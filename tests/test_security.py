from __future__ import annotations

from datetime import timedelta

from cityguide_backend.core.security import (
    create_access_token,
    decode_jwt,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    password_hash = hash_password("StrongPass123")
    assert verify_password("StrongPass123", password_hash)


def test_jwt_encode_decode() -> None:
    token = create_access_token(
        subject="123",
        secret_key="secret",
        expires_delta=timedelta(minutes=5),
        extra_claims={"role": "user"},
    )
    payload = decode_jwt(token, "secret")
    assert payload["sub"] == "123"
    assert payload["role"] == "user"
