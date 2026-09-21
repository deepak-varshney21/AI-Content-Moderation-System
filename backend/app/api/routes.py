"""FastAPI Route Handlers for Content Moderation System."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.config import settings
from app.database.database import get_db
from app.database.models import ModerationRecord
from app.schemas.moderation import (
    CommentRequest,
    HealthResponse,
    HistoryListResponse,
    HistoryRecordResponse,
    ModerationResult,
    StatsResponse,
)
from app.services.moderation import moderation_service
from app.services.toxicity_model import toxicity_model

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health & Model Status",
    tags=["System"],
)
def health_check() -> HealthResponse:
    """Check service operational health and Hugging Face model loading status."""
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        model_loaded=toxicity_model.is_loaded,
        model_name=toxicity_model.model_name,
        device=str(toxicity_model.device),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post(
    "/predict",
    response_model=ModerationResult,
    summary="Predict Toxicity and Moderation Result (Dry Run)",
    tags=["Moderation"],
)
def predict_comment(request: CommentRequest) -> ModerationResult:
    """Run full toxicity inference, severity estimation, policy decision, and censoring preview

    Does NOT persist record to database (ephemeral analysis).
    """
    try:
        result = moderation_service.process_comment(
            comment=request.comment,
            custom_threshold=request.custom_threshold,
            save_to_db=False,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Toxicity prediction failed: {str(exc)}",
        ) from exc


@router.post(
    "/moderate",
    response_model=ModerationResult,
    summary="Full Moderation Workflow with Audit Logging",
    tags=["Moderation"],
)
def moderate_comment(
    request: CommentRequest,
    db: Session = Depends(get_db),
) -> ModerationResult:
    """Run full content moderation pipeline and persist audit record to SQLite database."""
    try:
        result = moderation_service.process_comment(
            comment=request.comment,
            custom_threshold=request.custom_threshold,
            save_to_db=True,
            db=db,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Content moderation processing failed: {str(exc)}",
        ) from exc


@router.get(
    "/history",
    response_model=HistoryListResponse,
    summary="Retrieve Moderation Audit History",
    tags=["History"],
)
def get_history(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    action: Optional[str] = Query(None, description="Filter by recommended action"),
    search: Optional[str] = Query(None, description="Search comment text"),
    db: Session = Depends(get_db),
) -> HistoryListResponse:
    """Query historical moderation entries with optional search, severity, and action filters."""
    query = db.query(ModerationRecord)

    if severity:
        query = query.filter(ModerationRecord.severity == severity.upper())
    if action:
        query = query.filter(ModerationRecord.recommended_action == action.upper())
    if search:
        query = query.filter(ModerationRecord.comment.ilike(f"%{search}%"))

    total = query.count()
    records = query.order_by(desc(ModerationRecord.created_at)).offset(skip).limit(limit).all()

    return HistoryListResponse(
        total=total,
        items=[rec.to_schema() for rec in records],
    )


@router.get(
    "/history/{record_id}",
    response_model=HistoryRecordResponse,
    summary="Get Detailed Moderation History Record",
    tags=["History"],
)
def get_history_detail(
    record_id: int,
    db: Session = Depends(get_db),
) -> HistoryRecordResponse:
    """Retrieve full detail for a specific moderation audit record by ID."""
    record = db.query(ModerationRecord).filter(ModerationRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Moderation record with ID {record_id} not found.",
        )
    return record.to_schema()


@router.delete(
    "/history/{record_id}",
    summary="Delete a Moderation History Record",
    tags=["History"],
)
def delete_history_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """Delete a specific moderation history audit record."""
    record = db.query(ModerationRecord).filter(ModerationRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Moderation record with ID {record_id} not found.",
        )
    db.delete(record)
    db.commit()
    return {"message": f"Record {record_id} deleted successfully."}


@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Retrieve Moderation Analytics & Label Distribution",
    tags=["Analytics"],
)
def get_stats(db: Session = Depends(get_db)) -> StatsResponse:
    """Compute aggregate moderation metrics, action breakdowns, and label frequencies."""
    records = db.query(ModerationRecord).all()
    total_comments = len(records)

    toxic_comments = 0
    non_toxic_comments = 0
    comments_flagged = 0
    comments_hidden = 0
    comments_censored = 0
    comments_deleted = 0
    comments_allowed = 0

    label_distribution = {label: 0 for label in settings.TARGET_LABELS}
    action_distribution = {act: 0 for act in ["ALLOW", "CENSOR", "HIDE", "FLAG", "DELETE"]}
    severity_distribution = {sev: 0 for sev in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]}

    for rec in records:
        # Action counts
        action = rec.recommended_action
        if action in action_distribution:
            action_distribution[action] += 1

        if action == "FLAG":
            comments_flagged += 1
        elif action == "HIDE":
            comments_hidden += 1
        elif action == "CENSOR":
            comments_censored += 1
        elif action == "DELETE":
            comments_deleted += 1
        elif action == "ALLOW":
            comments_allowed += 1

        # Severity counts
        sev = rec.severity
        if sev in severity_distribution:
            severity_distribution[sev] += 1

        # Labels counts
        detected = rec.get_detected_labels()
        if detected or sev != "LOW":
            toxic_comments += 1
        else:
            non_toxic_comments += 1

        for lbl in detected:
            if lbl in label_distribution:
                label_distribution[lbl] += 1

    return StatsResponse(
        total_comments=total_comments,
        toxic_comments=toxic_comments,
        non_toxic_comments=non_toxic_comments,
        comments_flagged=comments_flagged,
        comments_hidden=comments_hidden,
        comments_censored=comments_censored,
        comments_deleted=comments_deleted,
        comments_allowed=comments_allowed,
        label_distribution=label_distribution,
        action_distribution=action_distribution,
        severity_distribution=severity_distribution,
    )
