#!/usr/bin/env python3
"""
测试健康档案与饮食计划的联动功能

使用方法:
    python test_health_diet_integration.py
"""

import sys
sys.path.insert(0, '.')

from app.services.health_diet_service import (
    analyze_health_profile, 
    filter_foods_by_health,
    get_diet_advice_for_user,
    should_use_low_gi
)
from app.services.weekly_plan_generator import WeeklyPlanGenerator
from app.data.food_ingredients_data import CORE_FOODS_DATA
from datetime import datetime

def test_high_uric_acid():
    """测试高尿酸血症场景"""
    print("\n" + "=" * 60)
    print("🧪 测试场景1: 高尿酸血症患者")
    print("=" * 60)
    
    health_metrics = {
        'uric_acid': 500,  # 男性 >420 为高尿酸
    }
    
    restrictions = analyze_health_profile(health_metrics, 'male')
    print(f"\n📊 输入指标: 尿酸 = {health_metrics['uric_acid']} μmol/L")
    print(f"🔍 检测到限制: {[r.condition for r in restrictions]}")
    
    if restrictions:
        r = restrictions[0]
        print(f"\n❌ 需要避免的食材: {r.foods_to_avoid}")
        print(f"✅ 推荐的食材: {r.foods_to_prefer}")
        print(f"💡 建议: {r.advice}")
    
    # 测试食材过滤
    filtered = filter_foods_by_health(CORE_FOODS_DATA, restrictions)
    print(f"\n📦 食材过滤: {len(CORE_FOODS_DATA)} → {len(filtered)} 种")
    
    # 检查被过滤掉的食材
    filtered_ids = {f.id for f in filtered}
    removed = [f.name for f in CORE_FOODS_DATA if f.id not in filtered_ids]
    print(f"🚫 被排除的食材: {removed}")


def test_diabetes_prediabetes():
    """测试糖尿病前期场景"""
    print("\n" + "=" * 60)
    print("🧪 测试场景2: 糖尿病前期患者")
    print("=" * 60)
    
    health_metrics = {
        'glu': 6.5,  # 空腹血糖 >6.1 为糖尿病前期
    }
    
    restrictions = analyze_health_profile(health_metrics, 'female')
    print(f"\n📊 输入指标: 空腹血糖 = {health_metrics['glu']} mmol/L")
    print(f"🔍 检测到限制: {[r.condition for r in restrictions]}")
    
    if restrictions:
        r = restrictions[0]
        print(f"\n❌ 需要避免的食材: {r.foods_to_avoid}")
        print(f"✅ 推荐的食材: {r.foods_to_prefer}")
        print(f"💡 建议: {r.advice}")
    
    # 测试是否推荐低GI饮食
    use_low_gi = should_use_low_gi(restrictions)
    print(f"\n🥣 是否推荐低GI饮食: {'是' if use_low_gi else '否'}")


def test_combined_conditions():
    """测试多种健康问题组合"""
    print("\n" + "=" * 60)
    print("🧪 测试场景3: 多种健康问题组合 (高尿酸 + 高血脂)")
    print("=" * 60)
    
    health_metrics = {
        'uric_acid': 480,  # 高尿酸
        'tc': 6.0,         # 高总胆固醇
        'ldl_c': 4.0,      # 高低密度脂蛋白
    }
    
    restrictions = analyze_health_profile(health_metrics, 'male')
    print(f"\n📊 输入指标:")
    print(f"   - 尿酸: {health_metrics['uric_acid']} μmol/L")
    print(f"   - 总胆固醇: {health_metrics['tc']} mmol/L")
    print(f"   - 低密度脂蛋白: {health_metrics['ldl_c']} mmol/L")
    print(f"\n🔍 检测到限制: {[r.condition for r in restrictions]}")
    
    # 显示所有建议
    advice_list = get_diet_advice_for_user(restrictions)
    print("\n💡 综合饮食建议:")
    for i, advice in enumerate(advice_list, 1):
        print(f"   {i}. {advice}")
    
    # 测试食材过滤
    filtered = filter_foods_by_health(CORE_FOODS_DATA, restrictions)
    print(f"\n📦 食材过滤: {len(CORE_FOODS_DATA)} → {len(filtered)} 种")


def test_weekly_plan_generation():
    """测试带健康档案的周计划生成"""
    print("\n" + "=" * 60)
    print("🧪 测试场景4: 生成个性化周计划")
    print("=" * 60)
    
    # 模拟月度计划
    monthly_plan = {
        'exercise_framework': {
            'selected_exercises': [],
            'rest_days': ['sunday']
        },
        'diet_framework': {
            'recommended_foods': [],
            'hydration_goal': '2000ml'
        },
        'medical_constraints': {}
    }
    
    # 模拟健康指标（高尿酸 + 高血糖）
    health_metrics = {
        'uric_acid': 500,  # 高尿酸
        'glu': 6.5,        # 高血糖
    }
    
    print(f"\n📊 用户健康指标:")
    print(f"   - 尿酸: {health_metrics['uric_acid']} μmol/L")
    print(f"   - 血糖: {health_metrics['glu']} mmol/L")
    
    generator = WeeklyPlanGenerator()
    result = generator.generate_weekly_plan(
        monthly_plan=monthly_plan,
        user_preferences={},
        week_number=1,
        week_start_date=datetime(2025, 1, 20),
        health_metrics=health_metrics,
        user_gender='male'
    )
    
    # 查看周一饮食
    monday_diet = result['daily_plans']['monday']['diet']
    
    print(f"\n📅 周一饮食计划:")
    print(f"   热量目标: {monday_diet['calories_target']} kcal")
    
    restrictions = monday_diet.get('dietary_restrictions', [])
    if restrictions:
        print(f"   🏥 健康限制: {restrictions}")
    
    advice = monday_diet.get('health_advice', [])
    if advice:
        print(f"\n   💡 个性化建议:")
        for i, a in enumerate(advice, 1):
            print(f"      {i}. {a}")
    
    print(f"\n   🍳 早餐: {[f['name'] for f in monday_diet['breakfast']['foods']]}")
    print(f"   🍱 午餐: {[f['name'] for f in monday_diet['lunch']['foods']]}")
    print(f"   🍽️ 晚餐: {[f['name'] for f in monday_diet['dinner']['foods']]}")


def main():
    print("\n" + "=" * 60)
    print("🏥 健康档案 ↔️ 饮食计划 联动功能测试")
    print("=" * 60)
    
    test_high_uric_acid()
    test_diabetes_prediabetes()
    test_combined_conditions()
    test_weekly_plan_generation()
    
    print("\n" + "=" * 60)
    print("✅ 所有测试完成!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
