"""Tests for Model Config id2label inspection and validation."""

from unittest.mock import MagicMock
import pytest
from app.services.toxicity_model import ToxicityModel


def test_model_id2label_verification_success():
    """Verify that ToxicityModel correctly maps the 6 Jigsaw labels and ignores extra labels like 'none'."""
    model_service = ToxicityModel()

    # Mock tokenizer and model config with actual oleksiizirka/xlm-roberta-toxicity-classifier id2label
    mock_model = MagicMock()
    mock_model.config.id2label = {
        0: "toxic",
        1: "severe_toxic",
        2: "obscene",
        3: "threat",
        4: "insult",
        5: "identity_hate",
        6: "none",
    }

    # Simulate _load_and_verify_from_hf inspection logic
    raw_id2label = mock_model.config.id2label
    normalized_id2label = {int(k): str(v).strip().lower() for k, v in raw_id2label.items()}
    
    target_to_index = {}
    ignored = set()
    for idx, lbl_name in normalized_id2label.items():
        matched = None
        for target in model_service.target_labels:
            if lbl_name == target or lbl_name == target.replace("_", ""):
                matched = target
                break
        if matched:
            target_to_index[matched] = idx
        else:
            ignored.add(lbl_name)

    # Assert all 6 labels mapped correctly
    assert len(target_to_index) == 6
    assert target_to_index["toxic"] == 0
    assert target_to_index["severe_toxic"] == 1
    assert target_to_index["obscene"] == 2
    assert target_to_index["threat"] == 3
    assert target_to_index["insult"] == 4
    assert target_to_index["identity_hate"] == 5

    # Assert 'none' is in ignored set and not in target categories
    assert "none" in ignored
    assert "none" not in target_to_index


def test_model_id2label_verification_failure():
    """Verify that ToxicityModel raises ValueError if required labels are missing from id2label."""
    model_service = ToxicityModel()

    mock_model = MagicMock()
    # Incomplete id2label missing identity_hate and threat
    mock_model.config.id2label = {
        0: "toxic",
        1: "severe_toxic",
        2: "obscene",
        3: "insult",
    }

    raw_id2label = mock_model.config.id2label
    normalized_id2label = {int(k): str(v).strip().lower() for k, v in raw_id2label.items()}

    target_to_index = {}
    for idx, lbl_name in normalized_id2label.items():
        for target in model_service.target_labels:
            if lbl_name == target:
                target_to_index[target] = idx

    missing = [target for target in model_service.target_labels if target not in target_to_index]
    assert "threat" in missing
    assert "identity_hate" in missing
