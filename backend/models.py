"""Pydantic 数据模型：API 请求/响应定义。"""

from pydantic import BaseModel


class TodayResponse(BaseModel):
    """GET /api/today 响应。"""
    date: str
    cat_state: str
    narrative: str
    categories: dict[str, int]
    dominant_vibe: str


class HistoryRecord(BaseModel):
    """单条历史记录。"""
    date: str
    cat_state: str
    narrative: str


class HistoryResponse(BaseModel):
    """GET /api/history 响应。"""
    records: list[HistoryRecord]
