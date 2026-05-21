"""SQLite 数据访问层，使用 aiosqlite 异步操作。"""

import json
import os
from dataclasses import asdict
from datetime import date as DateType

import aiosqlite

from analyzer import AnalysisResult

DB_PATH = os.environ.get("DB_PATH", "./data/trending.db")

_connection: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _connection
    if _connection is None:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        _connection = await aiosqlite.connect(DB_PATH)
        _connection.row_factory = aiosqlite.Row
    return _connection


async def close_db():
    global _connection
    if _connection:
        await _connection.close()
        _connection = None


async def save_today(
    raw_data: list[dict],
    analysis: AnalysisResult,
) -> None:
    """保存或更新今日的分析结果。"""
    db = await get_db()
    today = DateType.today().isoformat()
    await db.execute(
        """
        INSERT INTO trending_records (date, raw_data, analysis_json, cat_state, narrative)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
            raw_data = excluded.raw_data,
            analysis_json = excluded.analysis_json,
            cat_state = excluded.cat_state,
            narrative = excluded.narrative
        """,
        (
            today,
            json.dumps(raw_data, ensure_ascii=False),
            json.dumps(asdict(analysis), ensure_ascii=False),
            analysis.cat_state,
            analysis.narrative,
        ),
    )
    await db.commit()


async def get_today() -> dict | None:
    """获取今日已缓存的分析结果。"""
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
    """获取近 N 天的历史记录。"""
    db = await get_db()
    cursor = await db.execute(
        "SELECT date, cat_state, narrative FROM trending_records "
        "ORDER BY date DESC LIMIT ?",
        (days,),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]
