import os
from fastapi import APIRouter
from .db import Base, engine


router = APIRouter(prefix="/testing", tags=["testing"])


@router.post("/reset")
def reset_db():
    # Only allow in test mode
    if os.getenv("TESTING") != "1":
        return {"status": "ignored"}
    # Drop and recreate all tables for a clean slate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"status": "ok"}
