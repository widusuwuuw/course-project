import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 使用项目根目录的数据库，避免因启动目录不同导致使用不同数据库
PROJECT_ROOT = Path(__file__).parent.parent.parent  # backend/app/db.py -> 根目录
DB_PATH = PROJECT_ROOT / "dev.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# 调试日志
print(f"[DB] 数据库路径: {DB_PATH}")
print(f"[DB] 数据库存在: {DB_PATH.exists()}")
print(f"[DB] DATABASE_URL: {DATABASE_URL}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
