"""Severity Assessment Service.

Evaluates multi-label toxicity probabilities independently of the model
to determine calibrated severity levels (LOW, MEDIUM, HIGH, CRITICAL)
and a normalized aggregate severity score.
"""

from typing import Dict, List
from app.config import settings
from app.schemas.moderation import SeverityResult


class SeverityEngine:
    """Interprets raw toxicity probability distributions into categorical severity tiers."""

    def __init__(self) -> None:
        self.weights = settings.SEVERITY_WEIGHTS
        self.thresholds = settings.LABEL_THRESHOLDS

    def assess_severity(
        self,
        probabilities: Dict[str, float],
        detected_labels: List[str],
    ) -> SeverityResult:
        """Calculate severity level and normalized score from toxicity predictions.

        Args:
            probabilities: Dict of label probabilities (e.g. {'toxic': 0.94, ...})
            detected_labels: List of labels exceeding threshold

        Returns:
            SeverityResult containing categorical level and float score [0.0, 1.0].
        """
        toxic = probabilities.get("toxic", 0.0)
        severe_toxic = probabilities.get("severe_toxic", 0.0)
        obscene = probabilities.get("obscene", 0.0)
        threat = probabilities.get("threat", 0.0)
        insult = probabilities.get("insult", 0.0)
        identity_hate = probabilities.get("identity_hate", 0.0)

        # 1. Check CRITICAL conditions:
        # Physical threats or extreme severe toxicity
        if (
            threat >= 0.50
            or severe_toxic >= 0.55
            or (threat >= 0.35 and (toxic >= 0.70 or severe_toxic >= 0.35))
        ):
            level = "CRITICAL"
            raw_score = max(threat * 1.0, severe_toxic * 1.0, 0.85)

        # 2. Check HIGH conditions:
        # Identity-based hate, elevated severe_toxic, or compound toxic attacks
        elif (
            identity_hate >= 0.45
            or severe_toxic >= 0.35
            or (toxic >= 0.75 and insult >= 0.70)
            or (obscene >= 0.75 and insult >= 0.70)
            or len(detected_labels) >= 4
        ):
            level = "HIGH"
            raw_score = max(
                identity_hate * 0.95,
                toxic * 0.90,
                insult * 0.90,
                severe_toxic * 1.0,
                0.65,
            )

        # 3. Check MEDIUM conditions:
        # Standard toxic, insulting, or obscene content above detection threshold
        elif bool(detected_labels) or any(
            probabilities[lbl] >= self.thresholds.get(lbl, settings.DEFAULT_THRESHOLD)
            for lbl in probabilities
        ):
            level = "MEDIUM"
            max_prob = max(probabilities.values()) if probabilities else 0.5
            raw_score = max(max_prob * 0.75, 0.40)

        # 4. LOW conditions:
        # Benign or very low non-toxic signals
        else:
            level = "LOW"
            max_prob = max(probabilities.values()) if probabilities else 0.0
            raw_score = min(max_prob * 0.3, 0.25)

        # Ensure score bounds
        final_score = round(min(max(float(raw_score), 0.0), 1.0), 4)

        return SeverityResult(level=level, score=final_score)


# Singleton instance
severity_engine = SeverityEngine()
