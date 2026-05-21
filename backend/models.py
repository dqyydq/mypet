"""Pydantic 数据模型：API 响应定义。"""

from pydantic import BaseModel


class RepoOut(BaseModel):
    name: str
    description: str
    language: str
    stars_today: int
    total_stars: int
    url: str


class TodayResponse(BaseModel):
    date: str
    cat_state: str
    narrative: str
    categories: dict[str, int]
    dominant_vibe: str
    repos: list[RepoOut]


class HistoryRecord(BaseModel):
    date: str
    cat_state: str
    narrative: str


class HistoryResponse(BaseModel):
    records: list[HistoryRecord]
