"""SQLite 数据访问层，使用 aiosqlite 异步操作。"""

import json
import os
from dataclasses import asdict
from datetime import date as DateType

import aiosqlite

from analyzer import AnalysisResult

DB_PATH = os.environ.get("DB_PATH", "./data/trending.db")

_connection: aiosqlite.Connection | None = None
_migrated = False

CATEGORY_COLUMNS = [
    "cat_ai_ml",
    "cat_security",
    "cat_devtools",
    "cat_systems",
    "cat_other",
]
CATEGORY_MAP = {
    "AI/ML": "cat_ai_ml",
    "Security": "cat_security",
    "DevTools": "cat_devtools",
    "Systems": "cat_systems",
    "Other": "cat_other",
}
CATEGORY_COLUMNS_SQL = ", ".join(CATEGORY_COLUMNS)
DOMINANT_VIBE_COL = "dominant_vibe"


async def get_db() -> aiosqlite.Connection:
    global _connection
    if _connection is None:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        _connection = await aiosqlite.connect(DB_PATH)
        _connection.row_factory = aiosqlite.Row
    return _connection


async def run_migration(db: aiosqlite.Connection) -> None:
    global _migrated
    if _migrated:
        return
    existing = await db.execute("PRAGMA table_info(trending_records)")
    cols = {row[1] for row in await existing.fetchall()}
    for col in CATEGORY_COLUMNS:
        if col not in cols:
            await db.execute(f"ALTER TABLE trending_records ADD COLUMN {col} INTEGER DEFAULT 0")
    if DOMINANT_VIBE_COL not in cols:
        await db.execute(f"ALTER TABLE trending_records ADD COLUMN {DOMINANT_VIBE_COL} TEXT DEFAULT ''")
    await db.commit()
    _migrated = True


async def close_db():
    global _connection
    if _connection:
        await _connection.close()
        _connection = None


def _categories_to_columns(categories: dict[str, int]) -> dict[str, int]:
    cols = {col: 0 for col in CATEGORY_COLUMNS}
    for key, col in CATEGORY_MAP.items():
        cols[col] = categories.get(key, 0)
    return cols


def _columns_to_categories(row: dict) -> dict[str, int] | None:
    categories = {}
    for key, col in CATEGORY_MAP.items():
        val = row.get(col)
        if val is not None:
            categories[key] = val
    return categories if any(v is not None for v in categories.values()) else None


def _resolve_categories(row: dict, analysis_json: str) -> dict[str, int]:
    cats = _columns_to_categories(row)
    if cats:
        return cats
    if isinstance(analysis_json, str):
        try:
            return json.loads(analysis_json).get("categories", {})
        except json.JSONDecodeError:
            pass
    return {}


def _resolve_dominant_vibe(row: dict, analysis_json: str) -> str:
    val = row.get(DOMINANT_VIBE_COL, "") or ""
    if val:
        return val
    if isinstance(analysis_json, str):
        try:
            return json.loads(analysis_json).get(DOMINANT_VIBE_COL, "")
        except json.JSONDecodeError:
            pass
    return ""


def _parse_repo_stats(raw_data: str) -> tuple[int, int]:
    """Return (total_stars_today, repo_count) from raw_data JSON."""
    if not isinstance(raw_data, str):
        return 0, 0
    repos = json.loads(raw_data)
    stars = sum(r.get("stars_today", 0) for r in repos)
    return stars, len(repos)


