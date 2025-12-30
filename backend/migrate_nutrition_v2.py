"""
营养追踪数据库迁移 v2
增强食物记录表，添加每日营养汇总表
"""
import sqlite3
from pathlib import Path

def migrate():
    # 数据库路径
    db_path = Path(__file__).resolve().parent.parent / "dev.db"
    print(f"迁移数据库: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. 删除旧的简单表（如果存在）并重建增强版
    cursor.execute("DROP TABLE IF EXISTS food_records")
    cursor.execute("DROP TABLE IF EXISTS nutrition_goals")
    cursor.execute("DROP TABLE IF EXISTS daily_nutrition_summary")
    
    # 2. 创建增强版食物记录表
    cursor.execute("""
        CREATE TABLE food_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            meal_type VARCHAR(20) NOT NULL,
            
            -- 食物信息
            food_name VARCHAR(100) NOT NULL,
            serving_size VARCHAR(50),
            quantity REAL DEFAULT 1,
            
            -- 营养成分（每份）
            calories REAL DEFAULT 0,
            protein REAL DEFAULT 0,
            carbs REAL DEFAULT 0,
            fat REAL DEFAULT 0,
            fiber REAL DEFAULT 0,
            sodium REAL DEFAULT 0,
            
            -- 来源追踪
            source_type VARCHAR(20) DEFAULT 'manual',
            food_ingredient_id VARCHAR(50),
            
            -- 元数据
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # 创建索引
    cursor.execute("""
        CREATE INDEX idx_food_records_user_date 
        ON food_records(user_id, date)
    """)
    
    cursor.execute("""
        CREATE INDEX idx_food_records_date_meal 
        ON food_records(date, meal_type)
    """)
    
    # 3. 创建用户营养配置表（增强版）
    cursor.execute("""
        CREATE TABLE nutrition_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            
            -- 基础目标
            daily_calories INTEGER DEFAULT 2000,
            daily_protein INTEGER DEFAULT 150,
            daily_carbs INTEGER DEFAULT 250,
            daily_fat INTEGER DEFAULT 65,
            daily_fiber INTEGER DEFAULT 25,
            daily_sodium_max INTEGER DEFAULT 2300,
            
            -- 计算方式
            calorie_calculation_mode VARCHAR(10) DEFAULT 'auto',
            
            -- 医学约束（从体检自动生成）
            medical_restrictions TEXT,
            
            -- 元数据
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # 4. 创建每日营养汇总表（用于快速查询和趋势分析）
    cursor.execute("""
        CREATE TABLE daily_nutrition_summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            
            -- 实际摄入
            actual_calories REAL DEFAULT 0,
            actual_protein REAL DEFAULT 0,
            actual_carbs REAL DEFAULT 0,
            actual_fat REAL DEFAULT 0,
            actual_fiber REAL DEFAULT 0,
            actual_sodium REAL DEFAULT 0,
            
            -- 目标（当天快照）
            target_calories INTEGER DEFAULT 2000,
            target_protein INTEGER DEFAULT 150,
            target_carbs INTEGER DEFAULT 250,
            target_fat INTEGER DEFAULT 65,
            
            -- 运动消耗
            exercise_calories_burned REAL DEFAULT 0,
            
            -- 完成度和评分
            completion_rate REAL DEFAULT 0,
            health_score INTEGER DEFAULT 0,
            
            -- 元数据
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            UNIQUE(user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    cursor.execute("""
        CREATE INDEX idx_daily_summary_user_date 
        ON daily_nutrition_summary(user_id, date)
    """)
    
    conn.commit()
    conn.close()
    
    print("✅ 营养追踪表 v2 创建成功")
    print("   - food_records (增强版)")
    print("   - nutrition_goals (增强版)")
    print("   - daily_nutrition_summary (新增)")

if __name__ == "__main__":
    migrate()
