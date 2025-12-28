"""
食材元数据库 - 基于中国食物成分表第6版和USDA营养数据库
包含50种核心食材的完整营养数据和医学标签
"""

from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

class FoodCategory(str, Enum):
    """食材类别枚举"""
    GRAINS = "谷物类"
    VEGETABLES = "蔬菜类"
    FRUITS = "水果类"
    PROTEINS = "蛋白质类"
    DAIRY = "乳制品类"
    LEGUMES = "豆制品类"
    NUTS_SEEDS = "坚果种子类"
    FUNGI = "菌菇类"
    SEAWEED = "海藻类"
    HERBS_SPICES = "香草调料类"

class NutrientDensity(str, Enum):
    """营养密度等级"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"

class GlycemicIndex(str, Enum):
    """血糖生成指数"""
    LOW = "low"  # ≤55
    MEDIUM = "medium"  # 56-69
    HIGH = "high"  # ≥70

class ProcessingLevel(str, Enum):
    """加工程度"""
    WHOLE = "whole"  # 全食物
    MINIMALLY_PROCESSED = "minimally_processed"  # 初加工
    MODERATELY_PROCESSED = "moderately_processed"  # 中等加工
    HIGHLY_PROCESSED = "highly_processed"  # 深加工

class AllergenType(str, Enum):
    """过敏原类型"""
    GLUTEN = "gluten"
    DAIRY = "dairy"
    NUTS = "nuts"
    SOY = "soy"
    FISH = "fish"
    SHELLFISH = "shellfish"
    EGGS = "eggs"
    SESAME = "sesame"

@dataclass
class Nutrients:
    """营养成分数据 (每100g可食部)"""
    # 宏量营养素
    calories: float  # 能量 (kcal)
    protein: float  # 蛋白质 (g)
    carbs: float  # 碳水化合物 (g)
    fat: float  # 脂肪 (g)
    fiber: float  # 膳食纤维 (g)

    # 矿物质
    calcium: float  # 钙 (mg)
    iron: float  # 铁 (mg)
    magnesium: float  # 镁 (mg)
    phosphorus: float  # 磷 (mg)
    potassium: float  # 钾 (mg)
    sodium: float  # 钠 (mg)
    zinc: float  # 锌 (mg)
    selenium: float  # 硒 (μg)

    # 维生素
    vitamin_a: float  # 维生素A (μg RAE)
    vitamin_c: float  # 维生素C (mg)
    vitamin_e: float  # 维生素E (mg)
    vitamin_k: float  # 维生素K (μg)
    thiamine: float  # 维生素B1 (mg)
    riboflavin: float  # 维生素B2 (mg)
    niacin: float  # 维生素B3 (mg)
    vitamin_b6: float  # 维生素B6 (mg)
    folate: float  # 叶酸 (μg)
    vitamin_b12: float  # 维生素B12 (μg)

@dataclass
class MedicalTags:
    """医学标签"""
    contraindications: List[str]  # 禁忌症
    suitable_conditions: List[str]  # 适合状况
    allergens: List[AllergenType]  # 过敏原
    glycemic_index: GlycemicIndex  # 血糖指数
    nutrient_density: NutrientDensity  # 营养密度
    monitoring_required: bool  # 是否需要医学监测

@dataclass
class StorageRequirements:
    """储存要求"""
    temperature: str  # 储存温度要求
    humidity: str  # 湿度要求
    shelf_life: int  # 保质期（天）
    storage_method: str  # 储存方法

@dataclass
class PreparationMethods:
    """制备方法"""
    recommended_methods: List[str]  # 推荐烹饪方法
    cooking_time_range: str  # 烹饪时间范围
    temperature_range: str  # 温度范围
    nutrition_retention_tips: List[str]  # 营养保存建议

@dataclass
class FoodDetails:
    """食材详细信息"""
    description: str
    health_benefits: List[str]  # 健康功效
    nutritional_highlights: List[str]  # 营养特点
    medicinal_properties: List[str]  # 药用价值
    seasonal_availability: str  # 季节性
    selection_tips: List[str]  # 挑选建议

@dataclass
class FoodResource:
    """食材资源数据模型"""
    id: str
    name: str
    scientific_name: str  # 学名
    category: FoodCategory

    # 基础信息
    common_names: List[str]  # 别名
    origin: str  # 原产地

    # 营养数据
    nutrients: Nutrients

    # 医学标签
    medical_tags: MedicalTags

    # 储存要求
    storage_requirements: StorageRequirements

    # 制备方法
    preparation_methods: PreparationMethods

    # 详细信息
    details: FoodDetails

    # 元数据
    created_at: datetime
    updated_at: datetime

# 食材元数据库将在模块初始化时填充
FOOD_DATABASE: List[FoodResource] = []

# ========== 医学条件数据库 ==========
MEDICAL_CONDITIONS_DATABASE = {
    '糖尿病': {
        'recommended_foods': ['全谷物', '绿叶蔬菜', '豆类', '低糖水果'],
        'restricted_foods': ['精制糖', '高糖水果', '精制谷物'],
        'max_glycemic_index': 'medium',
        'precautions': ['控制碳水化合物总量', '选择低GI食物', '定时定量']
    },
    '高血压': {
        'recommended_foods': ['富含钾的食物', '低钠食物', '深色蔬菜'],
        'restricted_foods': ['高钠食物', '加工食品', '腌制食品'],
        'max_sodium_per_day': 2300,  # mg
        'precautions': ['限制钠摄入', '增加钾摄入', '避免加工食品']
    },
    '心脏病': {
        'recommended_foods': ['富含Omega-3的食物', '全谷物', '坚果'],
        'restricted_foods': ['高饱和脂肪食物', '反式脂肪', '高胆固醇食物'],
        'max_saturated_fat': 13,  # g per day
        'precautions': ['选择健康脂肪', '限制饱和脂肪', '增加纤维摄入']
    },
    '肾病': {
        'recommended_foods': ['低蛋白食物', '低磷食物', '低钾食物'],
        'restricted_foods': ['高蛋白食物', '高磷食物', '高钾食物'],
        'precautions': ['限制蛋白质摄入', '控制磷钾摄入', '根据病情调整']
    },
    '肠胃疾病': {
        'recommended_foods': ['易消化食物', '低纤维食物', '温和食物'],
        'restricted_foods': ['辛辣食物', '高纤维食物', '产气食物'],
        'precautions': ['少食多餐', '避免刺激性食物', '选择温和食物']
    }
}

# 数据库访问函数
def get_all_foods() -> List[FoodResource]:
    """获取所有食材资源"""
    return FOOD_DATABASE

def get_food_by_id(food_id: str) -> Optional[FoodResource]:
    """根据ID获取食材资源"""
    for food in FOOD_DATABASE:
        if food.id == food_id:
            return food
    return None

def get_foods_by_category(category: FoodCategory) -> List[FoodResource]:
    """根据类别获取食材资源"""
    return [food for food in FOOD_DATABASE if food.category == category]

def get_foods_by_nutrient_density(density: NutrientDensity) -> List[FoodResource]:
    """根据营养密度获取食材资源"""
    return [food for food in FOOD_DATABASE if food.medical_tags.nutrient_density == density]

def get_foods_by_glycemic_index(gi: GlycemicIndex) -> List[FoodResource]:
    """根据血糖指数获取食材资源"""
    return [food for food in FOOD_DATABASE if food.medical_tags.glycemic_index == gi]

def get_medical_condition_info(condition: str) -> Optional[Dict]:
    """获取医学条件信息"""
    return MEDICAL_CONDITIONS_DATABASE.get(condition)

def search_foods(keywords: List[str]) -> List[FoodResource]:
    """搜索食材资源"""
    results = []
    for food in FOOD_DATABASE:
        # 搜索名称、类别、适合条件、健康功效
        search_text = f"{food.name} {' '.join(food.common_names)} {food.category} {' '.join(food.medical_tags.suitable_conditions)} {' '.join(food.details.health_benefits)}"
        if any(keyword.lower() in search_text.lower() for keyword in keywords):
            results.append(food)
    return results

def filter_foods_by_allergens(exclude_allergens: List[AllergenType]) -> List[FoodResource]:
    """根据过敏原筛选食材"""
    return [food for food in FOOD_DATABASE
            if not any(allergen in food.medical_tags.allergens for allergen in exclude_allergens)]

def get_nutrient_rich_foods(nutrient: str, top_n: int = 10) -> List[Tuple[FoodResource, float]]:
    """获取特定营养成分含量最高的食材"""
    food_nutrient_values = []
    for food in FOOD_DATABASE:
        nutrient_value = getattr(food.nutrients, nutrient, 0)
        if nutrient_value > 0:
            food_nutrient_values.append((food, nutrient_value))

    return sorted(food_nutrient_values, key=lambda x: x[1], reverse=True)[:top_n]

def initialize_food_database(foods_data: List[FoodResource]):
    """初始化食材数据库"""
    global FOOD_DATABASE
    FOOD_DATABASE = foods_data