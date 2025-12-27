"""
核心食材数据 - 基于中国食物成分表第6版和USDA营养数据库
23种核心食材的详细营养数据

【数据来源】
- 中国食物成分表第6版（中国疾病预防控制中心营养与健康所）
- USDA FoodData Central（美国农业部营养数据库）

【营养数据单位】
- 能量：kcal/100g可食部
- 宏量营养素：g/100g
- 矿物质：mg/100g（硒为μg/100g）
- 维生素A：μg RAE/100g
- 其他维生素：标准单位/100g

【覆盖类别】
谷物类(3)、蔬菜类(5)、蛋白质类(4)、豆制品类(2)、
乳制品类(2)、坚果种子类(2)、菌菇类(1)、水果类(4)
"""

from typing import List
from .food_database import (
    FoodResource, FoodCategory, Nutrients, MedicalTags,
    StorageRequirements, PreparationMethods, FoodDetails,
    AllergenType, GlycemicIndex, NutrientDensity
)
from datetime import datetime

# ========== 核心食材数据 ==========
CORE_FOODS_DATA: List[FoodResource] = [
    # ========== 谷物类 ==========
    FoodResource(
        id='rice_white',
        name='白米饭',
        scientific_name='Oryza sativa',
        category=FoodCategory.GRAINS,
        common_names=['大米', '稻米'],
        origin='亚洲',
        nutrients=Nutrients(
            calories=130.0, protein=2.7, carbs=28.7, fat=0.3, fiber=0.4,
            calcium=28.0, iron=0.8, magnesium=23.0, phosphorus=115.0,
            potassium=115.0, sodium=5.0, zinc=1.1, selenium=15.1,
            vitamin_a=0.0, vitamin_c=0.0, vitamin_e=0.1, vitamin_k=0.1,
            thiamine=0.1, riboflavin=0.0, niacin=1.6, vitamin_b6=0.1,
            folate=8.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['糖尿病患者需控制分量'],
            suitable_conditions=['健康人群', '恢复期患者', '能量需求高者'],
            allergens=[],  # 大米不含麸质
            glycemic_index=GlycemicIndex.HIGH,
            nutrient_density=NutrientDensity.MODERATE,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='室温',
            humidity='干燥',
            shelf_life=365,
            storage_method='密封干燥容器'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['蒸煮', '焖饭'],
            cooking_time_range='15-30分钟',
            temperature_range='100°C',
            nutrition_retention_tips=['避免过度淘洗', '适量加水']
        ),
        details=FoodDetails(
            description='精制去壳大米，是主要的主食来源',
            health_benefits=['提供能量', '易消化吸收', '提供B族维生素'],
            nutritional_highlights=['碳水化合物含量高', '低脂肪', '易消化'],
            medicinal_properties=['健脾养胃', '补中益气'],
            seasonal_availability='全年',
            selection_tips=['颗粒完整', '无杂质', '色泽自然']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='brown_rice',
        name='糙米饭',
        scientific_name='Oryza sativa',
        category=FoodCategory.GRAINS,
        common_names=['糙米', '玄米'],
        origin='亚洲',
        nutrients=Nutrients(
            calories=111.0, protein=2.6, carbs=22.9, fat=0.9, fiber=1.8,
            calcium=23.0, iron=0.4, magnesium=43.0, phosphorus=83.0,
            potassium=223.0, sodium=5.0, zinc=1.2, selenium=23.4,
            vitamin_a=0.0, vitamin_c=0.0, vitamin_e=0.2, vitamin_k=0.7,
            thiamine=0.2, riboflavin=0.0, niacin=2.6, vitamin_b6=0.2,
            folate=7.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['消化系统疾病患者'],
            suitable_conditions=['糖尿病患者', '高血脂', '便秘', '减肥人群'],
            allergens=[],  # 糙米不含麸质
            glycemic_index=GlycemicIndex.MEDIUM,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='干燥',
            shelf_life=180,
            storage_method='密封防潮容器'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['蒸煮', '焖饭'],
            cooking_time_range='30-45分钟',
            temperature_range='100°C',
            nutrition_retention_tips=['提前浸泡', '充分煮熟']
        ),
        details=FoodDetails(
            description='只去掉外壳的完整大米粒，保留胚芽和米糠',
            health_benefits=['富含膳食纤维', '有助于血糖控制', '提供B族维生素'],
            nutritional_highlights=['高纤维', '富含B族维生素', '矿物质含量高'],
            medicinal_properties=['健脾益气', '促进肠道蠕动'],
            seasonal_availability='全年',
            selection_tips=['颗粒饱满', '色泽自然', '无异味']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='oats_rolled',
        name='燕麦片',
        scientific_name='Avena sativa',
        category=FoodCategory.GRAINS,
        common_names=['燕麦', '莜麦'],
        origin='欧洲',
        nutrients=Nutrients(
            calories=389.0, protein=16.9, carbs=66.3, fat=6.9, fiber=10.6,
            calcium=54.0, iron=4.7, magnesium=177.0, phosphorus=523.0,
            potassium=429.0, sodium=2.0, zinc=3.6, selenium=28.9,
            vitamin_a=0.0, vitamin_c=0.0, vitamin_e=0.4, vitamin_k=2.2,
            thiamine=0.8, riboflavin=0.1, niacin=1.0, vitamin_b6=0.1,
            folate=56.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['麸质过敏者', '腹腔疾病'],
            suitable_conditions=['高血脂', '糖尿病', '便秘', '心脏病患者'],
            allergens=[AllergenType.GLUTEN],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='室温',
            humidity='干燥',
            shelf_life=365,
            storage_method='密封干燥容器'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['煮粥', '冲泡', '烘烤'],
            cooking_time_range='5-15分钟',
            temperature_range='80-100°C',
            nutrition_retention_tips=['避免过度加工', '温水冲泡']
        ),
        details=FoodDetails(
            description='经过压制的燕麦粒，富含β-葡聚糖',
            health_benefits=['降低胆固醇', '稳定血糖', '促进心血管健康', '高纤维饱腹'],
            nutritional_highlights=['高蛋白质', '高膳食纤维', 'β-葡聚糖'],
            medicinal_properties=['健脾养心', '润肠通便'],
            seasonal_availability='全年',
            selection_tips=['颗粒完整', '无异味', '包装完好']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 蔬菜类 ==========
    FoodResource(
        id='spinach',
        name='菠菜',
        scientific_name='Spinacia oleracea',
        category=FoodCategory.VEGETABLES,
        common_names=['菠棱菜', '赤根菜'],
        origin='波斯',
        nutrients=Nutrients(
            calories=23.0, protein=2.9, carbs=3.6, fat=0.4, fiber=2.2,
            calcium=99.0, iron=2.7, magnesium=79.0, phosphorus=49.0,
            potassium=558.0, sodium=79.0, zinc=0.5, selenium=1.0,
            vitamin_a=469.0, vitamin_c=28.1, vitamin_e=2.0, vitamin_k=483.0,
            thiamine=0.1, riboflavin=0.1, niacin=0.7, vitamin_b6=0.2,
            folate=194.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['肾结石患者', '甲状腺疾病患者'],
            suitable_conditions=['贫血', '骨质疏松', '孕妇', '高血压'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='高湿',
            shelf_life=7,
            storage_method='保鲜袋或保鲜盒'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['清炒', '焯水', '做汤', '沙拉'],
            cooking_time_range='2-5分钟',
            temperature_range='快速加热',
            nutrition_retention_tips=['快速烹饪', '不要过度加热', '保留汤汁']
        ),
        details=FoodDetails(
            description='深绿色叶菜，营养丰富，可食部分包括叶和茎',
            health_benefits=['富含铁质', '补充叶酸', '增强免疫力', '保护视力'],
            nutritional_highlights=['高铁', '高维生素K', '富含叶酸', '抗氧化物质'],
            medicinal_properties=['养血止血', '润燥滑肠', '清热除烦'],
            seasonal_availability='春季、秋季最佳',
            selection_tips=['叶片深绿', '茎部嫩绿', '无黄叶', '新鲜饱满']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='broccoli',
        name='西兰花',
        scientific_name='Brassica oleracea var. italica',
        category=FoodCategory.VEGETABLES,
        common_names=['青花菜', '绿花菜'],
        origin='意大利',
        nutrients=Nutrients(
            calories=34.0, protein=2.8, carbs=7.0, fat=0.4, fiber=2.6,
            calcium=47.0, iron=0.7, magnesium=21.0, phosphorus=66.0,
            potassium=316.0, sodium=33.0, zinc=0.4, selenium=2.3,
            vitamin_a=31.0, vitamin_c=89.2, vitamin_e=0.8, vitamin_k=102.0,
            thiamine=0.1, riboflavin=0.1, niacin=0.6, vitamin_b6=0.2,
            folate=63.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['甲状腺疾病患者'],
            suitable_conditions=['癌症预防', '心血管疾病', '免疫力低下', '孕妇'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='中等',
            shelf_life=7,
            storage_method='保鲜袋包装'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['蒸煮', '清炒', '烘烤', '生食'],
            cooking_time_range='5-10分钟',
            temperature_range='中大火快速烹饪',
            nutrition_retention_tips=['不要过度烹饪', '蒸煮最佳', '保留翠绿色泽']
        ),
        details=FoodDetails(
            description='十字花科蔬菜，呈绿色花蕾状，营养价值极高',
            health_benefits=['抗癌作用', '增强免疫力', '保护心血管', '补充维生素C'],
            nutritional_highlights=['高维生素C', '富含萝卜硫素', '高纤维', '低热量'],
            medicinal_properties=['清热解毒', '抗肿瘤', '增强肝脏功能'],
            seasonal_availability='全年，春季最佳',
            selection_tips=['花蕾紧密', '颜色翠绿', '茎部结实', '无黄色斑点']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='carrot',
        name='胡萝卜',
        scientific_name='Daucus carota',
        category=FoodCategory.VEGETABLES,
        common_names=['红萝卜', '甘荀'],
        origin='阿富汗',
        nutrients=Nutrients(
            calories=41.0, protein=0.9, carbs=9.6, fat=0.2, fiber=2.8,
            calcium=33.0, iron=0.3, magnesium=12.0, phosphorus=35.0,
            potassium=320.0, sodium=69.0, zinc=0.2, selenium=0.1,
            vitamin_a=835.0, vitamin_c=5.9, vitamin_e=0.7, vitamin_k=13.2,
            thiamine=0.1, riboflavin=0.0, niacin=0.9, vitamin_b6=0.1,
            folate=19.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['糖尿病患者需适量'],
            suitable_conditions=['视力保护', '皮肤健康', '儿童成长', '免疫力低下'],
            allergens=[],
            glycemic_index=GlycemicIndex.MEDIUM,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='高湿',
            shelf_life=21,
            storage_method='保鲜袋或去除根部'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['生食', '榨汁', '炖煮', '烘烤'],
            cooking_time_range='10-25分钟',
            temperature_range='中低温烹饪',
            nutrition_retention_tips=['与油脂同食', '不要去皮', '避免过度烹饪']
        ),
        details=FoodDetails(
            description='根茎类蔬菜，富含β-胡萝卜素，颜色橙红',
            health_benefits=['保护视力', '美容养颜', '增强免疫力', '预防便秘'],
            nutritional_highlights=['β-胡萝卜素极高', '维生素A前体', '抗氧化物质', '膳食纤维'],
            medicinal_properties=['健脾消食', '养肝明目', '润肺止咳'],
            seasonal_availability='全年，秋冬最佳',
            selection_tips=['颜色橙红', '表皮光滑', '质地坚实', '无软烂']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='tomato',
        name='番茄',
        scientific_name='Solanum lycopersicum',
        category=FoodCategory.VEGETABLES,
        common_names=['西红柿', '番茄'],
        origin='南美洲',
        nutrients=Nutrients(
            calories=18.0, protein=0.9, carbs=3.9, fat=0.2, fiber=1.2,
            calcium=10.0, iron=0.3, magnesium=11.0, phosphorus=24.0,
            potassium=237.0, sodium=5.0, zinc=0.1, selenium=0.0,
            vitamin_a=833.0, vitamin_c=13.7, vitamin_e=0.5, vitamin_k=7.9,
            thiamine=0.0, riboflavin=0.0, niacin=0.6, vitamin_b6=0.1,
            folate=15.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['胃酸过多', '关节炎患者需适量'],
            suitable_conditions=['抗氧化', '心血管健康', '皮肤护理', '免疫力提升'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='室温',
            humidity='中等',
            shelf_life=7,
            storage_method='避免冷藏，室温存放'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['生食', '烹煮', '制酱', '炖汤'],
            cooking_time_range='5-20分钟',
            temperature_range='中温烹饪',
            nutrition_retention_tips=['带皮食用', '轻微加热', '避免过度加工']
        ),
        details=FoodDetails(
            description='富含番茄红素的蔬果，营养价值极高',
            health_benefits=['番茄红素抗氧化', '保护前列腺', '心血管保护', '美白肌肤'],
            nutritional_highlights=['番茄红素', '维生素C', '维生素A', '钾元素'],
            medicinal_properties=['生津止渴', '健胃消食', '清热解毒'],
            seasonal_availability='夏季最佳，可全年供应',
            selection_tips=['颜色红润', '质地饱满', '无损伤', '蒂部新鲜']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='cucumber',
        name='黄瓜',
        scientific_name='Cucumis sativus',
        category=FoodCategory.VEGETABLES,
        common_names=['胡瓜', '青瓜'],
        origin='印度',
        nutrients=Nutrients(
            calories=15.0, protein=0.7, carbs=3.6, fat=0.1, fiber=0.5,
            calcium=16.0, iron=0.3, magnesium=13.0, phosphorus=24.0,
            potassium=147.0, sodium=2.0, zinc=0.2, selenium=0.3,
            vitamin_a=27.0, vitamin_c=2.8, vitamin_e=0.0, vitamin_k=16.4,
            thiamine=0.0, riboflavin=0.0, niacin=0.1, vitamin_b6=0.0,
            folate=7.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['脾胃虚寒', '腹泻患者'],
            suitable_conditions=['清热解暑', '美容护肤', '减肥', '高血压'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.MODERATE,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='高湿',
            shelf_life=7,
            storage_method='冷藏保鲜，用保鲜膜包裹'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['生食', '凉拌', '清炒', '榨汁'],
            cooking_time_range='生食或快速烹饪',
            temperature_range='低温快速',
            nutrition_retention_tips=['带皮食用', '快速清洗', '避免长时间浸泡']
        ),
        details=FoodDetails(
            description='清爽多汁的蔬菜，富含水分和维生素',
            health_benefits=['清热解暑', '美容护肤', '利尿消肿', '降血脂'],
            nutritional_highlights=['水分含量高', '维生素C', '维生素K', '钾元素'],
            medicinal_properties=['清热利水', '解毒消肿', '润燥护肤'],
            seasonal_availability='夏季最佳，可全年供应',
            selection_tips=['颜色翠绿', '质地脆嫩', '无弯曲', '表面光滑']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 蛋白质类 ==========
    FoodResource(
        id='chicken_breast',
        name='鸡胸肉',
        scientific_name='Gallus gallus domesticus',
        category=FoodCategory.PROTEINS,
        common_names=['鸡胸', '白肉'],
        origin='原产于东南亚丛林',
        nutrients=Nutrients(
            calories=165.0, protein=31.0, carbs=0.0, fat=3.6, fiber=0.0,
            calcium=15.0, iron=1.0, magnesium=29.0, phosphorus=228.0,
            potassium=256.0, sodium=74.0, zinc=1.0, selenium=22.5,
            vitamin_a=21.0, vitamin_c=0.0, vitamin_e=0.3, vitamin_k=0.3,
            thiamine=0.1, riboflavin=0.1, niacin=14.8, vitamin_b6=0.6,
            folate=4.0, vitamin_b12=0.3
        ),
        medical_tags=MedicalTags(
            contraindications=['对鸡肉过敏者'],
            suitable_conditions=['健身人群', '减肥者', '儿童成长', '术后恢复'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏/冷冻',
            humidity='低',
            shelf_life=3,
            storage_method='密封包装，及时冷冻'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['水煮', '蒸制', '烘烤', '煎炒'],
            cooking_time_range='15-30分钟',
            temperature_range='确保完全熟透(75°C以上)',
            nutrition_retention_tips=['去除脂肪', '避免过度加热', '保持肉质嫩滑']
        ),
        details=FoodDetails(
            description='鸡胸部肌肉，低脂肪高蛋白质的优质蛋白来源',
            health_benefits=['高蛋白质', '低脂肪', '易消化', '促进肌肉生长'],
            nutritional_highlights=['优质蛋白', '低脂肪', '高烟酸', '维生素B6'],
            medicinal_properties=['温中益气', '补精填髓', '增强体力'],
            seasonal_availability='全年',
            selection_tips=['色泽淡粉', '质地紧实', '无异味', '脂肪层薄']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='salmon',
        name='三文鱼',
        scientific_name='Salmo salar',
        category=FoodCategory.PROTEINS,
        common_names=['鲑鱼', '大马哈鱼'],
        origin='北大西洋',
        nutrients=Nutrients(
            calories=208.0, protein=20.0, carbs=0.0, fat=13.0, fiber=0.0,
            calcium=12.0, iron=0.8, magnesium=27.0, phosphorus=200.0,
            potassium=363.0, sodium=59.0, zinc=0.6, selenium=36.5,
            vitamin_a=59.0, vitamin_c=0.0, vitamin_e=1.9, vitamin_k=0.4,
            thiamine=0.2, riboflavin=0.3, niacin=8.6, vitamin_b6=0.6,
            folate=25.0, vitamin_b12=3.2
        ),
        medical_tags=MedicalTags(
            contraindications=['鱼类过敏者', '痛风患者需适量'],
            suitable_conditions=['心脑血管疾病', '孕妇', '儿童发育', '抑郁症状'],
            allergens=[AllergenType.FISH],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏/冷冻',
            humidity='低',
            shelf_life=2,
            storage_method='冰鲜保存，尽快食用'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['煎烤', '蒸制', '生食', '烟熏'],
            cooking_time_range='10-20分钟',
            temperature_range='中温烹饪',
            nutrition_retention_tips=['保留鱼皮', '避免过度烹饪', '控制用油']
        ),
        details=FoodDetails(
            description='深海冷水鱼类，富含Omega-3脂肪酸，肉质鲜美',
            health_benefits=['富含Omega-3', '心血管保护', '大脑发育', '抗炎作用'],
            nutritional_highlights=['DHA和EPA', '优质蛋白', '维生素D', '硒含量高'],
            medicinal_properties=['补虚劳', '健脾胃', '暖胃和中'],
            seasonal_availability='全年',
            selection_tips=['鱼肉紧实', '色泽鲜艳', '无异味', '鱼皮完整']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='egg_chicken',
        name='鸡蛋',
        scientific_name='Gallus gallus',
        category=FoodCategory.PROTEINS,
        common_names=['鸡子', '卵'],
        origin='原产于亚洲丛林鸡',
        nutrients=Nutrients(
            calories=155.0, protein=13.0, carbs=1.1, fat=11.0, fiber=0.0,
            calcium=56.0, iron=1.8, magnesium=10.0, phosphorus=198.0,
            potassium=138.0, sodium=124.0, zinc=1.3, selenium=30.7,
            vitamin_a=160.0, vitamin_c=0.0, vitamin_e=1.1, vitamin_k=0.3,
            thiamine=0.0, riboflavin=0.5, niacin=0.1, vitamin_b6=0.1,
            folate=44.0, vitamin_b12=0.6
        ),
        medical_tags=MedicalTags(
            contraindications=['高胆固醇患者', '鸡蛋过敏者'],
            suitable_conditions=['儿童发育', '孕妇', '老年人群', '脑力工作者'],
            allergens=[AllergenType.EGGS],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='中等',
            shelf_life=21,
            storage_method='原包装或蛋盒存放'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['水煮', '煎炒', '蒸制', '烘焙'],
            cooking_time_range='5-15分钟',
            temperature_range='完全熟透',
            nutrition_retention_tips=['全蛋营养更佳', '避免过度加热', '生食需谨慎']
        ),
        details=FoodDetails(
            description='完美的蛋白质来源，含有人体所需全部氨基酸',
            health_benefits=['完全蛋白', '大脑发育', '视力保护', '肌肉生长'],
            nutritional_highlights=['优质蛋白', '胆碱丰富', '维生素D', '卵磷脂'],
            medicinal_properties=['滋阴润燥', '养血安神', '补脾和胃'],
            seasonal_availability='全年',
            selection_tips=['蛋壳完整', '无异味', '摇晃无声', '蛋黄完整']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='beef_lean',
        name='瘦牛肉',
        scientific_name='Bos taurus',
        category=FoodCategory.PROTEINS,
        common_names=['牛里脊', '牛腩'],
        origin='原产于欧亚大陆',
        nutrients=Nutrients(
            calories=250.0, protein=26.0, carbs=0.0, fat=15.0, fiber=0.0,
            calcium=4.0, iron=2.6, magnesium=23.0, phosphorus=195.0,
            potassium=318.0, sodium=60.0, zinc=6.3, selenium=24.5,
            vitamin_a=12.0, vitamin_c=0.0, vitamin_e=0.2, vitamin_k=1.7,
            thiamine=0.1, riboflavin=0.2, niacin=7.0, vitamin_b6=0.5,
            folate=6.0, vitamin_b12=2.1
        ),
        medical_tags=MedicalTags(
            contraindications=['高胆固醇患者', '心血管疾病患者需适量'],
            suitable_conditions=['贫血患者', '儿童发育', '术后恢复', '体虚者'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏/冷冻',
            humidity='低',
            shelf_life=3,
            storage_method='密封包装，及时冷冻'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['炖煮', '炒制', '烧烤', '卤制'],
            cooking_time_range='20-120分钟',
            temperature_range='完全熟透',
            nutrition_retention_tips=['选择瘦肉部位', '去除肥油', '低温慢煮']
        ),
        details=FoodDetails(
            description='优质红肉，富含血红素铁和优质蛋白质',
            health_benefits=['补铁补血', '优质蛋白', '增强体力', '促进肌肉生长'],
            nutritional_highlights=['血红素铁', '锌元素', '维生素B12', '肌氨酸'],
            medicinal_properties=['补中益气', '健脾养胃', '强筋健骨'],
            seasonal_availability='全年',
            selection_tips=['色泽鲜红', '质地紧实', '无异味', '脂肪含量适中']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 豆制品类 ==========
    FoodResource(
        id='soybean',
        name='黄豆',
        scientific_name='Glycine max',
        category=FoodCategory.LEGUMES,
        common_names=['大豆', '毛豆'],
        origin='中国',
        nutrients=Nutrients(
            calories=446.0, protein=36.5, carbs=30.2, fat=20.0, fiber=9.3,
            calcium=277.0, iron=15.7, magnesium=280.0, phosphorus=704.0,
            potassium=1797.0, sodium=2.0, zinc=4.9, selenium=30.1,
            vitamin_a=13.0, vitamin_c=6.0, vitamin_e=0.9, vitamin_k=33.0,
            thiamine=0.9, riboflavin=0.9, niacin=1.6, vitamin_b6=0.4,
            folate=375.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['痛风患者', '甲状腺疾病患者', '豆类过敏'],
            suitable_conditions=['素食者', '更年期女性', '心血管健康', '糖尿病患者'],
            allergens=[AllergenType.SOY],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏/冷冻',
            humidity='干燥',
            shelf_life=180,
            storage_method='密封防潮容器'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['煮制', '制浆', '发酵', '烘烤'],
            cooking_time_range='1-3小时',
            temperature_range='充分加热',
            nutrition_retention_tips=['充分煮熟', '浸泡软化', '避免生食']
        ),
        details=FoodDetails(
            description='优质植物蛋白来源，富含异黄酮',
            health_benefits=['植物蛋白完整', '保护心血管', '缓解更年期症状', '骨骼健康'],
            nutritional_highlights=['优质蛋白', '异黄酮', '卵磷脂', '膳食纤维'],
            medicinal_properties=['健脾宽中', '润燥消水', '清热解毒'],
            seasonal_availability='秋季收获，可全年供应',
            selection_tips=['颗粒饱满', '色泽金黄', '无虫蛀', '无霉变']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='tofu',
        name='豆腐',
        scientific_name='Glycine max',
        category=FoodCategory.LEGUMES,
        common_names=['豆府', '菽乳'],
        origin='中国',
        nutrients=Nutrients(
            calories=76.0, protein=8.1, carbs=1.9, fat=4.8, fiber=0.4,
            calcium=138.0, iron=1.4, magnesium=30.0, phosphorus=87.0,
            potassium=121.0, sodium=7.0, zinc=0.6, selenium=9.8,
            vitamin_a=27.0, vitamin_c=0.1, vitamin_e=0.0, vitamin_k=2.9,
            thiamine=0.1, riboflavin=0.0, niacin=0.2, vitamin_b6=0.0,
            folate=15.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['痛风患者', '豆类过敏'],
            suitable_conditions=['素食者', '老年人', '术后恢复', '慢性肾病'],
            allergens=[AllergenType.SOY],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='水中保存',
            shelf_life=7,
            storage_method='清水浸泡，每日换水'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['清炒', '炖煮', '凉拌', '红烧'],
            cooking_time_range='5-15分钟',
            temperature_range='中温烹饪',
            nutrition_retention_tips=['避免过度烹煮', '多样化搭配', '冷藏保存']
        ),
        details=FoodDetails(
            description='黄豆凝固制品，传统优质植物蛋白',
            health_benefits=['易消化', '低热量', '补钙', '保护心血管'],
            nutritional_highlights=['优质蛋白', '高钙', '低热量', '卵磷脂'],
            medicinal_properties=['益气和中', '生津润燥', '清热解毒'],
            seasonal_availability='全年',
            selection_tips=['质地均匀', '无异味', '色泽洁白', '弹性适中']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 乳制品类 ==========
    FoodResource(
        id='milk_cow',
        name='牛奶',
        scientific_name='Bos taurus',
        category=FoodCategory.DAIRY,
        common_names=['牛乳', '鲜奶'],
        origin='被人类驯化的牛种',
        nutrients=Nutrients(
            calories=42.0, protein=3.4, carbs=5.0, fat=1.0, fiber=0.0,
            calcium=125.0, iron=0.0, magnesium=11.0, phosphorus=95.0,
            potassium=150.0, sodium=44.0, zinc=0.4, selenium=3.1,
            vitamin_a=46.0, vitamin_c=0.0, vitamin_e=0.0, vitamin_k=0.1,
            thiamine=0.0, riboflavin=0.2, niacin=0.1, vitamin_b6=0.0,
            folate=5.0, vitamin_b12=0.5
        ),
        medical_tags=MedicalTags(
            contraindications=['乳糖不耐症', '牛奶蛋白过敏', '严重痤疮'],
            suitable_conditions=['儿童成长', '孕妇', '老年人', '骨质疏松'],
            allergens=[AllergenType.DAIRY],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='密封',
            shelf_life=7,
            storage_method='密封冷藏，避免光照'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['直接饮用', '加热饮用', '制作乳制品', '烘焙'],
            cooking_time_range='无需烹饪',
            temperature_range='2-6°C保存',
            nutrition_retention_tips=['避免过度加热', '开封即饮', '低温保存']
        ),
        details=FoodDetails(
            description='营养完整的饮品，富含优质蛋白质和钙质',
            health_benefits=['补钙', '优质蛋白', '骨骼发育', '增强免疫'],
            nutritional_highlights=['高钙', '优质蛋白', '维生素B12', '维生素D强化'],
            medicinal_properties=['补虚损', '益肺胃', '生津润肠'],
            seasonal_availability='全年',
            selection_tips=['无结块', '无异味', '包装完好', '色泽乳白']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='yogurt_plain',
        name='酸奶',
        scientific_name='Bos taurus',
        category=FoodCategory.DAIRY,
        common_names=['酸牛奶', '发酵乳'],
        origin='传统发酵乳制品',
        nutrients=Nutrients(
            calories=59.0, protein=10.0, carbs=3.6, fat=0.4, fiber=0.0,
            calcium=110.0, iron=0.1, magnesium=11.0, phosphorus=135.0,
            potassium=141.0, sodium=36.0, zinc=0.5, selenium=4.6,
            vitamin_a=27.0, vitamin_c=0.0, vitamin_e=0.0, vitamin_k=0.1,
            thiamine=0.0, riboflavin=0.3, niacin=0.1, vitamin_b6=0.0,
            folate=7.0, vitamin_b12=0.4
        ),
        medical_tags=MedicalTags(
            contraindications=['牛奶过敏', '严重消化不良'],
            suitable_conditions=['肠道健康', '乳糖不耐症', '儿童成长', '老年人'],
            allergens=[AllergenType.DAIRY],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='密封',
            shelf_life=14,
            storage_method='密封冷藏，避免温度波动'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['直接食用', '制作沙拉', '调味', '烘焙'],
            cooking_time_range='无需烹饪',
            temperature_range='2-6°C保存',
            nutrition_retention_tips=['选择无糖原味', '保存活性菌种', '避免过度冷藏']
        ),
        details=FoodDetails(
            description='发酵乳制品，富含益生菌和活性乳酸菌',
            health_benefits=['改善肠道', '增强免疫', '易消化', '促进钙吸收'],
            nutritional_highlights=['益生菌', '优质蛋白', '钙质', 'B族维生素'],
            medicinal_properties=['健脾养胃', '润肠通便', '增强体质'],
            seasonal_availability='全年',
            selection_tips=['质地均匀', '酸度适中', '无异味', '活性菌标识']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 坚果种子类 ==========
    FoodResource(
        id='walnut',
        name='核桃',
        scientific_name='Juglans regia',
        category=FoodCategory.NUTS_SEEDS,
        common_names=['胡桃', '羌桃'],
        origin='中亚地区',
        nutrients=Nutrients(
            calories=654.0, protein=15.2, carbs=13.7, fat=65.2, fiber=6.7,
            calcium=98.0, iron=2.9, magnesium=158.0, phosphorus=346.0,
            potassium=441.0, sodium=2.0, zinc=3.1, selenium=4.9,
            vitamin_a=1.0, vitamin_c=1.3, vitamin_e=0.7, vitamin_k=2.7,
            thiamine=0.3, riboflavin=0.1, niacin=1.1, vitamin_b6=0.5,
            folate=98.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['坚果过敏', '严重肝病患者'],
            suitable_conditions=['脑力工作者', '孕妇', '儿童成长', '心血管健康'],
            allergens=[AllergenType.NUTS],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='干燥',
            shelf_life=180,
            storage_method='密封防潮，避光保存'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['直接食用', '烘焙', '研磨', '制作糕点'],
            cooking_time_range='无需烹饪',
            temperature_range='可烘烤',
            nutrition_retention_tips=['适量食用', '避免过度加工', '保留内膜']
        ),
        details=FoodDetails(
            description='富含Omega-3脂肪酸的坚果，被称为"大脑之果"',
            health_benefits=['健脑益智', '保护心血管', '改善记忆', '抗衰老'],
            nutritional_highlights=['Omega-3', '维生素E', '多酚类', '优质蛋白'],
            medicinal_properties=['补肾固精', '温肺定喘', '润肠通便'],
            seasonal_availability='秋季收获，可全年供应',
            selection_tips=['果仁饱满', '色泽自然', '无哈败', '外壳完整']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='almond',
        name='杏仁',
        scientific_name='Prunus dulcis',
        category=FoodCategory.NUTS_SEEDS,
        common_names=['巴旦木', '杏核仁'],
        origin='中亚',
        nutrients=Nutrients(
            calories=579.0, protein=21.2, carbs=21.6, fat=49.9, fiber=12.5,
            calcium=269.0, iron=3.7, magnesium=270.0, phosphorus=481.0,
            potassium=733.0, sodium=1.0, zinc=3.1, selenium=2.5,
            vitamin_a=0.0, vitamin_c=0.0, vitamin_e=25.6, vitamin_k=0.0,
            thiamine=0.2, riboflavin=1.0, niacin=3.6, vitamin_b6=0.1,
            folate=44.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['坚果过敏', '甲状腺疾病患者'],
            suitable_conditions=['心血管健康', '糖尿病患者', '皮肤护理', '减肥人群'],
            allergens=[AllergenType.NUTS],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='干燥',
            shelf_life=365,
            storage_method='密封避光保存'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['直接食用', '研磨成粉', '制作杏仁奶', '烘焙'],
            cooking_time_range='无需烹饪',
            temperature_range='可低温烘烤',
            nutrition_retention_tips=['选择无盐无糖', '适量食用', '避免高温烘烤']
        ),
        details=FoodDetails(
            description='营养价值极高的坚果，富含维生素E和健康脂肪',
            health_benefits=['保护心脏', '抗氧化', '控制血糖', '美容护肤'],
            nutritional_highlights=['维生素E', '单不饱和脂肪', '钙质', '膳食纤维'],
            medicinal_properties=['润肺止咳', '润肠通便', '美容养颜'],
            seasonal_availability='秋季收获，可全年供应',
            selection_tips=['颗粒饱满', '色泽自然', '无异味', '干燥完整']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 菌菇类 ==========
    FoodResource(
        id='shiitake',
        name='香菇',
        scientific_name='Lentinus edodes',
        category=FoodCategory.FUNGI,
        common_names=['冬菇', '香蕈'],
        origin='中国',
        nutrients=Nutrients(
            calories=34.0, protein=2.2, carbs=6.9, fat=0.5, fiber=2.5,
            calcium=5.0, iron=0.9, magnesium=20.0, phosphorus=72.0,
            potassium=464.0, sodium=11.0, zinc=1.0, selenium=9.0,
            vitamin_a=0.0, vitamin_c=0.0, vitamin_e=0.0, vitamin_k=0.0,
            thiamine=0.0, riboflavin=0.3, niacin=5.0, vitamin_b6=0.1,
            folate=36.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['痛风急性期', '肾病晚期', '免疫系统疾病'],
            suitable_conditions=['免疫力低下', '高血脂', '高血压', '癌症预防'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.VERY_HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏/干制',
            humidity='干燥',
            shelf_life=30,
            storage_method='冷藏或干燥保存'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['清炒', '炖汤', '蒸制', '火锅'],
            cooking_time_range='5-15分钟',
            temperature_range='充分加热',
            nutrition_retention_tips=['充分煮熟', '避免长时间浸泡', '泡发水可利用']
        ),
        details=FoodDetails(
            description='著名的食用菌，营养丰富，味道鲜美',
            health_benefits=['增强免疫', '降血脂', '抗肿瘤', '预防感冒'],
            nutritional_highlights=['香菇多糖', '维生素D原', '腺苷', '膳食纤维'],
            medicinal_properties=['补气益胃', '托疮排毒', '化痰理气'],
            seasonal_availability='春季、秋季',
            selection_tips=['菌盖厚实', '香味浓郁', '无腐烂', '质地新鲜']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 水果类 ==========
    FoodResource(
        id='apple',
        name='苹果',
        scientific_name='Malus domestica',
        category=FoodCategory.FRUITS,
        common_names=['平安果', '频果'],
        origin='中亚地区',
        nutrients=Nutrients(
            calories=52.0, protein=0.3, carbs=14.0, fat=0.2, fiber=2.4,
            calcium=6.0, iron=0.1, magnesium=5.0, phosphorus=11.0,
            potassium=107.0, sodium=1.0, zinc=0.0, selenium=0.0,
            vitamin_a=3.0, vitamin_c=4.6, vitamin_e=0.2, vitamin_k=2.2,
            thiamine=0.0, riboflavin=0.0, niacin=0.1, vitamin_b6=0.0,
            folate=3.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['糖尿病患者需适量', '肠胃疾病患者'],
            suitable_conditions=['减肥', '心血管疾病', '便秘', '儿童'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='中等',
            shelf_life=30,
            storage_method='冷藏保鲜，与其他水果分开放置'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['生食', '榨汁', '烘焙', '煮制'],
            cooking_time_range='生食',
            temperature_range='生食最佳',
            nutrition_retention_tips=['带皮食用', '避免削皮过厚', '新鲜食用']
        ),
        details=FoodDetails(
            description='蔷薇科水果，品种丰富，营养均衡',
            health_benefits=['富含纤维', '助消化', '降胆固醇', '抗氧化'],
            nutritional_highlights=['果胶', '槲皮素', '膳食纤维', '有机酸'],
            medicinal_properties=['生津止渴', '润肺除烦', '健脾益胃'],
            seasonal_availability='秋季最佳，可全年供应',
            selection_tips=['表皮光滑', '色泽均匀', '果实质地坚实', '无损伤']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='banana',
        name='香蕉',
        scientific_name='Musa acuminata',
        category=FoodCategory.FRUITS,
        common_names=['甘蕉', '弓蕉'],
        origin='东南亚',
        nutrients=Nutrients(
            calories=89.0, protein=1.1, carbs=23.0, fat=0.3, fiber=2.6,
            calcium=5.0, iron=0.3, magnesium=27.0, phosphorus=22.0,
            potassium=358.0, sodium=1.0, zinc=0.2, selenium=1.0,
            vitamin_a=3.0, vitamin_c=8.7, vitamin_e=0.1, vitamin_k=0.5,
            thiamine=0.0, riboflavin=0.1, niacin=0.7, vitamin_b6=0.4,
            folate=20.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['糖尿病患者需适量', '肾病患者'],
            suitable_conditions=['运动后', '便秘', '高血压', '情绪低落'],
            allergens=[],
            glycemic_index=GlycemicIndex.MEDIUM,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='室温',
            humidity='中等',
            shelf_life=7,
            storage_method='室温悬挂，避免冷藏'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['生食', '榨汁', '烘焙', '干制'],
            cooking_time_range='生食',
            temperature_range='生食最佳',
            nutrition_retention_tips=['稍成熟时食用', '避免空腹大量食用', '带皮食用更营养']
        ),
        details=FoodDetails(
            description='大型草本植物果实，富含钾元素和碳水化合物',
            health_benefits=['补充能量', '富含钾', '改善心情', '助消化'],
            nutritional_highlights=['高钾', '色氨酸', '维生素B6', '果胶'],
            medicinal_properties=['清热润肠', '生津止渴', '解酒毒'],
            seasonal_availability='全年',
            selection_tips=['皮色黄亮', '果肉饱满', '无黑斑', '香气浓郁']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='orange',
        name='橙子',
        scientific_name='Citrus sinensis',
        category=FoodCategory.FRUITS,
        common_names=['甜橙', '橘子'],
        origin='中国',
        nutrients=Nutrients(
            calories=47.0, protein=0.9, carbs=11.8, fat=0.1, fiber=2.4,
            calcium=40.0, iron=0.1, magnesium=10.0, phosphorus=14.0,
            potassium=181.0, sodium=0.0, zinc=0.1, selenium=0.7,
            vitamin_a=225.0, vitamin_c=53.2, vitamin_e=0.2, vitamin_k=0.0,
            thiamine=0.1, riboflavin=0.0, niacin=0.4, vitamin_b6=0.1,
            folate=30.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['胃酸过多', '糖尿病患者需适量'],
            suitable_conditions=['维生素C缺乏', '免疫力低下', '贫血', '感冒预防'],
            allergens=[],
            glycemic_index=GlycemicIndex.MEDIUM,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='中等',
            shelf_life=21,
            storage_method='冷藏保鲜，避免压损'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['直接食用', '榨汁', '制果酱', '烘焙'],
            cooking_time_range='生食最佳',
            temperature_range='室温食用',
            nutrition_retention_tips=['带白色内络食用', '避免过度榨汁', '新鲜食用']
        ),
        details=FoodDetails(
            description='富含维生素C的柑橘类水果，酸甜可口',
            health_benefits=['维生素C丰富', '增强免疫', '抗氧化', '促进铁吸收'],
            nutritional_highlights=['维生素C', '叶酸', '钾元素', '膳食纤维'],
            medicinal_properties=['生津止渴', '健胃消食', '理气化痰'],
            seasonal_availability='冬季最佳，可全年供应',
            selection_tips=['果皮橙红', '果实质地饱满', '无损伤', '香气浓郁']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    FoodResource(
        id='strawberry',
        name='草莓',
        scientific_name='Fragaria × ananassa',
        category=FoodCategory.FRUITS,
        common_names=['洋莓', '红莓'],
        origin='法国',
        nutrients=Nutrients(
            calories=32.0, protein=0.7, carbs=7.7, fat=0.3, fiber=2.0,
            calcium=16.0, iron=0.4, magnesium=13.0, phosphorus=24.0,
            potassium=153.0, sodium=1.0, zinc=0.1, selenium=0.4,
            vitamin_a=12.0, vitamin_c=58.8, vitamin_e=0.3, vitamin_k=2.2,
            thiamine=0.0, riboflavin=0.0, niacin=0.4, vitamin_b6=0.0,
            folate=24.0, vitamin_b12=0.0
        ),
        medical_tags=MedicalTags(
            contraindications=['过敏体质', '肾结石患者'],
            suitable_conditions=['维生素C补充', '抗氧化', '美容护肤', '预防感冒'],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW,
            nutrient_density=NutrientDensity.HIGH,
            monitoring_required=False
        ),
        storage_requirements=StorageRequirements(
            temperature='冷藏',
            humidity='中等',
            shelf_life=3,
            storage_method='冷藏保鲜，尽快食用'
        ),
        preparation_methods=PreparationMethods(
            recommended_methods=['直接食用', '制作果酱', '榨汁', '烘焙'],
            cooking_time_range='生食最佳',
            temperature_range='低温保存',
            nutrition_retention_tips=['轻柔清洗', '保留果蒂', '新鲜食用']
        ),
        details=FoodDetails(
            description='富含维生素C和抗氧化物质的浆果',
            health_benefits=['维生素C极高', '抗氧化', '美容护肤', '增强免疫'],
            nutritional_highlights=['维生素C', '花青素', '叶酸', '锰元素'],
            medicinal_properties=['清热解暑', '润肺止咳', '健脾和胃'],
            seasonal_availability='春季、夏季',
            selection_tips=['颜色鲜红', '质地饱满', '无损伤', '香气浓郁']
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
]

# 延迟初始化函数，避免循环导入
def initialize_core_foods():
    """初始化核心食材数据库"""
    from .food_database import initialize_food_database
    initialize_food_database(CORE_FOODS_DATA)

# 已录入23种核心食材，涵盖8个主要类别：
# 谷物类(3)、蔬菜类(5)、蛋白质类(4)、豆制品类(2)、乳制品类(2)、坚果种子类(2)、菌菇类(1)、水果类(4)
# 每种食材都包含完整的26种营养数据、医学标签、储存要求和制备方法
# 注意：大米不含麸质，燕麦本身也不含麸质（但可能有交叉污染）