"""
食材数据库API
提供食材查询、筛选、推荐等功能
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..data.food_database import (
    get_all_foods, get_food_by_id, get_foods_by_category,
    get_foods_by_nutrient_density, get_foods_by_glycemic_index,
    search_foods, filter_foods_by_allergens,
    get_nutrient_rich_foods, get_medical_condition_info
)
from ..data.food_database import FoodCategory, NutrientDensity, GlycemicIndex, AllergenType

router = APIRouter(prefix="/food-ingredients", tags=["食材营养"])

# Pydantic模型
class NutrientInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    calcium: float
    iron: float
    magnesium: float
    phosphorus: float
    potassium: float
    sodium: float
    zinc: float
    selenium: float
    vitamin_a: float
    vitamin_c: float
    vitamin_e: float
    vitamin_k: float
    thiamine: float
    riboflavin: float
    niacin: float
    vitamin_b6: float
    folate: float
    vitamin_b12: float

class FoodInfo(BaseModel):
    food_id: str
    name: str
    scientific_name: str
    category: str
    common_names: List[str]
    origin: str
    nutrients: NutrientInfo
    health_benefits: List[str]
    nutritional_highlights: List[str]
    medicinal_properties: List[str]
    seasonal_availability: str
    selection_tips: List[str]
    preparation_methods: List[str]
    storage_method: str
    shelf_life: int

class MedicalConditionInfo(BaseModel):
    condition: str
    recommended_foods: List[str]
    restricted_foods: List[str]
    precautions: List[str]
    additional_info: dict

# API端点
@router.get("/foods", response_model=List[FoodInfo])
async def get_foods(
    category: Optional[str] = Query(None, description="食材类别"),
    nutrient_density: Optional[str] = Query(None, description="营养密度"),
    glycemic_index: Optional[str] = Query(None, description="血糖指数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    exclude_allergens: Optional[List[str]] = Query(None, description="排除过敏原")
):
    """
    获取食材列表
    支持按类别、营养密度、血糖指数筛选，以及搜索功能
    """
    try:
        # 获取所有食材
        foods = get_all_foods()

        # 按类别筛选
        if category:
            try:
                category_enum = FoodCategory(category)
                foods = [f for f in foods if f.category == category_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"无效的食材类别: {category}")

        # 按营养密度筛选
        if nutrient_density:
            try:
                density_enum = NutrientDensity(nutrient_density)
                foods = [f for f in foods if f.medical_tags.nutrient_density == density_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"无效的营养密度: {nutrient_density}")

        # 按血糖指数筛选
        if glycemic_index:
            try:
                gi_enum = GlycemicIndex(glycemic_index)
                foods = [f for f in foods if f.medical_tags.glycemic_index == gi_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"无效的血糖指数: {glycemic_index}")

        # 搜索功能
        if search:
            keywords = search.split()
            foods = search_foods(keywords)

        # 排除过敏原
        if exclude_allergens:
            try:
                allergen_enums = []
                for allergen in exclude_allergens:
                    allergen_enums.append(AllergenType(allergen))
                foods = filter_foods_by_allergens(allergen_enums)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"无效的过敏原类型: {e}")

        # 转换为响应格式
        result = []
        for food in foods:
            food_info = FoodInfo(
                food_id=food.id,
                name=food.name,
                scientific_name=food.scientific_name,
                category=food.category.value,
                common_names=food.common_names,
                origin=food.origin,
                nutrients=NutrientInfo(
                    calories=food.nutrients.calories,
                    protein=food.nutrients.protein,
                    carbs=food.nutrients.carbs,
                    fat=food.nutrients.fat,
                    fiber=food.nutrients.fiber,
                    calcium=food.nutrients.calcium,
                    iron=food.nutrients.iron,
                    magnesium=food.nutrients.magnesium,
                    phosphorus=food.nutrients.phosphorus,
                    potassium=food.nutrients.potassium,
                    sodium=food.nutrients.sodium,
                    zinc=food.nutrients.zinc,
                    selenium=food.nutrients.selenium,
                    vitamin_a=food.nutrients.vitamin_a,
                    vitamin_c=food.nutrients.vitamin_c,
                    vitamin_e=food.nutrients.vitamin_e,
                    vitamin_k=food.nutrients.vitamin_k,
                    thiamine=food.nutrients.thiamine,
                    riboflavin=food.nutrients.riboflavin,
                    niacin=food.nutrients.niacin,
                    vitamin_b6=food.nutrients.vitamin_b6,
                    folate=food.nutrients.folate,
                    vitamin_b12=food.nutrients.vitamin_b12
                ),
                health_benefits=food.details.health_benefits,
                nutritional_highlights=food.details.nutritional_highlights,
                medicinal_properties=food.details.medicinal_properties,
                seasonal_availability=food.details.seasonal_availability,
                selection_tips=food.details.selection_tips,
                preparation_methods=food.preparation_methods.recommended_methods,
                storage_method=food.storage_requirements.storage_method,
                shelf_life=food.storage_requirements.shelf_life
            )
            result.append(food_info)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取食材列表失败: {str(e)}")

@router.get("/foods/{food_id}", response_model=FoodInfo)
async def get_food_details(food_id: str):
    """
    获取特定食材的详细信息
    """
    food = get_food_by_id(food_id)
    if not food:
        raise HTTPException(status_code=404, detail=f"未找到食材: {food_id}")

    return FoodInfo(
        food_id=food.id,
        name=food.name,
        scientific_name=food.scientific_name,
        category=food.category.value,
        common_names=food.common_names,
        origin=food.origin,
        nutrients=NutrientInfo(
            calories=food.nutrients.calories,
            protein=food.nutrients.protein,
            carbs=food.nutrients.carbs,
            fat=food.nutrients.fat,
            fiber=food.nutrients.fiber,
            calcium=food.nutrients.calcium,
            iron=food.nutrients.iron,
            magnesium=food.nutrients.magnesium,
            phosphorus=food.nutrients.phosphorus,
            potassium=food.nutrients.potassium,
            sodium=food.nutrients.sodium,
            zinc=food.nutrients.zinc,
            selenium=food.nutrients.selenium,
            vitamin_a=food.nutrients.vitamin_a,
            vitamin_c=food.nutrients.vitamin_c,
            vitamin_e=food.nutrients.vitamin_e,
            vitamin_k=food.nutrients.vitamin_k,
            thiamine=food.nutrients.thiamine,
            riboflavin=food.nutrients.riboflavin,
            niacin=food.nutrients.niacin,
            vitamin_b6=food.nutrients.vitamin_b6,
            folate=food.nutrients.folate,
            vitamin_b12=food.nutrients.vitamin_b12
        ),
        health_benefits=food.details.health_benefits,
        nutritional_highlights=food.details.nutritional_highlights,
        medicinal_properties=food.details.medicinal_properties,
        seasonal_availability=food.details.seasonal_availability,
        selection_tips=food.details.selection_tips,
        preparation_methods=food.preparation_methods.recommended_methods,
        storage_method=food.storage_requirements.storage_method,
        shelf_life=food.storage_requirements.shelf_life
    )

@router.get("/categories")
async def get_food_categories():
    """
    获取所有食材类别
    """
    return {
        "categories": [
            {"value": category.value, "name": category.value}
            for category in FoodCategory
        ]
    }

@router.get("/nutrient-rich/{nutrient}")
async def get_nutrient_rich(
    nutrient: str,
    top_n: int = Query(10, description="返回前N个食材")
):
    """
    获取特定营养成分含量最高的食材
    """
    try:
        nutrient_rich_foods = get_nutrient_rich_foods(nutrient, top_n)

        result = []
        for food, value in nutrient_rich_foods:
            result.append({
                "food_id": food.id,
                "name": food.name,
                "category": food.category.value,
                f"{nutrient}_per_100g": value,
                "unit": get_nutrient_unit(nutrient)
            })

        return {
            "nutrient": nutrient,
            "unit": get_nutrient_unit(nutrient),
            "foods": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取营养成分数据失败: {str(e)}")

@router.get("/medical-conditions/{condition}", response_model=MedicalConditionInfo)
async def get_medical_condition(condition: str):
    """
    获取特定医学条件的饮食建议
    """
    info = get_medical_condition_info(condition)
    if not info:
        raise HTTPException(status_code=404, detail=f"未找到医学条件: {condition}")

    return MedicalConditionInfo(
        condition=condition,
        recommended_foods=info.get("recommended_foods", []),
        restricted_foods=info.get("restricted_foods", []),
        precautions=info.get("precautions", []),
        additional_info={k: v for k, v in info.items()
                        if k not in ["recommended_foods", "restricted_foods", "precautions"]}
    )

def get_nutrient_unit(nutrient: str) -> str:
    """获取营养成分的单位"""
    units = {
        "calories": "kcal",
        "protein": "g",
        "carbs": "g",
        "fat": "g",
        "fiber": "g",
        "calcium": "mg",
        "iron": "mg",
        "magnesium": "mg",
        "phosphorus": "mg",
        "potassium": "mg",
        "sodium": "mg",
        "zinc": "mg",
        "selenium": "μg",
        "vitamin_a": "μg",
        "vitamin_c": "mg",
        "vitamin_e": "mg",
        "vitamin_k": "μg",
        "thiamine": "mg",
        "riboflavin": "mg",
        "niacin": "mg",
        "vitamin_b6": "mg",
        "folate": "μg",
        "vitamin_b12": "μg"
    }
    return units.get(nutrient, "unknown")