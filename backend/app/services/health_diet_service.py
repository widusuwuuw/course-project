"""
健康档案联动饮食服务
根据用户健康指标自动调整饮食推荐
"""

from typing import Dict, List, Set, Optional
from dataclasses import dataclass
from app.data.food_ingredients_data import CORE_FOODS_DATA
from app.data.food_database import GlycemicIndex
import logging

logger = logging.getLogger(__name__)


@dataclass
class DietaryRestriction:
    """饮食限制"""
    condition: str           # 健康状况
    foods_to_avoid: List[str]  # 需要避免的食材ID
    foods_to_prefer: List[str]  # 推荐的食材ID
    nutrition_limits: Dict     # 营养素限制
    advice: str              # 饮食建议


# 健康指标阈值配置（基于中国成人标准）
HEALTH_THRESHOLDS = {
    # 尿酸 - 男性 > 420, 女性 > 360 为偏高
    'uric_acid': {'male_high': 420, 'female_high': 360},
    # 血糖 - > 6.1 为偏高, > 7.0 为糖尿病
    'glu': {'pre_diabetes': 6.1, 'diabetes': 7.0},
    # 糖化血红蛋白 - > 6.5% 为糖尿病
    'hba1c': {'pre_diabetes': 5.7, 'diabetes': 6.5},
    # 总胆固醇 - > 5.2 为偏高
    'tc': {'high': 5.2, 'very_high': 6.2},
    # 甘油三酯 - > 1.7 为偏高
    'tg': {'high': 1.7, 'very_high': 2.3},
    # LDL胆固醇 - > 3.4 为偏高
    'ldl_c': {'high': 3.4, 'very_high': 4.1},
    # 肌酐 - 男性 > 106, 女性 > 97 为偏高（肾功能下降）
    'crea': {'male_high': 106, 'female_high': 97},
}

# 高嘌呤食物列表（尿酸高者需避免）
HIGH_PURINE_FOODS = [
    'shrimp',      # 虾
    'salmon',      # 三文鱼
    'cod_fish',    # 鳕鱼
    'pork',        # 猪肉（内脏尤其高）
    'beef_lean',   # 瘦牛肉
    'lamb',        # 羊肉
    'duck',        # 鸭肉
    'mushroom_shiitake',  # 香菇
]

# 低嘌呤推荐食物
LOW_PURINE_FOODS = [
    'rice_white', 'brown_rice', 'oats_rolled',  # 谷物
    'egg', 'milk', 'yogurt', 'soymilk',  # 蛋奶
    'tofu', 'soybean',  # 豆制品
    'spinach', 'broccoli', 'tomato', 'cucumber',  # 蔬菜
    'apple', 'banana', 'orange', 'strawberry',  # 水果
]

# 高GI食物（血糖高者需避免）
HIGH_GI_FOODS = [
    'rice_white',   # 白米饭
    'porridge',     # 白粥
    'mantou',       # 馒头
    'baozi',        # 包子
    'youtiao',      # 油条
]

# 低GI推荐食物
LOW_GI_FOODS = [
    'brown_rice', 'oats_rolled', 'quinoa', 'wild_rice',  # 全谷物
    'spinach', 'broccoli', 'kale', 'cucumber', 'celery',  # 蔬菜
    'apple', 'strawberry', 'blueberry',  # 低糖水果
    'chicken_breast', 'salmon', 'egg', 'tofu',  # 蛋白质
    'walnut', 'almond', 'chia_seeds',  # 坚果
]

# 高胆固醇/高脂肪食物（血脂高者需限制）
HIGH_FAT_FOODS = [
    'pork',        # 猪肉（脂肪含量高）
    'lamb',        # 羊肉
    'duck',        # 鸭肉
    'egg',         # 鸡蛋（蛋黄胆固醇高，但适量可食）
    'youtiao',     # 油条
]

# 降脂推荐食物
LIPID_LOWERING_FOODS = [
    'oats_rolled',  # 燕麦（β-葡聚糖）
    'salmon',       # 三文鱼（omega-3）
    'cod_fish',     # 鳕鱼
    'walnut',       # 核桃
    'spinach', 'broccoli', 'kale',  # 绿叶蔬菜
    'apple', 'orange',  # 富含果胶
    'tofu', 'soymilk',  # 大豆蛋白
]


