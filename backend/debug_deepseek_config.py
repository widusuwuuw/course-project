#!/usr/bin/env python3
"""
测试DeepSeek配置的独立脚本
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_deepseek_import():
    print("Testing DeepSeek import and configuration...")

    try:
        # 测试环境变量加载
        from dotenv import load_dotenv

        env_paths = [
            Path(__file__).parent / '.env',  # backend/.env
            Path.cwd() / '.env',  # 当前工作目录 .env
        ]

        print("Checking .env files:")
        for env_path in env_paths:
            if env_path.exists():
                print(f"  Found: {env_path}")
                load_dotenv(dotenv_path=env_path, override=True)
                break
            else:
                print(f"  Not found: {env_path}")

        print(f"\nEnvironment variables:")
        print(f"  DEEPSEEK_API_KEY: {os.getenv('DEEPSEEK_API_KEY', 'Not set')}")
        print(f"  DEEPSEEK_MODEL: {os.getenv('DEEPSEEK_MODEL', 'Not set')}")

        # 测试导入
        print("\nTesting imports...")
        from app.services.deepseek_client import generate_answer, is_enabled

        print(f"  is_enabled(): {is_enabled()}")

        if is_enabled():
            print("\nTesting API call...")
            response = generate_answer("Hello, respond briefly please.")
            print(f"  Success! Response: {response[:100]}...")
        else:
            print("  API not enabled")

        return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_deepseek_import()
    print(f"\nResult: {'SUCCESS' if success else 'FAILED'}")