"""LLM 分析器：调用 DeepSeek API 对 Trending 项目分类并产出猫状态。

Phase 2 实现具体 Prompt 和 API 调用，Phase 0 仅定义接口骨架。
"""

import json
from dataclasses import dataclass, field

from scraper import RepoItem


@dataclass
class AnalysisResult:
    """LLM 分析结果。"""
    categories: dict[str, int] = field(default_factory=dict)
    dominant_vibe: str = ""
    cat_state: str = "content_grooming"
    narrative: str = ""


MOCK_RESULT = AnalysisResult(
    categories={"AI/ML": 8, "DevTools": 6, "Other": 11},
    dominant_vibe="balanced",
    cat_state="curious_tilting",
    narrative="今天的技术圈不温不火，AI 和工具类各占一半，但没什么让本猫眼前一亮的东西...喵。",
)


async def analyze(repos: list[RepoItem]) -> AnalysisResult:
    """对爬取到的 Trending 项目列表进行 LLM 分析。

    Args:
        repos: 爬虫返回的项目列表。

    Returns:
        AnalysisResult，包含分类、猫状态和叙述。
    """
    # Phase 2 实现真实 LLM 调用，Phase 0 返回 mock 数据
    if not repos:
        return MOCK_RESULT
    return MOCK_RESULT


def safe_parse_json(raw: str) -> dict | None:
    """安全解析 LLM 返回的 JSON，处理可能的 markdown 围栏。"""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[:-3]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
