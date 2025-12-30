#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库初始化脚本
创建数据库表并添加一些测试数据
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import hashlib

# 添加当前目录到Python路径
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import SessionLocal, engine
from app.models import Base, User, HealthLog, LabReport, LabResult
from app.security import get_password_hash

def create_tables():
    """创建所有数据库表"""
    print("[INFO] 创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] 数据库表创建完成！")

def create_sample_data():
    """创建示例数据"""
    print("[INFO] 创建示例数据...")
    db = SessionLocal()

    try:
        # 检查是否已有数据
        existing_user = db.query(User).first()
        if existing_user:
            print("[INFO] 数据库中已有数据，跳过示例数据创建")
            return

        # 创建示例用户
        users_data = [
            {
                "email": "demo@omnihealth.com",
                "password": "demo123"
            },
            {
                "email": "test@omnihealth.com",
                "password": "test123"
            },
            {
                "email": "health@omnihealth.com",
                "password": "health123"
            }
        ]

        created_users = []
        for user_data in users_data:
            # 确保密码不超过bcrypt的72字节限制
            password = user_data["password"][:72]  # 截断到72字符
            user = User(
                email=user_data["email"],
                password_hash=get_password_hash(password),
                created_at=datetime.utcnow()
            )
            db.add(user)
            created_users.append(user)

        db.commit()

        # 为每个用户添加健康数据
        base_date = datetime.utcnow() - timedelta(days=30)

        for i, user in enumerate(created_users):
            # 每个用户不同的健康数据模式
            if i == 0:  # Demo用户 - 体重变化
                base_weight = 75.0
                for day in range(30):
                    # 模拟体重逐渐下降的趋势
                    weight = base_weight - (day * 0.05) + (hash(f"{user.id}_{day}") % 100) / 1000
                    log_date = base_date + timedelta(days=day)

                    health_log = HealthLog(
                        user_id=user.id,
                        metric_type="weight",
                        value1=round(weight, 1),
                        unit="kg",
                        logged_at=log_date
                    )
                    db.add(health_log)

            elif i == 1:  # Test用户 - 体重记录
                base_weight = 65.0
                for day in range(30):
                    weight = base_weight + (hash(f"{user.id}_{day}") % 300) / 100 - 0.15
                    log_date = base_date + timedelta(days=day)

                    health_log = HealthLog(
                        user_id=user.id,
                        metric_type="weight",
                        value1=round(weight, 1),
                        unit="kg",
                        logged_at=log_date
                    )
                    db.add(health_log)

            elif i == 2:  # Health用户 - 更多样化的健康数据
                # 体重记录
                base_weight = 80.0
                for day in range(30):
                    if day % 2 == 0:  # 每2天记录一次体重
                        weight = base_weight - (day * 0.03) + (hash(f"{user.id}_{day}") % 200) / 1000
                        log_date = base_date + timedelta(days=day)

                        health_log = HealthLog(
                            user_id=user.id,
                            metric_type="weight",
                            value1=round(weight, 1),
                            unit="kg",
                            logged_at=log_date
                        )
                        db.add(health_log)

        db.commit()

        print("[SUCCESS] 示例数据创建完成！")
        print("\n[INFO] 创建的用户账户：")
        for i, user in enumerate(created_users):
            print(f"  {i+1}. {user.email} (密码: {users_data[i]['password']})")

        print("\n[INFO] 健康数据统计：")
        total_logs = db.query(HealthLog).count()
        print(f"  - 总共创建了 {total_logs} 条健康记录")

        for user in created_users:
            user_logs = db.query(HealthLog).filter(HealthLog.user_id == user.id).count()
            print(f"  - {user.email}: {user_logs} 条记录")

    except Exception as e:
        print(f"[ERROR] 创建示例数据失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """主函数"""
    print("[INFO] 开始初始化 Omnihealth 数据库...\n")

    try:
        # 创建数据库表
        create_tables()

        # 创建示例数据
        create_sample_data()

        print(f"\n[SUCCESS] 数据库初始化完成！")
        print(f"[INFO] 数据库文件位置: {Path('dev.db').absolute()}")

    except Exception as e:
        print(f"\n[ERROR] 数据库初始化失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()