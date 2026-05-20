"""GitHub Trending 爬虫：抓取当日 trending 项目列表。

Phase 1 实现具体逻辑，Phase 0 仅定义接口骨架。
"""

from dataclasses import dataclass


@dataclass
class RepoItem:
    """Trending 仓库的标准化结构。"""
    name: str
    description: str
    language: str
    stars_today: int
    total_stars: int
    url: str


async def scrape() -> list[RepoItem]:
    """爬取 GitHub Trending 当日项目列表。

    Returns:
        标准化后的 RepoItem 列表，爬取失败返回空列表。
    """
    # TODO: Phase 1 实现 httpx + BS4 爬取逻辑
    return []
