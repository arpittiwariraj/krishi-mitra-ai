"""Shared FastAPI dependencies for authentication."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.farmer import Farmer
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def _farmer_from_credentials(
    credentials: HTTPAuthorizationCredentials | None, db: Session
) -> Farmer | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    farmer_id = decode_access_token(credentials.credentials)
    if farmer_id is None:
        return None
    return db.get(Farmer, farmer_id)


def get_current_farmer(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Farmer:
    farmer = _farmer_from_credentials(credentials, db)
    if farmer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "UNAUTHORIZED", "message": "Authentication required"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return farmer


def get_optional_farmer(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Farmer | None:
    return _farmer_from_credentials(credentials, db)
