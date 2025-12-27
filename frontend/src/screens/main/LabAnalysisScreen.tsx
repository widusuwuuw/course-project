import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvailableLabMetrics, getUserLabReports, generateAIBodyReport } from '../../api/client';
import BloodRoutineScreen from './BloodRoutineScreen';
import LiverFunctionScreen from './LiverFunctionScreen';
import KidneyFunctionScreen from './KidneyFunctionScreen';
import LipidMetabolismScreen from './LipidMetabolismScreen';
import GlucoseMetabolismScreen from './GlucoseMetabolismScreen';
import ElectrolyteScreen from './ElectrolyteScreen';

const { width: screenWidth } = Dimensions.get('window');

interface MetricInfo {
  name: string;
  name_en: string;
  unit: string;
  description: string;
  normal_range?: [number, number];
}

interface AnalysisResult {
  metric_name: string;
  value: number;
  unit: string;
  status: 'normal' | 'abnormal';
  risk_level: string;
  message: string;
  recommendations: string[];
}

interface AnalysisResponse {
  success: boolean;
  message: string;
  data: {
    overall_assessment: {
      overall_status: string;
      overall_risk_level: string;
      summary: string;
      total_metrics: number;
      normal_metrics: number;
      abnormal_metrics: number;
    };
    individual_results: AnalysisResult[];
    abnormal_metrics: AnalysisResult[];
    all_recommendations: string[];
  };
}

type ScreenType = 'main' | 'blood-routine' | 'liver-function' | 'kidney-function' | 'lipid-metabolism' | 'glucose-metabolism' | 'electrolyte' | 'results' | 'ai-report';

