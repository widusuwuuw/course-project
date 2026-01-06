"""深度检查今日计划的饮食目标值"""
import requests
import json
from datetime import datetime

# 服务器地址
BASE_URL = "http://8.148.21.215"

# 首先用服务器上的账户登录
login_url = f"{BASE_URL}/api/login"
login_data = {
    "username": "29845695@qq.com",
    "password": "wty20031128"
}

print("=" * 60)
print("深度检查今日计划饮食目标")
print("=" * 60)
print(f"\n今天是: {datetime.now().strftime('%Y-%m-%d')} (星期{datetime.now().weekday() + 1})")

# 尝试多个可能的账户
accounts = [
    ("29845695@qq.com", "wty20031128"),
    ("2984553085@qq.com", "wty20031128"),
    ("demo@omnihealth.com", "demo123"),
    ("test@omnihealth.com", "test123"),
]

token = None
for email, pwd in accounts:
    try:
        resp = requests.post(login_url, data={"username": email, "password": pwd})
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            print(f"\n✓ 登录成功: {email}")
            break
        else:
            print(f"✗ {email}: {resp.json().get('detail', resp.status_code)}")
    except Exception as e:
        print(f"✗ {email}: {e}")

if not token:
    print("\n所有账户登录失败!")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 获取今日计划
print("\n" + "=" * 60)
print("获取今日计划 (/api/v1/weekly-plans/today)")
print("=" * 60)

today_url = f"{BASE_URL}/api/v1/weekly-plans/today"
resp = requests.get(today_url, headers=headers)
print(f"状态码: {resp.status_code}")

if resp.status_code == 200:
    data = resp.json()
    
    print(f"\n日期: {data.get('date')}")
    print(f"星期: {data.get('weekday')}")
    print(f"是否休息日: {data.get('is_rest_day')}")
    
    # 详细分析饮食数据
    diet = data.get('diet')
    if diet:
        print("\n" + "-" * 40)
        print("饮食数据分析:")
        print("-" * 40)
        
        # 检查顶层的 calories_target
        if 'calories_target' in diet:
            print(f"\n★ diet.calories_target = {diet['calories_target']} kcal")
        
        # 检查 daily_totals
        if 'daily_totals' in diet:
            print(f"★ diet.daily_totals = {diet['daily_totals']}")
        
        # 逐餐分析
        meals = ['breakfast', 'lunch', 'dinner', 'snacks']
        total_from_meals = 0
        
        print("\n各餐详情:")
        for meal in meals:
            meal_data = diet.get(meal)
            if meal_data:
                cal = meal_data.get('calories', 0)
                total_from_meals += cal
                print(f"  {meal}: {cal} kcal")
                # 检查所有可能的热量字段
                for key in ['calories', 'total_calories', 'target_calories']:
                    if key in meal_data:
                        print(f"    - {key}: {meal_data[key]}")
                if 'nutrition' in meal_data:
                    print(f"    - nutrition.calories: {meal_data['nutrition'].get('calories')}")
        
        print(f"\n累加各餐热量: {total_from_meals} kcal")
        
        # 输出完整的diet结构（用于调试）
        print("\n" + "-" * 40)
        print("完整 diet 数据结构:")
        print("-" * 40)
        print(json.dumps(diet, indent=2, ensure_ascii=False))
    else:
        print("\n没有饮食数据")
    
    # 运动数据
    exercise = data.get('exercise')
    if exercise:
        print("\n" + "-" * 40)
        print("运动数据:")
        print("-" * 40)
        print(f"名称: {exercise.get('name')}")
        print(f"calories_target: {exercise.get('calories_target')}")
        print(f"calories_burn: {exercise.get('calories_burn')}")
    else:
        print("\n没有运动计划 (可能是休息日)")

else:
    print(f"获取失败: {resp.text}")
