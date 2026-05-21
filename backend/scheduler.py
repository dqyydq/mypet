"""定时任务调度器：每天定时爬取 GitHub Trending 并分析。"""

import logging
from dataclasses import asdict

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from scraper import scrape
from analyzer import analyze
from database import save_today

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def run_daily_job():
    """执行每日爬取 + 分析 + 存储的完整流程。"""
    logger.info("=== 定时任务开始：爬取 GitHub Trending ===")
    try:
        repos = await scrape()
        if not repos:
            logger.warning("定时任务：爬取结果为空，跳过本次")
            return

        logger.info(f"爬取 {len(repos)} 个项目，正在分析...")
        analysis = await analyze(repos)

        await save_today(
            raw_data=[asdict(r) for r in repos],
            analysis=analysis,
        )
        logger.info(f"定时任务完成：状态={analysis.cat_state}")
    except Exception:
        logger.exception("定时任务执行失败")


def start_scheduler():
    """启动定时任务调度器。每 4 小时执行一次。"""
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        run_daily_job,
        trigger="interval",
        hours=4,
        id="trending_daily_job",
        name="爬取 GitHub Trending 并分析",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("定时任务调度器已启动（每 4 小时执行一次）")


def stop_scheduler():
    """停止定时任务调度器。"""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("定时任务调度器已停止")
