"""Toxicity Classification ML Model Service.

Loads a pretrained Hugging Face sequence classification model, validates its
`model.config.id2label` mapping against the 6 required Jigsaw toxicity categories,
handles extra non-toxicity labels (such as "none") separately, and computes
independent multi-label probabilities using Sigmoid activation.
"""

import logging
import time
from typing import Dict, List, Optional, Set
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.config import settings

logger = logging.getLogger("moderation.model")


class ToxicityModel:
    """Multi-label Toxicity Classification Service with strict id2label verification."""

    _instance: Optional["ToxicityModel"] = None

    def __init__(self) -> None:
        self.model_name = settings.MODEL_NAME
        self.fallback_model_name = settings.FALLBACK_MODEL_NAME
        self.tokenizer = None
        self.model = None
        self.device = self._select_device()
        self.is_loaded = False
        self.target_labels: List[str] = settings.TARGET_LABELS  # The 6 standard Jigsaw labels
        self.target_label_to_index: Dict[str, int] = {}  # Maps each standard label -> model output logit index
        self.raw_id2label: Dict[int, str] = {}
        self.ignored_labels: Set[str] = set()  # Extra labels like "none"

    @classmethod
    def get_instance(cls) -> "ToxicityModel":
        """Singleton instance provider."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _select_device(self) -> torch.device:
        """Select CUDA GPU if available and configured, otherwise CPU."""
        if settings.USE_GPU_IF_AVAILABLE and torch.cuda.is_available():
            selected = torch.device("cuda")
            logger.info("Using GPU acceleration: %s", torch.cuda.get_device_name(0))
        else:
            selected = torch.device("cpu")
            logger.info("Using CPU device for inference.")
        return selected

    def load_model(self) -> None:
        """Load tokenizer and model weights once during application startup, with strict label verification."""
        if self.is_loaded:
            logger.info("Model already initialized and verified.")
            return

        start_time = time.perf_counter()
        logger.info("Loading and verifying pretrained toxicity model '%s'...", self.model_name)

        try:
            self._load_and_verify_from_hf(self.model_name)
        except Exception as primary_error:
            logger.warning(
                "Primary model '%s' failed to load or verify (%s). Attempting fallback '%s'...",
                self.model_name,
                primary_error,
                self.fallback_model_name,
            )
            try:
                self._load_and_verify_from_hf(self.fallback_model_name)
                self.model_name = self.fallback_model_name
            except Exception as fallback_error:
                logger.error(
                    "Critical failure loading fallback model '%s': %s",
                    self.fallback_model_name,
                    fallback_error,
                )
                raise RuntimeError(
                    f"Unable to load or verify toxicity models: {fallback_error}"
                ) from fallback_error

        elapsed = (time.perf_counter() - start_time) * 1000.0
        self.is_loaded = True
        logger.info(
            "Toxicity model successfully loaded on %s in %.1f ms. Verified label mapping: %s (Ignored extra labels: %s)",
            self.device,
            elapsed,
            self.target_label_to_index,
            self.ignored_labels or "None",
        )

    def _load_and_verify_from_hf(self, model_identifier: str) -> None:
        """Instantiate tokenizer and model, inspect model.config.id2label, and verify required Jigsaw labels."""
        tokenizer = AutoTokenizer.from_pretrained(model_identifier)
        model = AutoModelForSequenceClassification.from_pretrained(model_identifier)
        model.to(self.device)
        model.eval()

        # Step 1: Inspect actual model.config.id2label
        raw_id2label = getattr(model.config, "id2label", None)
        if not raw_id2label or not isinstance(raw_id2label, dict):
            raise ValueError(
                f"Model '{model_identifier}' has invalid or missing 'model.config.id2label': {raw_id2label}"
            )

        # Normalize keys (int) and values (lowercase stripped strings)
        normalized_id2label: Dict[int, str] = {
            int(k): str(v).strip().lower() for k, v in raw_id2label.items()
        }

        # Step 2: Dynamically map the 6 required Jigsaw labels using model.config.id2label
        target_to_index: Dict[str, int] = {}
        ignored: Set[str] = set()

        for idx, lbl_name in normalized_id2label.items():
            # Check if this label matches any of our 6 target categories
            matched_target = None
            for target in self.target_labels:
                if lbl_name == target or lbl_name == target.replace("_", "") or lbl_name == target.replace("_", " "):
                    matched_target = target
                    break

            if matched_target:
                target_to_index[matched_target] = idx
            else:
                # E.g. "none" or other auxiliary non-toxicity classes
                ignored.add(lbl_name)

        # Step 3: Verify that all 6 required toxicity labels were found
        missing_labels = [target for target in self.target_labels if target not in target_to_index]
        if missing_labels:
            raise ValueError(
                f"Model configuration verification failed for '{model_identifier}'. "
                f"Missing required Jigsaw toxicity labels: {missing_labels}. "
                f"Available model.config.id2label: {normalized_id2label}"
            )

        # Assign verified attributes
        self.tokenizer = tokenizer
        self.model = model
        self.raw_id2label = normalized_id2label
        self.target_label_to_index = target_to_index
        self.ignored_labels = ignored

    def predict(self, text: str) -> Dict[str, float]:
        """Perform multi-label toxicity inference on the provided text.

        Applies Sigmoid activation over output logits (never softmax) and maps
        the verified indices to the 6 target Jigsaw labels. Extra labels like 'none'
        are excluded from the final output dictionary.

        Args:
            text: Cleaned English input comment.

        Returns:
            Dictionary mapping the 6 standard toxicity labels to probabilities [0.0, 1.0].
        """
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            logger.warning("Model was not pre-loaded. Initializing and verifying now on demand...")
            self.load_model()

        # Tokenize with truncation to max configured length
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=settings.MAX_SEQUENCE_LENGTH,
            padding=True,
        )

        # Move tensors to active device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits

            # CRITICAL: Multi-label classification requires Sigmoid, NOT Softmax!
            probabilities = torch.sigmoid(logits).squeeze(0).cpu().tolist()

        # Handle scalar output edge case
        if isinstance(probabilities, float):
            probabilities = [probabilities]

        # Extract probabilities strictly for the 6 verified target labels
        results: Dict[str, float] = {}
        for target in self.target_labels:
            idx = self.target_label_to_index[target]
            if idx < len(probabilities):
                prob = probabilities[idx]
            else:
                prob = 0.0

            results[target] = round(float(prob), 4)

        return results


# Global singleton instance
toxicity_model = ToxicityModel.get_instance()
