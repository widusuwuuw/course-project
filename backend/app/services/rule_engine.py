import json
import os
from typing import Dict, List, Any, Optional
from enum import Enum


class ComparisonOperator(Enum):
    """比较操作符枚举"""
    GT = "gt"      # 大于
    GTE = "gte"    # 大于等于
    LT = "lt"      # 小于
    LTE = "lte"    # 小于等于
    EQ = "eq"      # 等于
    NEQ = "neq"    # 不等于


class RiskLevel(Enum):
    """风险级别枚举"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class MedicalRuleEngine:
    """医学规则引擎类"""

    def __init__(self, rules_file_path: str = None):
        """
        初始化规则引擎

        Args:
            rules_file_path: 规则文件路径，默认为当前目录下的rules.json
        """
        if rules_file_path is None:
            # 获取backend目录下的rules.json路径
            current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            rules_file_path = os.path.join(current_dir, "rules.json")

        self.rules_file_path = rules_file_path
        self.rules_data = {}
        self.load_rules()

    def load_rules(self) -> None:
        """加载医学规则配置"""
        try:
            with open(self.rules_file_path, 'r', encoding='utf-8') as f:
                self.rules_data = json.load(f)
            print(f"[SUCCESS] 成功加载医学规则，版本: {self.rules_data.get('version', 'unknown')}")
        except FileNotFoundError:
            print(f"[ERROR] 规则文件未找到: {self.rules_file_path}")
            self.rules_data = {"rules": {}}
        except json.JSONDecodeError as e:
            print(f"[ERROR] 规则文件格式错误: {e}")
            self.rules_data = {"rules": {}}
        except Exception as e:
            print(f"[ERROR] 加载规则文件时发生错误: {e}")
            self.rules_data = {"rules": {}}

    def evaluate_condition(self, value: float, operator: str, threshold: float) -> bool:
        """
        评估单个条件

        Args:
            value: 检测值
            operator: 比较操作符
            threshold: 阈值

        Returns:
            bool: 条件是否满足
        """
        op = ComparisonOperator(operator)

        if op == ComparisonOperator.GT:
            return value > threshold
        elif op == ComparisonOperator.GTE:
            return value >= threshold
        elif op == ComparisonOperator.LT:
            return value < threshold
        elif op == ComparisonOperator.LTE:
            return value <= threshold
        elif op == ComparisonOperator.EQ:
            return value == threshold
        elif op == ComparisonOperator.NEQ:
            return value != threshold
        else:
            return False

    def get_gender_specific_threshold(self, rule_config: Dict, gender: str = "default") -> Optional[Dict]:
        """
        获取性别特定的阈值配置

        Args:
            rule_config: 规则配置
            gender: 性别 (male/female/default)

        Returns:
            Dict: 性别特定的配置，如果不存在则返回None
        """
        gender_specific = rule_config.get("gender_specific", {})
        return gender_specific.get(gender, gender_specific.get("default"))

    def evaluate_single_metric(self, metric_name: str, value: float, gender: str = "default") -> Dict:
        """
        评估单个检测指标

        Args:
            metric_name: 检测指标名称
            value: 检测值
            gender: 性别

        Returns:
            Dict: 评估结果
        """
        rules = self.rules_data.get("rules", {})
        rule_config = rules.get(metric_name)

        if not rule_config:
            return {
                "metric_name": metric_name,
                "value": value,
                "status": "unknown",
                "normal_range": None,
                "risk_level": "low",
                "abnormal_tag": None,
                "message": f"未找到 {metric_name} 的评估规则",
                "recommendations": []
            }

        # 获取性别特定的阈值
        gender_config = self.get_gender_specific_threshold(rule_config, gender)

        # 检查是否为正常范围
        if gender_config and "normal_range" in gender_config:
            normal_range = gender_config["normal_range"]
            if normal_range[0] <= value <= normal_range[1]:
                return {
                    "metric_name": rule_config.get("name", metric_name),
                    "metric_name_en": rule_config.get("name_en", metric_name),
                    "value": value,
                    "unit": rule_config.get("unit", ""),
                    "status": "normal",
                    "normal_range": normal_range,
                    "risk_level": "low",
                    "abnormal_tag": None,
                    "message": f"{rule_config.get('name', metric_name)}正常",
                    "recommendations": []
                }

        # 检查异常条件
        conditions = rule_config.get("conditions", [])
        for condition in conditions:
            if self.evaluate_condition(value, condition["operator"], condition["value"]):
                return {
                    "metric_name": rule_config.get("name", metric_name),
                    "metric_name_en": rule_config.get("name_en", metric_name),
                    "value": value,
                    "unit": rule_config.get("unit", ""),
                    "status": condition.get("status", "abnormal"),
                    "normal_range": gender_config.get("normal_range") if gender_config else None,
                    "risk_level": condition.get("risk_level", "moderate"),
                    "abnormal_tag": condition.get("abnormal_tag"),
                    "message": condition.get("message", f"{rule_config.get('name', metric_name)}异常"),
                    "recommendations": condition.get("recommendations", [])
                }

        # 默认正常结果
        return {
            "metric_name": rule_config.get("name", metric_name),
            "metric_name_en": rule_config.get("name_en", metric_name),
            "value": value,
            "unit": rule_config.get("unit", ""),
            "status": "normal",
            "normal_range": gender_config.get("normal_range") if gender_config else None,
            "risk_level": "low",
            "abnormal_tag": None,
            "message": f"{rule_config.get('name', metric_name)}正常",
            "recommendations": []
        }

    def evaluate_composite_rules(self, metrics: Dict[str, float], gender: str = "default") -> List[Dict]:
        """
        评估复合规则（跨多个指标的综合评估）

        Args:
            metrics: 检测指标字典，格式为 {metric_name: value}
            gender: 性别

        Returns:
            List[Dict]: 复合规则评估结果列表
        """
        composite_results = []

        # 心血管复合规则
        cardio_rules = self.rules_data.get("cardiovascular_composite_rules", {})
        for rule_category, rule_config in cardio_rules.items():
            category_results = self._evaluate_composite_category(rule_config, metrics, gender)
            composite_results.extend(category_results)

        # 代谢综合征复合规则
        metabolic_rules = self.rules_data.get("metabolic_syndrome_rules", {})
        for rule_category, rule_config in metabolic_rules.items():
            category_results = self._evaluate_composite_category(rule_config, metrics, gender)
            composite_results.extend(category_results)

        # 综合风险分层
        risk_stratification = self.rules_data.get("composite_risk_stratification", {})
        for rule_category, rule_config in risk_stratification.items():
            category_results = self._evaluate_composite_category(rule_config, metrics, gender)
            composite_results.extend(category_results)

        return composite_results

    def _evaluate_composite_category(self, rule_config: Dict, metrics: Dict[str, float], gender: str) -> List[Dict]:
        """
        评估单个复合规则类别

        Args:
            rule_config: 规则配置
            metrics: 检测指标字典
            gender: 性别

        Returns:
            List[Dict]: 该类别的评估结果
        """
        results = []
        conditions = rule_config.get("conditions", [])

        for condition in conditions:
            if self._evaluate_composite_condition(condition, metrics, gender):
                result = {
                    "rule_type": "composite",
                    "rule_category": rule_config.get("description", ""),
                    "rule_name": condition.get("name", ""),
                    "source": rule_config.get("source", ""),
                    "reference": rule_config.get("reference", ""),
                    "risk_level": condition.get("risk_level", "moderate"),
                    "message": condition.get("message", ""),
                    "recommendations": condition.get("recommendations", []),
                    "evidence_level": condition.get("evidence_level", "B")
                }
                results.append(result)

        return results

    def _evaluate_composite_condition(self, condition: Dict, metrics: Dict[str, float], gender: str) -> bool:
        """
        评估复合规则条件

        Args:
            condition: 条件配置
            metrics: 检测指标字典
            gender: 性别

        Returns:
            bool: 条件是否满足
        """
        condition_logic = condition.get("if", [])

        # 处理单一条件
        if isinstance(condition_logic, dict):
            return self._evaluate_single_composite_condition(condition_logic, metrics, gender)

        # 处理 AND 逻辑
        if isinstance(condition_logic, list) and len(condition_logic) > 0:
            # 检查是否是 AND 逻辑 (嵌套字典)
            if all(isinstance(item, dict) and "metric" in item for item in condition_logic):
                return all(self._evaluate_single_composite_condition(item, metrics, gender) for item in condition_logic)

            # 检查是否是 OR 逻辑
            or_conditions = condition_logic[0] if condition_logic[0] == "or" else []
            if or_conditions == "or":
                return any(self._evaluate_composite_condition({"if": cond}, metrics, gender) for cond in condition_logic[1])

            # 处理 count 逻辑 (至少满足n个条件)
            for item in condition_logic:
                if isinstance(item, dict) and "count" in item:
                    count_condition = item
                    required_count = count_condition.get("operator", ">=")
                    required_value = count_condition.get("value", 1)
                    conditions_to_check = count_condition.get("count", [])

                    satisfied_count = sum(
                        self._evaluate_single_composite_condition(cond, metrics, gender)
                        for cond in conditions_to_check
                    )

                    if required_count == ">=":
                        return satisfied_count >= required_value
                    elif required_count == ">":
                        return satisfied_count > required_value
                    elif required_count == "=":
                        return satisfied_count == required_value

            # 处理 and 关键字
            and_conditions = condition_logic[0] if condition_logic[0] == "and" else []
            if and_conditions == "and":
                return all(self._evaluate_single_composite_condition(cond, metrics, gender) for cond in condition_logic[1])

        # 默认处理：检查每个条件
        if isinstance(condition_logic, list):
            return any(self._evaluate_single_composite_condition(item, metrics, gender) for item in condition_logic)

        return False

    def _evaluate_single_composite_condition(self, single_condition: Dict, metrics: Dict[str, float], gender: str) -> bool:
        """
        评估单一复合条件

        Args:
            single_condition: 单一条件配置
            metrics: 检测指标字典
            gender: 性别

        Returns:
            bool: 条件是否满足
        """
        # 检查性别特异性条件
        if "gender" in single_condition:
            condition_gender = single_condition.get("gender")
            if condition_gender != gender and condition_gender != "default":
                return False

        # 检查指标条件
        if "metric" in single_condition:
            metric_name = single_condition.get("metric")
            operator = single_condition.get("operator", ">=")
            value = single_condition.get("value")

            if metric_name not in metrics:
                return False

            return self.evaluate_condition(metrics[metric_name], operator, value)

        # 检查计算条件 (如 AIP = log(tg/hdl_c))
        if "calculate" in single_condition:
            return self._evaluate_calculated_condition(single_condition, metrics)

        return True

    def _evaluate_calculated_condition(self, condition: Dict, metrics: Dict[str, float]) -> bool:
        """
        评估计算条件

        Args:
            condition: 包含计算表达式的条件
            metrics: 检测指标字典

        Returns:
            bool: 条件是否满足
        """
        try:
            expression = condition.get("calculate", "")
            operator = condition.get("operator", ">")
            threshold = condition.get("value", 0)

            # 简单的表达式求值 (支持基本的数学运算)
            # 示例: "log(tg/hdl_c)" -> 计算致动脉粥样硬化指数
            if "tg/hdl_c" in expression and "log" in expression:
                tg = metrics.get("tg", 0)
                hdl_c = metrics.get("hdl_c", 1)  # 避免除以0
                if hdl_c <= 0:
                    return False
                import math
                calculated_value = math.log10(tg / hdl_c)  # 使用log10更符合医学实践
                return self.evaluate_condition(calculated_value, operator, threshold)

            # 可以在这里添加更多计算规则

        except Exception as e:
            print(f"[ERROR] 计算条件评估失败: {e}")
            return False

        return False

    def evaluate(self, metrics: Dict[str, float], gender: str = "default") -> Dict:
        """
        评估多个检测指标（包含复合规则）

        Args:
            metrics: 检测指标字典，格式为 {metric_name: value}
            gender: 性别

        Returns:
            Dict: 完整的评估结果
        """
        results = []
        overall_risk_level = RiskLevel.LOW
        abnormal_metrics = []

        # 评估单个指标
        for metric_name, value in metrics.items():
            result = self.evaluate_single_metric(metric_name, value, gender)
            results.append(result)

            # 收集异常指标
            if result["status"] == "abnormal":
                abnormal_metrics.append(result)

                # 更新整体风险级别
                result_risk = RiskLevel(result.get("risk_level", "low"))
                if result_risk.value > overall_risk_level.value:
                    overall_risk_level = result_risk

        # 评估复合规则
        composite_results = self.evaluate_composite_rules(metrics, gender)

        # 复合规则也可能提升风险级别
        for composite_result in composite_results:
            composite_risk = RiskLevel(composite_result.get("risk_level", "low"))
            if composite_risk.value > overall_risk_level.value:
                overall_risk_level = composite_risk

        # 生成整体评估报告
        overall_assessment = {
            "total_metrics": len(results),
            "normal_metrics": len([r for r in results if r["status"] == "normal"]),
            "abnormal_metrics": len(abnormal_metrics),
            "composite_rules_found": len(composite_results),
            "overall_risk_level": overall_risk_level.value,
            "overall_status": "healthy" if len(abnormal_metrics) == 0 and len(composite_results) == 0 else "needs_attention",
            "summary": self._generate_summary(results, abnormal_metrics, composite_results)
        }

        return {
            "metadata": {
                "rules_version": self.rules_data.get("version", "unknown"),
                "evaluation_time": self._get_current_time(),
                "gender": gender,
                "composite_rules_enabled": True
            },
            "overall_assessment": overall_assessment,
            "individual_results": results,
            "abnormal_metrics": abnormal_metrics,
            "composite_results": composite_results,
            "all_recommendations": self._collect_all_recommendations(abnormal_metrics, composite_results)
        }

    def _generate_summary(self, all_results: List[Dict], abnormal_metrics: List[Dict], composite_results: List[Dict] = None) -> str:
        """生成评估摘要"""
        if composite_results is None:
            composite_results = []

        if len(abnormal_metrics) == 0 and len(composite_results) == 0:
            return "所有检测指标均在正常范围内，复合风险评估也显示健康状况良好，继续保持健康的生活方式！"

        summary_parts = []

        # 单个指标异常摘要
        if len(abnormal_metrics) > 0:
            abnormal_names = [m["metric_name"] for m in abnormal_metrics]
            if len(abnormal_metrics) == 1:
                summary_parts.append(f"检测到{abnormal_names[0]}异常")
            else:
                summary_parts.append(f"检测到{len(abnormal_metrics)}项指标异常（{', '.join(abnormal_names)}）")

        # 复合规则结果摘要
        if len(composite_results) > 0:
            high_risk_rules = [r for r in composite_results if r.get("risk_level") in ["high", "very_high"]]
            if high_risk_rules:
                summary_parts.append(f"发现{len(high_risk_rules)}项高风险复合模式（如代谢综合征、心血管风险升高等）")
            else:
                summary_parts.append(f"发现{len(composite_results)}项需关注的复合风险因素")

        # 综合建议
        if len(summary_parts) > 0:
            summary_parts.append("建议及时就医进行全面检查和风险评估")
            return "，".join(summary_parts) + "。"

        return "建议关注并进行进一步检查。"

    def _collect_all_recommendations(self, abnormal_metrics: List[Dict], composite_results: List[Dict] = None) -> List[str]:
        """收集所有建议"""
        if composite_results is None:
            composite_results = []

        all_recommendations = []

        # 收集单个指标的建议
        for metric in abnormal_metrics:
            all_recommendations.extend(metric.get("recommendations", []))

        # 收集复合规则的建议
        for composite in composite_results:
            all_recommendations.extend(composite.get("recommendations", []))

        # 去重并保持顺序
        seen = set()
        unique_recommendations = []
        for rec in all_recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)

        return unique_recommendations

    def _get_current_time(self) -> str:
        """获取当前时间字符串"""
        from datetime import datetime
        return datetime.now().isoformat()

    def get_available_metrics(self) -> List[str]:
        """获取可用的检测指标列表"""
        return list(self.rules_data.get("rules", {}).keys())

    def get_metric_info(self, metric_name: str) -> Optional[Dict]:
        """获取指定指标的详细信息"""
        rules = self.rules_data.get("rules", {})
        return rules.get(metric_name)