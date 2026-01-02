#!/usr/bin/env python3
"""
修复rules.json中的操作符格式
将数学符号操作符转换为规则引擎期望的枚举值
"""
import json

def fix_operators():
    """修复操作符格式"""
    print("开始修复rules.json中的操作符格式...")

    try:
        # 读取原始文件
        with open('rules.json', 'r', encoding='utf-8') as f:
            content = f.read()

        # 操作符映射表
        operator_map = {
            '>': 'gt',
            '>=': 'gte',
            '<': 'lt',
            '<=': 'lte',
            '=': 'eq',
            '==': 'eq',
            '!=': 'neq'
        }

        # 进行替换
        content_fixed = content
        replacements_made = 0

        for symbol, enum_value in operator_map.items():
            # 只替换在"operator"字段中的操作符
            old_pattern = f'"operator": "{symbol}"'
            new_pattern = f'"operator": "{enum_value}"'
            if old_pattern in content_fixed:
                count = content_fixed.count(old_pattern)
                content_fixed = content_fixed.replace(old_pattern, new_pattern)
                replacements_made += count
                print(f"  替换 '{symbol}' -> '{enum_value}': {count} 处")

        # 验证替换后的JSON格式
        try:
            json.loads(content_fixed)
            print("  JSON格式验证通过")
        except json.JSONDecodeError as e:
            print(f"  JSON格式验证失败: {e}")
            return False

        # 写入修复后的文件
        with open('rules.json', 'w', encoding='utf-8') as f:
            f.write(content_fixed)

        print(f"修复完成！总共替换了 {replacements_made} 处操作符")
        return True

    except Exception as e:
        print(f"修复失败: {e}")
        return False

if __name__ == "__main__":
    success = fix_operators()
    if success:
        print("操作符修复成功，可以重新测试性别特异性医学评估功能")
    else:
        print("操作符修复失败")