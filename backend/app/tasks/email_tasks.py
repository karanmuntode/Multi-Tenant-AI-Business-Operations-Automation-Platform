"""
OpsPilot AI — Email & Notification Dispatch Tasks
Asynchronous worker executing approved communications.
"""

import logging
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.email_tasks.dispatch_approved_action")
def dispatch_approved_action(approval_id: str, action_type: str, payload: dict):
    """
    Executes an action that has passed human-in-the-loop review.
    Dispatches outbound email, triggers runbook, or invokes customer webhook.
    """
    logger.info(f"Processing approved action {approval_id} of type {action_type}...")

    if action_type == "SEND_EMAIL":
        recipient = payload.get("recipient", "unknown")
        subject = payload.get("subject", "OpsPilot Alert")
        logger.info(f"Simulating SMTP / SES email dispatch to: {recipient} | Subject: {subject}")
        # In a live AWS environment, this connects to boto3 SES client
        return {
            "status": "DISPATCHED",
            "channel": "EMAIL_SES",
            "recipient": recipient,
            "subject": subject,
        }

    elif action_type == "EXECUTE_RUNBOOK":
        runbook = payload.get("runbook", "Standard Runbook")
        logger.info(f"Executing automated runbook: {runbook}")
        return {
            "status": "EXECUTED",
            "channel": "RUNBOOK_RUNNER",
            "runbook": runbook,
        }

    return {"status": "ACKNOWLEDGED", "action_type": action_type}
