"""查看食材元数据库"""
from app.data.food_ingredients_data import CORE_FOODS_DATA
from collections import Counter

print(f'食材元数据库总数: {len(CORE_FOODS_DATA)}')
print()

# 按类别统计
categories = Counter(f.category.value for f in CORE_FOODS_DATA)
print('各类别数量:')
for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {count}种')

print()
print('完整食材列表:')
for f in CORE_FOODS_DATA:
    gi = f.medical_tags.glycemic_index.value if f.medical_tags.glycemic_index else 'N/A'
    print(f'  - {f.name} ({f.category.value}, GI:{gi}, {f.nutrients.calories}kcal/100g)')
