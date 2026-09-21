"""Moderation Orchestrator Service.

Coordinates the complete moderation pipeline:
Comment -> Preprocessing -> Model Inference -> Severity Engine -> Policy Engine -> Censor Engine -> Storage -> Result
"""

import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import ModerationRecord
from app.policy.rules import policy_engine
from app.schemas.moderation import ModerationResult, SeverityResult, ToxicityProbabilities
from app.services.censor import censor_engine
from app.services.severity import severity_engine
from app.services.toxicity_model import toxicity_model

logger = logging.getLogger("moderation.service")


class ModerationService:
    """Orchestrates end-to-end moderation lifecycle."""

    def __init__(self) -> None:
        self.model = toxicity_model
        self.severity_engine = severity_engine
        self.policy_engine = policy_engine
        self.censor_engine = censor_engine
        self.thresholds = settings.LABEL_THRESHOLDS

    def process_comment(
        self,
        comment: str,
        custom_threshold: Optional[float] = None,
        save_to_db: bool = False,
        db: Optional[Session] = None,
    ) -> ModerationResult:
        """Run complete content moderation pipeline on a single user comment.

        Args:
            comment: Raw user comment string
            custom_threshold: Optional override for probability threshold
            save_to_db: Whether to persist audit record to database
            db: Active SQLAlchemy database session

        Returns:
            ModerationResult with all scores, detected labels, severity, policy action, and explanation.
        """
        # 1. Text Preprocessing & Cleaning
        cleaned_comment = comment.strip()

        # 2. Run Toxicity Model Inference (Sigmoid over 6 labels)
        raw_probabilities = self.model.predict(cleaned_comment)

        # 3. Detect applicable toxicity labels based on configurable thresholds
        detected_labels: List[str] = []
        for label in settings.TARGET_LABELS:
            prob = raw_probabilities.get(label, 0.0)
            threshold = (
                custom_threshold
                if custom_threshold is not None
                else self.thresholds.get(label, settings.DEFAULT_THRESHOLD)
            )
            if prob >= threshold:
                detected_labels.append(label)

        # 4. Severity Assessment
        severity: SeverityResult = self.severity_engine.assess_severity(
            raw_probabilities,
            detected_labels,
        )

        # 5. Check Censor Engine for profanity / bad words
        has_bad_words = self.censor_engine.has_censorable_words(cleaned_comment)

        # 6. Policy / Decision Engine
        recommended_action, explanation = self.policy_engine.evaluate_policy(
            probabilities=raw_probabilities,
            detected_labels=detected_labels,
            severity=severity,
            has_censorable_words=has_bad_words,
        )

        # 7. Censor Engine (applied ONLY if recommended action is CENSOR)
        censored_comment: Optional[str] = None
        if recommended_action == "CENSOR":
            censored_text, _ = self.censor_engine.censor_text(cleaned_comment)
            censored_comment = censored_text

        # Construct Typed Probabilities Schema
        toxicity_payload = ToxicityProbabilities(
            toxic=raw_probabilities.get("toxic", 0.0),
            severe_toxic=raw_probabilities.get("severe_toxic", 0.0),
            obscene=raw_probabilities.get("obscene", 0.0),
            threat=raw_probabilities.get("threat", 0.0),
            insult=raw_probabilities.get("insult", 0.0),
            identity_hate=raw_probabilities.get("identity_hate", 0.0),
        )

        result = ModerationResult(
            comment=cleaned_comment,
            toxicity=toxicity_payload,
            detected_labels=detected_labels,
            severity=severity,
            recommended_action=recommended_action,
            censored_comment=censored_comment,
            explanation=explanation,
        )

        # 8. Optional Database Persistence
        if save_to_db and db is not None:
            try:
                record = ModerationRecord(
                    comment=cleaned_comment,
                    severity=severity.level,
                    severity_score=severity.score,
                    recommended_action=recommended_action,
                    censored_comment=censored_comment,
                    explanation=explanation,
                )
                record.set_toxicity_scores(raw_probabilities)
                record.set_detected_labels(detected_labels)
                db.add(record)
                db.commit()
                db.refresh(record)
                logger.info("Saved moderation record ID=%d action=%s", record.id, recommended_action)
            except Exception as e:
                db.rollback()
                logger.error("Failed to save moderation record to DB: %s", e)

        return result


# Singleton instance
moderation_service = ModerationService()
