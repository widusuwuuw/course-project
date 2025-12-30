"""
运动课程数据库 - 基于运动元数据库的课程体系

每种运动可以有多个课程（不同强度/时长），模仿Keep的课程设计
每个课程包含：封面图片、教练、时长、难度、消耗卡路里等信息
"""

from typing import List, Optional
from dataclasses import dataclass
from enum import Enum


class CourseDifficulty(str, Enum):
    """课程难度"""
    BEGINNER = "初级"
    INTERMEDIATE = "中级"
    ADVANCED = "高级"


class CourseCategory(str, Enum):
    """课程分类"""
    YOGA = "瑜伽"
    STRENGTH = "力量训练"
    AEROBIC = "有氧运动"
    HIIT = "HIIT"
    DANCE = "舞蹈"
    STRETCH = "拉伸放松"
    TRADITIONAL = "传统健身"
    FUNCTIONAL = "功能训练"


@dataclass
class ExerciseCourse:
    """运动课程数据模型"""
    id: str                      # 课程唯一ID
    title: str                   # 课程标题
    exercise_id: str             # 关联的运动元数据ID (来自exercise_database.py)
    category: CourseCategory     # 课程分类
    instructor: str              # 教练名字
    duration: int                # 时长（分钟）
    difficulty: CourseDifficulty # 难度等级
    calories: int                # 消耗卡路里
    cover_image: str             # 封面图片路径/URL (AI生成)
    description: str             # 课程描述
    tags: List[str]              # 标签
    rating: float                # 评分 (1-5)
    students: int                # 学习人数
    is_free: bool                # 是否免费
    price: float                 # 价格（如果收费）
    equipment: List[str]         # 所需设备
    suitable_for: List[str]      # 适合人群
    preview_steps: List[str]     # 课程步骤预览


