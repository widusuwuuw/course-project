#!/usr/bin/env python3
"""
调试AI提示词 - 查看生成AI体质报告时使用的完整提示词
"""

import sqlite3
import json
from datetime import datetime, timedelta

def get_sample_prompt():
    """获取示例AI提示词"""

    # 连接数据库
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()

    # 查询最近的检测报告
    cursor.execute("""
        SELECT user_id, category, report_date, gender, overall_status,
               abnormal_metrics, total_metrics, overall_risk_level,
               summary, recommendations
        FROM lab_reports
        ORDER BY report_date DESC
        LIMIT 5
    """)

    reports = cursor.fetchall()

    if not reports:
        print("没有找到检测报告数据")
        conn.close()
        return

    print(f"找到 {len(reports)} 份检测报告")
    print("=" * 60)

    # 构建健康摘要（模拟AI报告生成逻辑）
    health_summary = []

    for i, report in enumerate(reports, 1):
        user_id, category, report_date, gender, overall_status, abnormal_metrics, total_metrics, overall_risk_level, summary, recommendations = report

        print(f"\n报告 {i}:")
        print(f"  - 检测类别: {category}")
        print(f"  - 检测日期: {report_date}")
        print(f"  - 性别: {gender}")
        print(f"  - 整体状态: {overall_status}")
        print(f"  - 异常指标: {abnormal_metrics}/{total_metrics}")
        print(f"  - 风险等级: {overall_risk_level}")
        print(f"  - 医学评估: {summary}")

        # 解析健康建议
        if recommendations:
            try:
                rec_list = json.loads(recommendations)
                print(f"  - 健康建议 ({len(rec_list)}条): {', '.join(rec_list[:3])}")
            except json.JSONDecodeError:
                print("  - 健康建议: 解析失败")

        # 添加到健康摘要
        health_summary.append(f"""
检测类别: {category}
检测日期: {report_date}
整体状态: {overall_status}
异常指标: {abnormal_metrics}/{total_metrics}
风险等级: {overall_risk_level}
""")

        if summary:
            health_summary.append(f"医学评估: {summary}")

        if recommendations:
            try:
                rec_list = json.loads(recommendations)
                if rec_list:
                    health_summary.append(f"健康建议: {', '.join(rec_list[:3])}")
            except json.JSONDecodeError:
                pass

    # 构建完整的AI提示词
    ai_prompt = f"""
你是一位专业的健康管理师和医学分析师，请基于以下用户的医学检测数据，生成一份详细的个性化AI体质报告。

用户基本信息:
- 性别: {reports[0][3]}
- 分析周期: 30天内
- 检测次数: {len(reports)}次

医学检测结果汇总:
{"".join(health_summary)}

请按照以下结构生成简洁实用的AI体质报告（控制在2000字以内）：

## AI体质分析报告

### 一、整体健康状况评估
基于检测结果的综合评估，突出主要问题

### 二、系统功能分析
七大系统功能状态简析（血液、代谢、电解质、心血管、肝肾功能、神经系统、免疫系统）

### 三、关键指标趋势分析
重要异常指标的变化趋势

### 四、健康风险评估
当前主要健康风险等级和重点关注问题

### 五、个性化健康建议
1. 饮食营养建议（具体食物推荐）
2. 运动健身指导（具体运动建议）
3. 生活方式调整（可操作建议）
4. 就医和复查建议（时间点和项目）

请用专业且通俗易懂的语言，重点突出实用建议，避免冗长学术表述。
"""

    print("\n" + "=" * 60)
    print("完整的AI提示词:")
    print("=" * 60)
    print(ai_prompt)

    # 计算提示词长度
    prompt_length = len(ai_prompt)
    print(f"\n提示词总长度: {prompt_length} 字符")
    print(f"提示词token数(估算): {prompt_length // 2} tokens (中文字符按2个token估算)")

    conn.close()

if __name__ == "__main__":
    print("Debugging AI prompt generation...")
    get_sample_prompt()