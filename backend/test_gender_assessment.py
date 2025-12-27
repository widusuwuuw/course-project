#!/usr/bin/env python3
"""
测试性别特异性医学评估功能
"""
import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_gender_specific_assessment():
    """测试性别特异性医学评估"""
    print("开始测试性别特异性医学评估功能...")

    # 测试数据 - 相同的HDL-C值，男性和女性应该有不同的评估结果
    hdl_c_value = 1.1  # 这个值对男性来说是正常的，对女性来说偏低的测试数据
    test_metrics = [
        {"name": "hdl_c", "value": hdl_c_value, "unit": "mmol/L"}
    ]

    # 测试男性用户
    print(f"\n1. 测试男性用户 - HDL-C: {hdl_c_value} mmol/L")
    try:
        male_response = requests.post(
            f"{API_BASE_URL}/api/v1/lab/analyze",
            json={"metrics": test_metrics, "gender": "male"},
            headers={"Content-Type": "application/json"}
        )

        if male_response.status_code == 200:
            male_result = male_response.json()
            print("   男性评估成功")

            # 查找HDL-C的结果
            hdl_result = None
            for result in male_result.get("data", {}).get("individual_results", []):
                if "hdl" in result.get("metric_name", "").lower():
                    hdl_result = result
                    break

            if hdl_result:
                print(f"   - HDL-C状态: {hdl_result.get('status', 'unknown')}")
                print(f"   - 风险级别: {hdl_result.get('risk_level', 'unknown')}")
                print(f"   - 分析消息: {hdl_result.get('message', 'No message')}")
            else:
                print("   - 未找到HDL-C评估结果")
        else:
            print(f"   男性评估失败: {male_response.status_code}")

    except Exception as e:
        print(f"   男性评估异常: {e}")

    # 测试女性用户
    print(f"\n2. 测试女性用户 - HDL-C: {hdl_c_value} mmol/L")
    try:
        female_response = requests.post(
            f"{API_BASE_URL}/api/v1/lab/analyze",
            json={"metrics": test_metrics, "gender": "female"},
            headers={"Content-Type": "application/json"}
        )

        if female_response.status_code == 200:
            female_result = female_response.json()
            print("   女性评估成功")

            # 查找HDL-C的结果
            hdl_result = None
            for result in female_result.get("data", {}).get("individual_results", []):
                if "hdl" in result.get("metric_name", "").lower():
                    hdl_result = result
                    break

            if hdl_result:
                print(f"   - HDL-C状态: {hdl_result.get('status', 'unknown')}")
                print(f"   - 风险级别: {hdl_result.get('risk_level', 'unknown')}")
                print(f"   - 分析消息: {hdl_result.get('message', 'No message')}")
            else:
                print("   - 未找到HDL-C评估结果")
        else:
            print(f"   女性评估失败: {female_response.status_code}")

    except Exception as e:
        print(f"   女性评估异常: {e}")

    print("\n测试完成！")
    print("预期结果：")
    print("- 男性: HDL-C 1.1 mmol/L 应该显示为正常（≥1.0）")
    print("- 女性: HDL-C 1.1 mmol/L 应该显示为偏低（<1.3）")

if __name__ == "__main__":
    test_gender_specific_assessment()