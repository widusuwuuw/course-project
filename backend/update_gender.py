#!/usr/bin/env python3
"""
数据库迁移脚本：将所有现有用户的性别设置为男性
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.db import DATABASE_URL

def add_gender_column_and_update():
    """添加gender字段并更新所有现有用户为男性"""
    try:
        # 创建数据库连接
        engine = create_engine(DATABASE_URL)

        with engine.connect() as conn:
            # 首先检查gender字段是否存在
            check_result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in check_result.fetchall()]

            if 'gender' not in columns:
                print("gender字段不存在，正在添加...")
                # 添加gender字段
                conn.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(10) DEFAULT 'default'"))
                conn.commit()
                print("成功添加gender字段")
            else:
                print("gender字段已存在")

            # 更新所有现有用户为男性
            result = conn.execute(
                text("UPDATE users SET gender = 'male' WHERE gender IS NULL OR gender = 'default' OR gender = '';")
            )
            conn.commit()

            print(f"成功更新了 {result.rowcount} 个用户的性别设置为男性")

            # 验证更新结果
            verify_result = conn.execute(text("SELECT COUNT(*) FROM users WHERE gender = 'male'"))
            male_count = verify_result.scalar()

            total_result = conn.execute(text("SELECT COUNT(*) FROM users"))
            total_count = total_result.scalar()

            print(f"当前数据库状态：")
            print(f"   - 总用户数：{total_count}")
            print(f"   - 男性用户数：{male_count}")
            print(f"   - 更新覆盖率：{male_count/total_count*100:.1f}%")

        return True

    except Exception as e:
        print(f"数据库更新失败：{e}")
        return False

if __name__ == "__main__":
    print("开始执行用户性别数据迁移...")
    success = add_gender_column_and_update()

    if success:
        print("数据迁移完成！所有现有用户现在都使用男性性别设置。")
    else:
        print("数据迁移失败，请检查数据库连接和权限。")
        sys.exit(1)