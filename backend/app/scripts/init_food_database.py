#!/usr/bin/env python3
"""
食材数据库初始化脚本
创建食材数据库表并导入核心食材数据
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from ..db import Base, DATABASE_URL
from ..data.food_database import FOOD_DATABASE
from ..data.food_database import FoodResource, FoodCategory, Nutrients, MedicalTags
from ..data.food_database import StorageRequirements, PreparationMethods, FoodDetails
from ..data.food_database import AllergenType, GlycemicIndex, NutrientDensity
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建食材数据库表模型（如果还没有）
def create_food_tables():
    """创建食材相关的数据库表"""

    # 这里应该定义对应的ORM模型，但为了简化，我们使用SQL直接创建
    create_tables_sql = """
    -- 创建食材主表
    CREATE TABLE IF NOT EXISTS food_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        scientific_name VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        common_names TEXT,
        origin TEXT,
        calories FLOAT,
        protein FLOAT,
        carbs FLOAT,
        fat FLOAT,
        fiber FLOAT,
        calcium FLOAT,
        iron FLOAT,
        magnesium FLOAT,
        phosphorus FLOAT,
        potassium FLOAT,
        sodium FLOAT,
        zinc FLOAT,
        selenium FLOAT,
        vitamin_a FLOAT,
        vitamin_c FLOAT,
        vitamin_e FLOAT,
        vitamin_k FLOAT,
        thiamine FLOAT,
        riboflavin FLOAT,
        niacin FLOAT,
        vitamin_b6 FLOAT,
        folate FLOAT,
        vitamin_b12 FLOAT,
        contraindications TEXT,
        suitable_conditions TEXT,
        allergens TEXT,
        glycemic_index VARCHAR(20),
        nutrient_density VARCHAR(20),
        monitoring_required BOOLEAN DEFAULT FALSE,
        storage_temperature VARCHAR(50),
        storage_humidity VARCHAR(50),
        shelf_life INTEGER,
        storage_method TEXT,
        recommended_methods TEXT,
        cooking_time_range VARCHAR(50),
        temperature_range VARCHAR(50),
        nutrition_retention_tips TEXT,
        description TEXT,
        health_benefits TEXT,
        nutritional_highlights TEXT,
        medicinal_properties TEXT,
        seasonal_availability VARCHAR(100),
        selection_tips TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text(create_tables_sql))
        conn.commit()

    logger.info("食材数据库表创建完成")

