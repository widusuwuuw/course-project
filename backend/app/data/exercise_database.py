"""
运动元数据库 - 基于ACSM体力活动汇编和2024医学指南
包含20种核心运动的完整医学标签和执行指导
"""

from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

class ExerciseCategory(str, Enum):
    """运动类别枚举"""
    AEROBIC = "有氧运动"
    STRENGTH = "力量训练"
    FLEXIBILITY = "柔韧性训练"
    TRADITIONAL_CHINESE = "传统中式"
    HIIT = "高强度间歇"
    WATER_SPORTS = "水中运动"
    FUNCTIONAL = "功能性训练"

class IntensityLevel(str, Enum):
    """运动强度枚举"""
    LIGHT = "light"
    MODERATE = "moderate"
    VIGOROUS = "vigorous"

class ImpactLevel(str, Enum):
    """冲击等级枚举"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"

class DifficultyLevel(int, Enum):
    """难度等级枚举"""
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3

class LearningCurve(str, Enum):
    """学习曲线枚举"""
    EASY = "easy"
    MODERATE = "moderate"
    DIFFICULT = "difficult"

@dataclass
class MedicalTags:
    """医学标签"""
    contraindications: List[str]  # 禁忌症
    suitable_conditions: List[str]  # 适合状况
    monitoring_required: bool  # 是否需要医学监测
    impact_level: ImpactLevel  # 冲击等级

@dataclass
class Requirements:
    """运动要求"""
    equipment: List[str]  # 所需设备
    space_required: str  # 所需空间
    difficulty_level: DifficultyLevel  # 难度等级
    learning_curve: LearningCurve  # 学习曲线

@dataclass
class Modifications:
    """动作调整"""
    easier: List[str]  # 简化版本
    harder: List[str]  # 进阶版本

@dataclass
class ExerciseDetails:
    """运动详细信息"""
    description: str
    benefits: List[str]
    proper_form: List[str]
    common_mistakes: List[str]
    modifications: Modifications

@dataclass
class ExerciseResource:
    """运动资源数据模型"""
    id: str
    name: str
    category: ExerciseCategory

    # 运动参数
    met_value: float
    intensity: IntensityLevel
    duration: int  # 推荐时长（分钟）
    calorie_burn: int  # 每小时估算卡路里消耗（基于70kg体重）

    # 医学标签
    medical_tags: MedicalTags

    # 执行要求
    requirements: Requirements

    # 详细信息
    details: ExerciseDetails

    # 元数据
    created_at: datetime
    updated_at: datetime

# ========== 运动元数据库 ==========
EXERCISE_DATABASE = [
    # ========== 有氧运动 ==========
    ExerciseResource(
        id='walk_3mph',
        name='快走 (3mph, 5km/h)',
        category=ExerciseCategory.AEROBIC,
        met_value=3.3,
        intensity=IntensityLevel.MODERATE,
        duration=30,
        calorie_burn=231,
        medical_tags=MedicalTags(
            contraindications=['急性关节损伤', '严重关节炎急性期'],
            suitable_conditions=['健康人群', '心脏病康复', '减脂需求', '老年人'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='medium',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='中等速度步行，心率保持在中等强度范围',
            benefits=['改善心肺功能', '促进血液循环', '减少压力', '体重管理'],
            proper_form=['保持正确姿势', '手臂自然摆动', '足跟先着地'],
            common_mistakes=['弓背驼背', '步幅过大或过小', '手臂僵硬'],
            modifications=Modifications(
                easier=['降低速度到2.5mph', '缩短时间15-20分钟'],
                harder=['增加到3.5-4mph', '增加坡度', '手持轻重量']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='jog_6mph',
        name='慢跑 (6mph, 10km/h)',
        category=ExerciseCategory.AEROBIC,
        met_value=8.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=30,
        calorie_burn=560,
        medical_tags=MedicalTags(
            contraindications=['严重心脏病', '高血压未控制', '关节损伤', '近期手术'],
            suitable_conditions=['健康人群', '良好心肺功能', '减脂需求'],
            monitoring_required=False,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=['跑鞋'],
            space_required='large',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='中等速度跑步，保持稳定的呼吸节奏',
            benefits=['增强心肺功能', '提高耐力', '有效减脂', '骨骼健康'],
            proper_form=['身体略微前倾', '脚步轻盈', '呼吸节奏均匀'],
            common_mistakes=['脚步过重', '身体过度前倾', '呼吸急促'],
            modifications=Modifications(
                easier=['改为快走慢跑交替', '降低速度5mph', '缩短时间20分钟'],
                harder=['增加到7-8mph', '间歇跑', '增加坡度']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 力量训练 ==========
    ExerciseResource(
        id='squats_bodyweight',
        name='徒手深蹲',
        category=ExerciseCategory.STRENGTH,
        met_value=5.0,
        intensity=IntensityLevel.MODERATE,
        duration=15,
        calorie_burn=175,
        medical_tags=MedicalTags(
            contraindications=['膝关节严重损伤', '腰部急性损伤', '近期膝关节手术'],
            suitable_conditions=['健康人群', '下肢力量训练', '功能改善'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='基础下肢力量训练动作，锻炼大腿和臀部肌群',
            benefits=['增强下肢力量', '改善平衡', '提高代谢', '日常功能改善'],
            proper_form=['脚与肩同宽', '膝盖不超过脚尖', '背部挺直'],
            common_mistakes=['膝盖内扣', '腰部过度弯曲', '脚后跟离地'],
            modifications=Modifications(
                easier=['扶墙或椅子支撑', '减少下蹲深度', '增加休息时间'],
                harder=['手持重量', '增加次数组数', '跳蹲']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 高强度间歇训练 ==========
    ExerciseResource(
        id='hiit_tabata',
        name='Tabata HIIT (4分钟)',
        category=ExerciseCategory.HIIT,
        met_value=12.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=4,
        calorie_burn=56,
        medical_tags=MedicalTags(
            contraindications=['心脏病', '高血压未控制', '关节损伤', '孕妇'],
            suitable_conditions=['良好心肺功能', '时间紧张', '高效训练'],
            monitoring_required=True,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.ADVANCED,
            learning_curve=LearningCurve.DIFFICULT
        ),
        details=ExerciseDetails(
            description='20秒全力运动+10秒休息，重复8个周期',
            benefits=['高效燃脂', '心肺功能爆发', '时间效率高', '后燃效应'],
            proper_form=['动作标准化', '全力输出', '充分恢复'],
            common_mistakes=['动作不标准', '强度不够', '休息不足'],
            modifications=Modifications(
                easier=['延长休息时间', '降低运动强度', '增加循环次数'],
                harder=['缩短休息时间', '增加难度动作', '负重训练']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 传统中式运动 ==========
    ExerciseResource(
        id='baduanjin',
        name='八段锦',
        category=ExerciseCategory.TRADITIONAL_CHINESE,
        met_value=2.8,
        intensity=IntensityLevel.LIGHT,
        duration=12,
        calorie_burn=42,
        medical_tags=MedicalTags(
            contraindications=[],
            suitable_conditions=['老年人', '慢性病患者', '初学者', '压力管理'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='传统气功功法，八个动作组合的健身方法',
            benefits=['改善平衡', '增强柔韧性', '压力缓解', '气血调理'],
            proper_form=['动作缓慢连贯', '呼吸配合', '意念集中'],
            common_mistakes=['动作急促', '呼吸不配合', '意念分散'],
            modifications=Modifications(
                easier=['减少动作幅度', '增加休息时间', '坐姿练习'],
                harder=['增加动作幅度', '延长练习时间', '增加重复次数']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 柔韧性训练 ==========
    ExerciseResource(
        id='yoga_basic',
        name='基础瑜伽',
        category=ExerciseCategory.FLEXIBILITY,
        met_value=2.5,
        intensity=IntensityLevel.LIGHT,
        duration=30,
        calorie_burn=88,
        medical_tags=MedicalTags(
            contraindications=['急性腰椎间盘突出', '严重骨质疏松'],
            suitable_conditions=['健康人群', '压力管理', '柔韧性改善', '老年人'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['瑜伽垫'],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='基础瑜伽体式练习，注重呼吸与动作配合',
            benefits=['增强柔韧性', '改善体态', '缓解压力', '提高专注力'],
            proper_form=['动作缓慢', '配合呼吸', '量力而行'],
            common_mistakes=['过度拉伸', '憋气', '动作过快'],
            modifications=Modifications(
                easier=['使用瑜伽砖辅助', '减少停留时间', '选择简单体式'],
                harder=['延长停留时间', '尝试进阶体式', '增加流动性']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='stretching_full',
        name='全身拉伸',
        category=ExerciseCategory.FLEXIBILITY,
        met_value=2.3,
        intensity=IntensityLevel.LIGHT,
        duration=15,
        calorie_burn=40,
        medical_tags=MedicalTags(
            contraindications=['急性肌肉拉伤'],
            suitable_conditions=['健康人群', '运动恢复', '久坐人群', '老年人'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='系统性全身主要肌群拉伸，适合运动前热身或运动后放松',
            benefits=['预防运动损伤', '缓解肌肉紧张', '改善活动范围', '促进恢复'],
            proper_form=['每个动作保持15-30秒', '感到轻微拉伸感即可', '均匀呼吸'],
            common_mistakes=['弹震式拉伸', '拉伸过度疼痛', '憋气'],
            modifications=Modifications(
                easier=['减少拉伸幅度', '缩短保持时间'],
                harder=['增加拉伸深度', '延长保持时间']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 更多有氧运动 ==========
    ExerciseResource(
        id='cycling_stationary',
        name='室内单车',
        category=ExerciseCategory.AEROBIC,
        met_value=5.5,
        intensity=IntensityLevel.MODERATE,
        duration=30,
        calorie_burn=275,
        medical_tags=MedicalTags(
            contraindications=['严重膝关节损伤'],
            suitable_conditions=['健康人群', '减脂需求', '关节保护需求'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['动感单车或健身车'],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='室内固定单车骑行，低冲击有氧运动',
            benefits=['心肺功能', '下肢力量', '关节友好', '不受天气影响'],
            proper_form=['座椅高度适中', '保持稳定踏频', '上身放松'],
            common_mistakes=['座椅过高或过低', '过度用力', '上身过度摇晃'],
            modifications=Modifications(
                easier=['降低阻力', '减慢速度', '缩短时间'],
                harder=['增加阻力', '间歇训练', '延长时间']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='swimming',
        name='游泳',
        category=ExerciseCategory.WATER_SPORTS,
        met_value=6.0,
        intensity=IntensityLevel.MODERATE,
        duration=30,
        calorie_burn=300,
        medical_tags=MedicalTags(
            contraindications=['开放性伤口', '严重皮肤病', '癫痫未控制'],
            suitable_conditions=['健康人群', '关节损伤康复', '减脂需求', '老年人'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['泳衣', '泳镜'],
            space_required='large',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='全身性水中有氧运动，对关节几乎零冲击',
            benefits=['全身锻炼', '心肺功能', '关节保护', '体重管理'],
            proper_form=['保持流线型体态', '均匀呼吸', '节奏稳定'],
            common_mistakes=['憋气过久', '动作不协调', '速度过快'],
            modifications=Modifications(
                easier=['使用浮板', '减慢速度', '选择轻松泳姿'],
                harder=['增加距离', '提高速度', '间歇训练']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 更多传统中式运动 ==========
    ExerciseResource(
        id='tai_chi',
        name='太极拳(24式)',
        category=ExerciseCategory.TRADITIONAL_CHINESE,
        met_value=3.0,
        intensity=IntensityLevel.LIGHT,
        duration=20,
        calorie_burn=70,
        medical_tags=MedicalTags(
            contraindications=[],
            suitable_conditions=['老年人', '慢性病患者', '平衡训练', '压力管理'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.DIFFICULT
        ),
        details=ExerciseDetails(
            description='简化太极拳24式，融合呼吸与动作的传统健身方法',
            benefits=['改善平衡', '增强协调性', '降低血压', '缓解焦虑'],
            proper_form=['动作缓慢连贯', '重心稳定', '呼吸自然'],
            common_mistakes=['动作僵硬', '重心不稳', '呼吸急促'],
            modifications=Modifications(
                easier=['简化动作', '扶墙练习', '减少套路'],
                harder=['完整套路', '增加重复', '配合器械']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 更多力量训练 ==========
    ExerciseResource(
        id='resistance_band',
        name='弹力带训练',
        category=ExerciseCategory.STRENGTH,
        met_value=3.5,
        intensity=IntensityLevel.LIGHT,
        duration=20,
        calorie_burn=98,
        medical_tags=MedicalTags(
            contraindications=['急性肌肉损伤'],
            suitable_conditions=['健康人群', '力量入门', '老年人', '康复训练'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['弹力带'],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='使用弹力带进行全身力量训练，安全可控',
            benefits=['增强肌力', '改善体态', '关节友好', '携带方便'],
            proper_form=['控制动作速度', '保持张力', '呼吸配合'],
            common_mistakes=['动作过快', '弹力带选择不当', '姿势不正确'],
            modifications=Modifications(
                easier=['选择较轻阻力带', '减少组数'],
                harder=['选择更强阻力带', '增加组数', '复合动作']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='plank',
        name='平板支撑',
        category=ExerciseCategory.STRENGTH,
        met_value=4.0,
        intensity=IntensityLevel.MODERATE,
        duration=5,
        calorie_burn=35,
        medical_tags=MedicalTags(
            contraindications=['腕关节损伤', '严重腰椎问题'],
            suitable_conditions=['健康人群', '核心训练', '体态改善'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['瑜伽垫'],
            space_required='small',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='静态核心训练，增强核心稳定性',
            benefits=['核心力量', '改善体态', '预防腰痛', '提高稳定性'],
            proper_form=['身体呈直线', '核心收紧', '均匀呼吸'],
            common_mistakes=['塌腰', '撅臀', '憋气'],
            modifications=Modifications(
                easier=['膝盖着地', '缩短时间', '靠墙支撑'],
                harder=['单腿支撑', '侧平板', '动态平板']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 功能性训练 ==========
    ExerciseResource(
        id='functional_squat',
        name='功能性深蹲',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=5.8,
        intensity=IntensityLevel.MODERATE,
        duration=20,
        calorie_burn=203,
        medical_tags=MedicalTags(
            contraindications=['膝关节急性损伤', '腰椎间盘突出急性期', '严重平衡障碍'],
            suitable_conditions=['健康人群', '下肢功能康复', '平衡能力训练', '老年人群'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='模拟日常坐立动作的功能性深蹲，注重日常生活实用性',
            benefits=['改善日常生活能力', '增强下肢力量', '提高平衡能力', '预防跌倒'],
            proper_form=['膝盖与脚尖方向一致', '背部保持挺直', '重心均匀分布'],
            common_mistakes=['膝盖内扣', '上身过度前倾', '下蹲过浅'],
            modifications=Modifications(
                easier=['扶椅支撑', '减少下蹲深度', '增加休息时间'],
                harder=['增加负重', '单腿深蹲', '增加速度']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='functional_lunge',
        name='弓步功能性训练',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=6.5,
        intensity=IntensityLevel.MODERATE,
        duration=18,
        calorie_burn=175,
        medical_tags=MedicalTags(
            contraindications=['膝关节严重损伤', '平衡功能障碍', '急性踝关节扭伤'],
            suitable_conditions=['健康人群', '下肢协调训练', '运动表现提升', '康复期患者'],
            monitoring_required=False,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=[],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='模拟行走、爬楼梯等日常动作的弓步训练',
            benefits=['提高下肢协调性', '增强平衡能力', '改善步态', '强化核心稳定性'],
            proper_form=['前膝不超过脚尖', '后膝接近地面', '上身挺直'],
            common_mistakes=['前膝过度前倾', '上身摇晃', '步幅不当'],
            modifications=Modifications(
                easier=['扶墙支撑', '减小步幅', '降低速度'],
                harder=['手持负重', '跳跃弓步', '增加变化方向']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='functional_deadlift',
        name='硬拉功能性训练',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=7.2,
        intensity=IntensityLevel.VIGOROUS,
        duration=15,
        calorie_burn=180,
        medical_tags=MedicalTags(
            contraindications=['急性腰椎损伤', '严重骨质疏松', '高血压未控制'],
            suitable_conditions=['健康人群', '后链力量训练', '姿势改善', '日常提物能力'],
            monitoring_required=True,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=[],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.DIFFICULT
        ),
        details=ExerciseDetails(
            description='模拟日常提举重物的安全动作模式',
            benefits=['增强后链肌群', '改善提物姿势', '预防腰背损伤', '提高全身力量'],
            proper_form=['背部挺直', '用腿部发力', '重物贴近身体'],
            common_mistakes=['弓背提举', '过度依赖腰部', '重物离身体过远'],
            modifications=Modifications(
                easier=['徒手模拟', '减轻负重', '增加休息'],
                harder=['增加负重', '单腿硬拉', '增加速度']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='functional_push',
        name='功能性推举训练',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=5.2,
        intensity=IntensityLevel.MODERATE,
        duration=20,
        calorie_burn=182,
        medical_tags=MedicalTags(
            contraindications=['肩关节急性损伤', '腕管综合征', '高血压严重'],
            suitable_conditions=['健康人群', '上肢功能训练', '日常推物能力', '肩部稳定性'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='模拟推门、推购物车等日常推举动作',
            benefits=['增强上肢力量', '改善推物能力', '提高肩部稳定性', '核心力量'],
            proper_form=['手腕保持中立', '核心收紧', '动作路径稳定'],
            common_mistakes=['肩部过度耸起', '手腕弯曲', '核心松弛'],
            modifications=Modifications(
                easier=['跪姿推举', '减少幅度', '墙面支撑'],
                harder=['增加负重', '单臂推举', '不稳定平面']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='functional_balance',
        name='平衡功能性训练',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=3.5,
        intensity=IntensityLevel.LIGHT,
        duration=25,
        calorie_burn=88,
        medical_tags=MedicalTags(
            contraindications=['严重平衡障碍', '急性眩晕', '内耳疾病'],
            suitable_conditions=['老年人', '康复期患者', '平衡能力训练', '跌倒预防'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='模拟日常站立、行走等平衡需求的综合性训练',
            benefits=['提高平衡能力', '增强本体感觉', '预防跌倒', '改善协调性'],
            proper_form=['保持视线水平', '核心收紧', '缓慢稳定'],
            common_mistakes=['屏气', '视线晃动', '动作过快'],
            modifications=Modifications(
                easier=['扶墙支撑', '双脚并拢', '缩短时间'],
                harder=['单腿站立', '闭眼训练', '增加干扰']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='functional_core',
        name='核心功能性训练',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=4.8,
        intensity=IntensityLevel.MODERATE,
        duration=22,
        calorie_burn=176,
        medical_tags=MedicalTags(
            contraindications=['急性腰椎间盘突出', '腹肌撕裂', '怀孕初期'],
            suitable_conditions=['健康人群', '腰背痛预防', '姿势改善', '运动表现提升'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['瑜伽垫'],
            space_required='small',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='模拟日常转身、弯腰等核心参与的复合动作',
            benefits=['增强核心稳定性', '改善姿势', '预防腰背痛', '提高功能性动作'],
            proper_form=['保持自然呼吸', '核心持续收紧', '动作控制精确'],
            common_mistakes=['憋气', '过度代偿', '动作过快'],
            modifications=Modifications(
                easier=['减少幅度', '增加休息', '简单动作'],
                harder=['增加幅度', '延长保持时间', '复合动作']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    # ========== 新增运动：健身房器械与高强度训练 ==========
    ExerciseResource(
        id='elliptical_machine',
        name='椭圆机训练',
        category=ExerciseCategory.AEROBIC,
        met_value=5.0,
        intensity=IntensityLevel.MODERATE,
        duration=30,
        calorie_burn=175,
        medical_tags=MedicalTags(
            contraindications=['严重膝关节损伤', '平衡功能障碍'],
            suitable_conditions=['健康人群', '关节保护需求', '体重管理', '心血管健康'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['椭圆机'],
            space_required='medium',
            difficulty_level=DifficultyLevel.BEGINNER,
            learning_curve=LearningCurve.EASY
        ),
        details=ExerciseDetails(
            description='低冲击有氧运动，模拟跑步和 climbing 动作，对关节压力小',
            benefits=['提高心肺功能', '燃烧卡路里', '保护关节', '全身协调'],
            proper_form=['保持挺胸', '全脚掌踩踏板', '手臂协调摆动'],
            common_mistakes=['身体前倾过度', '仅用脚尖踩踏', '手臂不动'],
            modifications=Modifications(
                easier=['降低阻力', '缩短时间', '降低坡度'],
                harder=['增加阻力', '增加坡度', '手握不扶扶手']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='rowing_machine',
        name='划船机训练',
        category=ExerciseCategory.AEROBIC,
        met_value=7.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=20,
        calorie_burn=245,
        medical_tags=MedicalTags(
            contraindications=['腰椎间盘突出', '肩袖损伤', '严重腰背痛'],
            suitable_conditions=['健康人群', '全身有氧', '上肢力量', '背部健康'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['划船机'],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='全身有氧运动，模拟划船动作，锻炼心肺和肌肉力量',
            benefits=['全身肌肉参与', '高卡路里消耗', '低冲击', '改善体态'],
            proper_form=['用腿部发力启动', '保持背部挺直', '拉手至胸部'],
            common_mistakes=['过度使用手臂', '弓背', '过度后仰'],
            modifications=Modifications(
                easier=['降低阻力', '缩短时间', '降低速度'],
                harder=['增加阻力', '间歇训练', '增加速度']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='stair_climber',
        name='登山机训练',
        category=ExerciseCategory.AEROBIC,
        met_value=9.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=15,
        calorie_burn=236,
        medical_tags=MedicalTags(
            contraindications=['膝关节严重损伤', '踝关节不稳定', '下肢关节炎'],
            suitable_conditions=['健康人群', '下肢力量', '心肺功能', '体重管理'],
            monitoring_required=False,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=['登山机'],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='模拟爬楼梯动作，高强度有氧和下肢训练',
            benefits=['强化下肢', '高卡路里消耗', '提升心肺', '塑形腿部'],
            proper_form=['全脚掌踩踏板', '保持挺胸', '不要手扶扶手过度承重'],
            common_mistakes=['仅用前脚掌', '身体过度前倾', '手扶扶手承重'],
            modifications=Modifications(
                easier=['降低速度', '缩短时间', '间歇休息'],
                harder=['增加速度', '携带负重', '侧向爬楼梯']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='burpees',
        name='波比跳',
        category=ExerciseCategory.HIIT,
        met_value=8.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=10,
        calorie_burn=112,
        medical_tags=MedicalTags(
            contraindications=['膝关节损伤', '腕关节损伤', '高血压', '腰椎问题'],
            suitable_conditions=['健康人群', '高强度训练', '全身燃脂', '时间效率高'],
            monitoring_required=True,
            impact_level=ImpactLevel.HIGH
        ),
        requirements=Requirements(
            equipment=[],
            space_required='small',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='高强度全身运动，结合深蹲、俯卧撑和跳跃',
            benefits=['全身肌肉参与', '高卡路里消耗', '提升爆发力', '时间效率'],
            proper_form=['落地轻盈', '核心收紧', '动作连贯'],
            common_mistakes=['落地过重', '弓背', '膝盖内扣'],
            modifications=Modifications(
                easier=['去掉跳跃', '慢速完成', '减少次数'],
                harder=['增加跳跃高度', '加入俯卧撑', '加快速度']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='pilates',
        name='普拉提',
        category=ExerciseCategory.FLEXIBILITY,
        met_value=3.0,
        intensity=IntensityLevel.LIGHT,
        duration=45,
        calorie_burn=127,
        medical_tags=MedicalTags(
            contraindications=['骨质疏松严重', '椎间盘突出急性期', '怀孕初期'],
            suitable_conditions=['健康人群', '核心力量', '姿态改善', '康复期'],
            monitoring_required=False,
            impact_level=ImpactLevel.LOW
        ),
        requirements=Requirements(
            equipment=['瑜伽垫'],
            space_required='small',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='强调核心力量、姿态控制和呼吸的训练方法',
            benefits=['强化核心', '改善姿态', '增强柔韧性', '缓解腰背痛'],
            proper_form=['专注呼吸', '动作控制精确', '核心持续收紧'],
            common_mistakes=['憋气', '过度代偿', '追求幅度牺牲质量'],
            modifications=Modifications(
                easier=['简化动作', '使用辅助工具', '增加休息'],
                harder=['增加难度', '延长保持时间', '复合动作']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='battle_ropes',
        name='战绳训练',
        category=ExerciseCategory.HIIT,
        met_value=10.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=8,
        calorie_burn=112,
        medical_tags=MedicalTags(
            contraindications=['肩关节损伤', '高血压', '腕管综合征'],
            suitable_conditions=['健康人群', '高强度间歇', '上肢力量', '爆发力训练'],
            monitoring_required=True,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=['战绳'],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.MODERATE
        ),
        details=ExerciseDetails(
            description='使用重型绳索进行高强度的波浪和甩动训练',
            benefits=['全身协调', '高卡路里消耗', '提升爆发力', '增强握力'],
            proper_form=['核心收紧', '利用全身力量', '保持节奏'],
            common_mistakes=['仅用手臂', '核心松弛', '呼吸屏住'],
            modifications=Modifications(
                easier=['降低绳重', '缩短时间', '间歇延长'],
                harder=['增加绳重', '复合动作', '缩短间歇']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    ),

    ExerciseResource(
        id='kettlebell_swing',
        name='壶铃摆动',
        category=ExerciseCategory.FUNCTIONAL,
        met_value=6.0,
        intensity=IntensityLevel.VIGOROUS,
        duration=15,
        calorie_burn=126,
        medical_tags=MedicalTags(
            contraindications=['腰椎间盘突出', '肩关节损伤', '孕期'],
            suitable_conditions=['健康人群', '爆发力训练', '后链力量', '功能性运动'],
            monitoring_required=True,
            impact_level=ImpactLevel.MODERATE
        ),
        requirements=Requirements(
            equipment=['壶铃'],
            space_required='medium',
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            learning_curve=LearningCurve.DIFFICULT
        ),
        details=ExerciseDetails(
            description='使用壶铃进行摆动动作，强化后链肌肉群和爆发力',
            benefits=['强化臀腿', '提升爆发力', '改善姿势', '全身协调'],
            proper_form=['臀部发力', '背部挺直', '手臂仅作为摆锤'],
            common_mistakes=['过度依赖手臂', '弓背', '膝盖过度内扣'],
            modifications=Modifications(
                easier=['减轻壶铃重量', '降低摆动高度', '增加休息'],
                harder=['增加壶铃重量', '单腿摆动', '增加次数']
            )
        ),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
]

# ========== 医学条件数据库 ==========
MEDICAL_CONDITIONS_DATABASE = {
    '心脏病': {
        'absolute_contraindications': ['HIIT高强度', '大重量力量训练', '憋气动作'],
        'relative_contraindications': ['高强度有氧', '等长收缩运动'],
        'recommended_activities': ['八段锦', '太极拳', '轻度有氧运动', '水中运动'],
        'max_met_value': 4.0,
        'monitoring_required': True,
        'precautions': ['监测心率', '避免过度疲劳', '循序渐进']
    },

    '高血压': {
        'absolute_contraindications': ['HIIT高强度', '大重量训练', '头部低于心脏动作'],
        'relative_contraindications': ['中等强度力量训练'],
        'recommended_activities': ['中等强度有氧', '太极拳', '八段锦', '水中运动'],
        'max_met_value': 6.0,
        'monitoring_required': True,
        'precautions': ['监测血压', '避免憋气', '控制强度']
    },

    '糖尿病': {
        'absolute_contraindications': ['空腹高强度运动', '胰岛素高峰期运动'],
        'relative_contraindications': ['长时间高强度运动'],
        'recommended_activities': ['中等强度运动', '规律有氧运动', '太极拳'],
        'max_met_value': 6.0,
        'timing_requirements': ['餐后1-2小时'],
        'precautions': ['监测血糖', '携带糖类', '避免低血糖']
    },

    '关节损伤': {
        'absolute_contraindications': ['高冲击运动', '跑步类', '跳跃动作'],
        'relative_contraindications': ['大重量下肢训练'],
        'recommended_activities': ['水中运动', '太极', '八段锦', '低冲击有氧'],
        'max_met_value': 4.0,
        'impact_level': 'low',
        'precautions': ['避免疼痛动作', '加强稳定性训练', '循序渐进']
    }
}

# 数据库访问函数
def get_all_exercises() -> List[ExerciseResource]:
    """获取所有运动资源"""
    return EXERCISE_DATABASE

def get_exercise_by_id(exercise_id: str) -> Optional[ExerciseResource]:
    """根据ID获取运动资源"""
    for exercise in EXERCISE_DATABASE:
        if exercise.id == exercise_id:
            return exercise
    return None

def get_exercises_by_category(category: ExerciseCategory) -> List[ExerciseResource]:
    """根据类别获取运动资源"""
    return [ex for ex in EXERCISE_DATABASE if ex.category == category]

def get_exercises_by_intensity(intensity: IntensityLevel) -> List[ExerciseResource]:
    """根据强度获取运动资源"""
    return [ex for ex in EXERCISE_DATABASE if ex.intensity == intensity]

def get_medical_condition_info(condition: str) -> Optional[Dict]:
    """获取医学条件信息"""
    return MEDICAL_CONDITIONS_DATABASE.get(condition)

def search_exercises(keywords: List[str]) -> List[ExerciseResource]:
    """搜索运动资源"""
    results = []
    for exercise in EXERCISE_DATABASE:
        # 搜索名称、类别、适合条件
        search_text = f"{exercise.name} {exercise.category} {' '.join(exercise.medical_tags.suitable_conditions)}"
        if any(keyword.lower() in search_text.lower() for keyword in keywords):
            results.append(exercise)
    return results