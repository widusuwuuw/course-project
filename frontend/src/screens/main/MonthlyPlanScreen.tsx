/**
 * 月度计划页面
 * 
 * 展示AI生成的结构化月度健康计划
 * 采用卡片式布局，包括：
 * - 顶部AI总结（目标+注意事项）
 * - 运动计划卡片
 * - 饮食计划卡片
 * - 医学约束/禁忌卡片
 * - 四周主题列表
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { apiGet, apiPost, apiDelete } from '../../api/client';

// ========== 类型定义 ==========

interface TargetMetric {
  name: string;
  improvement_direction: string;
  priority: string;
}

interface MonthGoal {
  primary_target: string;
  target_metrics: TargetMetric[];
  success_criteria: string;
}

interface SelectedExercise {
  exercise_id: string;
  name: string;
  frequency_per_week: number;
  duration_minutes: number;
  best_time: string;
}

interface ExerciseFramework {
  weekly_frequency: number;
  intensity_range: string[];
  selected_exercises: SelectedExercise[];
  rest_days: string[];
  progression_note: string;
}

interface RecommendedFood {
  food_id: string;
  name: string;
  category: string;
  frequency: string;
  serving_suggestion: string;
}

interface DietFramework {
  principles: string[];
  recommended_foods: RecommendedFood[];
  meal_structure: {
    breakfast_ratio: number;
    lunch_ratio: number;
    dinner_ratio: number;
  };
  foods_to_avoid: string[];
  hydration_goal: string;
}

interface WeeklyTheme {
  week: number;
  theme: string;
  focus: string;
  exercise_intensity: string;
  diet_focus: string;
}

interface MedicalConstraints {
  forbidden_exercises: string[];
  forbidden_foods: string[];
  monitoring_reminders: string[];
}

interface MonthlyPlan {
  id: number;
  plan_month: string;
  plan_title: string;
  month_goal: MonthGoal;
  exercise_framework: ExerciseFramework;
  diet_framework: DietFramework;
  weekly_themes: WeeklyTheme[];
  medical_constraints: MedicalConstraints;
  ai_interpretation: string;
  generation_status: string;
  is_active: boolean;
  created_at: string;
}

// ========== 组件 ==========

export default function MonthlyPlanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  // 状态
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载当前月度计划
  const loadPlan = useCallback(async () => {
    try {
      setError(null);
      const response = await apiGet('/api/v1/plans/monthly/current');
      
      if (response.success && response.data) {
        setPlan(response.data);
      } else {
        setPlan(null);
        // 不设置错误，因为可能只是没有计划
      }
    } catch (err: any) {
      console.error('加载计划失败:', err);
      setPlan(null);
      // 401错误不显示，可能只是未登录
      if (!err.message?.includes('401')) {
        setError('加载计划失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlan();
  }, [loadPlan]);

  // 生成新计划
  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await apiPost('/api/v1/plans/monthly/generate', {});
      
      if (response.success && response.data) {
        setPlan(response.data);
        alert('月度计划已生成！');
      } else {
        alert(response.message || '请先提交体检数据');
      }
    } catch (err: any) {
      console.error('生成计划失败:', err);
      alert(err.message || '生成计划失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 重新生成计划
  const handleRegeneratePlan = async () => {
    console.log('点击重新生成按钮，当前plan:', plan);
    
    if (!plan?.id) {
      alert('未找到计划ID');
      return;
    }
    
    // 使用 confirm 代替 Alert.alert，兼容 Web 环境
    const confirmed = window.confirm('确定要重新生成月度计划吗？旧计划将被覆盖。');
    
    if (!confirmed) {
      console.log('用户取消重新生成');
      return;
    }
    
    try {
      console.log('开始重新生成计划，plan_id:', plan.id);
      setGenerating(true);
      setError(null);
      
      const response = await apiPost(`/api/v1/plans/monthly/${plan.id}/regenerate`, {});
      console.log('重新生成响应:', response);
      
      if (response.success && response.data) {
        console.log('重新生成成功，更新plan状态');
        setPlan(response.data);
        alert('计划已重新生成！');
      } else {
        console.log('重新生成失败，原因:', response.message);
        alert(response.message || '重新生成失败，可能需要先更新体检数据');
      }
    } catch (err: any) {
      console.error('重新生成出错:', err);
      alert(err.message || '重新生成失败，请检查网络连接');
    } finally {
      setGenerating(false);
    }
  };

  // ========== 渲染辅助组件 ==========

  // 卡片组件
  const Card = ({ title, icon, children, color = colors.primary }: {
    title: string;
    icon: string;
    children: React.ReactNode;
    color?: string;
  }) => (
    <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  // 标签组件
  const Tag = ({ text, type = 'default' }: { text: string; type?: 'default' | 'warning' | 'success' }) => {
    const bgColors = {
      default: colors.primary + '20',
      warning: '#FEF3C7',
      success: '#D1FAE5'
    };
    const textColors = {
      default: colors.primary,
      warning: '#92400E',
      success: '#065F46'
    };
    
    return (
      <View style={[styles.tag, { backgroundColor: bgColors[type] }]}>
        <Text style={[styles.tagText, { color: textColors[type] }]}>{text}</Text>
      </View>
    );
  };

  // 进度条组件
  const ProgressBar = ({ value, label, color = colors.primary }: {
    value: number;
    label: string;
    color?: string;
  }) => (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.progressValue, { color: colors.textSecondary }]}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${value * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  // ========== 空状态渲染 ==========

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>暂无月度计划</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        基于您的健康档案生成个性化的月度运动和饮食计划
      </Text>
      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: colors.primary }]}
        onPress={handleGeneratePlan}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>生成月度计划</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ========== 计划渲染 ==========

  const renderPlan = () => {
    if (!plan) return null;

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 顶部目标卡片 */}
        <Card title="🎯 本月目标" icon="flag" color="#3B82F6">
          <Text style={[styles.primaryTarget, { color: colors.text }]}>
            {plan.month_goal?.primary_target || '改善整体健康状况'}
          </Text>
          
          {plan.month_goal?.target_metrics && plan.month_goal.target_metrics.length > 0 && (
            <View style={styles.targetMetrics}>
              {plan.month_goal.target_metrics.map((metric, index) => (
                <View key={index} style={styles.metricItem}>
                  <Text style={[styles.metricName, { color: colors.text }]}>{metric.name}</Text>
                  <Tag 
                    text={metric.improvement_direction} 
                    type={metric.priority === 'high' ? 'warning' : 'default'} 
                  />
                </View>
              ))}
            </View>
          )}
          
          {plan.month_goal?.success_criteria && (
            <Text style={[styles.successCriteria, { color: colors.textSecondary }]}>
              📊 评估标准：{plan.month_goal.success_criteria}
            </Text>
          )}
        </Card>

        {/* 运动计划卡片 */}
        <Card title="🏃 运动计划" icon="fitness" color="#10B981">
          <View style={styles.exerciseOverview}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {plan.exercise_framework?.weekly_frequency || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>次/周</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {plan.exercise_framework?.intensity_range?.join('-') || '适中'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>强度范围</Text>
            </View>
          </View>

          <Text style={[styles.sectionSubtitle, { color: colors.text }]}>推荐运动</Text>
          {plan.exercise_framework?.selected_exercises?.map((exercise, index) => (
            <View key={index} style={[styles.exerciseItem, { borderBottomColor: colors.border }]}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                <Text style={[styles.exerciseDetail, { color: colors.textSecondary }]}>
                  {exercise.frequency_per_week}次/周 · {exercise.duration_minutes}分钟 · {exercise.best_time}
                </Text>
              </View>
            </View>
          ))}

          {plan.exercise_framework?.rest_days && plan.exercise_framework.rest_days.length > 0 && (
            <Text style={[styles.restDays, { color: colors.textSecondary }]}>
              🛌 休息日：{plan.exercise_framework.rest_days.join('、')}
            </Text>
          )}

          {plan.exercise_framework?.progression_note && (
            <Text style={[styles.progressionNote, { color: colors.textSecondary }]}>
              💡 {plan.exercise_framework.progression_note}
            </Text>
          )}
        </Card>

        {/* 饮食计划卡片 */}
        <Card title="🥗 饮食计划" icon="nutrition" color="#F59E0B">
          {/* 饮食原则 */}
          {plan.diet_framework?.principles && plan.diet_framework.principles.length > 0 && (
            <View style={styles.principlesContainer}>
              {plan.diet_framework.principles.map((principle, index) => (
                <Tag key={index} text={principle} type="success" />
              ))}
            </View>
          )}

          {/* 三餐比例 */}
          {plan.diet_framework?.meal_structure && (
            <View style={styles.mealStructure}>
              <Text style={[styles.sectionSubtitle, { color: colors.text }]}>三餐配比</Text>
              <ProgressBar 
                value={plan.diet_framework.meal_structure.breakfast_ratio} 
                label="早餐" 
                color="#3B82F6" 
              />
              <ProgressBar 
                value={plan.diet_framework.meal_structure.lunch_ratio} 
                label="午餐" 
                color="#10B981" 
              />
              <ProgressBar 
                value={plan.diet_framework.meal_structure.dinner_ratio} 
                label="晚餐" 
                color="#F59E0B" 
              />
            </View>
          )}

          {/* 推荐食材 */}
          <Text style={[styles.sectionSubtitle, { color: colors.text, marginTop: 16 }]}>推荐食材</Text>
          <View style={styles.foodsGrid}>
            {plan.diet_framework?.recommended_foods?.slice(0, 6).map((food, index) => (
              <View key={index} style={[styles.foodItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                <Text style={[styles.foodFrequency, { color: colors.textSecondary }]}>{food.frequency}</Text>
              </View>
            ))}
          </View>

          {/* 饮水目标 */}
          {plan.diet_framework?.hydration_goal && (
            <Text style={[styles.hydrationGoal, { color: colors.textSecondary }]}>
              💧 饮水目标：{plan.diet_framework.hydration_goal}
            </Text>
          )}
        </Card>

        {/* 医学约束卡片 */}
        {plan.medical_constraints && (
          (plan.medical_constraints.forbidden_exercises?.length > 0 || 
           plan.medical_constraints.forbidden_foods?.length > 0 ||
           plan.medical_constraints.monitoring_reminders?.length > 0) && (
            <Card title="⚠️ 医学约束" icon="alert-circle" color="#EF4444">
              {plan.medical_constraints.forbidden_exercises?.length > 0 && (
                <View style={styles.constraintSection}>
                  <Text style={[styles.constraintLabel, { color: colors.text }]}>禁忌运动</Text>
                  <View style={styles.constraintTags}>
                    {plan.medical_constraints.forbidden_exercises.map((item, index) => (
                      <Tag key={index} text={item} type="warning" />
                    ))}
                  </View>
                </View>
              )}

              {plan.medical_constraints.forbidden_foods?.length > 0 && (
                <View style={styles.constraintSection}>
                  <Text style={[styles.constraintLabel, { color: colors.text }]}>禁忌食物</Text>
                  <View style={styles.constraintTags}>
                    {plan.medical_constraints.forbidden_foods.map((item, index) => (
                      <Tag key={index} text={item} type="warning" />
                    ))}
                  </View>
                </View>
              )}

              {plan.medical_constraints.monitoring_reminders?.length > 0 && (
                <View style={styles.constraintSection}>
                  <Text style={[styles.constraintLabel, { color: colors.text }]}>监测提醒</Text>
                  {plan.medical_constraints.monitoring_reminders.map((item, index) => (
                    <Text key={index} style={[styles.reminderText, { color: colors.textSecondary }]}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
            </Card>
          )
        )}

        {/* 四周主题 */}
        {plan.weekly_themes && plan.weekly_themes.length > 0 && (
          <Card title="📅 四周安排" icon="calendar" color="#8B5CF6">
            {plan.weekly_themes.map((week, index) => (
              <View 
                key={index} 
                style={[
                  styles.weekItem, 
                  { borderBottomColor: colors.border },
                  index === plan.weekly_themes.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.weekHeader}>
                  <View style={[styles.weekBadge, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.weekBadgeText}>W{week.week}</Text>
                  </View>
                  <Text style={[styles.weekTheme, { color: colors.text }]}>{week.theme}</Text>
                </View>
                <Text style={[styles.weekFocus, { color: colors.textSecondary }]}>
                  {week.focus}
                </Text>
                <View style={styles.weekDetails}>
                  <Text style={[styles.weekDetailText, { color: colors.textSecondary }]}>
                    🏋️ {week.exercise_intensity}强度
                  </Text>
                  <Text style={[styles.weekDetailText, { color: colors.textSecondary }]}>
                    🍽️ {week.diet_focus}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* AI解读 */}
        {plan.ai_interpretation && (
          <Card title="💡 AI解读" icon="bulb" color="#6366F1">
            <Text style={[styles.aiInterpretation, { color: colors.text }]}>
              {plan.ai_interpretation}
            </Text>
          </Card>
        )}

        {/* 重新生成按钮 */}
        <TouchableOpacity
          style={[
            styles.regenerateButton, 
            { borderColor: colors.primary },
            generating && { opacity: 0.5 }
          ]}
          onPress={handleRegeneratePlan}
          disabled={generating}
          activeOpacity={0.7}
        >
          {generating ? (
            <>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[styles.regenerateButtonText, { color: colors.primary, marginLeft: 8 }]}>
                正在生成...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={[styles.regenerateButtonText, { color: colors.primary }]}>重新生成计划</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ========== 主渲染 ==========

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 标题栏 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.headerBackButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>月度计划</Text>
        {plan && (
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {plan.plan_month}
          </Text>
        )}
      </View>

      {/* 内容 */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadPlan}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : plan ? (
        renderPlan()
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}

// ========== 样式 ==========

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryTarget: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  targetMetrics: {
    marginTop: 12,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricName: {
    fontSize: 14,
  },
  successCriteria: {
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
  },
  exerciseDetail: {
    fontSize: 12,
    marginTop: 4,
  },
  restDays: {
    fontSize: 13,
    marginTop: 12,
  },
  progressionNote: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  principlesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  mealStructure: {
    marginTop: 8,
  },
  progressItem: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 13,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  foodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '30%',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodFrequency: {
    fontSize: 11,
    marginTop: 2,
  },
  hydrationGoal: {
    fontSize: 13,
    marginTop: 16,
  },
  constraintSection: {
    marginBottom: 12,
  },
  constraintLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  constraintTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reminderText: {
    fontSize: 13,
    lineHeight: 20,
  },
  weekItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weekBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  weekTheme: {
    fontSize: 15,
    fontWeight: '600',
  },
  weekFocus: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 42,
  },
  weekDetails: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 42,
    gap: 16,
  },
  weekDetailText: {
    fontSize: 12,
  },
  aiInterpretation: {
    fontSize: 14,
    lineHeight: 22,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 8,
  },
  regenerateButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
