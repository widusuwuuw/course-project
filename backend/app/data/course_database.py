"""
课程数据库 - 基于运动元数据库的教练课程
每种运动可以有多个不同教练、时长、难度的课程变体
"""

from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class CourseDifficulty(str, Enum):
    """课程难度"""
    BEGINNER = "初级"
    INTERMEDIATE = "中级"
    ADVANCED = "高级"

@dataclass
class CourseResource:
    """课程资源数据模型"""
    id: str                      # 课程唯一ID
    exercise_id: str             # 关联的运动ID（来自exercise_database）
    category: str                # 分类（与exercise_database一致）
    title: str                   # 课程标题
    instructor: str              # 教练名称
    duration: int                # 时长（分钟）
    calories: int                # 消耗卡路里
    difficulty: CourseDifficulty # 难度等级
    cover_image: str             # 封面图片路径（占位）
    description: str             # 课程描述
    tags: List[str]              # 标签
    rating: float                # 评分
    students: int                # 学习人数
    is_free: bool                # 是否免费
    price: float                 # 价格（免费课程为0）

# ========== 课程数据库 ==========
COURSE_DATABASE: List[CourseResource] = [
    # ========== 有氧运动 课程 ==========
    # 快走课程
    CourseResource(
        id="walk_beginner_20",
        exercise_id="walk_3mph",
        category="有氧运动",
        title="晨间活力快走",
        instructor="李教练",
        duration=20,
        calories=100,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/walk_beginner_20.jpg",
        description="适合初学者的轻松快走课程，唤醒身体活力",
        tags=["零基础", "晨练", "减压"],
        rating=4.8,
        students=3240,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="walk_intermediate_30",
        exercise_id="walk_3mph",
        category="有氧运动",
        title="燃脂快走训练",
        instructor="王教练",
        duration=30,
        calories=150,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/walk_intermediate_30.jpg",
        description="中等强度快走，配合坡度变化，高效燃脂",
        tags=["燃脂", "减重", "心肺"],
        rating=4.7,
        students=2180,
        is_free=False,
        price=9.9
    ),

    # 慢跑课程
    CourseResource(
        id="jog_beginner_15",
        exercise_id="jog_6mph",
        category="有氧运动",
        title="入门慢跑指南",
        instructor="张教练",
        duration=15,
        calories=140,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/jog_beginner_15.jpg",
        description="从零开始学慢跑，掌握正确跑姿和呼吸技巧",
        tags=["入门", "跑步", "呼吸"],
        rating=4.9,
        students=5620,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="jog_intermediate_30",
        exercise_id="jog_6mph",
        category="有氧运动",
        title="进阶耐力跑训练",
        instructor="陈教练",
        duration=30,
        calories=280,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/jog_intermediate_30.jpg",
        description="提升耐力和配速的系统训练课程",
        tags=["耐力", "配速", "进阶"],
        rating=4.8,
        students=3450,
        is_free=False,
        price=19.9
    ),
    CourseResource(
        id="jog_advanced_45",
        exercise_id="jog_6mph",
        category="有氧运动",
        title="马拉松备战训练",
        instructor="刘教练",
        duration=45,
        calories=420,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/jog_advanced_45.jpg",
        description="专业马拉松备战课程，间歇跑与长距离结合",
        tags=["马拉松", "专业", "间歇"],
        rating=4.9,
        students=1280,
        is_free=False,
        price=29.9
    ),

    # 室内单车课程
    CourseResource(
        id="cycling_beginner_20",
        exercise_id="cycling_stationary",
        category="有氧运动",
        title="单车入门骑行",
        instructor="赵教练",
        duration=20,
        calories=180,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/cycling_beginner_20.jpg",
        description="学习正确骑行姿势，轻松开启单车之旅",
        tags=["入门", "单车", "低冲击"],
        rating=4.7,
        students=2890,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="cycling_intermediate_30",
        exercise_id="cycling_stationary",
        category="有氧运动",
        title="动感单车燃脂派对",
        instructor="孙教练",
        duration=30,
        calories=300,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/cycling_intermediate_30.jpg",
        description="跟随音乐节奏，高效燃脂的动感单车课",
        tags=["燃脂", "音乐", "动感"],
        rating=4.9,
        students=4520,
        is_free=False,
        price=15.9
    ),

    # 椭圆机课程
    CourseResource(
        id="elliptical_beginner_25",
        exercise_id="elliptical_machine",
        category="有氧运动",
        title="椭圆机基础训练",
        instructor="周教练",
        duration=25,
        calories=145,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/elliptical_beginner_25.jpg",
        description="低冲击全身有氧，保护关节的理想选择",
        tags=["低冲击", "关节友好", "全身"],
        rating=4.6,
        students=1890,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="elliptical_intermediate_35",
        exercise_id="elliptical_machine",
        category="有氧运动",
        title="椭圆机间歇挑战",
        instructor="吴教练",
        duration=35,
        calories=220,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/elliptical_intermediate_35.jpg",
        description="阻力变化训练，提升心肺功能和耐力",
        tags=["间歇", "心肺", "挑战"],
        rating=4.7,
        students=1420,
        is_free=False,
        price=12.9
    ),

    # 划船机课程
    CourseResource(
        id="rowing_beginner_15",
        exercise_id="rowing_machine",
        category="有氧运动",
        title="划船机入门教学",
        instructor="郑教练",
        duration=15,
        calories=122,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/rowing_beginner_15.jpg",
        description="掌握正确划船姿势，避免常见错误",
        tags=["入门", "全身", "技术"],
        rating=4.8,
        students=2340,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="rowing_intermediate_25",
        exercise_id="rowing_machine",
        category="有氧运动",
        title="划船机力量耐力训练",
        instructor="王教练",
        duration=25,
        calories=290,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/rowing_intermediate_25.jpg",
        description="结合力量和耐力的高效全身训练",
        tags=["全身", "力量", "耐力"],
        rating=4.8,
        students=1780,
        is_free=False,
        price=16.9
    ),

    # 登山机课程
    CourseResource(
        id="stair_beginner_10",
        exercise_id="stair_climber",
        category="有氧运动",
        title="登山机入门体验",
        instructor="李教练",
        duration=10,
        calories=157,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/stair_beginner_10.jpg",
        description="学习登山机正确使用方法，塑造下肢线条",
        tags=["入门", "下肢", "塑形"],
        rating=4.5,
        students=1560,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="stair_advanced_20",
        exercise_id="stair_climber",
        category="有氧运动",
        title="登山机极限挑战",
        instructor="张教练",
        duration=20,
        calories=315,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/stair_advanced_20.jpg",
        description="高强度登山训练，挑战你的极限",
        tags=["高强度", "挑战", "燃脂"],
        rating=4.9,
        students=890,
        is_free=False,
        price=19.9
    ),

    # ========== 力量训练 课程 ==========
    # 徒手深蹲课程
    CourseResource(
        id="squat_beginner_10",
        exercise_id="squats_bodyweight",
        category="力量训练",
        title="深蹲基础入门",
        instructor="陈教练",
        duration=10,
        calories=58,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/squat_beginner_10.jpg",
        description="学习标准深蹲动作，打好下肢力量基础",
        tags=["入门", "下肢", "基础"],
        rating=4.9,
        students=6780,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="squat_intermediate_20",
        exercise_id="squats_bodyweight",
        category="力量训练",
        title="深蹲进阶挑战",
        instructor="刘教练",
        duration=20,
        calories=117,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/squat_intermediate_20.jpg",
        description="多种深蹲变式，全面强化腿部和臀部",
        tags=["进阶", "臀腿", "变式"],
        rating=4.8,
        students=3420,
        is_free=False,
        price=12.9
    ),

    # 弹力带训练课程
    CourseResource(
        id="band_beginner_15",
        exercise_id="resistance_band",
        category="力量训练",
        title="弹力带全身塑形",
        instructor="赵教练",
        duration=15,
        calories=73,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/band_beginner_15.jpg",
        description="居家必备，弹力带全身力量训练入门",
        tags=["居家", "全身", "入门"],
        rating=4.7,
        students=4560,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="band_intermediate_25",
        exercise_id="resistance_band",
        category="力量训练",
        title="弹力带力量进阶",
        instructor="孙教练",
        duration=25,
        calories=122,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/band_intermediate_25.jpg",
        description="进阶弹力带动作，针对性强化各肌群",
        tags=["进阶", "针对性", "力量"],
        rating=4.8,
        students=2340,
        is_free=False,
        price=14.9
    ),

    # 平板支撑课程
    CourseResource(
        id="plank_beginner_8",
        exercise_id="plank",
        category="力量训练",
        title="平板支撑入门",
        instructor="周教练",
        duration=8,
        calories=47,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/plank_beginner_8.jpg",
        description="从30秒开始，逐步建立核心力量",
        tags=["核心", "入门", "基础"],
        rating=4.8,
        students=5890,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="plank_advanced_15",
        exercise_id="plank",
        category="力量训练",
        title="平板支撑挑战赛",
        instructor="吴教练",
        duration=15,
        calories=105,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/plank_advanced_15.jpg",
        description="多种平板变式，打造钢铁核心",
        tags=["核心", "挑战", "变式"],
        rating=4.9,
        students=2180,
        is_free=False,
        price=9.9
    ),

    # ========== 柔韧性训练 课程 ==========
    # 基础瑜伽课程
    CourseResource(
        id="yoga_beginner_20",
        exercise_id="yoga_basic",
        category="柔韧性训练",
        title="零基础瑜伽入门",
        instructor="林教练",
        duration=20,
        calories=59,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/yoga_beginner_20.jpg",
        description="从呼吸开始，轻松入门瑜伽世界",
        tags=["零基础", "呼吸", "放松"],
        rating=4.9,
        students=8920,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="yoga_intermediate_40",
        exercise_id="yoga_basic",
        category="柔韧性训练",
        title="晨间唤醒瑜伽",
        instructor="陈教练",
        duration=40,
        calories=117,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/yoga_intermediate_40.jpg",
        description="温和的晨间流瑜伽，唤醒身心活力",
        tags=["晨练", "流瑜伽", "唤醒"],
        rating=4.8,
        students=4560,
        is_free=False,
        price=19.9
    ),
    CourseResource(
        id="yoga_advanced_60",
        exercise_id="yoga_basic",
        category="柔韧性训练",
        title="力量瑜伽进阶",
        instructor="王教练",
        duration=60,
        calories=176,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/yoga_advanced_60.jpg",
        description="结合力量与柔韧的高级瑜伽练习",
        tags=["力量", "进阶", "挑战"],
        rating=4.9,
        students=2340,
        is_free=False,
        price=29.9
    ),

    # 全身拉伸课程
    CourseResource(
        id="stretch_beginner_10",
        exercise_id="stretching_full",
        category="柔韧性训练",
        title="办公室拉伸放松",
        instructor="郑教练",
        duration=10,
        calories=27,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/stretch_beginner_10.jpg",
        description="久坐族必备，快速缓解肩颈腰背",
        tags=["办公室", "肩颈", "久坐"],
        rating=4.8,
        students=7890,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="stretch_intermediate_20",
        exercise_id="stretching_full",
        category="柔韧性训练",
        title="运动后深度拉伸",
        instructor="李教练",
        duration=20,
        calories=53,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/stretch_intermediate_20.jpg",
        description="运动后必做的深度拉伸，加速恢复",
        tags=["运动后", "恢复", "深度"],
        rating=4.7,
        students=3450,
        is_free=False,
        price=9.9
    ),

    # 普拉提课程
    CourseResource(
        id="pilates_beginner_25",
        exercise_id="pilates",
        category="柔韧性训练",
        title="普拉提基础入门",
        instructor="张教练",
        duration=25,
        calories=71,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/pilates_beginner_25.jpg",
        description="学习普拉提核心原理，建立身体意识",
        tags=["入门", "核心", "体态"],
        rating=4.8,
        students=4230,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="pilates_intermediate_40",
        exercise_id="pilates",
        category="柔韧性训练",
        title="普拉提体态矫正",
        instructor="陈教练",
        duration=40,
        calories=113,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/pilates_intermediate_40.jpg",
        description="针对性改善体态问题，塑造优美身姿",
        tags=["体态", "矫正", "塑形"],
        rating=4.9,
        students=2780,
        is_free=False,
        price=24.9
    ),

    # ========== 传统中式 课程 ==========
    # 八段锦课程
    CourseResource(
        id="baduanjin_beginner_12",
        exercise_id="baduanjin",
        category="传统中式",
        title="八段锦标准教学",
        instructor="王师傅",
        duration=12,
        calories=42,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/baduanjin_beginner_12.jpg",
        description="国家体育总局标准版八段锦完整教学",
        tags=["传统", "养生", "标准"],
        rating=4.9,
        students=12450,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="baduanjin_intermediate_20",
        exercise_id="baduanjin",
        category="传统中式",
        title="八段锦深度解析",
        instructor="李师傅",
        duration=20,
        calories=70,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/baduanjin_intermediate_20.jpg",
        description="深入讲解每式要点，配合呼吸调理",
        tags=["深度", "呼吸", "调理"],
        rating=4.8,
        students=5680,
        is_free=False,
        price=15.9
    ),

    # 太极拳课程
    CourseResource(
        id="taichi_beginner_15",
        exercise_id="tai_chi",
        category="传统中式",
        title="太极拳入门基础",
        instructor="张师傅",
        duration=15,
        calories=53,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/taichi_beginner_15.jpg",
        description="从基本步法和手型开始，打好太极基础",
        tags=["入门", "基础", "步法"],
        rating=4.8,
        students=6780,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="taichi_intermediate_25",
        exercise_id="tai_chi",
        category="传统中式",
        title="24式太极拳完整套路",
        instructor="陈师傅",
        duration=25,
        calories=88,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/taichi_intermediate_25.jpg",
        description="24式简化太极拳完整教学，动作详解",
        tags=["24式", "完整", "套路"],
        rating=4.9,
        students=4560,
        is_free=False,
        price=19.9
    ),
    CourseResource(
        id="taichi_advanced_40",
        exercise_id="tai_chi",
        category="传统中式",
        title="太极拳精进修炼",
        instructor="王师傅",
        duration=40,
        calories=140,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/taichi_advanced_40.jpg",
        description="深入太极内功，劲力运用与意念配合",
        tags=["精进", "内功", "意念"],
        rating=4.9,
        students=1890,
        is_free=False,
        price=39.9
    ),

    # ========== 高强度间歇 课程 ==========
    # Tabata HIIT课程
    CourseResource(
        id="tabata_beginner_8",
        exercise_id="hiit_tabata",
        category="高强度间歇",
        title="Tabata入门体验",
        instructor="刘教练",
        duration=8,
        calories=112,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/tabata_beginner_8.jpg",
        description="4分钟Tabata入门，感受高效燃脂",
        tags=["入门", "4分钟", "燃脂"],
        rating=4.7,
        students=5680,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="tabata_intermediate_15",
        exercise_id="hiit_tabata",
        category="高强度间歇",
        title="Tabata全身燃脂",
        instructor="张教练",
        duration=15,
        calories=210,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/tabata_intermediate_15.jpg",
        description="3组Tabata循环，全身燃脂风暴",
        tags=["全身", "燃脂", "循环"],
        rating=4.9,
        students=4320,
        is_free=False,
        price=15.9
    ),
    CourseResource(
        id="tabata_advanced_20",
        exercise_id="hiit_tabata",
        category="高强度间歇",
        title="Tabata极限挑战",
        instructor="陈教练",
        duration=20,
        calories=280,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/tabata_advanced_20.jpg",
        description="4组高强度Tabata，挑战你的极限",
        tags=["极限", "挑战", "高强度"],
        rating=4.8,
        students=2180,
        is_free=False,
        price=19.9
    ),

    # 波比跳课程
    CourseResource(
        id="burpee_beginner_8",
        exercise_id="burpees",
        category="高强度间歇",
        title="波比跳入门教学",
        instructor="赵教练",
        duration=8,
        calories=90,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/burpee_beginner_8.jpg",
        description="分解动作教学，掌握标准波比跳",
        tags=["入门", "分解", "技术"],
        rating=4.6,
        students=3450,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="burpee_intermediate_12",
        exercise_id="burpees",
        category="高强度间歇",
        title="波比跳燃脂训练",
        instructor="孙教练",
        duration=12,
        calories=134,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/burpee_intermediate_12.jpg",
        description="波比跳组合训练，高效燃烧脂肪",
        tags=["燃脂", "组合", "高效"],
        rating=4.8,
        students=2780,
        is_free=False,
        price=12.9
    ),

    # 战绳训练课程
    CourseResource(
        id="rope_beginner_10",
        exercise_id="battle_ropes",
        category="高强度间歇",
        title="战绳基础入门",
        instructor="周教练",
        duration=10,
        calories=140,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/rope_beginner_10.jpg",
        description="战绳基本动作教学，唤醒全身力量",
        tags=["入门", "全身", "力量"],
        rating=4.7,
        students=1890,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="rope_advanced_15",
        exercise_id="battle_ropes",
        category="高强度间歇",
        title="战绳极限风暴",
        instructor="吴教练",
        duration=15,
        calories=210,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/rope_advanced_15.jpg",
        description="高强度战绳训练，爆发力与耐力双提升",
        tags=["极限", "爆发", "耐力"],
        rating=4.9,
        students=1240,
        is_free=False,
        price=16.9
    ),

    # ========== 水中运动 课程 ==========
    # 游泳课程
    CourseResource(
        id="swim_beginner_20",
        exercise_id="swimming",
        category="水中运动",
        title="零基础学游泳",
        instructor="郑教练",
        duration=20,
        calories=200,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/swim_beginner_20.jpg",
        description="从水性开始，轻松学会蛙泳",
        tags=["零基础", "蛙泳", "水性"],
        rating=4.9,
        students=7890,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="swim_intermediate_30",
        exercise_id="swimming",
        category="水中运动",
        title="自由泳技术提升",
        instructor="李教练",
        duration=30,
        calories=300,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/swim_intermediate_30.jpg",
        description="自由泳动作纠正与效率提升",
        tags=["自由泳", "技术", "效率"],
        rating=4.8,
        students=3450,
        is_free=False,
        price=29.9
    ),
    CourseResource(
        id="swim_advanced_45",
        exercise_id="swimming",
        category="水中运动",
        title="游泳耐力训练",
        instructor="王教练",
        duration=45,
        calories=450,
        difficulty=CourseDifficulty.ADVANCED,
        cover_image="courses/swim_advanced_45.jpg",
        description="混合泳姿耐力训练，提升游泳能力",
        tags=["耐力", "混合", "进阶"],
        rating=4.9,
        students=1560,
        is_free=False,
        price=39.9
    ),

    # ========== 功能性训练 课程 ==========
    # 功能性深蹲课程
    CourseResource(
        id="func_squat_beginner_12",
        exercise_id="functional_squat",
        category="功能性训练",
        title="日常功能深蹲",
        instructor="张教练",
        duration=12,
        calories=122,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/func_squat_beginner_12.jpg",
        description="改善日常坐立能力，预防下肢退化",
        tags=["日常", "功能", "预防"],
        rating=4.8,
        students=3890,
        is_free=True,
        price=0
    ),

    # 弓步功能性训练课程
    CourseResource(
        id="func_lunge_beginner_15",
        exercise_id="functional_lunge",
        category="功能性训练",
        title="弓步协调训练",
        instructor="陈教练",
        duration=15,
        calories=146,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/func_lunge_beginner_15.jpg",
        description="提升行走和上下楼梯的协调性",
        tags=["协调", "步态", "日常"],
        rating=4.7,
        students=2560,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="func_lunge_intermediate_20",
        exercise_id="functional_lunge",
        category="功能性训练",
        title="动态弓步挑战",
        instructor="刘教练",
        duration=20,
        calories=217,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/func_lunge_intermediate_20.jpg",
        description="多方向弓步变化，全面提升下肢功能",
        tags=["动态", "多方向", "进阶"],
        rating=4.8,
        students=1780,
        is_free=False,
        price=14.9
    ),

    # 硬拉功能性训练课程
    CourseResource(
        id="func_deadlift_beginner_12",
        exercise_id="functional_deadlift",
        category="功能性训练",
        title="安全提物训练",
        instructor="赵教练",
        duration=12,
        calories=144,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/func_deadlift_beginner_12.jpg",
        description="学习正确提物姿势，保护腰背健康",
        tags=["提物", "腰背", "安全"],
        rating=4.9,
        students=4230,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="func_deadlift_intermediate_18",
        exercise_id="functional_deadlift",
        category="功能性训练",
        title="后链力量强化",
        instructor="孙教练",
        duration=18,
        calories=216,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/func_deadlift_intermediate_18.jpg",
        description="强化后链肌群，提升整体力量",
        tags=["后链", "力量", "强化"],
        rating=4.8,
        students=1980,
        is_free=False,
        price=16.9
    ),

    # 功能性推举训练课程
    CourseResource(
        id="func_push_beginner_15",
        exercise_id="functional_push",
        category="功能性训练",
        title="推举功能训练",
        instructor="周教练",
        duration=15,
        calories=137,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/func_push_beginner_15.jpg",
        description="改善日常推物能力，强化上肢",
        tags=["推举", "上肢", "日常"],
        rating=4.6,
        students=2340,
        is_free=True,
        price=0
    ),

    # 平衡功能性训练课程
    CourseResource(
        id="func_balance_beginner_20",
        exercise_id="functional_balance",
        category="功能性训练",
        title="平衡能力训练",
        instructor="吴教练",
        duration=20,
        calories=70,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/func_balance_beginner_20.jpg",
        description="提升平衡能力，预防跌倒风险",
        tags=["平衡", "预防", "安全"],
        rating=4.8,
        students=5670,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="func_balance_intermediate_30",
        exercise_id="functional_balance",
        category="功能性训练",
        title="进阶平衡挑战",
        instructor="郑教练",
        duration=30,
        calories=105,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/func_balance_intermediate_30.jpg",
        description="单腿站立与动态平衡进阶训练",
        tags=["进阶", "单腿", "动态"],
        rating=4.7,
        students=2180,
        is_free=False,
        price=12.9
    ),

    # 核心功能性训练课程
    CourseResource(
        id="func_core_beginner_15",
        exercise_id="functional_core",
        category="功能性训练",
        title="核心基础训练",
        instructor="李教练",
        duration=15,
        calories=120,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/func_core_beginner_15.jpg",
        description="建立核心稳定性，改善姿势",
        tags=["核心", "稳定", "姿势"],
        rating=4.8,
        students=4560,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="func_core_intermediate_25",
        exercise_id="functional_core",
        category="功能性训练",
        title="核心力量进阶",
        instructor="王教练",
        duration=25,
        calories=200,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/func_core_intermediate_25.jpg",
        description="复合核心动作，全面强化腰腹",
        tags=["进阶", "复合", "腰腹"],
        rating=4.9,
        students=2890,
        is_free=False,
        price=15.9
    ),

    # 壶铃摆动课程
    CourseResource(
        id="kettlebell_beginner_12",
        exercise_id="kettlebell_swing",
        category="功能性训练",
        title="壶铃基础入门",
        instructor="张教练",
        duration=12,
        calories=101,
        difficulty=CourseDifficulty.BEGINNER,
        cover_image="courses/kettlebell_beginner_12.jpg",
        description="壶铃基础动作教学，安全高效",
        tags=["入门", "壶铃", "安全"],
        rating=4.7,
        students=2340,
        is_free=True,
        price=0
    ),
    CourseResource(
        id="kettlebell_intermediate_20",
        exercise_id="kettlebell_swing",
        category="功能性训练",
        title="壶铃爆发力训练",
        instructor="陈教练",
        duration=20,
        calories=168,
        difficulty=CourseDifficulty.INTERMEDIATE,
        cover_image="courses/kettlebell_intermediate_20.jpg",
        description="壶铃摆动与抓举，提升爆发力",
        tags=["爆发力", "摆动", "抓举"],
        rating=4.9,
        students=1560,
        is_free=False,
        price=18.9
    ),
]

