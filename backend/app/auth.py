from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session # Re-added
from .db import get_db # Re-added
from .models import User # Re-added
from .schemas import UserCreate, Token, UserOut, UserSettingsUpdate, PasswordUpdate, PasswordConfirmation # Re-added
from .security import create_access_token, verify_password, get_password_hash
from .deps import get_current_user
from starlette.requests import Request # Add this import


router = APIRouter()


@router.post("/register", status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=payload.email, password_hash=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registered successfully"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm defines fields: username, password
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token({"sub": user.email}, expires_delta=timedelta(minutes=60))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me/settings", response_model=UserOut)
async def update_user_settings(
    settings: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch the user from the current session to ensure changes are tracked
    user_in_db = db.query(User).filter(User.id == current_user.id).first()
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = settings.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_in_db, key, value)
    
    db.commit()
    db.refresh(user_in_db)
    return user_in_db


@router.put("/me/password")
def update_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    
    current_user.password_hash = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password updated successfully"}


@router.delete("/me")
def delete_account(
    payload: PasswordConfirmation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
    
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
