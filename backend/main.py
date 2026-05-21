"""FastAPI 入口：GitHub Trending 宠物状态仪表盘"""

import logging
from contextlib import asynccontextmanager
from dataclasses import asdict
from datetime import date as DateType

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import get_db, save_today, get_today as db_get_today, get_history as db_get_history
from scraper import scrape
from analyzer import analyze
from scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = await get_db()
    await db.execute(
        """
        CREATE TABLE IF NOT EXISTS trending_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            raw_data TEXT,
            analysis_json TEXT,
            cat_state TEXT,
            narrative TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    await db.commit()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="GitHub Trending Pet", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/today")
async def get_today():
    """获取今日分析结果。有缓存直接返回，否则爬取+分析。"""
    cached = await db_get_today()
    if cached and cached.get("analysis"):
        analysis = cached["analysis"]
        return {
            "date": cached["date"],
            "cat_state": analysis.get("cat_state", "content_grooming"),
            "narrative": analysis.get("narrative", ""),
            "categories": analysis.get("categories", {}),
            "dominant_vibe": analysis.get("dominant_vibe", ""),
            "repos": cached.get("raw_data", []),
        }

    # 无缓存：爬取 + 分析 + 存储
    repos = await scrape()
    if not repos:
        return {
            "date": DateType.today().isoformat(),
            "cat_state": "sleepy_yawning",
            "narrative": "今天 GitHub 打不开...连不上网，本猫也懒得动。喵。",
            "categories": {},
            "dominant_vibe": "quiet_day",
            "repos": [],
        }

    analysis = await analyze(repos)

    await save_today(
        raw_data=[asdict(r) for r in repos],
        analysis=analysis,
    )

    return {
        "date": DateType.today().isoformat(),
        "cat_state": analysis.cat_state,
        "narrative": analysis.narrative,
        "categories": analysis.categories,
        "dominant_vibe": analysis.dominant_vibe,
        "repos": [asdict(r) for r in repos],
    }


@app.get("/api/history")
async def get_history(days: int = 7):
    records = await db_get_history(days)
    return {"records": records}


@app.post("/api/refresh")
async def refresh():
    """强制重新爬取+分析。"""
    repos = await scrape()
    if not repos:
        return {"status": "error", "message": "爬取失败，无法刷新"}

    analysis = await analyze(repos)

    await save_today(
        raw_data=[asdict(r) for r in repos],
        analysis=analysis,
    )

    return {
        "status": "ok",
        "date": DateType.today().isoformat(),
        "cat_state": analysis.cat_state,
        "narrative": analysis.narrative,
    }
