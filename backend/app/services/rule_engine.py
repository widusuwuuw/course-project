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

    def evaluate(self, metrics: Dict[str, float], gender: str = "default") -> Dict:
        """
        评估多个检测指标

        Args:
            metrics: 检测指标字典，格式为 {metric_name: value}
            gender: 性别

        Returns:
            Dict: 完整的评估结果
        """
        results = []
        overall_risk_level = RiskLevel.LOW
        abnormal_metrics = []

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

        # 生成整体评估报告
        overall_assessment = {
            "total_metrics": len(results),
            "normal_metrics": len([r for r in results if r["status"] == "normal"]),
            "abnormal_metrics": len(abnormal_metrics),
            "overall_risk_level": overall_risk_level.value,
            "overall_status": "healthy" if len(abnormal_metrics) == 0 else "needs_attention",
            "summary": self._generate_summary(results, abnormal_metrics)
        }

        return {
            "metadata": {
                "rules_version": self.rules_data.get("version", "unknown"),
                "evaluation_time": self._get_current_time(),
                "gender": gender
            },
            "overall_assessment": overall_assessment,
            "individual_results": results,
            "abnormal_metrics": abnormal_metrics,
            "all_recommendations": self._collect_all_recommendations(abnormal_metrics)
        }

    def _generate_summary(self, all_results: List[Dict], abnormal_metrics: List[Dict]) -> str:
        """生成评估摘要"""
        if len(abnormal_metrics) == 0:
            return "所有检测指标均在正常范围内，继续保持健康的生活方式！"

        abnormal_names = [m["metric_name"] for m in abnormal_metrics]
        if len(abnormal_metrics) == 1:
            return f"检测到{abnormal_names[0]}异常，建议关注并进行进一步检查。"
        else:
            return f"检测到{len(abnormal_metrics)}项指标异常（{', '.join(abnormal_names)}），建议及时就医进行全面检查。"

    def _collect_all_recommendations(self, abnormal_metrics: List[Dict]) -> List[str]:
        """收集所有建议"""
        all_recommendations = []
        for metric in abnormal_metrics:
            all_recommendations.extend(metric.get("recommendations", []))

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