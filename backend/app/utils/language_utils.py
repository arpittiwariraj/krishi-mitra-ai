"""Small language helpers shared by routes and services."""

SUPPORTED_LANGUAGES = {"en", "hi"}


def normalize_language(language: str | None) -> str:
    value = (language or "en").strip().lower()
    return value if value in SUPPORTED_LANGUAGES else "en"


def pick(language: str, english: str, hindi: str) -> str:
    return hindi if normalize_language(language) == "hi" else english
