from datetime import date
from uuid import UUID
from fastapi import BackgroundTasks

from app.db.session import AsyncSessionLocal
from app.models.notification import Notification


def format_ws_payload(notification: Notification, event_type: str = "notification:new") -> dict:
    """
    Standardized WebSocket payload formatter for notifications.
    Converts Notification model to JSON-serializable dict with event wrapper.
    
    Args:
        notification: Notification model instance
        event_type: Event type string (default: "notification:new")
    
    Returns:
        dict with keys: event, notification
    """
    notification_data = {
        "id": str(notification.id),
        "user_id": str(notification.user_id),
        "user_role": notification.user_role,
        "notification_type": notification.notification_type,
        "title": notification.title,
        "message": notification.message,
        "entity_id": str(notification.entity_id) if notification.entity_id else None,
        "entity_type": notification.entity_type,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }
    return {
        "event": event_type,
        "notification": notification_data,
    }


async def _create_notification_in_background(
    *,
    user_id: UUID,
    user_role: str,
    notification_type: str,
    title: str,
    message: str,
    entity_id: UUID | None,
    entity_type: str | None,
):
    try:
        await _create_notification_now(
            user_id=user_id,
            user_role=user_role,
            notification_type=notification_type,
            title=title,
            message=message,
            entity_id=entity_id,
            entity_type=entity_type,
        )
    except Exception as e:
        print(f"⚠ Background notification task failed: {e}")


async def _create_notification_now(
    *,
    user_id: UUID,
    user_role: str,
    notification_type: str,
    title: str,
    message: str,
    entity_id: UUID | None,
    entity_type: str | None,
):
    try:
        from app.services.notification_service import create_notification

        async with AsyncSessionLocal() as db:
            await create_notification(
                db,
                user_id=user_id,
                user_role=user_role,
                notification_type=notification_type,
                title=title,
                message=message,
                entity_id=entity_id,
                entity_type=entity_type,
            )
    except Exception as e:
            print(f"⚠ Notification task failed: {e}")


def schedule_appointment_approved_notification(
    background_tasks: BackgroundTasks,
    *,
    user_id: UUID,
    appointment_code: str | None,
    appointment_id: UUID,
):
    code_text = appointment_code or "(code unavailable)"
    background_tasks.add_task(
        _create_notification_in_background,
        user_id=user_id,
        user_role="farmer",
        notification_type="APPOINTMENT_APPROVED",
        title="Appointment Accepted",
        message=f"Your appointment {code_text} has been accepted by vet.",
        entity_id=appointment_id,
        entity_type="appointment",
    )


async def send_appointment_approved_notification_now(
    *,
    user_id: UUID,
    appointment_code: str | None,
    appointment_id: UUID,
):
    code_text = appointment_code or "(code unavailable)"
    await _create_notification_now(
        user_id=user_id,
        user_role="farmer",
        notification_type="APPOINTMENT_APPROVED",
        title="Appointment Accepted",
        message=f"Your appointment {code_text} has been accepted by vet.",
        entity_id=appointment_id,
        entity_type="appointment",
    )


def schedule_vet_event_notification(
    background_tasks: BackgroundTasks,
    *,
    user_id: UUID,
    event_type: str,
    event_name: str,
    next_due_date: date | None,
    event_id: UUID,
):
    due_text = f" Next due date: {next_due_date}." if next_due_date else ""
    background_tasks.add_task(
        _create_notification_in_background,
        user_id=user_id,
        user_role="farmer",
        notification_type="VET_EVENT_CREATED",
        title=f"{event_type} update",
        message=f"{event_name} recorded for your cattle.{due_text}",
        entity_id=event_id,
        entity_type="vet_event",
    )


def schedule_prescription_notification(
    background_tasks: BackgroundTasks,
    *,
    user_id: UUID,
    appointment_code: str,
    follow_up_date: date | None,
    health_record_id: UUID,
):
    follow_up_text = f" Follow-up date: {follow_up_date}." if follow_up_date else ""
    background_tasks.add_task(
        _create_notification_in_background,
        user_id=user_id,
        user_role="farmer",
        notification_type="PRESCRIPTION_ADDED",
        title="Prescription Added",
        message=(
            f"New vet prescription/health record added for appointment {appointment_code}."
            f"{follow_up_text}"
        ),
        entity_id=health_record_id,
        entity_type="vet_health_record",
    )