def import_food_data():
    """导入食材数据到数据库"""

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    try:
        session = SessionLocal()

        for food in FOOD_DATABASE:
            # 检查是否已存在
            check_sql = text("SELECT food_id FROM food_ingredients WHERE food_id = :food_id")
            result = session.execute(check_sql, {"food_id": food.id}).fetchone()

            if result:
                logger.info(f"食材 {food.name} ({food.id}) 已存在，跳过导入")
                continue

            # 转换数据为数据库格式
            insert_sql = text("""
                INSERT INTO food_ingredients (
                    food_id, name, scientific_name, category, common_names, origin,
                    calories, protein, carbs, fat, fiber,
                    calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, selenium,
                    vitamin_a, vitamin_c, vitamin_e, vitamin_k, thiamine, riboflavin,
                    niacin, vitamin_b6, folate, vitamin_b12,
                    contraindications, suitable_conditions, allergens,
                    glycemic_index, nutrient_density, monitoring_required,
                    storage_temperature, storage_humidity, shelf_life, storage_method,
                    recommended_methods, cooking_time_range, temperature_range, nutrition_retention_tips,
                    description, health_benefits, nutritional_highlights, medicinal_properties,
                    seasonal_availability, selection_tips, created_at, updated_at
                ) VALUES (
                    :food_id, :name, :scientific_name, :category, :common_names, :origin,
                    :calories, :protein, :carbs, :fat, :fiber,
                    :calcium, :iron, :magnesium, :phosphorus, :potassium, :sodium, :zinc, :selenium,
                    :vitamin_a, :vitamin_c, :vitamin_e, :vitamin_k, :thiamine, :riboflavin,
                    :niacin, :vitamin_b6, :folate, :vitamin_b12,
                    :contraindications, :suitable_conditions, :allergens,
                    :glycemic_index, :nutrient_density, :monitoring_required,
                    :storage_temperature, :storage_humidity, :shelf_life, :storage_method,
                    :recommended_methods, :cooking_time_range, :temperature_range, :nutrition_retention_tips,
                    :description, :health_benefits, :nutritional_highlights, :medicinal_properties,
                    :seasonal_availability, :selection_tips, :created_at, :updated_at
                )
            """)

            # 准备数据
            data = {
                'food_id': food.id,
                'name': food.name,
                'scientific_name': food.scientific_name,
                'category': food.category.value,
                'common_names': ','.join(food.common_names),
                'origin': food.origin,
                'calories': food.nutrients.calories,
                'protein': food.nutrients.protein,
                'carbs': food.nutrients.carbs,
                'fat': food.nutrients.fat,
                'fiber': food.nutrients.fiber,
                'calcium': food.nutrients.calcium,
                'iron': food.nutrients.iron,
                'magnesium': food.nutrients.magnesium,
                'phosphorus': food.nutrients.phosphorus,
                'potassium': food.nutrients.potassium,
                'sodium': food.nutrients.sodium,
                'zinc': food.nutrients.zinc,
                'selenium': food.nutrients.selenium,
                'vitamin_a': food.nutrients.vitamin_a,
                'vitamin_c': food.nutrients.vitamin_c,
                'vitamin_e': food.nutrients.vitamin_e,
                'vitamin_k': food.nutrients.vitamin_k,
                'thiamine': food.nutrients.thiamine,
                'riboflavin': food.nutrients.riboflavin,
                'niacin': food.nutrients.niacin,
                'vitamin_b6': food.nutrients.vitamin_b6,
                'folate': food.nutrients.folate,
                'vitamin_b12': food.nutrients.vitamin_b12,
                'contraindications': ','.join(food.medical_tags.contraindications),
                'suitable_conditions': ','.join(food.medical_tags.suitable_conditions),
                'allergens': ','.join([a.value for a in food.medical_tags.allergens]),
                'glycemic_index': food.medical_tags.glycemic_index.value,
                'nutrient_density': food.medical_tags.nutrient_density.value,
                'monitoring_required': food.medical_tags.monitoring_required,
                'storage_temperature': food.storage_requirements.temperature,
                'storage_humidity': food.storage_requirements.humidity,
                'shelf_life': food.storage_requirements.shelf_life,
                'storage_method': food.storage_requirements.storage_method,
                'recommended_methods': ','.join(food.preparation_methods.recommended_methods),
                'cooking_time_range': food.preparation_methods.cooking_time_range,
                'temperature_range': food.preparation_methods.temperature_range,
                'nutrition_retention_tips': ','.join(food.preparation_methods.nutrition_retention_tips),
                'description': food.details.description,
                'health_benefits': ','.join(food.details.health_benefits),
                'nutritional_highlights': ','.join(food.details.nutritional_highlights),
                'medicinal_properties': ','.join(food.details.medicinal_properties),
                'seasonal_availability': food.details.seasonal_availability,
                'selection_tips': ','.join(food.details.selection_tips),
                'created_at': food.created_at,
                'updated_at': food.updated_at
            }

            session.execute(insert_sql, data)
            logger.info(f"导入食材: {food.name}")

        session.commit()
        logger.info("食材数据导入完成")

    except Exception as e:
        session.rollback()
        logger.error(f"导入食材数据时出错: {e}")
        raise
    finally:
        session.close()

def verify_import():
    """验证导入结果"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) as count FROM food_ingredients")).fetchone()
        count = result[0]

        logger.info(f"数据库中共有 {count} 种食材")

        # 按类别统计
        categories_result = conn.execute(text("""
            SELECT category, COUNT(*) as count
            FROM food_ingredients
            GROUP BY category
            ORDER BY count DESC
        """)).fetchall()

        logger.info("各类别食材数量:")
        for category, count in categories_result:
            logger.info(f"  {category}: {count} 种")

def main():
    """主函数"""
    logger.info("开始初始化食材数据库...")

    try:
        # 1. 创建表
        create_food_tables()

        # 2. 导入数据
        import_food_data()

        # 3. 验证结果
        verify_import()

        logger.info("食材数据库初始化完成!")

    except Exception as e:
        logger.error(f"初始化食材数据库失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()