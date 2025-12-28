import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.security import get_password_hash
from app.db import DATABASE_URL

# 重置用户密码
email = "29845695@qq.com"
password = "WTy051107"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

user = db.query(User).filter(User.email == email).first()
if user:
    new_hash = get_password_hash(password)
    user.password_hash = new_hash
    db.commit()
    print("Password reset successfully for:", email)
    print("New hash:", new_hash)
else:
    print("User not found:", email)

db.close()