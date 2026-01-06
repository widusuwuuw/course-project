"""测试 /logs/stats/daily API 返回的数据"""
import requests
import json
from datetime import datetime

BASE_URL = "http://8.148.21.215"

print("=== 测试饮食统计 API ===\n")

# 先测试登录端点是否可用
print("测试登录端点...")
test_urls = [
    f"{BASE_URL}/api/login",
    f"{BASE_URL}/login", 
    f"{BASE_URL}/api/v1/login",
]

for url in test_urls:
    try:
        resp = requests.post(url, data={"username": "test", "password": "test"}, timeout=5)
        print(f"  {url}: 状态码={resp.status_code}, 响应长度={len(resp.text)}")
        if resp.text:
            print(f"    响应: {resp.text[:200]}")
    except Exception as e:
        print(f"  {url}: 错误={e}")

# 使用正确的登录端点
login_url = f"{BASE_URL}/api/login"
login_data = {
    "username": "123456@tongji.edu.cn",
    "password": "123456"
}

print(f"\n登录 {login_data['username']}...")
try:
    resp = requests.post(login_url, data=login_data, timeout=10)
    print(f"状态码: {resp.status_code}")
    print(f"响应: {resp.text[:500] if resp.text else '(空)'}")
    
    if resp.status_code == 200 and resp.text:
        token = resp.json().get("access_token")
        if token:
            print(f"✓ 登录成功")
            
            headers = {"Authorization": f"Bearer {token}"}
            today = datetime.now().strftime('%Y-%m-%d')
            
            # 调用统计API
            stats_url = f"{BASE_URL}/api/logs/stats/daily?date={today}"
            print(f"\n获取今日({today})统计: {stats_url}")
            
            resp = requests.get(stats_url, headers=headers, timeout=10)
            print(f"状态码: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                print("\n=== 返回数据 ===")
                print(f"diet.actual.calories = {data.get('diet', {}).get('actual', {}).get('calories')}")
                print(f"has_diet_record = {data.get('has_diet_record')}")
                print(f"meals: {list(data.get('diet', {}).get('meals', {}).keys())}")
            else:
                print(f"错误: {resp.text}")
        else:
            print("✗ 登录响应中没有token")
    else:
        print(f"✗ 登录失败")
except Exception as e:
    print(f"✗ 请求失败: {e}")
