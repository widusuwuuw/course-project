#!/usr/bin/env python3
"""
调试规则引擎错误
"""
import json
from app.services.rule_engine import MedicalRuleEngine

def debug_rule_engine():
    """调试规则引擎"""
    print("开始调试规则引擎...")

    try:
        # 创建规则引擎实例
        engine = MedicalRuleEngine()

        # 测试HDL-C评估
        print("\n1. 测试单个条件评估")
        result1 = engine.evaluate_condition(1.1, "lt", 1.0)
        print(f"   1.1 < 1.0: {result1}")

        result2 = engine.evaluate_condition(1.1, "lt", 1.3)
        print(f"   1.1 < 1.3: {result2}")

        # 测试完整的规则评估
        print("\n2. 测试完整的规则评估")
        test_metrics = [{"name": "hdl_c", "value": 1.1, "unit": "mmol/L"}]

        print("   测试男性性别:")
        try:
            male_result = engine.evaluate(test_metrics, "male")
            print(f"   男性评估成功: {len(male_result.get('individual_results', []))} 个结果")
        except Exception as e:
            print(f"   男性评估失败: {e}")

        print("   测试女性性别:")
        try:
            female_result = engine.evaluate(test_metrics, "female")
            print(f"   女性评估成功: {len(female_result.get('individual_results', []))} 个结果")
        except Exception as e:
            print(f"   女性评估失败: {e}")

    except Exception as e:
        print(f"调试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_rule_engine()