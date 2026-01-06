"""检查饮食记录"""
import sqlite3
import json
from datetime import datetime

# 直接读取 prod.db
conn = sqlite3.connect('prod.db')
cursor = conn.cursor()

today = datetime.now().strftime('%Y-%m-%d')
print(f"=== 检查今日({today})的饮食记录 ===\n")

# 查询饮食记录表结构
cursor.execute("PRAGMA table_info(diet_logs)")
columns = cursor.fetchall()
print("diet_logs 表结构:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# 查询今日饮食记录
print(f"\n=== 今日饮食记录 ===")
cursor.execute("""
    SELECT id, user_id, meal_type, total_calories, foods, log_date, created_at 
    FROM diet_logs 
    WHERE date(log_date) = date('now', 'localtime')
    OR date(log_date) = ?
""", (today,))
logs = cursor.fetchall()

if logs:
    print(f"找到 {len(logs)} 条记录:")
    for log in logs:
        print(f"  ID: {log[0]}, 用户: {log[1]}, 餐类: {log[2]}, 热量: {log[3]}")
        print(f"    日期: {log[5]}, 创建时间: {log[6]}")
        if log[4]:
            foods = json.loads(log[4]) if isinstance(log[4], str) else log[4]
            print(f"    食物: {foods}")
else:
    print("没有找到今日饮食记录")

# 查看所有饮食记录
print(f"\n=== 所有饮食记录 ===")
cursor.execute("SELECT id, user_id, meal_type, total_calories, log_date FROM diet_logs ORDER BY log_date DESC LIMIT 10")
all_logs = cursor.fetchall()
if all_logs:
    for log in all_logs:
        print(f"  ID: {log[0]}, 用户: {log[1]}, 餐类: {log[2]}, 热量: {log[3]}, 日期: {log[4]}")
else:
    print("数据库中没有任何饮食记录")

conn.close()
