"""Pydantic Request and Response Schemas for Moderation API."""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class CommentRequest(BaseModel):
    """Input payload for comment moderation."""

    comment: str = Field(
        ...,
        min_length=1,
        max_length=2500,
        description="User text comment to analyze for harmful content.",
        examples=["You are a stupid idiot"],
    )
    custom_threshold: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Optional custom probability threshold override.",
    )

    @field_validator("comment")
    @classmethod
    def validate_non_empty_comment(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Comment cannot be empty or solely whitespace.")
        return cleaned


class ToxicityProbabilities(BaseModel):
    """Probability scores for the 6 independent toxicity labels."""

    toxic: float = Field(..., ge=0.0, le=1.0, description="General toxicity probability")
    severe_toxic: float = Field(..., ge=0.0, le=1.0, description="Extreme / severe toxicity probability")
    obscene: float = Field(..., ge=0.0, le=1.0, description="Obscene / vulgar content probability")
    threat: float = Field(..., ge=0.0, le=1.0, description="Physical / violent threat probability")
    insult: float = Field(..., ge=0.0, le=1.0, description="Derogatory / insulting content probability")
    identity_hate: float = Field(..., ge=0.0, le=1.0, description="Hate speech targeting protected group identity")


class SeverityResult(BaseModel):
    """Calculated severity classification and normalized score."""

    level: str = Field(
        ...,
        description="Severity category: LOW, MEDIUM, HIGH, or CRITICAL",
        examples=["MEDIUM"],
    )
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalized aggregate severity score from 0.0 to 1.0",
        examples=[0.92],
    )


class ModerationResult(BaseModel):
    """Full moderation pipeline response payload."""

    comment: str
    toxicity: ToxicityProbabilities
    detected_labels: List[str]
    severity: SeverityResult
    recommended_action: str = Field(
        ...,
        description="Action recommended by policy engine: ALLOW, CENSOR, HIDE, FLAG, DELETE",
        examples=["CENSOR"],
    )
    censored_comment: Optional[str] = Field(
        None,
        description="Safe masked version of the text if CENSOR action was triggered, else None",
    )
    explanation: str = Field(
        ...,
        description="Human-readable rationale for the severity assessment and policy decision.",
    )


class HistoryRecordResponse(BaseModel):
    """Single moderation history entry."""

    id: int
    comment: str
    toxicity: ToxicityProbabilities
    detected_labels: List[str]
    severity: SeverityResult
    recommended_action: str
    censored_comment: Optional[str]
    explanation: str
    created_at: str


class HistoryListResponse(BaseModel):
    """List of moderation history records with pagination metadata."""

    total: int
    items: List[HistoryRecordResponse]


class StatsResponse(BaseModel):
    """Aggregated moderation statistics."""

    total_comments: int
    toxic_comments: int
    non_toxic_comments: int
    comments_flagged: int
    comments_hidden: int
    comments_censored: int
    comments_deleted: int
    comments_allowed: int
    label_distribution: Dict[str, int]
    action_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]


class HealthResponse(BaseModel):
    """Service health and model status."""

    status: str
    service: str
    version: str
    model_loaded: bool
    model_name: str
    device: str
    timestamp: str
