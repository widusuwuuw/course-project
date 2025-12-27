from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from dotenv import load_dotenv

# 先加载 .env 再导入依赖（assistant.py 会在导入时读取LLM配置）
def _load_env():
    candidates = [
        Path(__file__).resolve().parent.parent / '.env',  # backend/.env
        Path.cwd() / '.env',  # 当前工作目录 .env
    ]
    for p in candidates:
        if p.exists():
            load_dotenv(dotenv_path=p, override=False)
            break

_load_env()

from .db import Base, engine, get_db
from .models import User
from .auth import router as auth_router
from .routers.health_logs import router as health_logs_router
from .routers.lab import router as lab_router
from .routers.plans import router as plans_router
from .routers.preferences import router as preferences_router
from .routers.weekly_plans import router as weekly_plans_router
from .routers.nutrition import router as nutrition_router
from .assistant import router as assistant_router
from .testing import router as testing_router
from .api.exercise_prescription import router as exercise_prescription_router
from .api.food_ingredients import router as food_ingredients_router

# Import and initialize food ingredients data
from .data import food_ingredients_data
food_ingredients_data.initialize_core_foods()
from .utils import EmailCheckRequest, EmailCheckResponse
from sqlalchemy.orm import Session
from fastapi import Depends


def create_app() -> FastAPI:
    app = FastAPI(title="Omnihealth API", version="0.1.0")

    # 邮箱检查接口
    @app.post("/check-email", response_model=EmailCheckResponse)
    def check_email_exists(payload: EmailCheckRequest, db: Session = Depends(get_db)):
        user = db.query(User).filter(User.email == payload.email).first()
        return EmailCheckResponse(exists=user is not None)

    # Routers
    app.include_router(auth_router, tags=["auth"])
    app.include_router(health_logs_router)
    app.include_router(lab_router)
    app.include_router(plans_router)
    app.include_router(preferences_router)
    app.include_router(weekly_plans_router)
    app.include_router(nutrition_router)
    app.include_router(assistant_router)
    app.include_router(exercise_prescription_router)
    app.include_router(food_ingredients_router)
    # Testing utilities (enabled only when TESTING=1)
    if os.getenv("TESTING") == "1":
        app.include_router(testing_router)

    # Ensure tables exist for both runtime and tests
    Base.metadata.create_all(bind=engine)

    # CORS (allow Expo / Web clients during dev; tighten for prod)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
            "exp://127.0.0.1:19000",
            "exp://localhost:19000",
            "*"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


app = create_app()
