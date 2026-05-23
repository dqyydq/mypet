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
    categories: dict[str, int] = {}
    dominant_vibe: str = ""
    total_stars_today: int = 0
    repo_count: int = 0


class HistoryResponse(BaseModel):
    records: list[HistoryRecord]


class StateDistItem(BaseModel):
    state: str
    count: int


class StatsRecord(BaseModel):
    date: str
    cat_state: str
    total_stars_today: int
    categories: dict[str, int] = {}
    dominant_vibe: str = ""


class StatsResponse(BaseModel):
    period_days: int
    average_categories: dict[str, float]
    state_distribution: list[StateDistItem]
    peak_day: dict
    records: list[StatsRecord]
