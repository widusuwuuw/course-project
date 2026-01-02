"""检查运动数据库"""
from app.data.exercise_database import EXERCISE_DATABASE, ExerciseCategory
from collections import Counter

print(f'运动数据库总数: {len(EXERCISE_DATABASE)}\n')

# 类别分布
print('类别分布:')
cats = Counter([ex.category.value for ex in EXERCISE_DATABASE])
for k, v in sorted(cats.items()):
    print(f'  {k}: {v}种')

# 按类别详细列表
print('\n按类别详细列表:')
for cat in ExerciseCategory:
    exs = [ex for ex in EXERCISE_DATABASE if ex.category == cat]
    if exs:
        print(f'\n【{cat.value}】({len(exs)}种):')
        for i, ex in enumerate(exs):
            print(f'  {i+1}. {ex.name}')
            print(f'     强度: {ex.intensity.value} | MET: {ex.met_value} | 时长: {ex.duration}分钟')
            if hasattr(ex, 'requirements') and ex.requirements:
                print(f'     设备: {", ".join(ex.requirements.equipment) if ex.requirements.equipment else "无需设备"}')
