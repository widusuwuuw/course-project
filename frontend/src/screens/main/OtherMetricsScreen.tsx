import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvailableLabMetrics, analyzeLabResults, getUserGender } from '../../api/client';
import { MetricInfo } from '../../types/health';

const { width: screenWidth } = Dimensions.get('window');

// 其他指标列表（不属于血常规和肝功能的其他指标）- 使用后端返回的完整英文名称
const OTHER_METRICS = [
  'Uric Acid'
];

interface OtherMetricsScreenProps {
  onBack: () => void;
  onAnalysisComplete: (results: any, values: {[key: string]: string}) => void;
}

export default function OtherMetricsScreen({ onBack, onAnalysisComplete }: OtherMetricsScreenProps) {
  const [availableMetrics, setAvailableMetrics] = useState<MetricInfo[]>([]);
  const [metricValues, setMetricValues] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const metrics = await getAvailableLabMetrics();
        const otherMetrics = metrics.filter(metric =>
          OTHER_METRICS.includes(metric.name_en)
        );
        setAvailableMetrics(otherMetrics);
      } catch (error) {
        console.error('Failed to load metrics:', error);
        Alert.alert('错误', '加载指标信息失败');
      } finally {
        setLoadingMetrics(false);
      }
    };
    loadMetrics();
  }, []);

  const updateMetricValue = (metricName: string, value: string) => {
    setMetricValues(prev => ({
      ...prev,
      [metricName]: value
    }));
  };

  const getMetricIcon = (metricName: string): string => {
    const iconMap: {[key: string]: string} = {
      'Uric Acid': 'flask-outline'
    };
    return iconMap[metricName] || 'analytics-outline';
  };

  const handleAnalyze = async () => {
    // 检查是否有输入的数值
    const filledMetrics = Object.entries(metricValues).filter(([_, value]) => value.trim() !== '');

    console.log('🔍 Other Metrics Input:', metricValues);
    console.log('✅ Other Metrics Filled:', filledMetrics);

    if (filledMetrics.length === 0) {
      Alert.alert('提示', '请至少输入一项检测数值后再进行分析');
      return;
    }

    setLoading(true);
    try {
      // 获取用户性别信息
      const userGender = await getUserGender();

      // 映射完整英文名称到后端期望的短代码
      const nameToCodeMap: {[key: string]: string} = {
        'Uric Acid': 'uric_acid'
      };

      // 构建分析请求，使用后端期望的短代码
      const metrics = filledMetrics.map(([name, value]) => ({
        name: nameToCodeMap[name] || name, // 转换为短代码
        value: parseFloat(value),
        unit: availableMetrics.find(m => m.name_en === name)?.unit || ''
      }));

      console.log('📊 Other Metrics Sending for analysis:', metrics);

      const results = await analyzeLabResults(metrics, userGender);
      console.log('📈 Other Metrics Analysis results:', results);

      onAnalysisComplete(results, metricValues);
    } catch (error) {
      console.error('❌ Other Metrics Analysis failed:', error);
      Alert.alert('分析失败', `分析过程中出现错误：${error?.message || '请检查网络连接或稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingMetrics) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>其他指标检测</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>加载检测指标中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>其他指标检测</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 说明卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="flask-outline" size={24} color="#8B5CF6" />
            <Text style={styles.infoTitle}>其他重要检测</Text>
          </View>
          <Text style={styles.infoDescription}>
            包含尿酸等其他重要健康指标，用于综合评估身体健康状况。
          </Text>
        </View>

        {/* 指标输入网格 */}
        <View style={styles.metricsGrid}>
          {availableMetrics.map((metric) => (
            <View key={metric.name_en} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name={getMetricIcon(metric.name_en)}
                  size={16}
                  color="#8B5CF6"
                />
                <Text style={styles.metricName}>{metric.name}</Text>
              </View>
              <Text style={styles.metricUnit}>{metric.unit}</Text>
              <TextInput
                style={styles.metricInput}
                placeholder="0.0"
                value={metricValues[metric.name_en] || ''}
                onChangeText={(value) => updateMetricValue(metric.name_en, value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}
        </View>

        {/* 如果没有其他指标，显示提示 */}
        {availableMetrics.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="flask-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>暂无其他指标</Text>
            <Text style={styles.emptyDescription}>
              目前只有血常规和肝功能检测项目
            </Text>
          </View>
        )}

        {/* 分析按钮 */}
        {availableMetrics.length > 0 && (
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>分析检测结果</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
    backgroundColor: '#8B5CF6',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
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