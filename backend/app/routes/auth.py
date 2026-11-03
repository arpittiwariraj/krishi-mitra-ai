"""Farmer registration, login and session identity endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_farmer
from app.models.farmer import Farmer, FarmerProfile
from app.schemas.farmer import FarmerCreate, FarmerLogin, FarmerOut
from app.security import create_access_token, hash_password, verify_password
from app.utils.responses import success

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _farmer_payload(farmer: Farmer) -> dict:
    return FarmerOut.model_validate(farmer).model_dump(mode="json")


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: FarmerCreate, db: Session = Depends(get_db)):
    existing = db.query(Farmer).filter(Farmer.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "EMAIL_EXISTS", "message": "An account with this email already exists"},
        )

    farmer = Farmer(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        state=payload.state,
        district=payload.district,
        preferred_language=payload.preferred_language,
    )
    farmer.profile = FarmerProfile()
    db.add(farmer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "EMAIL_EXISTS", "message": "An account with this email already exists"},
        ) from exc
    db.refresh(farmer)

    token = create_access_token(farmer.id)
    return success(
        {"access_token": token, "token_type": "bearer", "farmer": _farmer_payload(farmer)},
        "Account created successfully",
    )


@router.post("/login")
def login(payload: FarmerLogin, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.email == payload.email.lower()).first()
    if farmer is None or not verify_password(payload.password, farmer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )
    token = create_access_token(farmer.id)
    return success(
        {"access_token": token, "token_type": "bearer", "farmer": _farmer_payload(farmer)},
        "Login successful",
    )


@router.get("/me")
def me(farmer: Farmer = Depends(get_current_farmer)):
    return success(_farmer_payload(farmer))


@router.post("/logout")
def logout(farmer: Farmer = Depends(get_current_farmer)):
    return success(None, "Logged out. Discard the token on the client.")