def analyze_health_profile(health_metrics: Dict, gender: str = 'male') -> List[DietaryRestriction]:
    """
    分析健康档案，返回饮食限制列表
    
    Args:
        health_metrics: 健康指标字典 {metric_key: value}
        gender: 性别 ('male' or 'female')
    
    Returns:
        List[DietaryRestriction]: 饮食限制列表
    """
    restrictions = []
    
    # 1. 检查尿酸
    uric_acid = health_metrics.get('uric_acid')
    if uric_acid:
        threshold = HEALTH_THRESHOLDS['uric_acid']['male_high' if gender == 'male' else 'female_high']
        if uric_acid > threshold:
            restrictions.append(DietaryRestriction(
                condition='高尿酸血症',
                foods_to_avoid=HIGH_PURINE_FOODS,
                foods_to_prefer=LOW_PURINE_FOODS,
                nutrition_limits={'purine': 'low'},
                advice=f'您的尿酸偏高({uric_acid}μmol/L)，建议减少高嘌呤食物（海鲜、内脏、浓汤），多喝水促进尿酸排泄'
            ))
            logger.info(f"[健康联动] 尿酸偏高 {uric_acid}，添加低嘌呤饮食限制")
    
    # 2. 检查血糖
    glu = health_metrics.get('glu')
    hba1c = health_metrics.get('hba1c')
    
    has_glucose_issue = False
    if glu and glu >= HEALTH_THRESHOLDS['glu']['pre_diabetes']:
        has_glucose_issue = True
    if hba1c and hba1c >= HEALTH_THRESHOLDS['hba1c']['pre_diabetes']:
        has_glucose_issue = True
    
    if has_glucose_issue:
        condition = '糖尿病' if (glu and glu >= 7.0) or (hba1c and hba1c >= 6.5) else '糖尿病前期'
        restrictions.append(DietaryRestriction(
            condition=condition,
            foods_to_avoid=HIGH_GI_FOODS,
            foods_to_prefer=LOW_GI_FOODS,
            nutrition_limits={'gi': 'low', 'sugar': 'restricted'},
            advice=f'您的血糖偏高，建议选择低GI主食（糙米、燕麦），控制精制碳水，增加膳食纤维摄入'
        ))
        logger.info(f"[健康联动] 血糖异常，添加低GI饮食限制")
    
    # 3. 检查血脂
    tc = health_metrics.get('tc')
    tg = health_metrics.get('tg')
    ldl_c = health_metrics.get('ldl_c')
    
    has_lipid_issue = False
    if tc and tc > HEALTH_THRESHOLDS['tc']['high']:
        has_lipid_issue = True
    if tg and tg > HEALTH_THRESHOLDS['tg']['high']:
        has_lipid_issue = True
    if ldl_c and ldl_c > HEALTH_THRESHOLDS['ldl_c']['high']:
        has_lipid_issue = True
    
    if has_lipid_issue:
        restrictions.append(DietaryRestriction(
            condition='血脂异常',
            foods_to_avoid=HIGH_FAT_FOODS,
            foods_to_prefer=LIPID_LOWERING_FOODS,
            nutrition_limits={'saturated_fat': 'low', 'cholesterol': 'restricted'},
            advice='您的血脂偏高，建议减少饱和脂肪摄入，增加富含omega-3的鱼类和全谷物'
        ))
        logger.info(f"[健康联动] 血脂异常，添加低脂饮食限制")
    
    # 4. 检查肾功能
    crea = health_metrics.get('crea')
    if crea:
        threshold = HEALTH_THRESHOLDS['crea']['male_high' if gender == 'male' else 'female_high']
        if crea > threshold:
            restrictions.append(DietaryRestriction(
                condition='肾功能下降',
                foods_to_avoid=['pork', 'beef_lean', 'lamb'],  # 限制高蛋白
                foods_to_prefer=['rice_white', 'vegetables', 'fruits'],
                nutrition_limits={'protein': 'moderate', 'sodium': 'low', 'potassium': 'moderate'},
                advice='您的肾功能指标偏高，建议适量控制蛋白质摄入，避免高钠高钾食物'
            ))
            logger.info(f"[健康联动] 肾功能偏低，添加蛋白质限制")
    
    return restrictions


def filter_foods_by_health(
    foods: List,
    restrictions: List[DietaryRestriction]
) -> List:
    """
    根据健康限制过滤食材列表
    
    Args:
        foods: 食材列表（FoodResource对象或字典）
        restrictions: 饮食限制列表
    
    Returns:
        过滤后的食材列表（保持原类型）
    """
    if not restrictions:
        return list(foods)
    
    # 收集所有需要避免和推荐的食材
    all_avoid = set()
    all_prefer = set()
    
    for r in restrictions:
        all_avoid.update(r.foods_to_avoid)
        all_prefer.update(r.foods_to_prefer)
    
    # 过滤
    filtered = []
    for food in foods:
        # 支持 FoodResource 对象和字典两种格式
        if hasattr(food, 'id'):
            food_id = food.id
            food_name = food.name
        else:
            food_id = food.get('food_id', food.get('id', ''))
            food_name = food.get('name', '')
        
        # 跳过需要避免的食材（按ID和名称都检查）
        if food_id in all_avoid or food_name in all_avoid:
            logger.debug(f"[健康过滤] 排除食材: {food_name} (ID: {food_id})")
            continue
        
        filtered.append(food)
    
    # 对于 FoodResource 对象，按推荐优先级排序
    def sort_key(food):
        if hasattr(food, 'id'):
            food_id = food.id
            food_name = food.name
        else:
            food_id = food.get('food_id', food.get('id', ''))
            food_name = food.get('name', '')
        
        # 健康推荐的排前面
        is_preferred = food_id in all_prefer or food_name in all_prefer
        return 0 if is_preferred else 1
    
    filtered.sort(key=sort_key)
    
    logger.info(f"[健康过滤] 原{len(foods)}种食材 -> 过滤后{len(filtered)}种")
    
    return filtered


def get_diet_advice_for_user(restrictions: List[DietaryRestriction]) -> List[str]:
    """
    获取用户的饮食建议列表
    
    Args:
        restrictions: 饮食限制列表
    
    Returns:
        建议列表
    """
    return [r.advice for r in restrictions]


def should_use_low_gi(restrictions: List[DietaryRestriction]) -> bool:
    """检查是否需要使用低GI食物"""
    for r in restrictions:
        if r.nutrition_limits.get('gi') == 'low':
            return True
    return False


def adjust_portions_for_health(
    meal_foods: List[Dict],
    restrictions: List[DietaryRestriction],
    meal_type: str
) -> List[Dict]:
    """
    根据健康限制调整食物份量
    
    Args:
        meal_foods: 餐食食物列表
        restrictions: 饮食限制
        meal_type: 餐食类型 (breakfast/lunch/dinner)
    
    Returns:
        调整份量后的食物列表
    """
    # TODO: 实现更精细的份量调整
    # 例如：血糖高→减少主食份量；血脂高→减少肉类份量
    return meal_foods
