"""Automated tests for Backend Pipeline."""

import pytest
from app.config import settings
from app.database.database import Base, SessionLocal, engine
from app.database.models import ModerationRecord
from app.policy.rules import PolicyEngine
from app.schemas.moderation import SeverityResult
from app.services.censor import CensorEngine
from app.services.moderation import ModerationService
from app.services.severity import SeverityEngine
from app.services.toxicity_model import ToxicityModel


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup


def test_censor_engine_exact_and_boundary():
    """Verify censor engine masks words while preserving benign sub-words."""
    engine = CensorEngine()
    
    # Simple profanity replacement
    censored, matches = engine.censor_text("You are a stupid idiot!")
    assert "******" in censored
    assert "*****" in censored
    assert "!" in censored  # Preserves punctuation
    assert "stupid" in matches
    assert "idiot" in matches

    # Substring safety: "assume" should NOT match "ass", "class" should NOT match "ass"
    safe_text = "I assume this class is classic."
    censored_safe, matches_safe = engine.censor_text(safe_text)
    assert censored_safe == safe_text
    assert len(matches_safe) == 0


def test_severity_engine_rules():
    """Verify severity calculations against calibrated thresholds."""
    severity = SeverityEngine()

    # 1. Critical threat test
    crit_probs = {
        "toxic": 0.90,
        "severe_toxic": 0.30,
        "obscene": 0.20,
        "threat": 0.85,
        "insult": 0.70,
        "identity_hate": 0.10,
    }
    crit_res = severity.assess_severity(crit_probs, ["toxic", "threat", "insult"])
    assert crit_res.level == "CRITICAL"
    assert crit_res.score >= 0.80

    # 2. High identity hate test
    high_probs = {
        "toxic": 0.88,
        "severe_toxic": 0.20,
        "obscene": 0.15,
        "threat": 0.05,
        "insult": 0.80,
        "identity_hate": 0.75,
    }
    high_res = severity.assess_severity(high_probs, ["toxic", "insult", "identity_hate"])
    assert high_res.level == "HIGH"

    # 3. Medium toxic test
    med_probs = {
        "toxic": 0.65,
        "severe_toxic": 0.05,
        "obscene": 0.55,
        "threat": 0.01,
        "insult": 0.60,
        "identity_hate": 0.01,
    }
    med_res = severity.assess_severity(med_probs, ["toxic", "obscene", "insult"])
    assert med_res.level == "MEDIUM"

    # 4. Low benign test
    low_probs = {
        "toxic": 0.02,
        "severe_toxic": 0.01,
        "obscene": 0.01,
        "threat": 0.01,
        "insult": 0.02,
        "identity_hate": 0.01,
    }
    low_res = severity.assess_severity(low_probs, [])
    assert low_res.level == "LOW"
    assert low_res.score <= 0.25


def test_policy_engine_actions():
    """Verify policy engine action recommendations."""
    policy = PolicyEngine()

    # Critical -> DELETE
    crit_sev = SeverityResult(level="CRITICAL", score=0.95)
    action, exp = policy.evaluate_policy({"threat": 0.90}, ["threat"], crit_sev, False)
    assert action == "DELETE"
    assert "Critical" in exp

    # High -> FLAG
    high_sev = SeverityResult(level="HIGH", score=0.85)
    action, exp = policy.evaluate_policy({"identity_hate": 0.80}, ["identity_hate"], high_sev, False)
    assert action == "FLAG"
    assert "human moderator review" in exp

    # Medium with bad words -> CENSOR
    med_sev = SeverityResult(level="MEDIUM", score=0.60)
    action, exp = policy.evaluate_policy({"toxic": 0.70, "insult": 0.65}, ["toxic", "insult"], med_sev, True)
    assert action == "CENSOR"
    assert "CENSOR" in exp

    # Medium without bad words -> HIDE
    action, exp = policy.evaluate_policy({"toxic": 0.70}, ["toxic"], med_sev, False)
    assert action == "HIDE"

    # Low -> ALLOW
    low_sev = SeverityResult(level="LOW", score=0.05)
    action, exp = policy.evaluate_policy({"toxic": 0.05}, [], low_sev, False)
    assert action == "ALLOW"
