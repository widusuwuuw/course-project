"""直接从数据库查看周计划数据结构"""
from app.db import SessionLocal
from app.models import WeeklyPlan, User
import json

db = SessionLocal()

# 获取所有周计划
plans = db.query(WeeklyPlan).all()
print(f'共有 {len(plans)} 个周计划')

for p in plans[:1]:  # 只看第一个
    daily_plans = json.loads(p.daily_plans) if p.daily_plans else {}
    print(f'\n用户ID: {p.user_id}')
    print(f'计划ID: {p.id}')
    print(f'日期范围: {p.week_start_date} - {p.week_end_date}')
    print(f'包含的天: {list(daily_plans.keys())}')
    
    # 找周二(tuesday) - 今天是1月7日周二
    tuesday = daily_plans.get('tuesday')
    if tuesday:
        print('\n=== 周二计划(tuesday) ===')
        diet = tuesday.get('diet')
        if diet:
            print(f'饮食数据类型: {type(diet)}')
            if isinstance(diet, dict):
                print(f'饮食顶层键: {list(diet.keys())}')
                for meal in ['breakfast', 'lunch', 'dinner', 'snacks']:
                    m = diet.get(meal)
                    if m:
                        print(f'\n{meal}:')
                        print(f'  类型: {type(m)}')
                        if isinstance(m, dict):
                            print(f'  键: {list(m.keys())}')
                            print(f'  calories字段: {m.get("calories")}')
                            print(f'  total_calories字段: {m.get("total_calories")}')
                            nutrition = m.get("nutrition")
                            if nutrition:
                                print(f'  nutrition: {nutrition}')
                        elif isinstance(m, list):
                            print(f'  数组长度: {len(m)}')
                            total_cal = sum(item.get('calories', 0) for item in m)
                            print(f'  计算总热量: {total_cal}')
        else:
            print('没有饮食数据')
        
        exercise = tuesday.get('exercise')
        if exercise:
            print('\n=== 运动数据 ===')
            print(f'运动数据: {json.dumps(exercise, indent=2, ensure_ascii=False)}')
        else:
            print('\n没有运动计划')
    else:
        print('\n没有周二的计划')
        print(f'可用的天: {list(daily_plans.keys())}')
