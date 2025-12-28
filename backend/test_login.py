#!/usr/bin/env python3
"""
直接测试登录逻辑
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import User
from app.security import verify_password

def test_login_logic():
    """测试登录逻辑"""
    print("测试登录逻辑...")

    db = SessionLocal()
    try:
        # 测试用户查找
        user = db.query(User).filter(User.email == "test@omnihealth.com").first()
        if not user:
            print("用户不存在")
            return

        print(f"找到用户: {user.email}")
        print(f"性别: {user.gender}")

        # 测试密码验证
        try:
            is_valid = verify_password("test123", user.password_hash)
            print(f"密码验证结果: {is_valid}")
        except Exception as e:
            print(f"密码验证失败: {e}")
            print(f"错误类型: {type(e)}")
            import traceback
            traceback.print_exc()

    finally:
        db.close()

if __name__ == "__main__":
    test_login_logic()