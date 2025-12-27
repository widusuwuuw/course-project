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

interface ElectrolyteScreenProps {
  onBack: () => void;
  onAnalysisComplete: (results: any, values: {[key: string]: string}) => void;
}

// 电解质6项指标
const ELECTROLYTE_METRICS = [
  { key: 'na', name: '钠离子', unit: 'mmol/L', placeholder: '135-145', icon: 'water-outline' },
  { key: 'k', name: '钾离子', unit: 'mmol/L', placeholder: '3.5-5.5', icon: 'water-outline' },
  { key: 'cl', name: '氯离子', unit: 'mmol/L', placeholder: '98-106', icon: 'water-outline' },
  { key: 'ca', name: '钙离子', unit: 'mmol/L', placeholder: '2.1-2.8', icon: 'water-outline' },
  { key: 'p', name: '磷离子', unit: 'mmol/L', placeholder: '0.8-1.5', icon: 'water-outline' },
  { key: 'mg', name: '镁离子', unit: 'mmol/L', placeholder: '0.7-1.1', icon: 'water-outline' },
];

export default function ElectrolyteScreen({ onBack, onAnalysisComplete }: ElectrolyteScreenProps) {
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
        const metric = ELECTROLYTE_METRICS.find(m => m.key === key);
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
          unit: ELECTROLYTE_METRICS.find(m => m.key === key)?.unit || ''
        }));

      const analysisResult = await analyzeLabResults(metrics, userGender, 'electrolyte');

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
        <Text style={styles.title}>电解质检测</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 说明卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="water-outline" size={24} color="#7C3AED" />
            <Text style={styles.infoTitle}>电解质6项检测</Text>
          </View>
          <Text style={styles.infoDescription}>
            包含钠、钾、钙、镁等关键离子检测，用于评估体内水电解质平衡状况。
          </Text>
        </View>

        {/* 健康知识卡片 */}
        <View style={styles.knowledgeCard}>
          <View style={styles.knowledgeHeader}>
            <Ionicons name="bulb-outline" size={24} color="#7C3AED" />
            <Text style={styles.knowledgeTitle}>电解质平衡小知识</Text>
          </View>
          <Text style={styles.knowledgeText}>
            • 钠钾离子是维持神经肌肉功能的关键，钠钾失衡可导致心律失常{'\n'}
            • 钙离子不仅是骨骼成分，还参与血液凝固和肌肉收缩{'\n'}
            • 镁离子是多种酶的激活剂，缺乏时可能出现抽搐和心律不齐
          </Text>
        </View>

        {/* 指标输入网格 */}
        <View style={styles.metricsGrid}>
          {ELECTROLYTE_METRICS.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name={metric.icon}
                  size={16}
                  color="#7C3AED"
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
              <Text style={styles.analyzeButtonText}>分析电解质结果</Text>
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
    backgroundColor: '#7C3AED',
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
    borderLeftColor: '#7C3AED',
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
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#7C3AED',
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