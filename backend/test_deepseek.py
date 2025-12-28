#!/usr/bin/env python3
"""
测试DeepSeek客户端导入和功能
"""

import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    print("Testing imports...")

    try:
        print("1. Testing openai import...")
        import openai
        print("   OK OpenAI imported successfully")
    except Exception as e:
        print(f"   FAIL OpenAI import failed: {e}")
        return False

    try:
        print("2. Testing deepseek_client import...")
        from app.services.deepseek_client import generate_answer, is_enabled
        print("   OK deepseek_client imported successfully")
    except Exception as e:
        print(f"   FAIL deepseek_client import failed: {e}")
        return False

    try:
        print("3. Testing configuration...")
        print(f"   is_enabled(): {is_enabled()}")

        if is_enabled():
            print("4. Testing API call...")
            response = generate_answer("Hello, please respond briefly.")
            print(f"   OK API call successful: {len(response)} characters")
            print(f"   Response preview: {response[:100]}...")
        else:
            print("   WARN API not enabled")

    except Exception as e:
        print(f"   FAIL Function test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    success = test_imports()
    if success:
        print("\n✓ All tests passed!")
    else:
        print("\n✗ Some tests failed!")
        sys.exit(1)