"""
OpsPilot AI — Celery Application Configuration
Broker: Redis, Backend: Redis, with Celery Beat periodic schedules.
"""

from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "opspilot_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.sla_tasks",
        "app.tasks.email_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    worker_concurrency=4,
)

# Celery Beat Scheduled Tasks
celery_app.conf.beat_schedule = {
    "monitor-incident-sla-breaches-every-minute": {
        "task": "app.tasks.sla_tasks.check_sla_breaches",
        "schedule": 60.0,  # Every 60 seconds
    },
    "health-check-heartbeat-every-5-minutes": {
        "task": "app.tasks.sla_tasks.system_heartbeat",
        "schedule": 300.0,
    },
}
