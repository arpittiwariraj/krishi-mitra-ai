"""Tests for password hashing and JWT helpers."""

from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestPassword:
    def test_hash_and_verify(self):
        pw = "secret-password-123"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed) is True
        assert verify_password("wrong-password", hashed) is False

    def test_rehashes_are_different(self):
        h1 = hash_password("same-password")
        h2 = hash_password("same-password")
        assert h1 != h2  # a secure hasher includes a per-hash salt


class TestJWT:
    def test_create_and_decode(self):
        token = create_access_token(farmer_id=42)
        farmer_id = decode_access_token(token)
        assert farmer_id == 42

    def test_token_expires(self):
        token = create_access_token(farmer_id=7)
        decoded = decode_access_token(token)
        assert decoded == 7

    def test_unsigned_token_returns_none(self):
        assert decode_access_token("not-a-jwt") is None

    def test_tampered_token_returns_none(self):
        token = create_access_token(farmer_id=9)
        assert decode_access_token(token + "x") is None
