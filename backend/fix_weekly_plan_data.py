"""修复周计划中运动数据的脚本"""
import json
from app.db import SessionLocal
from app.models import WeeklyPlan
from app.data.exercise_database import EXERCISE_DATABASE

def fix_weekly_plans():
    # 创建运动ID到数据的映射 (ExerciseResource是dataclass，用属性访问)
    exercise_map = {ex.id: ex for ex in EXERCISE_DATABASE}
    # 添加中文名称映射
    name_map = {ex.name: ex for ex in EXERCISE_DATABASE}

    db = SessionLocal()
    plans = db.query(WeeklyPlan).all()
    
    total_fixed = 0

    for plan in plans:
        if plan.daily_plans:
            daily_plans = json.loads(plan.daily_plans)
            updated = False
            
            for day, day_data in daily_plans.items():
                exercises = day_data.get('exercises', [])
                for ex in exercises:
                    # 查找运动数据
                    ex_data = exercise_map.get(ex.get('exercise_id')) or name_map.get(ex.get('name'))
                    if ex_data:
                        old_intensity = ex.get('intensity')
                        old_calories = ex.get('calories_target')
                        
                        # 更新数据 (ex_data是dataclass，用属性访问; intensity是enum需要取value)
                        new_intensity = ex_data.intensity.value if hasattr(ex_data.intensity, 'value') else ex_data.intensity
                        ex['intensity'] = new_intensity
                        ex['duration'] = ex_data.duration
                        # 计算正确的卡路里：MET * 70kg * duration / 60
                        ex['calories_target'] = int(ex_data.met_value * 70 * ex_data.duration / 60)
                        
                        if old_intensity != new_intensity or old_calories != ex['calories_target']:
                            print(f"修复 {day} - {ex['name']}: {old_intensity}/{old_calories}kcal -> {new_intensity}/{ex['calories_target']}kcal")
                            updated = True
                            total_fixed += 1
            
            if updated:
                plan.daily_plans = json.dumps(daily_plans, ensure_ascii=False)

    db.commit()
    db.close()
    print(f"\n数据修复完成！共修复 {total_fixed} 条运动数据")

if __name__ == "__main__":
    fix_weekly_plans()
