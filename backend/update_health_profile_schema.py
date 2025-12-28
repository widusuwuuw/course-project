"""
数据库迁移脚本 - 添加 UserHealthProfile 表

该脚本用于创建用户健康档案卡表，实现增量更新健康指标的存储逻辑。
"""

import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, inspect, text
from app.db import Base, DATABASE_URL
from app.models import User, HealthLog, LabReport, LabResult, UserHealthProfile


def check_table_exists(engine, table_name: str) -> bool:
    """检查表是否存在"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def migrate_database():
    """执行数据库迁移"""
    print("=" * 60)
    print("开始数据库迁移 - 添加 UserHealthProfile 表")
    print("=" * 60)
    
    # 创建数据库引擎
    engine = create_engine(DATABASE_URL)
    
    # 检查现有表
    print("\n[INFO] 检查现有数据库表...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"现有表: {existing_tables}")
    
    # 检查 user_health_profiles 表是否存在
    if 'user_health_profiles' in existing_tables:
        print("\n[WARNING] user_health_profiles 表已存在")
        
        # 检查表结构
        columns = inspector.get_columns('user_health_profiles')
        column_names = [col['name'] for col in columns]
        print(f"现有列数: {len(column_names)}")
        
        # 检查是否缺少某些列
        expected_columns = [
            'id', 'user_id', 'gender',
            # 血常规
            'wbc', 'wbc_updated_at', 'rbc', 'rbc_updated_at', 'hgb', 'hgb_updated_at',
            'plt', 'plt_updated_at', 'neut_per', 'neut_per_updated_at',
            'lymp_per', 'lymp_per_updated_at', 'mono_per', 'mono_per_updated_at',
            'hct', 'hct_updated_at', 'mcv', 'mcv_updated_at',
            'mch', 'mch_updated_at', 'mchc', 'mchc_updated_at',
            # 肝功能
            'alt', 'alt_updated_at', 'ast', 'ast_updated_at',
            'alp', 'alp_updated_at', 'ggt', 'ggt_updated_at',
            'tbil', 'tbil_updated_at', 'dbil', 'dbil_updated_at',
            'tp', 'tp_updated_at', 'alb', 'alb_updated_at', 'glb', 'glb_updated_at',
            # 肾功能
            'crea', 'crea_updated_at', 'bun', 'bun_updated_at',
            'urea', 'urea_updated_at', 'uric_acid', 'uric_acid_updated_at',
            'cysc', 'cysc_updated_at', 'egfr', 'egfr_updated_at',
            'microalb', 'microalb_updated_at', 'upcr', 'upcr_updated_at',
            # 血脂
            'tc', 'tc_updated_at', 'tg', 'tg_updated_at',
            'hdl_c', 'hdl_c_updated_at', 'ldl_c', 'ldl_c_updated_at',
            'vldl_c', 'vldl_c_updated_at',
            'apolipoprotein_a', 'apolipoprotein_a_updated_at',
            'apolipoprotein_b', 'apolipoprotein_b_updated_at',
            # 血糖
            'glu', 'glu_updated_at', 'hba1c', 'hba1c_updated_at',
            'fasting_insulin', 'fasting_insulin_updated_at',
            'c_peptide', 'c_peptide_updated_at', 'homa_ir', 'homa_ir_updated_at',
            # 电解质
            'na', 'na_updated_at', 'k', 'k_updated_at',
            'cl', 'cl_updated_at', 'ca', 'ca_updated_at',
            'p', 'p_updated_at', 'mg', 'mg_updated_at',
            # 元数据
            'ai_comprehensive_report', 'ai_report_generated_at',
            'total_metrics_count', 'last_updated_at', 'created_at'
        ]
        
        missing_columns = [col for col in expected_columns if col not in column_names]
        if missing_columns:
            print(f"\n[WARNING] 缺少以下列: {missing_columns}")
            print("[INFO] 建议删除旧表后重新创建")
            
            response = input("\n是否删除旧表并重新创建? (y/n): ")
            if response.lower() == 'y':
                with engine.connect() as conn:
                    conn.execute(text("DROP TABLE IF EXISTS user_health_profiles CASCADE"))
                    conn.commit()
                print("[SUCCESS] 旧表已删除")
            else:
                print("[INFO] 跳过表创建")
                return
        else:
            print("[SUCCESS] 表结构完整，无需迁移")
            return
    
    # 创建新表
    print("\n[INFO] 创建 user_health_profiles 表...")
    
    # 只创建 UserHealthProfile 表
    UserHealthProfile.__table__.create(engine, checkfirst=True)
    
    print("[SUCCESS] user_health_profiles 表创建成功！")
    
    # 验证表结构
    print("\n[INFO] 验证表结构...")
    inspector = inspect(engine)
    columns = inspector.get_columns('user_health_profiles')
    print(f"总列数: {len(columns)}")
    
    # 按类别统计
    metric_columns = [col['name'] for col in columns if not col['name'].endswith('_updated_at') 
                      and col['name'] not in ['id', 'user_id', 'gender', 'ai_comprehensive_report', 
                                               'ai_report_generated_at', 'total_metrics_count', 
                                               'last_updated_at', 'created_at']]
    timestamp_columns = [col['name'] for col in columns if col['name'].endswith('_updated_at')]
    
    print(f"指标列数: {len(metric_columns)}")
    print(f"时间戳列数: {len(timestamp_columns)}")
    
    print("\n" + "=" * 60)
    print("数据库迁移完成！")
    print("=" * 60)
    
    # 显示表结构摘要
    print("\n【UserHealthProfile 表结构摘要】")
    print("-" * 40)
    categories = {
        '血常规': ['wbc', 'rbc', 'hgb', 'plt', 'neut_per', 'lymp_per', 'mono_per', 'hct', 'mcv', 'mch', 'mchc'],
        '肝功能': ['alt', 'ast', 'alp', 'ggt', 'tbil', 'dbil', 'tp', 'alb', 'glb'],
        '肾功能': ['crea', 'bun', 'urea', 'uric_acid', 'cysc', 'egfr', 'microalb', 'upcr'],
        '血脂': ['tc', 'tg', 'hdl_c', 'ldl_c', 'vldl_c', 'apolipoprotein_a', 'apolipoprotein_b'],
        '血糖': ['glu', 'hba1c', 'fasting_insulin', 'c_peptide', 'homa_ir'],
        '电解质': ['na', 'k', 'cl', 'ca', 'p', 'mg']
    }
    
    total = 0
    for category, metrics in categories.items():
        print(f"  {category}: {len(metrics)}项")
        total += len(metrics)
    print(f"  ─────────────────")
    print(f"  合计: {total}项健康指标")


if __name__ == "__main__":
    migrate_database()
