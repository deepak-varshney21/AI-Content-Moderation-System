"""Policy / Decision Engine Module.

Encapsulates all moderation business rules and action mapping.
Separates policy logic completely from machine learning model inference.
"""

from typing import Dict, List, Tuple
from app.schemas.moderation import SeverityResult


class PolicyEngine:
    """Configurable rule-based moderation policy engine."""

    ACTIONS = ["ALLOW", "CENSOR", "HIDE", "FLAG", "DELETE"]

    def evaluate_policy(
        self,
        probabilities: Dict[str, float],
        detected_labels: List[str],
        severity: SeverityResult,
        has_censorable_words: bool,
    ) -> Tuple[str, str]:
        """Evaluate moderation action and generate a human-readable explanation.

        Args:
            probabilities: Probability dictionary for all 6 toxicity categories
            detected_labels: Labels that passed the threshold
            severity: Calculated SeverityResult (level and score)
            has_censorable_words: Boolean indicating whether censor dictionary matched tokens

        Returns:
            Tuple of (recommended_action, explanation_text)
        """
        level = severity.level
        threat_score = probabilities.get("threat", 0.0)
        severe_toxic_score = probabilities.get("severe_toxic", 0.0)
        hate_score = probabilities.get("identity_hate", 0.0)

        # 1. CRITICAL SEVERITY -> DELETE
        if level == "CRITICAL":
            action = "DELETE"
            reasons = []
            if threat_score >= 0.40:
                reasons.append("credible physical threat indicators")
            if severe_toxic_score >= 0.45:
                reasons.append("extreme / severe toxicity")
            reason_str = " and ".join(reasons) if reasons else "critical safety policy violations"
            explanation = (
                f"Critical risk detected due to {reason_str} (Severity: CRITICAL, Score: {severity.score:.0%}). "
                "The moderation policy mandates immediate deletion to ensure community safety."
            )
            return action, explanation

        # 2. HIGH SEVERITY -> FLAG
        if level == "HIGH":
            action = "FLAG"
            reasons = []
            if hate_score >= 0.40:
                reasons.append("identity-based hate speech")
            if "insult" in detected_labels and "toxic" in detected_labels:
                reasons.append("aggressive targeted hostility")
            if severe_toxic_score >= 0.35:
                reasons.append("elevated severe toxicity")
            reason_str = " and ".join(reasons) if reasons else f"high severity content ({', '.join(detected_labels)})"
            explanation = (
                f"High-severity harmful content detected involving {reason_str} (Severity: HIGH, Score: {severity.score:.0%}). "
                "The moderation policy recommends flagging this item for human moderator review and containment."
            )
            return action, explanation

        # 3. MEDIUM SEVERITY -> CENSOR or HIDE
        if level == "MEDIUM":
            if has_censorable_words:
                action = "CENSOR"
                labels_str = ", ".join(detected_labels) if detected_labels else "profanity"
                explanation = (
                    f"Moderate {labels_str} detected with actionable profanities or offensive phrases. "
                    "Based on the configured policy, the recommended action is CENSOR to mask vulgar terms while preserving text flow."
                )
            else:
                action = "HIDE"
                labels_str = ", ".join(detected_labels) if detected_labels else "toxic nuances"
                explanation = (
                    f"Moderate {labels_str} detected without specific dictionary profanity. "
                    "The moderation policy recommends hiding the comment from public feeds to maintain decorum."
                )
            return action, explanation

        # 4. LOW SEVERITY -> ALLOW (or CENSOR if isolated profanity word found)
        if has_censorable_words and (probabilities.get("obscene", 0.0) >= 0.30 or probabilities.get("insult", 0.0) >= 0.30):
            action = "CENSOR"
            explanation = (
                "Mild profanity or colloquial vulgarity detected without widespread hostility. "
                "The policy recommends censoring specific words to keep the space clean."
            )
            return action, explanation

        action = "ALLOW"
        explanation = (
            f"No policy-violating harmful content detected (Severity: LOW, Score: {severity.score:.0%}). "
            "The comment complies with community guidelines and is safe to publish."
        )
        return action, explanation


# Singleton instance
policy_engine = PolicyEngine()
