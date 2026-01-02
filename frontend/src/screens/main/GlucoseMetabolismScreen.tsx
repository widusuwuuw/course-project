import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { analyzeLabResults, getUserGender } from '../../api/client';

const { width: screenWidth } = Dimensions.get('window');

interface GlucoseMetabolismScreenProps {
  onBack: () => void;
  onAnalysisComplete: (results: any, values: {[key: string]: string}) => void;
}

// 血糖代谢5项指标
const GLUCOSE_METRICS = [
  { key: 'glu', name: '空腹血糖', unit: 'mmol/L', placeholder: '3.9-6.1', icon: 'water-outline' },
  { key: 'hba1c', name: '糖化血红蛋白', unit: '%', placeholder: '4.0-6.5', icon: 'water-outline' },
  { key: 'fasting_insulin', name: '空腹胰岛素', unit: 'μIU/mL', placeholder: '5-25', icon: 'water-outline' },
  { key: 'c_peptide', name: 'C肽', unit: 'ng/mL', placeholder: '0.8-3.5', icon: 'water-outline' },
  { key: 'homa_ir', name: 'HOMA-IR', unit: '计算值', placeholder: '0.5-2.5', icon: 'calculator-outline' },
];

export default function GlucoseMetabolismScreen({ onBack, onAnalysisComplete }: GlucoseMetabolismScreenProps) {
  const { colors } = useTheme();
  const [metricValues, setMetricValues] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  // 处理输入值变化
  const handleValueChange = (metricKey: string, value: string) => {
    setMetricValues(prev => ({
      ...prev,
      [metricKey]: value
    }));
  };

  // 计算HOMA-IR（如果输入了血糖和胰岛素）
  const calculateHOMAIR = () => {
    const glucose = parseFloat(metricValues['glu']);
    const insulin = parseFloat(metricValues['fasting_insulin']);

    if (!isNaN(glucose) && !isNaN(insulin) && glucose > 0 && insulin > 0) {
      // HOMA-IR = (空腹血糖 × 空腹胰岛素) / 22.5
      const homa_ir = (glucose * insulin) / 22.5;
      setMetricValues(prev => ({
        ...prev,
        'homa_ir': homa_ir.toFixed(2)
      }));
    }
  };

  // 监听血糖和胰岛素输入变化，自动计算HOMA-IR
  React.useEffect(() => {
    calculateHOMAIR();
  }, [metricValues['glu'], metricValues['fasting_insulin']]);

  // 验证输入数据
  const validateInputs = () => {
    const filledMetrics = Object.entries(metricValues).filter(([_, value]) => value.trim());

    if (filledMetrics.length === 0) {
      Alert.alert('提示', '请至少输入一项检测指标');
      return false;
    }

    // 验证数值格式
    for (const [key, value] of filledMetrics) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        const metric = GLUCOSE_METRICS.find(m => m.key === key);
        Alert.alert('输入错误', `${metric?.name}的输入值格式不正确`);
        return false;
      }
    }

    return true;
  };

  // 开始分析
  const handleStartAnalysis = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // 获取用户性别信息
      const userGender = await getUserGender();

      // 构建分析请求
      const metrics = Object.entries(metricValues)
        .filter(([_, value]) => value.trim())
        .map(([key, value]) => ({
          name: key,
          value: parseFloat(value),
          unit: GLUCOSE_METRICS.find(m => m.key === key)?.unit || ''
        }));

      const analysisResult = await analyzeLabResults(metrics, userGender, 'glucose_metabolism');

      if (analysisResult.success) {
        onAnalysisComplete(analysisResult, metricValues);
      } else {
        Alert.alert('分析失败', analysisResult.message || '未知错误');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('分析失败', '网络连接异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 清空所有输入
  const handleClear = () => {
    setMetricValues({});
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>血糖代谢检测</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 说明卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="water-outline" size={24} color="#DC2626" />
            <Text style={styles.infoTitle}>血糖代谢5项检测</Text>
          </View>
          <Text style={styles.infoDescription}>
            包含空腹血糖、糖化血红蛋白、胰岛素等关键血糖指标，用于糖尿病风险评估。
          </Text>
        </View>

        {/* 健康知识卡片 */}
        <View style={styles.knowledgeCard}>
          <View style={styles.knowledgeHeader}>
            <Ionicons name="bulb-outline" size={24} color="#DC2626" />
            <Text style={styles.knowledgeTitle}>血糖健康小知识</Text>
          </View>
          <Text style={styles.knowledgeText}>
            • 空腹血糖正常值为3.9-6.1 mmol/L，超过7.0 mmol/L可诊断为糖尿病{'\n'}
            • 糖化血红蛋白反映近2-3个月的平均血糖水平，是糖尿病控制的重要指标{'\n'}
            • HOMA-IR是评估胰岛素抵抗的指标，数值越高说明胰岛素抵抗越严重
          </Text>
        </View>

        {/* 指标输入网格 */}
        <View style={styles.metricsGrid}>
          {GLUCOSE_METRICS.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name={metric.icon}
                  size={16}
                  color="#DC2626"
                />
                <Text style={styles.metricName}>{metric.name}</Text>
              </View>
              <Text style={styles.metricUnit}>{metric.unit}</Text>
              <TextInput
                style={[
                  styles.metricInput,
                  metric.key === 'homa_ir' ? styles.metricInputDisabled : null
                ]}
                placeholder={metric.key === 'homa_ir' ? "自动计算" : "0.0"}
                value={metricValues[metric.key] || ''}
                onChangeText={(value) => handleValueChange(metric.key, value)}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                editable={metric.key !== 'homa_ir'}
              />
              {metric.key === 'homa_ir' && metricValues['glu'] && metricValues['fasting_insulin'] && (
                <Text style={styles.calculationHint}>
                  * 自动计算: (血糖×胰岛素)÷22.5
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* 分析按钮 */}
        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
          onPress={handleStartAnalysis}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>分析血糖结果</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  knowledgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  knowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  knowledgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  knowledgeText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  metricUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  metricInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  metricInputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    color: '#6B7280',
  },
  calculationHint: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  analyzeButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});