import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import get_db
from app.services.briefing_engine import generate_briefing

logger = logging.getLogger("daily_kernel.scheduler")

_scheduler: AsyncIOScheduler | None = None


async def generate_all_briefings():
    """Generate daily briefings for all users."""
    logger.info("Starting scheduled briefing generation for all users")

    try:
        async with get_db() as db:
            cursor = await db.execute("SELECT id, name FROM users")
            users = await cursor.fetchall()

        for user in users:
            user_id = user["id"]
            user_name = user["name"]
            try:
                async with get_db() as db:
                    result = await generate_briefing(db, user_id)
                    cards_count = result.get("cards_count", 0)
                    logger.info(
                        "Generated briefing for user %s (%s): %d cards",
                        user_name,
                        user_id,
                        cards_count,
                    )
            except Exception:
                logger.exception(
                    "Failed to generate briefing for user %s (%s)",
                    user_name,
                    user_id,
                )

        logger.info("Completed scheduled briefing generation")
    except Exception:
        logger.exception("Failed to run scheduled briefing generation")


def start_scheduler():
    """Start the APScheduler to run briefing generation daily at 5am."""
    global _scheduler

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        generate_all_briefings,
        trigger=CronTrigger(hour=5, minute=0),
        id="daily_briefing_generation",
        name="Generate daily briefings for all users",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started - daily briefing generation scheduled for 5:00 AM")


def shutdown_scheduler():
    """Shut down the scheduler gracefully."""
    global _scheduler

    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler shut down")
