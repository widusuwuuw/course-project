from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .db import get_db
from .models import User
from .schemas import UserCreate, Token, UserOut
from .security import create_access_token, get_password_hash, verify_password, get_current_user


# 使用统一的密码加密方式
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()


@router.post("/register", status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        gender=payload.gender
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registered successfully"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm defines fields: username, password
    user = db.query(User).filter(User.email == form_data.username).first()

    # 检查用户是否存在
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="该邮箱尚未注册，请先注册账户"
        )

    # 检查密码是否正确
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误，请重新输入"
        )

    access_token = create_access_token({"sub": user.email}, expires_delta=timedelta(minutes=60))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前登录用户的信息"""
    return current_user


@router.put("/me", response_model=UserOut)
def update_user_info(
    gender: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    if gender is not None and gender not in ["male", "female", "other", "default"]:
        raise HTTPException(
            status_code=400,
            detail="Gender must be one of: male, female, other, default"
        )

    if gender is not None:
        current_user.gender = gender

    db.commit()
    db.refresh(current_user)
    return current_user
