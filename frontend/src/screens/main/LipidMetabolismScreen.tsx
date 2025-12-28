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

interface LipidMetabolismScreenProps {
  onBack: () => void;
  onAnalysisComplete: (results: any, values: {[key: string]: string}) => void;
}

// 血脂代谢7项指标
const LIPID_METRICS = [
  { key: 'tc', name: '总胆固醇', unit: 'mmol/L', placeholder: '3.9-6.2', icon: 'water-outline' },
  { key: 'tg', name: '甘油三酯', unit: 'mmol/L', placeholder: '0.4-1.8', icon: 'water-outline' },
  { key: 'hdl_c', name: '高密度脂蛋白胆固醇', unit: 'mmol/L', placeholder: '0.9-2.0', icon: 'water-outline' },
  { key: 'ldl_c', name: '低密度脂蛋白胆固醇', unit: 'mmol/L', placeholder: '1.8-3.4', icon: 'water-outline' },
  { key: 'vldl_c', name: '极低密度脂蛋白胆固醇', unit: 'mmol/L', placeholder: '0.2-1.0', icon: 'water-outline' },
  { key: 'apolipoprotein_a', name: '载脂蛋白A1', unit: 'g/L', placeholder: '1.0-1.6', icon: 'water-outline' },
  { key: 'apolipoprotein_b', name: '载脂蛋白B', unit: 'g/L', placeholder: '0.6-1.2', icon: 'water-outline' },
];

export default function LipidMetabolismScreen({ onBack, onAnalysisComplete }: LipidMetabolismScreenProps) {
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
        const metric = LIPID_METRICS.find(m => m.key === key);
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
          unit: LIPID_METRICS.find(m => m.key === key)?.unit || ''
        }));

      const analysisResult = await analyzeLabResults(metrics, userGender, 'lipid_metabolism');

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
        <Text style={styles.title}>血脂代谢检测</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 说明卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="heart-outline" size={24} color="#059669" />
            <Text style={styles.infoTitle}>血脂代谢7项检测</Text>
          </View>
          <Text style={styles.infoDescription}>
            包含总胆固醇、甘油三酯、高/低密度脂蛋白等关键血脂指标，用于评估心血管疾病风险。
          </Text>
        </View>

        {/* 健康知识卡片 */}
        <View style={styles.knowledgeCard}>
          <View style={styles.knowledgeHeader}>
            <Ionicons name="bulb-outline" size={24} color="#059669" />
            <Text style={styles.knowledgeTitle}>血脂健康小知识</Text>
          </View>
          <Text style={styles.knowledgeText}>
            • 低密度脂蛋白(LDL-C)被称为"坏胆固醇"，是动脉粥样硬化的主要危险因素{'\n'}
            • 高密度脂蛋白(HDL-C)被称为"好胆固醇"，有助于清除血管内多余的胆固醇{'\n'}
            • 总胆固醇/高密度脂蛋白比值是评估心血管风险的重要指标
          </Text>
        </View>

        {/* 指标输入网格 */}
        <View style={styles.metricsGrid}>
          {LIPID_METRICS.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name={metric.icon}
                  size={16}
                  color="#059669"
                />
                <Text style={styles.metricName}>{metric.name}</Text>
              </View>
              <Text style={styles.metricUnit}>{metric.unit}</Text>
              <TextInput
                style={styles.metricInput}
                placeholder="0.0"
                value={metricValues[metric.key] || ''}
                onChangeText={(value) => handleValueChange(metric.key, value)}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
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
              <Text style={styles.analyzeButtonText}>分析血脂结果</Text>
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
    backgroundColor: '#059669',
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
    borderLeftColor: '#059669',
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
  analyzeButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#059669',
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