# ========== 课程数据库 ==========
EXERCISE_COURSES: List[ExerciseCourse] = [
    # ========== 瑜伽课程 ==========
    ExerciseCourse(
        id='yoga_beginner_morning',
        title='晨间瑜伽唤醒',
        exercise_id='yoga_basic',
        category=CourseCategory.YOGA,
        instructor='赵教练',
        duration=15,
        difficulty=CourseDifficulty.BEGINNER,
        calories=50,
        cover_image='/assets/courses/yoga_morning.jpg',
        description='清晨的温柔唤醒练习，帮助你以最好的状态开始新的一天',
        tags=['早晨', '唤醒', '温和', '零基础'],
        rating=4.9,
        students=2340,
        is_free=True,
        price=0,
        equipment=['瑜伽垫'],
        suitable_for=['零基础', '上班族', '早起族'],
        preview_steps=['调息放松', '颈部活动', '猫牛式', '下犬式', '站立前屈', '山式']
    ),
    ExerciseCourse(
        id='yoga_beginner_full',
        title='初学者瑜伽入门',
        exercise_id='yoga_basic',
        category=CourseCategory.YOGA,
        instructor='李教练',
        duration=30,
        difficulty=CourseDifficulty.BEGINNER,
        calories=88,
        cover_image='/assets/courses/yoga_beginner.jpg',
        description='适合零基础学员的瑜伽入门课程，循序渐进掌握基础体式',
        tags=['零基础', '拉伸', '放松'],
        rating=4.8,
        students=5680,
        is_free=True,
        price=0,
        equipment=['瑜伽垫'],
        suitable_for=['零基础', '柔韧性差', '压力大'],
        preview_steps=['调息', '热身', '站立体式', '坐姿体式', '仰卧体式', '休息术']
    ),
    ExerciseCourse(
        id='yoga_intermediate_flow',
        title='流瑜伽进阶',
        exercise_id='yoga_basic',
        category=CourseCategory.YOGA,
        instructor='李教练',
        duration=45,
        difficulty=CourseDifficulty.INTERMEDIATE,
        calories=150,
        cover_image='/assets/courses/yoga_flow.jpg',
        description='动态流动的瑜伽练习，配合呼吸进行连续体式转换',
        tags=['流瑜伽', '有氧', '进阶'],
        rating=4.7,
        students=1890,
        is_free=False,
        price=19.9,
        equipment=['瑜伽垫'],
        suitable_for=['有基础', '想提升', '减压'],
        preview_steps=['拜日式热身', '站立序列', '平衡体式', '核心激活', '后弯序列', '放松']
    ),

    # ========== HIIT课程 ==========
    ExerciseCourse(
        id='hiit_beginner_10',
        title='HIIT入门燃脂',
        exercise_id='hiit_tabata',
        category=CourseCategory.HIIT,
        instructor='张教练',
        duration=10,
        difficulty=CourseDifficulty.BEGINNER,
        calories=100,
        cover_image='/assets/courses/hiit_beginner.jpg',
        description='10分钟入门级HIIT，适合刚开始接触高强度训练的新手',
        tags=['入门', '燃脂', '短时'],
        rating=4.6,
        students=3200,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['新手', '时间紧张', '想减脂'],
        preview_steps=['热身2分钟', '开合跳', '深蹲', '登山者', '高抬腿', '拉伸放松']
    ),
    ExerciseCourse(
        id='hiit_intermediate_20',
        title='燃脂HIIT训练',
        exercise_id='hiit_tabata',
        category=CourseCategory.HIIT,
        instructor='张教练',
        duration=20,
        difficulty=CourseDifficulty.INTERMEDIATE,
        calories=220,
        cover_image='/assets/courses/hiit_burn.jpg',
        description='20分钟中等强度HIIT，高效燃脂的间歇训练',
        tags=['燃脂', '减重', '中级'],
        rating=4.8,
        students=4500,
        is_free=False,
        price=19.9,
        equipment=[],
        suitable_for=['有基础', '减脂需求', '心肺好'],
        preview_steps=['动态热身', '波比跳', '跳跃深蹲', '登山者', '平板开合', '拉伸恢复']
    ),
    ExerciseCourse(
        id='hiit_advanced_30',
        title='极限HIIT挑战',
        exercise_id='hiit_tabata',
        category=CourseCategory.HIIT,
        instructor='王教练',
        duration=30,
        difficulty=CourseDifficulty.ADVANCED,
        calories=350,
        cover_image='/assets/courses/hiit_extreme.jpg',
        description='30分钟高强度极限挑战，适合有良好体能基础的训练者',
        tags=['极限', '挑战', '高级'],
        rating=4.9,
        students=1200,
        is_free=False,
        price=29.9,
        equipment=[],
        suitable_for=['体能好', '想突破', '减脂冲刺'],
        preview_steps=['充分热身', '组合波比', '跳跃训练', '核心轰炸', '全身复合', '深度拉伸']
    ),
    ExerciseCourse(
        id='hiit_tabata_4',
        title='4分钟Tabata极速燃脂',
        exercise_id='hiit_tabata',
        category=CourseCategory.HIIT,
        instructor='王教练',
        duration=4,
        difficulty=CourseDifficulty.ADVANCED,
        calories=56,
        cover_image='/assets/courses/tabata.jpg',
        description='经典Tabata协议：20秒全力+10秒休息×8轮，4分钟极限燃脂',
        tags=['Tabata', '极速', '高效'],
        rating=4.7,
        students=2800,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['时间紧', '体能好', '高效训练'],
        preview_steps=['快速热身', '波比跳×8轮', '深度拉伸']
    ),

    # ========== 力量训练课程 ==========
    ExerciseCourse(
        id='strength_squat_beginner',
        title='深蹲基础训练',
        exercise_id='squats_bodyweight',
        category=CourseCategory.STRENGTH,
        instructor='刘教练',
        duration=15,
        difficulty=CourseDifficulty.BEGINNER,
        calories=100,
        cover_image='/assets/courses/squat_beginner.jpg',
        description='学习正确的深蹲姿势，打造有力下肢',
        tags=['深蹲', '下肢', '基础'],
        rating=4.8,
        students=3400,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['新手', '想练腿', '臀部塑形'],
        preview_steps=['热身活动', '深蹲教学', '分组练习', '变式尝试', '拉伸放松']
    ),
    ExerciseCourse(
        id='strength_full_body_20',
        title='全身力量训练',
        exercise_id='squats_bodyweight',
        category=CourseCategory.STRENGTH,
        instructor='刘教练',
        duration=30,
        difficulty=CourseDifficulty.INTERMEDIATE,
        calories=200,
        cover_image='/assets/courses/full_body.jpg',
        description='系统性全身肌肉训练，雕刻完美身材',
        tags=['全身', '增肌', '塑形'],
        rating=4.8,
        students=4100,
        is_free=False,
        price=29.9,
        equipment=[],
        suitable_for=['有基础', '想增肌', '塑形'],
        preview_steps=['动态热身', '上肢训练', '核心训练', '下肢训练', '复合动作', '拉伸恢复']
    ),
    ExerciseCourse(
        id='strength_core_killer',
        title='腹肌撕裂者',
        exercise_id='plank',
        category=CourseCategory.STRENGTH,
        instructor='王教练',
        duration=20,
        difficulty=CourseDifficulty.ADVANCED,
        calories=150,
        cover_image='/assets/courses/abs_killer.jpg',
        description='高强度腹肌训练，打造完美核心',
        tags=['腹肌', '核心', '撕裂'],
        rating=4.9,
        students=5200,
        is_free=False,
        price=19.9,
        equipment=['瑜伽垫'],
        suitable_for=['有基础', '想练腹肌', '核心强化'],
        preview_steps=['核心激活', '上腹训练', '下腹训练', '侧腹训练', '平板系列', '放松拉伸']
    ),
    ExerciseCourse(
        id='strength_plank_challenge',
        title='平板支撑挑战',
        exercise_id='plank',
        category=CourseCategory.STRENGTH,
        instructor='陈教练',
        duration=10,
        difficulty=CourseDifficulty.INTERMEDIATE,
        calories=80,
        cover_image='/assets/courses/plank.jpg',
        description='多种平板变式，全方位强化核心',
        tags=['平板', '核心', '挑战'],
        rating=4.7,
        students=2900,
        is_free=True,
        price=0,
        equipment=['瑜伽垫'],
        suitable_for=['想练核心', '时间短', '中级'],
        preview_steps=['热身', '标准平板', '侧平板', '动态平板', '高平板', '放松']
    ),

    # ========== 有氧运动课程 ==========
    ExerciseCourse(
        id='cardio_walk_easy',
        title='轻松健步走',
        exercise_id='walk_3mph',
        category=CourseCategory.AEROBIC,
        instructor='周教练',
        duration=30,
        difficulty=CourseDifficulty.BEGINNER,
        calories=150,
        cover_image='/assets/courses/walk.jpg',
        description='适合所有人的低强度有氧运动，养成健康走路习惯',
        tags=['走路', '低强度', '健康'],
        rating=4.6,
        students=8900,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['老年人', '初学者', '康复期'],
        preview_steps=['热身拉伸', '慢速起步', '中速行走', '手臂摆动', '收尾放慢', '拉伸放松']
    ),
    ExerciseCourse(
        id='cardio_jog_beginner',
        title='新手慢跑入门',
        exercise_id='jog_6mph',
        category=CourseCategory.AEROBIC,
        instructor='周教练',
        duration=20,
        difficulty=CourseDifficulty.BEGINNER,
        calories=180,
        cover_image='/assets/courses/jog_beginner.jpg',
        description='从走到跑的过渡训练，帮助新手建立跑步习惯',
        tags=['慢跑', '入门', '心肺'],
        rating=4.7,
        students=4200,
        is_free=True,
        price=0,
        equipment=['跑鞋'],
        suitable_for=['跑步新手', '想减脂', '心肺弱'],
        preview_steps=['热身走动', '快走过渡', '慢跑3分钟', '走跑交替', '慢跑收尾', '拉伸放松']
    ),
    ExerciseCourse(
        id='cardio_jog_fat_burn',
        title='燃脂慢跑30分钟',
        exercise_id='jog_6mph',
        category=CourseCategory.AEROBIC,
        instructor='张教练',
        duration=30,
        difficulty=CourseDifficulty.INTERMEDIATE,
        calories=300,
        cover_image='/assets/courses/jog_burn.jpg',
        description='30分钟稳定心率慢跑，进入最佳燃脂区间',
        tags=['燃脂', '慢跑', '持续'],
        rating=4.8,
        students=3800,
        is_free=False,
        price=9.9,
        equipment=['跑鞋'],
        suitable_for=['有基础', '减脂需求', '心肺好'],
        preview_steps=['动态热身', '配速起步', '稳定配速', '心率监控', '降速收尾', '深度拉伸']
    ),
    ExerciseCourse(
        id='cardio_cycling_20',
        title='室内单车燃脂',
        exercise_id='cycling_stationary',
        category=CourseCategory.AEROBIC,
        instructor='陈教练',
        duration=20,
        difficulty=CourseDifficulty.BEGINNER,
        calories=180,
        cover_image='/assets/courses/cycling.jpg',
        description='低冲击的室内单车训练，保护关节同时高效燃脂',
        tags=['单车', '低冲击', '燃脂'],
        rating=4.6,
        students=2100,
        is_free=True,
        price=0,
        equipment=['动感单车'],
        suitable_for=['关节保护', '新手', '减脂'],
        preview_steps=['调整座椅', '热身骑行', '阻力变化', '配速训练', '冲刺段', '放松骑行']
    ),

    # ========== 拉伸放松课程 ==========
    ExerciseCourse(
        id='stretch_full_15',
        title='全身拉伸放松',
        exercise_id='stretching_full',
        category=CourseCategory.STRETCH,
        instructor='李教练',
        duration=15,
        difficulty=CourseDifficulty.BEGINNER,
        calories=40,
        cover_image='/assets/courses/stretch.jpg',
        description='运动后必备的全身拉伸，促进恢复预防损伤',
        tags=['拉伸', '放松', '恢复'],
        rating=4.9,
        students=6700,
        is_free=True,
        price=0,
        equipment=['瑜伽垫'],
        suitable_for=['运动后', '久坐族', '所有人'],
        preview_steps=['颈部拉伸', '肩背拉伸', '胸部拉伸', '腰部拉伸', '腿部拉伸', '深呼吸放松']
    ),
    ExerciseCourse(
        id='stretch_office_10',
        title='办公室快速拉伸',
        exercise_id='stretching_full',
        category=CourseCategory.STRETCH,
        instructor='赵教练',
        duration=10,
        difficulty=CourseDifficulty.BEGINNER,
        calories=25,
        cover_image='/assets/courses/office_stretch.jpg',
        description='不离开工位的快速拉伸，缓解久坐疲劳',
        tags=['办公室', '快速', '久坐'],
        rating=4.8,
        students=4500,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['上班族', '久坐', '颈椎问题'],
        preview_steps=['颈部活动', '肩部放松', '手腕拉伸', '腰部扭转', '腿部拉伸', '眼部放松']
    ),

    # ========== 传统健身课程 ==========
    ExerciseCourse(
        id='baduanjin_12',
        title='八段锦养生',
        exercise_id='baduanjin',
        category=CourseCategory.TRADITIONAL,
        instructor='孙教练',
        duration=12,
        difficulty=CourseDifficulty.BEGINNER,
        calories=42,
        cover_image='/assets/courses/baduanjin.jpg',
        description='传统八段锦功法，调理气血养生健体',
        tags=['八段锦', '养生', '传统'],
        rating=4.9,
        students=3200,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['老年人', '养生', '慢性病'],
        preview_steps=['起势调息', '双手托天', '左右开弓', '调理脾胃', '摇头摆尾', '收势']
    ),
    ExerciseCourse(
        id='taichi_basic_20',
        title='太极拳入门',
        exercise_id='tai_chi',
        category=CourseCategory.TRADITIONAL,
        instructor='孙教练',
        duration=20,
        difficulty=CourseDifficulty.BEGINNER,
        calories=60,
        cover_image='/assets/courses/taichi.jpg',
        description='24式简化太极拳入门，修身养性',
        tags=['太极', '入门', '养生'],
        rating=4.8,
        students=1800,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['老年人', '养生', '平衡差'],
        preview_steps=['起势', '野马分鬃', '白鹤亮翅', '搂膝拗步', '手挥琵琶', '收势']
    ),

    # ========== 舞蹈课程 ==========
    ExerciseCourse(
        id='dance_aerobic_party',
        title='有氧舞蹈派对',
        exercise_id='yoga_basic',  # 借用瑜伽的低强度特性
        category=CourseCategory.DANCE,
        instructor='陈教练',
        duration=40,
        difficulty=CourseDifficulty.BEGINNER,
        calories=280,
        cover_image='/assets/courses/dance.jpg',
        description='在音乐中享受运动的乐趣，边跳边燃脂',
        tags=['舞蹈', '有氧', '有趣'],
        rating=4.7,
        students=2900,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['喜欢音乐', '想减脂', '想放松'],
        preview_steps=['热身律动', '基础步伐', '组合动作', '自由发挥', '高潮部分', '放松收尾']
    ),

    # ========== 功能训练课程 ==========
    ExerciseCourse(
        id='functional_balance_15',
        title='平衡力训练',
        exercise_id='functional_balance',
        category=CourseCategory.FUNCTIONAL,
        instructor='刘教练',
        duration=15,
        difficulty=CourseDifficulty.BEGINNER,
        calories=70,
        cover_image='/assets/courses/balance.jpg',
        description='提升身体平衡能力，预防跌倒',
        tags=['平衡', '功能', '预防'],
        rating=4.6,
        students=1200,
        is_free=True,
        price=0,
        equipment=[],
        suitable_for=['老年人', '平衡差', '康复'],
        preview_steps=['热身', '单腿站立', '前后移重心', '侧向移动', '闭眼平衡', '放松']
    ),
    ExerciseCourse(
        id='functional_core_20',
        title='核心功能训练',
        exercise_id='functional_core',
        category=CourseCategory.FUNCTIONAL,
        instructor='王教练',
        duration=20,
        difficulty=CourseDifficulty.INTERMEDIATE,
        calories=130,
        cover_image='/assets/courses/core.jpg',
        description='强化核心稳定性，改善体态和运动表现',
        tags=['核心', '稳定', '功能'],
        rating=4.8,
        students=2600,
        is_free=False,
        price=19.9,
        equipment=['瑜伽垫'],
        suitable_for=['想强化核心', '运动员', '腰部问题'],
        preview_steps=['呼吸激活', '死虫式', '鸟狗式', '平板变式', '抗旋转', '放松']
    ),
]


