"""
数据库迁移脚本 - 添加 monthly_plans 表

运行方式：
cd backend
python -m app.scripts.migrate_add_monthly_plans
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db import engine, Base
from app.models import MonthlyPlan

def migrate():
    """执行迁移"""
    print("开始迁移：添加 monthly_plans 表...")
    
    # 创建表（如果不存在）
    Base.metadata.create_all(bind=engine, tables=[MonthlyPlan.__table__])
    
    print("✅ 迁移完成！monthly_plans 表已创建。")

if __name__ == "__main__":
    migrate()
