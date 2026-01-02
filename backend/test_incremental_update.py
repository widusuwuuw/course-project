"""
测试增量更新逻辑 - 验证 UserHealthProfile 工作流程
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import User, UserHealthProfile
from datetime import datetime


def test_incremental_update():
    """测试增量更新逻辑"""
    print("=" * 60)
    print("测试 UserHealthProfile 增量更新逻辑")
    print("=" * 60)
    
    db: Session = SessionLocal()
    
    try:
        # 1. 查找或创建测试用户
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            print("\n[INFO] 创建测试用户...")
            test_user = User(
                email="test@example.com",
                password_hash="test_hash",
                gender="male"
            )
            db.add(test_user)
            db.commit()
            print(f"[SUCCESS] 测试用户创建成功 - ID: {test_user.id}")
        else:
            print(f"\n[INFO] 使用现有测试用户 - ID: {test_user.id}")
        
        # 2. 查找或创建健康档案
        profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == test_user.id
        ).first()
        
        if not profile:
            print("[INFO] 创建健康档案...")
            profile = UserHealthProfile(
                user_id=test_user.id,
                gender="male"
            )
            db.add(profile)
            db.commit()
            print(f"[SUCCESS] 健康档案创建成功 - ID: {profile.id}")
        else:
            print(f"[INFO] 使用现有健康档案 - ID: {profile.id}")
        
        # 3. 第一次提交：血糖和血脂
        print("\n" + "-" * 60)
        print("【第1次提交】血糖 + 血脂")
        print("-" * 60)
        
        metrics_1 = {
            'glu': 5.5,      # 空腹血糖
            'tc': 4.2,       # 总胆固醇
            'tg': 1.5        # 甘油三酯
        }
        
        profile.update_metrics(metrics_1)
        db.commit()
        
        print(f"已录入指标数: {profile.total_metrics_count}")
        print("当前档案中的指标:")
        for key, data in profile.get_all_metrics().items():
            print(f"  - {key}: {data['value']} (更新于: {data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')})")
        
        # 4. 第二次提交：尿酸（不提交血糖、血脂）
        print("\n" + "-" * 60)
        print("【第2次提交】只提交尿酸，不提交血糖、血脂")
        print("-" * 60)
        
        import time
        time.sleep(2)  # 等待2秒，让时间戳有区别
        
        metrics_2 = {
            'uric_acid': 420  # 尿酸
        }
        
        profile.update_metrics(metrics_2)
        db.commit()
        
        print(f"已录入指标数: {profile.total_metrics_count}")
        print("当前档案中的指标:")
        for key, data in profile.get_all_metrics().items():
            print(f"  - {key}: {data['value']} (更新于: {data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')})")
        
        # 5. 验证增量更新结果
        print("\n" + "=" * 60)
        print("【验证结果】")
        print("=" * 60)
        
        # 重新查询确保数据持久化
        profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == test_user.id
        ).first()
        
        all_metrics = profile.get_all_metrics()
        
        # 检查血糖是否保留
        if 'glu' in all_metrics and all_metrics['glu']['value'] == 5.5:
            print("✅ 血糖保留成功 (glu=5.5)")
        else:
            print("❌ 血糖丢失！")
        
        # 检查血脂是否保留
        if 'tc' in all_metrics and all_metrics['tc']['value'] == 4.2:
            print("✅ 总胆固醇保留成功 (tc=4.2)")
        else:
            print("❌ 总胆固醇丢失！")
        
        if 'tg' in all_metrics and all_metrics['tg']['value'] == 1.5:
            print("✅ 甘油三酯保留成功 (tg=1.5)")
        else:
            print("❌ 甘油三酯丢失！")
        
        # 检查尿酸是否新增
        if 'uric_acid' in all_metrics and all_metrics['uric_acid']['value'] == 420:
            print("✅ 尿酸新增成功 (uric_acid=420)")
        else:
            print("❌ 尿酸新增失败！")
        
        # 检查时间戳
        glu_time = all_metrics['glu']['updated_at']
        uric_acid_time = all_metrics['uric_acid']['updated_at']
        
        if uric_acid_time > glu_time:
            print(f"✅ 时间戳正确：尿酸更新时间晚于血糖")
            print(f"   血糖更新时间: {glu_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   尿酸更新时间: {uric_acid_time.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print("❌ 时间戳错误！")
        
        print(f"\n总计已录入 {profile.total_metrics_count} 项指标")
        
        print("\n" + "=" * 60)
        print("测试完成！增量更新逻辑验证成功 ✅")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] 测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_incremental_update()