export default function LabAnalysisScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // 状态管理
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main');
  const [availableMetrics, setAvailableMetrics] = useState<MetricInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [currentMetricValues, setCurrentMetricValues] = useState<{[key: string]: string}>({});
  const [aiReport, setAiReport] = useState<string>('');
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // 获取可用指标列表
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metrics = await getAvailableLabMetrics();
        setAvailableMetrics(metrics);
      } catch (error) {
        console.error('Failed to load metrics:', error);
        Alert.alert('错误', '无法加载检测指标列表，请重试');
      } finally {
        setMetricsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  // 处理分析完成
  const handleAnalysisComplete = (results: AnalysisResponse, values: {[key: string]: string}) => {
    setAnalysisResult(results);
    setCurrentMetricValues(values);
    setCurrentScreen('results');
  };

  // 返回主界面
  const handleBackToMain = () => {
    setCurrentScreen('main');
    setAnalysisResult(null);
    setCurrentMetricValues({});
  };

  // 返回上一级
  const handleBack = () => {
    if (currentScreen === 'results') {
      handleBackToMain();
    } else if (currentScreen === 'ai-report') {
      setCurrentScreen('main');
    } else {
      setCurrentScreen('main');
    }
  };

  // 生成AI体质报告
  const handleGenerateAIReport = async () => {
    try {
      setAiReportLoading(true);

      const response = await generateAIBodyReport(30); // 分析最近30天的数据

      if (response.success) {
        setAiReport(response.ai_report);
        setCurrentScreen('ai-report');
      } else {
        Alert.alert('生成失败', '无法生成AI体质报告，请先完成相关检测');
      }
    } catch (error) {
      console.error('生成AI报告失败:', error);
      Alert.alert('生成失败', `生成AI体质报告失败: ${error?.message || '请检查网络连接或稍后重试'}`);
    } finally {
      setAiReportLoading(false);
    }
  };

  // 渲染主界面
  const renderMainScreen = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>体检分析</Text>
        <Text style={styles.subtitle}>选择检测类别开始分析</Text>
      </View>

      {/* 分类卡片 */}
      <View style={styles.categoriesContainer}>
        {/* 血常规检测卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#4ABAB8' }]}
          onPress={() => setCurrentScreen('blood-routine')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="color-filter-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>血常规检测</Text>
              <Text style={styles.cardSubtitle}>11项基础血液检测</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              白细胞、红细胞、血红蛋白、血小板等关键血液指标分析
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>11项指标</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 肝功能检测卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#EF4444' }]}
          onPress={() => setCurrentScreen('liver-function')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="pulse-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>肝功能检测</Text>
              <Text style={styles.cardSubtitle}>9项肝功能检测</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              转氨酶、胆红素、蛋白质等肝功能指标全面评估
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>9项指标</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 肾功能检测卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#A855F7' }]}
          onPress={() => setCurrentScreen('kidney-function')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="water-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>肾功能检测</Text>
              <Text style={styles.cardSubtitle}>8项肾功能指标</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              肌酐、尿素氮、肾小球滤过率等关键肾功能指标全面评估
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>8项指标</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 血脂代谢检测卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#059669' }]}
          onPress={() => setCurrentScreen('lipid-metabolism')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>血脂代谢检测</Text>
              <Text style={styles.cardSubtitle}>7项血脂指标</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              总胆固醇、甘油三酯、高/低密度脂蛋白等心血管健康关键指标评估
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>7项指标</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 血糖代谢检测卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#DC2626' }]}
          onPress={() => setCurrentScreen('glucose-metabolism')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="cube-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>血糖代谢检测</Text>
              <Text style={styles.cardSubtitle}>5项血糖指标</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              空腹血糖、糖化血红蛋白、胰岛素等糖尿病风险评估重要指标检测
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>5项指标</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 电解质检测卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#7C3AED' }]}
          onPress={() => setCurrentScreen('electrolyte')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="flash-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>电解质检测</Text>
              <Text style={styles.cardSubtitle}>6项电解质指标</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              钠、钾、钙、镁等6项关键离子检测，评估体内水电解质平衡状况
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>6项指标</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* AI体质报告卡片 */}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: '#8B5CF6' }]}
          onPress={handleGenerateAIReport}
          disabled={aiReportLoading}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              {aiReportLoading ? (
                <ActivityIndicator size={32} color="#FFFFFF" />
              ) : (
                <Ionicons name="sparkles-outline" size={32} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>
                {aiReportLoading ? '生成中...' : 'AI体质报告'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {aiReportLoading ? '正在分析您的健康数据' : '智能生成个性化体质分析'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.descriptionText}>
              基于您的全部检测数据，AI将为您生成个性化的体质分析报告，包含健康风险评估和针对性建议
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metricCount}>
              <Ionicons name="medical-outline" size={16} color="#FFFFFF" />
              <Text style={styles.metricCountText}>综合分析</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 总计信息 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="information-circle-outline" size={24} color="#4ABAB8" />
          <Text style={styles.summaryTitle}>检测总览</Text>
        </View>
        <Text style={styles.summaryText}>
          系统共支持<Text style={{fontWeight: 'bold'}}>47</Text>项医学检测指标分析，
          涵盖血液常规、肝功能、肾功能、血脂代谢、血糖代谢、电解质等七大健康模块。
        </Text>
      </View>
    </ScrollView>
  );

  // 渲染结果界面
  const renderResultsScreen = () => {
    if (!analysisResult) return null;

    const { overall_assessment, individual_results, abnormal_metrics, all_recommendations } = analysisResult.data;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 结果头部 */}
        <View style={styles.resultsHeader}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: overall_assessment.overall_status === 'healthy' ? '#10B981' : '#F59E0B' }
            ]}>
              <Ionicons
                name={overall_assessment.overall_status === 'healthy' ? 'checkmark-circle' : 'alert-circle'}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.statusText}>
              {overall_assessment.overall_status === 'healthy' ? '整体健康' : '需要关注'}
            </Text>
          </View>
          <Text style={styles.summaryText}>{overall_assessment.summary}</Text>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overall_assessment.total_metrics}</Text>
            <Text style={styles.statLabel}>检测项目</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overall_assessment.normal_metrics}</Text>
            <Text style={styles.statLabel}>正常指标</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
              {overall_assessment.abnormal_metrics}
            </Text>
            <Text style={styles.statLabel}>异常指标</Text>
          </View>
        </View>

        {/* 检测结果详情 */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>检测结果详情</Text>
          {individual_results.map((result, index) => (
            <View key={index} style={[
              styles.resultItem,
              { borderLeftColor: result.status === 'normal' ? '#10B981' : '#EF4444' }
            ]}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultMetricName}>{result.metric_name}</Text>
                <Text style={[
                  styles.resultValue,
                  { color: result.status === 'normal' ? '#10B981' : '#EF4444' }
                ]}>
                  {result.value} {result.unit}
                </Text>
              </View>
              <Text style={styles.resultStatus}>{result.message}</Text>
            </View>
          ))}
        </View>

        {/* 健康建议 */}
        {all_recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>健康建议</Text>
            {all_recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4ABAB8" />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 返回按钮 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToMain}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>返回首页</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // 渲染AI报告界面
  const renderAIReportScreen = () => (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { backgroundColor: '#8B5CF6' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>AI体质报告</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI报告内容 */}
        <View style={styles.aiReportContainer}>
          <View style={styles.aiReportHeader}>
            <Ionicons name="sparkles-outline" size={28} color="#8B5CF6" />
            <Text style={styles.aiReportTitle}>智能体质分析报告</Text>
          </View>

          {aiReportLoading ? (
            <View style={styles.aiReportLoadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.aiReportLoadingText}>AI正在分析您的健康数据...</Text>
              <Text style={styles.aiReportSubText}>这可能需要几秒钟，请耐心等待</Text>
            </View>
          ) : (
            <View style={styles.aiReportContent}>
              {aiReport.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('###')) {
                  return (
                    <Text key={index} style={styles.aiReportH3}>
                      {paragraph.replace('###', '').trim()}
                    </Text>
                  );
                } else if (paragraph.startsWith('##')) {
                  return (
                    <Text key={index} style={styles.aiReportH2}>
                      {paragraph.replace('##', '').trim()}
                    </Text>
                  );
                } else if (paragraph.startsWith('#')) {
                  return (
                    <Text key={index} style={styles.aiReportH1}>
                      {paragraph.replace('#', '').trim()}
                    </Text>
                  );
                } else if (paragraph.trim().startsWith('-')) {
                  return (
                    <View key={index} style={styles.aiReportListItem}>
                      <Text style={styles.aiReportBullet}>•</Text>
                      <Text style={styles.aiReportListItemText}>
                        {paragraph.trim().replace('-', '').trim()}
                      </Text>
                    </View>
                  );
                } else if (paragraph.trim()) {
                  return (
                    <Text key={index} style={styles.aiReportParagraph}>
                      {paragraph.trim()}
                    </Text>
                  );
                }
                return null;
              })}
            </View>
          )}
        </View>

        {/* 操作按钮 */}
        {!aiReportLoading && (
          <View style={styles.aiReportActions}>
            <TouchableOpacity
              style={[styles.aiReportButton, { backgroundColor: '#10B981' }]}
              onPress={() => {
                // TODO: 实现分享功能
                Alert.alert('提示', '分享功能即将上线');
              }}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.aiReportButtonText}>分享报告</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aiReportButton, { backgroundColor: '#4ABAB8' }]}
              onPress={handleBackToMain}
            >
              <Ionicons name="home-outline" size={20} color="#FFFFFF" />
              <Text style={styles.aiReportButtonText}>返回首页</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // 渲染加载界面
  if (metricsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ABAB8" />
        <Text style={styles.loadingText}>加载检测项目中...</Text>
      </View>
    );
  }

  // 根据当前屏幕渲染不同内容
  switch (currentScreen) {
    case 'blood-routine':
      return (
        <BloodRoutineScreen
          onBack={handleBack}
          onAnalysisComplete={handleAnalysisComplete}
        />
      );
    case 'liver-function':
      return (
        <LiverFunctionScreen
          onBack={handleBack}
          onAnalysisComplete={handleAnalysisComplete}
        />
      );
    case 'kidney-function':
      return (
        <KidneyFunctionScreen
          onBack={handleBack}
          onAnalysisComplete={handleAnalysisComplete}
        />
      );
    case 'lipid-metabolism':
      return (
        <LipidMetabolismScreen
          onBack={handleBack}
          onAnalysisComplete={handleAnalysisComplete}
        />
      );
    case 'glucose-metabolism':
      return (
        <GlucoseMetabolismScreen
          onBack={handleBack}
          onAnalysisComplete={handleAnalysisComplete}
        />
      );
    case 'electrolyte':
      return (
        <ElectrolyteScreen
          onBack={handleBack}
          onAnalysisComplete={handleAnalysisComplete}
        />
      );
    case 'results':
      return renderResultsScreen();
    case 'ai-report':
      return renderAIReportScreen();
    default:
      return renderMainScreen();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardDescription: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  metricCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metricCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // 结果界面样式
  resultsHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  resultItem: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultMetricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultStatus: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  recommendationsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#4ABAB8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#4ABAB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // AI报告相关样式
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  aiReportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  aiReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  aiReportTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  aiReportLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  aiReportLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 16,
    marginBottom: 8,
  },
  aiReportSubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  aiReportContent: {
    gap: 16,
  },
  aiReportH1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  aiReportH2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 6,
  },
  aiReportH3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 10,
    marginTop: 4,
  },
  aiReportParagraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'justify',
  },
  aiReportListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  aiReportBullet: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '700',
    marginTop: 4,
  },
  aiReportListItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  aiReportActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  aiReportButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiReportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});