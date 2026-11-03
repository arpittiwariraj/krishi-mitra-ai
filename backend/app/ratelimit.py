"""Shared in-process rate limiter.

For production deployments with multiple workers, use a shared Redis storage
backend with slowapi. This project's MVP uses per-process memory storage.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, headers_enabled=False)