# ========== 辅助函数 ==========
def get_all_courses() -> List[ExerciseCourse]:
    """获取所有课程"""
    return EXERCISE_COURSES


def get_courses_by_category(category: str) -> List[ExerciseCourse]:
    """按分类获取课程"""
    return [c for c in EXERCISE_COURSES if c.category.value == category]


def get_courses_by_exercise_id(exercise_id: str) -> List[ExerciseCourse]:
    """按运动ID获取相关课程"""
    return [c for c in EXERCISE_COURSES if c.exercise_id == exercise_id]


def get_courses_by_difficulty(difficulty: str) -> List[ExerciseCourse]:
    """按难度获取课程"""
    return [c for c in EXERCISE_COURSES if c.difficulty.value == difficulty]


def get_course_by_id(course_id: str) -> Optional[ExerciseCourse]:
    """按ID获取单个课程"""
    for course in EXERCISE_COURSES:
        if course.id == course_id:
            return course
    return None


def get_free_courses() -> List[ExerciseCourse]:
    """获取所有免费课程"""
    return [c for c in EXERCISE_COURSES if c.is_free]


def search_courses(keyword: str) -> List[ExerciseCourse]:
    """搜索课程（标题、描述、标签）"""
    keyword = keyword.lower()
    results = []
    for course in EXERCISE_COURSES:
        if (keyword in course.title.lower() or 
            keyword in course.description.lower() or
            any(keyword in tag.lower() for tag in course.tags)):
            results.append(course)
    return results


def course_to_dict(course: ExerciseCourse) -> dict:
    """将课程转换为字典（用于API响应）"""
    return {
        "id": course.id,
        "title": course.title,
        "exercise_id": course.exercise_id,
        "category": course.category.value,
        "instructor": course.instructor,
        "duration": course.duration,
        "difficulty": course.difficulty.value,
        "calories": course.calories,
        "cover_image": course.cover_image,
        "description": course.description,
        "tags": course.tags,
        "rating": course.rating,
        "students": course.students,
        "is_free": course.is_free,
        "price": course.price,
        "equipment": course.equipment,
        "suitable_for": course.suitable_for,
        "preview_steps": course.preview_steps,
    }


def get_all_courses_dict() -> List[dict]:
    """获取所有课程的字典列表"""
    return [course_to_dict(c) for c in EXERCISE_COURSES]


# 课程分类统计
def get_category_stats() -> dict:
    """获取各分类的课程统计"""
    stats = {}
    for category in CourseCategory:
        courses = get_courses_by_category(category.value)
        stats[category.value] = {
            "count": len(courses),
            "free_count": len([c for c in courses if c.is_free]),
            "total_students": sum(c.students for c in courses)
        }
    return stats
