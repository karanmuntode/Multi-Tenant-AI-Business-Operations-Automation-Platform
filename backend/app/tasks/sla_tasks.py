"""
OpsPilot AI — SLA Monitoring Background Tasks
Periodically scans active incidents, detects breaches, and issues alert notifications.
"""

import asyncio
import logging
from datetime import datetime, timezone
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _async_check_sla():
    """Async helper to query DB and identify SLA breaches."""
    from app.database import async_session_factory
    from sqlalchemy import select
    from app.models.incident import Incident, IncidentStatus
    from app.models.audit_log import Notification, NotificationType

    now = datetime.now(timezone.utc)
    breached_count = 0

    async with async_session_factory() as session:
        # Check active unresolved incidents
        query = select(Incident).where(
            Incident.status.in_([
                IncidentStatus.INVESTIGATING,
                IncidentStatus.IDENTIFIED,
                IncidentStatus.MONITORING,
            ])
        )
        results = await session.scalars(query)
        incidents = results.all()

        for inc in incidents:
            # Check response SLA
            if inc.sla_response_due and inc.sla_response_due < now and not inc.sla_response_met:
                inc.sla_response_met = False
                breached_count += 1
                # Generate notification for assignee / reporter
                if inc.assignee_id:
                    notif = Notification(
                        organization_id=inc.organization_id,
                        user_id=inc.assignee_id,
                        title=f"SLA Response Breached: {inc.incident_number}",
                        message=f"Incident '{inc.title}' has breached its response SLA deadline.",
                        type=NotificationType.SLA,
                        is_read=False,
                    )
                    session.add(notif)

            # Check resolution SLA
            if inc.sla_resolution_due and inc.sla_resolution_due < now and not inc.sla_resolution_met:
                inc.sla_resolution_met = False

        await session.commit()
        return breached_count


@celery_app.task(name="app.tasks.sla_tasks.check_sla_breaches")
def check_sla_breaches():
    """Celery task invoked by Celery Beat every 60 seconds."""
    logger.info("Executing periodic SLA breach detection scan...")
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    count = loop.run_until_complete(_async_check_sla())
    logger.info(f"SLA scan completed. {count} active incidents analyzed.")
    return {"status": "success", "breaches_detected": count}


@celery_app.task(name="app.tasks.sla_tasks.system_heartbeat")
def system_heartbeat():
    """Worker heartbeat to ensure task broker connectivity."""
    logger.info("OpsPilot Celery background worker heartbeat healthy.")
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
