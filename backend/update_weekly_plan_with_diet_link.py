"""
更新现有周计划，添加运动-饮食联动数据
运行此脚本后，营养追踪页面将显示运动-饮食联动卡片
"""
import json
import sys
sys.path.insert(0, '.')

from app.db import SessionLocal
from app.models import WeeklyPlan
from app.services.weekly_plan_generator import WeeklyPlanGenerator

def update_weekly_plans_with_diet_link():
    db = SessionLocal()
    generator = WeeklyPlanGenerator()
    
    # 获取所有活跃的周计划
    plans = db.query(WeeklyPlan).filter(WeeklyPlan.is_active == True).all()
    
    print(f"找到 {len(plans)} 个活跃周计划")
    
    for plan in plans:
        print(f"\n处理周计划 ID={plan.id}, 用户ID={plan.user_id}")
        
        if not plan.daily_plans:
            print("  跳过：无 daily_plans")
            continue
        
        daily_plans = json.loads(plan.daily_plans)
        updated = False
        
        for day, day_data in daily_plans.items():
            exercises = day_data.get("exercises", [])
            diet = day_data.get("diet", {})
            
            # 检查是否已有联动数据
            if "exercise_diet_link" in diet:
                print(f"  {day}: 已有联动数据，跳过")
                continue
            
            # 分析运动
            analysis = generator._analyze_exercise_for_diet(exercises)
            
            if analysis["total_calories"] > 0:
                # 添加联动数据
                diet["exercise_diet_link"] = {
                    "exercise_calories": analysis["total_calories"],
                    "calorie_adjustment": int(analysis["total_calories"] * 0.8),
                    "has_strength_training": analysis["has_strength_training"],
                    "is_high_intensity": analysis["is_high_intensity"],
                    "primary_time_slot": analysis["primary_time_slot"],
                    "post_exercise_tips": analysis["post_exercise_tips"]
                }
                day_data["diet"] = diet
                updated = True
                print(f"  {day}: 添加联动数据 (运动消耗={analysis['total_calories']}kcal, 力量={analysis['has_strength_training']}, 时段={analysis['primary_time_slot']})")
            else:
                print(f"  {day}: 休息日，无运动消耗")
        
        if updated:
            plan.daily_plans = json.dumps(daily_plans, ensure_ascii=False)
            db.commit()
            print(f"  ✅ 已更新周计划 ID={plan.id}")
        else:
            print(f"  ⏭️ 无需更新")
    
    db.close()
    print("\n完成！请刷新营养追踪页面查看效果。")

if __name__ == "__main__":
    update_weekly_plans_with_diet_link()
