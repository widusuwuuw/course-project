"""
检查运动元数据库与课程数据库的关联完整性
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.data.exercise_database import EXERCISE_DATABASE
from app.data.course_database import COURSE_DATABASE
from collections import defaultdict

# 获取所有运动ID
exercise_ids = [ex.id for ex in EXERCISE_DATABASE]
print(f"运动元数据库总共有 {len(exercise_ids)} 种运动\n")

# 统计每个运动ID关联的课程数量
course_count = defaultdict(int)
for course in COURSE_DATABASE:
    course_count[course.exercise_id] += 1

# 检查每个运动是否有课程关联
missing_courses = []
covered_count = 0

print("=== 运动与课程关联情况 ===\n")
for exercise_id in sorted(exercise_ids):
    count = course_count.get(exercise_id, 0)
    exercise = next((ex for ex in EXERCISE_DATABASE if ex.id == exercise_id), None)
    exercise_name = exercise.name if exercise else "未知"

    if count > 0:
        print(f"✓ {exercise_id:30} ({exercise_name:20}) - {count} 个课程")
        covered_count += 1
    else:
        print(f"✗ {exercise_id:30} ({exercise_name:20}) - 缺少课程")
        missing_courses.append((exercise_id, exercise_name))

print(f"\n=== 统计汇总 ===")
print(f"有课程的运动: {covered_count}/{len(exercise_ids)}")
print(f"缺少课程的运动: {len(missing_courses)}")

if missing_courses:
    print(f"\n=== 缺少课程的运动列表 ===")
    for ex_id, ex_name in missing_courses:
        print(f"  - {ex_id}: {ex_name}")
else:
    print(f"\n✓ 所有运动都有对应的课程！")
