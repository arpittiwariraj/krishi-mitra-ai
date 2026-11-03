"""Helpers for the consistent API response envelope."""

from typing import Any


def success(data: Any = None, message: str = "Request completed successfully") -> dict:
    return {"success": True, "message": message, "data": data}


def error(message: str, error_code: str, details: Any = None) -> dict:
    payload: dict[str, Any] = {
        "success": False,
        "message": message,
        "error_code": error_code,
    }
    if details is not None:
        payload["details"] = details
    return payload