# ========== 数据库访问函数 ==========
def get_all_courses() -> List[CourseResource]:
    """获取所有课程"""
    return COURSE_DATABASE

def get_course_by_id(course_id: str) -> Optional[CourseResource]:
    """根据ID获取课程"""
    for course in COURSE_DATABASE:
        if course.id == course_id:
            return course
    return None

def get_courses_by_category(category: str) -> List[CourseResource]:
    """根据分类获取课程"""
    return [c for c in COURSE_DATABASE if c.category == category]

def get_courses_by_exercise(exercise_id: str) -> List[CourseResource]:
    """根据运动ID获取相关课程"""
    return [c for c in COURSE_DATABASE if c.exercise_id == exercise_id]

def get_courses_by_difficulty(difficulty: CourseDifficulty) -> List[CourseResource]:
    """根据难度获取课程"""
    return [c for c in COURSE_DATABASE if c.difficulty == difficulty]

def get_free_courses() -> List[CourseResource]:
    """获取免费课程"""
    return [c for c in COURSE_DATABASE if c.is_free]

def search_courses(keyword: str) -> List[CourseResource]:
    """搜索课程"""
    keyword = keyword.lower()
    results = []
    for course in COURSE_DATABASE:
        search_text = f"{course.title} {course.description} {course.instructor} {' '.join(course.tags)}".lower()
        if keyword in search_text:
            results.append(course)
    return results

def get_all_categories() -> List[str]:
    """获取所有分类"""
    return [
        "有氧运动",
        "力量训练", 
        "柔韧性训练",
        "传统中式",
        "高强度间歇",
        "水中运动",
        "功能性训练"
    ]

def get_category_stats() -> dict:
    """获取各分类课程统计"""
    stats = {}
    for category in get_all_categories():
        courses = get_courses_by_category(category)
        stats[category] = {
            "count": len(courses),
            "free_count": len([c for c in courses if c.is_free])
        }
    return stats
