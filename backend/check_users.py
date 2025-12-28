#!/usr/bin/env python3
"""
检查数据库中的用户数据
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal, engine
from app.models import User
from app.security import verify_password

def check_users():
    """检查用户数据"""
    print("检查数据库中的用户数据...")

    db = SessionLocal()
    try:
        users = db.query(User).all()

        print(f"找到 {len(users)} 个用户:")

        for user in users:
            print(f"\n用户: {user.email}")
            print(f"  ID: {user.id}")
            print(f"  性别: {user.gender}")
            print(f"  密码哈希: {user.password_hash[:50]}...")
            print(f"  创建时间: {user.created_at}")

            # 测试密码验证
            test_passwords = ["test123", "demo123", "health123"]
            for pwd in test_passwords:
                try:
                    is_valid = verify_password(pwd, user.password_hash)
                    print(f"  密码 '{pwd}': {'✓' if is_valid else '✗'}")
                except Exception as e:
                    print(f"  密码 '{pwd}': 错误 - {e}")

    finally:
        db.close()

if __name__ == "__main__":
    check_users()