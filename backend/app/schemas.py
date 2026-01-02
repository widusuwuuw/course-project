from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    gender: Optional[str] = Field("default", pattern="^(male|female|other|default)$")


class UserOut(BaseModel):
    id: int
    email: EmailStr
    gender: Optional[str] = "default"
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat().replace('+00:00', 'Z')
        }


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HealthLogBase(BaseModel):
    metric_type: str = "weight"
    value1: float
    unit: str = "kg"
    logged_at: Optional[datetime] = None


class HealthLogCreate(HealthLogBase):
    pass


class HealthLogOut(HealthLogBase):
    id: int

    class Config:
        from_attributes = True


class HealthLogList(BaseModel):
    items: List[HealthLogOut]


class TrendPoint(BaseModel):
    date: date
    avg: float
    count: int


class TrendsResponse(BaseModel):
    metric: str
    days: int
    unit: str = "kg"
    points: List[TrendPoint]
    avg_last_7: Optional[float] = None
    avg_prev_7: Optional[float] = None
    weekly_change: Optional[float] = None
    trend: Optional[str] = None  # up | down | stable

# ===============================================
# Schemas for Community Feature v2 (with Tags/Images)
# ===============================================

class TagOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentOut(CommentBase):
    id: int
    created_at: datetime
    owner: UserOut

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat().replace('+00:00', 'Z')
        }

class PostBase(BaseModel):
    content: str

class PostCreate(PostBase):
    image_urls: List[str] = []
    tags: List[str] = []

class PostOut(PostBase):
    id: int
    created_at: datetime
    owner: UserOut
    image_urls: List[str] = []
    tags: List[TagOut] = []
    likes_count: int
    comments_count: int
    is_liked: bool = False

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat().replace('+00:00', 'Z')
        }