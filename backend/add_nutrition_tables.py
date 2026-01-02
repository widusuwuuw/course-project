"""
添加营养追踪表
"""
import sqlite3
from pathlib import Path

def migrate():
    # 数据库路径
    db_path = Path(__file__).resolve().parent.parent.parent.parent / "dev.db"
    print(f"迁移数据库: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建食物记录表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            meal_type VARCHAR(20) NOT NULL,
            food_name VARCHAR(100) NOT NULL,
            serving_size VARCHAR(50),
            calories REAL DEFAULT 0,
            protein REAL DEFAULT 0,
            carbs REAL DEFAULT 0,
            fat REAL DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # 创建索引
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_food_records_user_date 
        ON food_records(user_id, date)
    """)
    
    # 创建营养目标表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nutrition_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            daily_calories INTEGER DEFAULT 2000,
            daily_protein INTEGER DEFAULT 150,
            daily_carbs INTEGER DEFAULT 250,
            daily_fat INTEGER DEFAULT 65,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    conn.commit()
    conn.close()
    
    print("✅ 营养追踪表创建成功")

if __name__ == "__main__":
    migrate()
