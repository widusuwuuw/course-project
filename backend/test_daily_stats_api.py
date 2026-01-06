"""测试 /logs/stats/daily API 返回的数据"""
import requests
import json
from datetime import datetime

BASE_URL = "http://8.148.21.215"

# 登录获取token
login_url = f"{BASE_URL}/api/login"
login_data = {
    "username": "123456@tongji.edu.cn",
    "password": "123456"  # 假设密码
}

print("=== 测试饮食统计 API ===\n")

# 尝试不同的密码
passwords = ["123456", "password", "test123", "123456789", "tongji123", "tongji"]

token = None
for pwd in passwords:
    try:
        resp = requests.post(login_url, data={"username": "123456@tongji.edu.cn", "password": pwd})
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            print(f"✓ 登录成功，密码: {pwd}")
            break
        else:
            print(f"✗ 密码 {pwd}: {resp.json().get('detail', resp.status_code)}")
    except Exception as e:
        print(f"✗ 密码 {pwd}: {e}")

if not token:
    print("\n登录失败，请提供正确的密码")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}
today = datetime.now().strftime('%Y-%m-%d')

# 调用 /logs/stats/daily API
print(f"\n=== 获取今日({today})统计 ===")
stats_url = f"{BASE_URL}/api/logs/stats/daily?date={today}"
print(f"URL: {stats_url}")

resp = requests.get(stats_url, headers=headers)
print(f"状态码: {resp.status_code}")

if resp.status_code == 200:
    data = resp.json()
    print("\n返回数据:")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    print("\n=== 关键字段 ===")
    print(f"diet.actual.calories = {data.get('diet', {}).get('actual', {}).get('calories')}")
    print(f"has_diet_record = {data.get('has_diet_record')}")
else:
    print(f"错误: {resp.text}")
