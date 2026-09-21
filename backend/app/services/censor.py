"""Censor Engine Service.

Performs dictionary-based safe text masking with word boundary preservation,
case-insensitivity, and punctuation handling.
"""

import logging
import os
import re
from typing import List, Set, Tuple
from app.config import settings

logger = logging.getLogger("moderation.censor")


class CensorEngine:
    """Safe keyword and profanity censoring engine."""

    def __init__(self, bad_words_file: str = settings.BAD_WORDS_FILE) -> None:
        self.bad_words_file = bad_words_file
        self.bad_words: Set[str] = set()
        self.regex_pattern: re.Pattern = re.compile(r"")
        self.load_dictionary()

    def load_dictionary(self) -> None:
        """Load bad words dictionary from disk and compile regex pattern."""
        words: Set[str] = set()
        if os.path.exists(self.bad_words_file):
            try:
                with open(self.bad_words_file, "r", encoding="utf-8") as f:
                    for line in f:
                        cleaned = line.strip().lower()
                        if cleaned and not cleaned.startswith("#"):
                            words.add(cleaned)
                logger.info("Loaded %d bad words from %s", len(words), self.bad_words_file)
            except Exception as e:
                logger.error("Failed to read bad words file %s: %s", self.bad_words_file, e)
        else:
            logger.warning("Bad words file not found at %s. Using default fallback list.", self.bad_words_file)
            words = {
                "stupid", "idiot", "bastard", "bitch", "asshole", "fuck", "fucking",
                "fucker", "shit", "dick", "crap", "moron", "loser", "jerk", "slut",
                "whore", "twat", "wanker", "dumbass", "piss", "scumbag"
            }

        self.bad_words = words
        if self.bad_words:
            # Sort by length descending to ensure longer phrases/words match first
            sorted_words = sorted(list(self.bad_words), key=len, reverse=True)
            escaped_words = [re.escape(w) for w in sorted_words]
            # Construct strict word-boundary pattern
            pattern_str = r"\b(" + "|".join(escaped_words) + r")\b"
            self.regex_pattern = re.compile(pattern_str, flags=re.IGNORECASE)
        else:
            self.regex_pattern = re.compile(r"(?!x)x")

    def has_censorable_words(self, text: str) -> bool:
        """Check if comment contains known bad words from the dictionary."""
        if not text or not self.bad_words:
            return False
        return bool(self.regex_pattern.search(text))

    def censor_text(self, text: str, mask_char: str = "*") -> Tuple[str, List[str]]:
        """Censor identified profanities while preserving surrounding punctuation, casing length, and whitespace.

        Args:
            text: Original comment text
            mask_char: Replacement character (default '*')

        Returns:
            Tuple of (censored_string, list_of_matched_words)
        """
        if not text or not self.bad_words:
            return text, []

        matched_words: List[str] = []

        def replace_match(match: re.Match) -> str:
            word = match.group(0)
            matched_words.append(word.lower())
            # Replace each character with mask character, preserving exact word length
            return mask_char * len(word)

        censored = self.regex_pattern.sub(replace_match, text)
        return censored, list(set(matched_words))


# Singleton instance
censor_engine = CensorEngine()
