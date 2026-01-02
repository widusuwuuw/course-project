import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPost } from '../../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

// 类型定义
interface DailyStats {
  date: string;
  diet: {
    planned_calories: number;
    actual_calories: number;
    adherence_score: number;
    meals_recorded: number;
    meals_planned: number;
  };
  exercise: {
    planned_duration: number;
    actual_duration: number;
    planned_calories: number;
    actual_calories: number;
    adherence_score: number;
    courses_completed: number;
  };
}

interface WeeklyStats {
  week_start: string;
  week_end: string;
  daily_stats: DailyStats[];
  summary: {
    diet: {
      avg_adherence: number;
      total_planned_calories: number;
      total_actual_calories: number;
      total_meals_recorded: number;
    };
    exercise: {
      avg_adherence: number;
      total_planned_duration: number;
      total_actual_duration: number;
      total_planned_calories: number;
      total_actual_calories: number;
      total_courses_completed: number;
    };
  };
}

export default function StatsComparisonScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'diet' | 'exercise'>('diet');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  
  // AI分析相关状态
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiAnalysisType, setAiAnalysisType] = useState<'diet' | 'exercise' | 'comprehensive'>('diet');

  const loadWeeklyStats = useCallback(async () => {
    try {
      const response = await apiGet('/logs/stats/weekly');
      if (response.data) {
        setWeeklyStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWeeklyStats();
  }, [loadWeeklyStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeeklyStats();
  }, [loadWeeklyStats]);

  // AI分析功能
  const handleAIAnalysis = async (type: 'diet' | 'exercise' | 'comprehensive') => {
    setAiAnalysisType(type);
    setAiAnalyzing(true);
    setShowAIAnalysisModal(true);
    setAiAnalysisResult(null);
    
    try {
      const response = await apiPost('/logs/stats/ai-analysis', { analysis_type: type });
      if (response.data && response.data.ai_analysis) {
        setAiAnalysisResult(response.data.ai_analysis);
      } else {
        setAiAnalysisResult('分析失败，请稍后重试');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysisResult('分析失败，请检查网络连接后重试');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // 获取星期几的中文名
  const getDayName = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  // 计算柱状图高度（最大100px）
  const getBarHeight = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return Math.min((value / maxValue) * 100, 100);
  };

  // 渲染柱状图
  const renderBarChart = (
    data: { planned: number; actual: number; label: string }[],
    unit: string,
    colors: { planned: string; actual: string }
  ) => {
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.planned, d.actual)),
      1
    );

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barPair}>
                {/* 计划柱 */}
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.plannedBar,
                      {
                        height: getBarHeight(item.planned, maxValue),
                        backgroundColor: colors.planned,
                      },
                    ]}
                  />
                </View>
                {/* 实际柱 */}
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.actualBar,
                      {
                        height: getBarHeight(item.actual, maxValue),
                        backgroundColor: colors.actual,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        
        {/* 图例 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.planned }]} />
            <Text style={styles.legendText}>计划</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.actual }]} />
            <Text style={styles.legendText}>实际</Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染依从性环形进度
  const renderAdherenceRing = (score: number, label: string, color: string) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference * (1 - score / 100);

    return (
      <View style={styles.adherenceRing}>
        <View style={styles.ringContainer}>
          <View style={styles.ringBackground} />
          <View style={[styles.ringProgress, { borderColor: color }]}>
            <Text style={[styles.ringScore, { color }]}>{Math.round(score)}%</Text>
          </View>
        </View>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    );
  };

  // 渲染饮食统计
  const renderDietStats = () => {
    if (!weeklyStats) return null;

    const { daily_stats, summary } = weeklyStats;
    
    // 准备热量柱状图数据
    const caloriesData = daily_stats.map(d => ({
      planned: d.diet.planned_calories,
      actual: d.diet.actual_calories,
      label: getDayName(d.date),
    }));

    return (
      <View style={styles.statsContent}>
        {/* 周总结卡片 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>本周饮食总结</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round(summary.diet.total_actual_calories)}
              </Text>
              <Text style={styles.summaryLabel}>实际摄入(千卡)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round(summary.diet.total_planned_calories)}
              </Text>
              <Text style={styles.summaryLabel}>计划摄入(千卡)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {summary.diet.total_meals_recorded}
              </Text>
              <Text style={styles.summaryLabel}>已记录餐次</Text>
            </View>
          </View>
        </View>

        {/* 依从性展示 */}
        <View style={styles.adherenceSection}>
          <Text style={styles.sectionTitle}>饮食依从性</Text>
          <View style={styles.adherenceRings}>
            {renderAdherenceRing(
              summary.diet.avg_adherence,
              '平均依从率',
              '#22C55E'
            )}
          </View>
        </View>

        {/* 热量对比图表 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>每日热量对比</Text>
          {renderBarChart(caloriesData, '千卡', {
            planned: '#94A3B8',
            actual: '#F97316',
          })}
        </View>

        {/* 每日详情列表 */}
        <View style={styles.dailySection}>
          <Text style={styles.sectionTitle}>每日详情</Text>
          {daily_stats.map((day, index) => (
            <View key={index} style={styles.dailyCard}>
              <View style={styles.dailyHeader}>
                <Text style={styles.dailyDate}>
                  {getDayName(day.date)} · {day.date.slice(5)}
                </Text>
                <View
                  style={[
                    styles.dailyBadge,
                    {
                      backgroundColor:
                        day.diet.adherence_score >= 80
                          ? '#DCFCE7'
                          : day.diet.adherence_score >= 60
                          ? '#FEF3C7'
                          : '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dailyBadgeText,
                      {
                        color:
                          day.diet.adherence_score >= 80
                            ? '#22C55E'
                            : day.diet.adherence_score >= 60
                            ? '#F59E0B'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {Math.round(day.diet.adherence_score)}%
                  </Text>
                </View>
              </View>
              <View style={styles.dailyStats}>
                <View style={styles.dailyStat}>
                  <Ionicons name="flame-outline" size={16} color="#F97316" />
                  <Text style={styles.dailyStatText}>
                    实际 {day.diet.actual_calories} / 计划 {day.diet.planned_calories} 千卡
                  </Text>
                </View>
                <View style={styles.dailyStat}>
                  <Ionicons name="restaurant-outline" size={16} color="#4ABAB8" />
                  <Text style={styles.dailyStatText}>
                    已记录 {day.diet.meals_recorded} / {day.diet.meals_planned} 餐
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* AI分析按钮 */}
        <TouchableOpacity
          style={styles.aiAnalysisButton}
          onPress={() => handleAIAnalysis('diet')}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.aiButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.aiButtonText}>分析我的饮食状况</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染运动统计
  const renderExerciseStats = () => {
    if (!weeklyStats) return null;

    const { daily_stats, summary } = weeklyStats;

    // 准备时长柱状图数据
    const durationData = daily_stats.map(d => ({
      planned: d.exercise.planned_duration,
      actual: d.exercise.actual_duration,
      label: getDayName(d.date),
    }));

    // 准备消耗热量柱状图数据
    const caloriesData = daily_stats.map(d => ({
      planned: d.exercise.planned_calories,
      actual: d.exercise.actual_calories,
      label: getDayName(d.date),
    }));

    return (
      <View style={styles.statsContent}>
        {/* 周总结卡片 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>本周运动总结</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {summary.exercise.total_actual_duration}
              </Text>
              <Text style={styles.summaryLabel}>实际时长(分钟)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {summary.exercise.total_actual_calories}
              </Text>
              <Text style={styles.summaryLabel}>消耗热量(千卡)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {summary.exercise.total_courses_completed}
              </Text>
              <Text style={styles.summaryLabel}>完成课程</Text>
            </View>
          </View>
        </View>

        {/* 依从性展示 */}
        <View style={styles.adherenceSection}>
          <Text style={styles.sectionTitle}>运动依从性</Text>
          <View style={styles.adherenceRings}>
            {renderAdherenceRing(
              summary.exercise.avg_adherence,
              '平均依从率',
              '#4ABAB8'
            )}
          </View>
        </View>

        {/* 运动时长对比图表 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>每日运动时长对比</Text>
          {renderBarChart(durationData, '分钟', {
            planned: '#94A3B8',
            actual: '#4ABAB8',
          })}
        </View>

        {/* 热量消耗对比图表 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>每日热量消耗对比</Text>
          {renderBarChart(caloriesData, '千卡', {
            planned: '#94A3B8',
            actual: '#EF4444',
          })}
        </View>

        {/* 每日详情列表 */}
        <View style={styles.dailySection}>
          <Text style={styles.sectionTitle}>每日详情</Text>
          {daily_stats.map((day, index) => (
            <View key={index} style={styles.dailyCard}>
              <View style={styles.dailyHeader}>
                <Text style={styles.dailyDate}>
                  {getDayName(day.date)} · {day.date.slice(5)}
                </Text>
                <View
                  style={[
                    styles.dailyBadge,
                    {
                      backgroundColor:
                        day.exercise.adherence_score >= 80
                          ? '#DCFCE7'
                          : day.exercise.adherence_score >= 60
                          ? '#FEF3C7'
                          : '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dailyBadgeText,
                      {
                        color:
                          day.exercise.adherence_score >= 80
                            ? '#22C55E'
                            : day.exercise.adherence_score >= 60
                            ? '#F59E0B'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {Math.round(day.exercise.adherence_score)}%
                  </Text>
                </View>
              </View>
              <View style={styles.dailyStats}>
                <View style={styles.dailyStat}>
                  <Ionicons name="time-outline" size={16} color="#4ABAB8" />
                  <Text style={styles.dailyStatText}>
                    实际 {day.exercise.actual_duration} / 计划 {day.exercise.planned_duration} 分钟
                  </Text>
                </View>
                <View style={styles.dailyStat}>
                  <Ionicons name="flame-outline" size={16} color="#EF4444" />
                  <Text style={styles.dailyStatText}>
                    消耗 {day.exercise.actual_calories} 千卡
                  </Text>
                </View>
                <View style={styles.dailyStat}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#22C55E" />
                  <Text style={styles.dailyStatText}>
                    完成 {day.exercise.courses_completed} 节课程
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* AI分析按钮 */}
        <TouchableOpacity
          style={styles.aiAnalysisButton}
          onPress={() => handleAIAnalysis('exercise')}
        >
          <LinearGradient
            colors={['#4ABAB8', '#2DD4BF']}
            style={styles.aiButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.aiButtonText}>分析我的运动数据</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#4ABAB8', '#2DD4BF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>执行统计</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tab切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diet' && styles.tabActive]}
            onPress={() => setActiveTab('diet')}
          >
            <Ionicons
              name="restaurant"
              size={18}
              color={activeTab === 'diet' ? '#4ABAB8' : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'diet' && styles.tabTextActive,
              ]}
            >
              饮食统计
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'exercise' && styles.tabActive]}
            onPress={() => setActiveTab('exercise')}
          >
            <Ionicons
              name="fitness"
              size={18}
              color={activeTab === 'exercise' ? '#4ABAB8' : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'exercise' && styles.tabTextActive,
              ]}
            >
              运动统计
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ABAB8" />
          <Text style={styles.loadingText}>加载统计数据...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4ABAB8"
            />
          }
        >
          {activeTab === 'diet' ? renderDietStats() : renderExerciseStats()}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* AI分析结果Modal */}
      <Modal
        visible={showAIAnalysisModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalContent}>
            <LinearGradient
              colors={aiAnalysisType === 'diet' ? ['#22C55E', '#16A34A'] : ['#4ABAB8', '#2DD4BF']}
              style={styles.aiModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.aiModalTitleRow}>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                <Text style={styles.aiModalTitle}>
                  {aiAnalysisType === 'diet' ? '饮食分析报告' : '运动分析报告'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAIAnalysisModal(false)}
                style={styles.aiModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView 
              style={styles.aiModalBody}
              showsVerticalScrollIndicator={false}
            >
              {aiAnalyzing ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="large" color="#4ABAB8" />
                  <Text style={styles.aiLoadingText}>AI正在分析您的数据...</Text>
                  <Text style={styles.aiLoadingSubtext}>请稍等片刻</Text>
                </View>
              ) : (
                <Text style={styles.aiResultText}>{aiAnalysisResult}</Text>
              )}
            </ScrollView>

            {!aiAnalyzing && (
              <TouchableOpacity
                style={styles.aiModalActionButton}
                onPress={() => setShowAIAnalysisModal(false)}
              >
                <Text style={styles.aiModalActionButtonText}>我知道了</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },

  headerGradient: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },

  tabActive: {
    backgroundColor: '#FFFFFF',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  tabTextActive: {
    color: '#4ABAB8',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },

  scrollView: {
    flex: 1,
  },

  statsContent: {
    padding: 16,
  },

  // 周总结卡片
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4ABAB8',
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // 依从性部分
  adherenceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },

  adherenceRings: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  adherenceRing: {
    alignItems: 'center',
  },

  ringContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ringBackground: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#F3F4F6',
  },

  ringProgress: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ringScore: {
    fontSize: 24,
    fontWeight: '800',
  },

  ringLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  // 图表部分
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  chartContainer: {
    alignItems: 'center',
  },

  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 120,
    paddingBottom: 24,
  },

  barGroup: {
    alignItems: 'center',
    flex: 1,
  },

  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 100,
  },

  barWrapper: {
    justifyContent: 'flex-end',
    height: 100,
  },

  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },

  plannedBar: {
    opacity: 0.5,
  },

  actualBar: {},

  barLabel: {
    marginTop: 8,
    fontSize: 11,
    color: '#6B7280',
    position: 'absolute',
    bottom: 0,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // 每日详情
  dailySection: {
    marginTop: 8,
  },

  dailyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  dailyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },

  dailyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  dailyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  dailyStats: {
    gap: 6,
  },

  dailyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  dailyStatText: {
    fontSize: 13,
    color: '#4B5563',
  },

  // AI分析按钮样式
  aiAnalysisButton: {
    marginTop: 20,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },

  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // AI Modal 样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  aiModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },

  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  aiModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  aiModalCloseButton: {
    padding: 4,
  },

  aiModalBody: {
    padding: 20,
    maxHeight: 400,
  },

  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  aiLoadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },

  aiLoadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },

  aiResultText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },

  aiModalActionButton: {
    backgroundColor: '#4ABAB8',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  aiModalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});