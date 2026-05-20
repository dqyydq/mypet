"""FastAPI 入口：GitHub Trending 宠物状态仪表盘"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """启动时初始化数据库，关闭时清理连接。"""
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
    yield


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
    # TODO: Phase 3 实现完整逻辑
    return {"message": "Phase 0 placeholder"}


@app.get("/api/history")
async def get_history(days: int = 7):
    return {"message": "Phase 0 placeholder", "days": days}


@app.post("/api/refresh")
async def refresh():
    return {"message": "Phase 0 placeholder"}