async def save_today(
    raw_data: list[dict],
    analysis: AnalysisResult,
) -> None:
    db = await get_db()
    today = DateType.today().isoformat()
    cat_cols = _categories_to_columns(analysis.categories)
    col_names = ", ".join(CATEGORY_COLUMNS)
    col_placeholders = ", ".join(["?"] * len(CATEGORY_COLUMNS))
    update_clauses = ", ".join(f"{col} = excluded.{col}" for col in CATEGORY_COLUMNS)
    await db.execute(
        f"""
        INSERT INTO trending_records
            (date, raw_data, analysis_json, cat_state, narrative,
             {col_names}, {DOMINANT_VIBE_COL})
        VALUES (?, ?, ?, ?, ?, {col_placeholders}, ?)
        ON CONFLICT(date) DO UPDATE SET
            raw_data = excluded.raw_data,
            analysis_json = excluded.analysis_json,
            cat_state = excluded.cat_state,
            narrative = excluded.narrative,
            {update_clauses},
            {DOMINANT_VIBE_COL} = excluded.{DOMINANT_VIBE_COL}
        """,
        (
            today,
            json.dumps(raw_data, ensure_ascii=False),
            json.dumps(asdict(analysis), ensure_ascii=False),
            analysis.cat_state,
            analysis.narrative,
            *[cat_cols[c] for c in CATEGORY_COLUMNS],
            analysis.dominant_vibe,
        ),
    )
    await db.commit()


async def get_today() -> dict | None:
    db = await get_db()
    today = DateType.today().isoformat()
    cursor = await db.execute(
        "SELECT * FROM trending_records WHERE date = ?", (today,)
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    data = dict(row)
    analysis_json = data.pop("analysis_json", "{}")
    raw_data = data.pop("raw_data", "[]")
    if isinstance(analysis_json, str):
        data["analysis"] = json.loads(analysis_json)
    if isinstance(raw_data, str):
        data["raw_data"] = json.loads(raw_data)
    return data


async def get_history(days: int = 7) -> list[dict]:
    db = await get_db()
    cursor = await db.execute(
        f"SELECT date, cat_state, narrative, {DOMINANT_VIBE_COL}, {CATEGORY_COLUMNS_SQL}, analysis_json, raw_data "
        "FROM trending_records "
        "ORDER BY date DESC LIMIT ?",
        (days,),
    )
    rows = await cursor.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        analysis_json = d.pop("analysis_json", "{}")
        raw_data = d.pop("raw_data", "[]")
        d["categories"] = _resolve_categories(d, analysis_json)
        d["dominant_vibe"] = _resolve_dominant_vibe(d, analysis_json)
        d["total_stars_today"], d["repo_count"] = _parse_repo_stats(raw_data)
        result.append(d)
    return result


async def get_stats(days: int = 30) -> dict:
    db = await get_db()
    cursor = await db.execute(
        f"SELECT date, cat_state, {DOMINANT_VIBE_COL}, {CATEGORY_COLUMNS_SQL}, analysis_json, raw_data "
        "FROM trending_records "
        "ORDER BY date DESC LIMIT ?",
        (days,),
    )
    rows = await cursor.fetchall()
    if not rows:
        return {}

    totals = {col: 0 for col in CATEGORY_COLUMNS}
    state_counts: dict[str, int] = {}
    peak_day = {"date": "", "stars": 0}
    records = []

    for row in rows:
        d = dict(row)
        raw_data = d.pop("raw_data", "[]")
        analysis_json = d.pop("analysis_json", "{}")
        date = d.pop("date", "")

        cats = _resolve_categories(d, analysis_json)
        dominant_vibe = _resolve_dominant_vibe(d, analysis_json)

        for key, col in CATEGORY_MAP.items():
            totals[col] += cats.get(key, 0)

        state = d.get("cat_state", "content_grooming")
        state_counts[state] = state_counts.get(state, 0) + 1

        total_stars, repo_count = _parse_repo_stats(raw_data)
        records.append({
            "date": date,
            "cat_state": state,
            "total_stars_today": total_stars,
            "categories": cats,
            "dominant_vibe": dominant_vibe,
        })
        if total_stars > peak_day["stars"]:
            peak_day = {"date": date, "stars": total_stars}

    n = len(rows)
    avg_categories = {
        key: totals[col] / n
        for key, col in CATEGORY_MAP.items()
    }

    state_distribution = sorted(
        [{"state": s, "count": c} for s, c in state_counts.items()],
        key=lambda x: -x["count"],
    )

    return {
        "period_days": n,
        "average_categories": avg_categories,
        "state_distribution": state_distribution,
        "peak_day": peak_day,
        "records": records,
    }
