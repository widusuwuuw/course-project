"""测试今日计划API的返回数据结构"""
import requests
import json

# 登录获取token
login_url = "http://127.0.0.1:8000/login"
login_data = {
    "username": "29845695@qq.com",
    "password": "wty20031128"
}

print("正在登录...")
response = requests.post(login_url, data=login_data)
if response.status_code != 200:
    print(f"登录失败: {response.status_code}")
    print(response.text)
    exit(1)

token = response.json()["access_token"]
print(f"登录成功，Token: {token[:20]}...")

# 获取今日计划
headers = {"Authorization": f"Bearer {token}"}
today_url = "http://127.0.0.1:8000/api/v1/weekly-plans/today"

print("\n获取今日计划...")
response = requests.get(today_url, headers=headers)
print(f"状态码: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print("\n=== 今日计划完整数据 ===")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    print("\n=== 饮食部分详情 ===")
    diet = data.get("diet")
    if diet:
        for meal in ['breakfast', 'lunch', 'dinner', 'snacks']:
            meal_data = diet.get(meal)
            if meal_data:
                print(f"\n{meal}:")
                print(f"  类型: {type(meal_data)}")
                if isinstance(meal_data, dict):
                    print(f"  键: {meal_data.keys()}")
                    # 检查常见的热量字段
                    for key in ['total_calories', 'calories', 'nutrition']:
                        if key in meal_data:
                            print(f"  {key}: {meal_data[key]}")
                elif isinstance(meal_data, list):
                    print(f"  数组长度: {len(meal_data)}")
                    total = sum(item.get('calories', 0) for item in meal_data)
                    print(f"  总热量: {total}")
    else:
        print("没有饮食计划数据")
    
    print("\n=== 运动部分详情 ===")
    exercise = data.get("exercise")
    if exercise:
        print(f"运动数据类型: {type(exercise)}")
        print(f"运动数据: {json.dumps(exercise, indent=2, ensure_ascii=False)}")
    else:
        print("没有运动计划")
else:
    print(f"获取失败: {response.text}")
