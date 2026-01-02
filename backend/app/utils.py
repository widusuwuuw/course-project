from pydantic import BaseModel, EmailStr


class EmailCheckRequest(BaseModel):
    email: EmailStr


class EmailCheckResponse(BaseModel):
    exists: bool