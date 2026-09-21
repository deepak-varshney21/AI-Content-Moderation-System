"""SQLAlchemy ORM Database Models."""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from app.database.database import Base
from app.schemas.moderation import HistoryRecordResponse, SeverityResult, ToxicityProbabilities


class ModerationRecord(Base):
    """ORM Model storing moderation audit and history records."""

    __tablename__ = "moderation_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    comment = Column(Text, nullable=False)
    toxicity_scores_json = Column(Text, nullable=False)  # JSON-encoded Dict[str, float]
    detected_labels_json = Column(Text, nullable=False)  # JSON-encoded List[str]
    severity = Column(String(32), nullable=False, index=True)
    severity_score = Column(Float, nullable=False)
    recommended_action = Column(String(32), nullable=False, index=True)
    censored_comment = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def set_toxicity_scores(self, scores: Dict[str, float]) -> None:
        self.toxicity_scores_json = json.dumps(scores)

    def get_toxicity_scores(self) -> Dict[str, float]:
        try:
            return json.loads(self.toxicity_scores_json)
        except Exception:
            return {}

    def set_detected_labels(self, labels: List[str]) -> None:
        self.detected_labels_json = json.dumps(labels)

    def get_detected_labels(self) -> List[str]:
        try:
            return json.loads(self.detected_labels_json)
        except Exception:
            return []

    def to_schema(self) -> HistoryRecordResponse:
        """Convert ORM record into API History Record Response schema."""
        scores_dict = self.get_toxicity_scores()
        toxicity = ToxicityProbabilities(
            toxic=scores_dict.get("toxic", 0.0),
            severe_toxic=scores_dict.get("severe_toxic", 0.0),
            obscene=scores_dict.get("obscene", 0.0),
            threat=scores_dict.get("threat", 0.0),
            insult=scores_dict.get("insult", 0.0),
            identity_hate=scores_dict.get("identity_hate", 0.0),
        )
        return HistoryRecordResponse(
            id=self.id,
            comment=self.comment,
            toxicity=toxicity,
            detected_labels=self.get_detected_labels(),
            severity=SeverityResult(level=self.severity, score=self.severity_score),
            recommended_action=self.recommended_action,
            censored_comment=self.censored_comment,
            explanation=self.explanation,
            created_at=self.created_at.isoformat() if self.created_at else "",
        )
