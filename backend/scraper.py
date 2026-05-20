"""GitHub Trending 爬虫：抓取当日 trending 项目列表。"""

import os
import re
import logging
from dataclasses import dataclass
from urllib.request import getproxies

import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TRENDING_URL = "https://github.com/trending?since=daily"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def _get_proxy() -> str | None:
    """获取代理地址，自动修复本地代理的 scheme 问题。

    某些系统配置将本地 HTTP 代理标记为 https:// 协议，
    导致 httpx 对代理服务器本身发起 TLS 握手失败。
    本地回环地址一律使用 http:// 协议。
    """
    proxy = (
        os.environ.get("HTTPS_PROXY")
        or os.environ.get("HTTP_PROXY")
        or getproxies().get("https")
        or None
    )
    if proxy and proxy.startswith("https://127.0.0.1"):
        proxy = proxy.replace("https://", "http://", 1)
    return proxy


@dataclass
class RepoItem:
    """Trending 仓库的标准化结构。"""
    name: str
    description: str
    language: str
    stars_today: int
    total_stars: int
    url: str


def _parse_stars_today(text: str) -> int:
    """从 '1,234 stars today' 或 '99 stars today' 提取数字。"""
    match = re.search(r"([\d,]+)\s*stars?\s*today", text, re.IGNORECASE)
    if match:
        return int(match.group(1).replace(",", ""))
    return 0


def _parse_compact_number(text: str) -> int:
    """解析 '1.2k' / '3.4m' 缩略数字。"""
    text = text.strip().lower().replace(",", "")
    match = re.match(r"([\d.]+)\s*([km])?", text)
    if not match:
        return 0
    num = float(match.group(1))
    suffix = match.group(2)
    if suffix == "k":
        num *= 1000
    elif suffix == "m":
        num *= 1_000_000
    return int(num)


async def scrape() -> list[RepoItem]:
    """爬取 GitHub Trending 当日项目列表。"""
    repos: list[RepoItem] = []
    proxy = _get_proxy()
    try:
        async with httpx.AsyncClient(
            timeout=15.0, follow_redirects=True, proxy=proxy
        ) as client:
            resp = await client.get(TRENDING_URL, headers=HEADERS)
            resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.error(f"HTTP 请求失败（可设 HTTPS_PROXY 配置代理）: {e}")
        return repos

    soup = BeautifulSoup(resp.text, "html.parser")

    articles = soup.find_all("article", class_="Box-row")
    if not articles:
        articles = soup.find_all("article")

    for article in articles:
        try:
            h2 = article.find("h2")
            if not h2:
                continue
            link = h2.find("a")
            if not link:
                continue
            href = link.get("href", "").strip()
            url = f"https://github.com{href}"
            name_text = " ".join(link.get_text(strip=True).split())

            desc_p = article.find("p")
            description = desc_p.get_text(strip=True) if desc_p else ""

            lang_span = article.find("span", itemprop="programmingLanguage")
            language = lang_span.get_text(strip=True) if lang_span else "Unknown"

            all_text = article.get_text(" ", strip=True)
            stars_today = _parse_stars_today(all_text)

            total_stars = 0
            star_link = article.find("a", href=re.compile(r"/stargazers"))
            if star_link:
                star_text = star_link.get_text(strip=True)
                total_stars = _parse_stars_today(star_text)
                if total_stars == 0:
                    total_stars = _parse_compact_number(star_text)

            repos.append(RepoItem(
                name=name_text,
                description=description,
                language=language,
                stars_today=stars_today,
                total_stars=total_stars,
                url=url,
            ))
        except Exception:
            logger.debug("解析单个 repo 失败", exc_info=True)
            continue

    logger.info(f"爬取完成：共 {len(repos)} 个项目")
    return repos
