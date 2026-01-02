#!/usr/bin/env python3
"""
重置用户密码的脚本
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.security import get_password_hash, verify_password
from app.db import DATABASE_URL

def reset_user_password(email: str, new_password: str):
    """重置指定用户的密码"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 查找用户
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"用户 {email} 不存在")
            return False

        # 生成新的密码哈希
        new_hash = get_password_hash(new_password)
        print(f"新密码哈希: {new_hash}")

        # 验证新哈希
        if verify_password(new_password, new_hash):
            print("✅ 新密码哈希验证成功")
        else:
            print("❌ 新密码哈希验证失败")
            return False

        # 更新密码
        user.password_hash = new_hash
        db.commit()

        print(f"✅ 用户 {email} 的密码已成功重置")
        return True

    except Exception as e:
        print(f"❌ 重置密码失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # 重置指定用户的密码
    email = "29845695@qq.com"
    password = "WTy051107"

    print(f"正在重置用户 {email} 的密码...")
    success = reset_user_password(email, password)

    if success:
        print("密码重置完成，现在可以尝试登录了！")
    else:
        print("密码重置失败")