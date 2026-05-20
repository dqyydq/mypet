"""LLM 分析器：调用 DeepSeek API 对 Trending 项目分类并产出猫状态。"""

import json
import os
import logging
from dataclasses import dataclass, field

from dotenv import load_dotenv
from openai import OpenAI

from scraper import RepoItem

load_dotenv()
logger = logging.getLogger(__name__)

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
MOCK_LLM = os.environ.get("MOCK_LLM", "false").lower() == "true"

CAT_STATES = [
    "excited_bouncing",
    "alert_ears_up",
    "focused_working",
    "sleepy_yawning",
    "curious_tilting",
    "overwhelmed_dizzy",
    "content_grooming",
    "shocked_puffed",
]

SYSTEM_PROMPT = """你是一只住在服务器机房里的小猫，每天负责观察 GitHub Trending 页面。

你的性格：
- 慵懒：对大多数项目提不起兴趣，只有真正惊艳的才能让你竖起耳朵
- 毒舌：看到无聊的项目会吐槽，看到跟风项目会翻白眼
- 敏锐：能快速识别真正的技术趋势，不被营销话术忽悠
- 可爱：用猫的口吻描述一切，偶尔穿插猫的行为描写（揣手手、舔爪子、尾巴摆摆）

你的任务：
看今天的 GitHub Trending 项目列表，分析后返回 JSON。

分析要求：
1. 把项目分到以下类别：
   - "AI/ML"：大模型、机器学习、深度学习、AI Agent、Prompt 相关
   - "Security"：安全、漏洞、加密、隐私
   - "DevTools"：开发工具、框架、CLI、编辑器、代码生成
   - "Systems"：基础设施、数据库、网络、操作系统
   - "Other"：不属于以上任何类别
   统计每个类别的项目数量（共25个项目，确保加起来等于25）

2. 判断今天的主导氛围（dominant_vibe），从以下选一个：
   - "ai_explosion"：AI项目显著多于其他类别
   - "security_alert"：安全相关项目突然增多
   - "tooling_frenzy"：开发工具和效率类项目扎堆
   - "systems_heavy"：基础设施类项目占主导
   - "balanced"：各领域均匀分布
   - "quiet_day"：没有突出主题，星星都偏低

3. 判断你今天的状态（cat_state），从以下选一个：
   - "excited_bouncing"：AI项目 > 40%
   - "alert_ears_up"：Security项目 > 20%
   - "focused_working"：DevTools类 > 30%
   - "sleepy_yawning"：无明显主题且stars普遍低
   - "curious_tilting"：多领域均衡分布
   - "overwhelmed_dizzy"：总stars异常高，信息密度大
   - "content_grooming"：平静日，无爆款
   - "shocked_puffed"：单项目stars异常暴涨（>10k当日）

4. 用猫的口吻写一段50-100字的叙述（narrative），描述今天的感受。
   要毒舌、可爱、有猫味。如果AI项目太多就吐槽"两脚兽除了AI还会什么"，
   如果平静就说"本猫正好补个觉"。

只返回纯 JSON，不要加 ``` 代码块或任何前缀文字：
{"categories": {"AI/ML": 0, "Security": 0, "DevTools": 0, "Systems": 0, "Other": 0}, "dominant_vibe": "", "cat_state": "", "narrative": ""}"""


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


def _build_user_prompt(repos: list[RepoItem]) -> str:
    """把爬虫结果格式化为 LLM 输入。"""
    lines = ["今天的 GitHub Trending 项目列表：", ""]
    for i, r in enumerate(repos, 1):
        lines.append(f"{i}. [{r.language}] {r.name}")
        lines.append(f"   Stars today: {r.stars_today} | Total: {r.total_stars}")
        if r.description:
            lines.append(f"   Description: {r.description[:120]}")
        lines.append("")
    return "\n".join(lines)


def safe_parse_json(raw: str) -> dict | None:
    """安全解析 LLM 返回的 JSON，处理可能的 markdown 围栏。"""
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = lines[1:]  # 去掉开头的 ```
        if lines and lines[-1].strip().endswith("```"):
            lines = lines[:-1]  # 去掉结尾的 ```
        raw = "\n".join(lines)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def analyze(repos: list[RepoItem]) -> AnalysisResult:
    """对爬取到的 Trending 项目列表进行 LLM 分析。"""
    if not repos:
        logger.warning("空仓库列表，返回 mock 结果")
        return MOCK_RESULT

    if MOCK_LLM:
        logger.info("Mock 模式，返回固定结果")
        return MOCK_RESULT

    if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY == "sk-your-key-here":
        logger.warning("未设置有效 DEEPSEEK_API_KEY，使用 mock 结果")
        return MOCK_RESULT

    user_prompt = _build_user_prompt(repos)
    logger.info(f"发送 LLM 请求，分析 {len(repos)} 个项目...")

    try:
        client = OpenAI(
            api_key=DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
            timeout=30.0,
        )
        response = client.chat.completions.create(
            model="deepseek-v4-flash",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            stream=False,
            temperature=0.7,
        )
        raw = response.choices[0].message.content or ""
        logger.info(f"LLM 原始响应长度：{len(raw)} 字符")
    except Exception as e:
        logger.error(f"LLM 调用失败: {e}")
        return MOCK_RESULT

    parsed = safe_parse_json(raw)
    if parsed is None:
        logger.error(f"JSON 解析失败，原始内容: {raw[:200]}")
        return MOCK_RESULT

    # 校验必要字段
    categories = parsed.get("categories", {})
    if not isinstance(categories, dict):
        categories = {}
    # 确保类别 key 存在
    for cat in ("AI/ML", "Security", "DevTools", "Systems", "Other"):
        categories.setdefault(cat, 0)

    cat_state = parsed.get("cat_state", "content_grooming")
    if cat_state not in CAT_STATES:
        cat_state = "content_grooming"

    return AnalysisResult(
        categories=categories,
        dominant_vibe=parsed.get("dominant_vibe", ""),
        cat_state=cat_state,
        narrative=parsed.get("narrative", ""),
    )
