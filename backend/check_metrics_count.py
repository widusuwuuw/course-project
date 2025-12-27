import json

with open('rules.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('rules.json 实际指标数:', len(data['rules']))
print('\n所有指标列表:')
for i, key in enumerate(data['rules'].keys(), 1):
    print(f'{i:2d}. {key}')

categories = {
    '血常规': ['wbc', 'rbc', 'hgb', 'plt', 'neut_per', 'lymp_per', 'mono_per', 'hct', 'mcv', 'mch', 'mchc'],
    '肝功能': ['alt', 'ast', 'alp', 'ggt', 'tbil', 'dbil', 'tp', 'alb', 'glb'],
    '肾功能': ['crea', 'bun', 'urea', 'uric_acid', 'cysc', 'egfr', 'microalb', 'upcr'],
    '血脂': ['tc', 'tg', 'hdl_c', 'ldl_c', 'vldl_c', 'apolipoprotein_a', 'apolipoprotein_b'],
    '血糖': ['glu', 'hba1c', 'fasting_insulin', 'c_peptide', 'homa_ir'],
    '电解质': ['na', 'k', 'cl', 'ca', 'p', 'mg']
}

total = sum(len(v) for v in categories.values())
print(f'\n按类别统计: {total}项')
for k, v in categories.items():
    print(f'  {k}: {len(v)}项 - {v}')

print('\n总计: 11+9+8+7+5+6 =', 11+9+8+7+5+6)
