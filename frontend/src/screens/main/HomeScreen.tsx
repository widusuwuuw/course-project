import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiGet } from '../../api/client';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [refreshing, setRefreshing] = useState(false);

  // 今日统计数据
  const [todayStats, setTodayStats] = useState({
    dietCalories: 0,
    dietTarget: 2000,
    exerciseCalories: 0,
    exerciseTarget: 300,
    mealsRecorded: 0,
    coursesCompleted: 0,
  });

  // 健康数据 - 基于真实数据动态更新
  const [healthStats, setHealthStats] = useState([
    {
      icon: 'restaurant-outline',
      label: '今日饮食',
      value: '0',
      target: '2000 kcal',
      color: '#10B981',
      progress: 0,
      route: 'Nutrition'
    },
    {
      icon: 'fitness-outline',
      label: '今日运动',
      value: '0',
      target: '300 kcal',
      color: '#F59E0B',
      progress: 0,
      route: 'SportsTraining'
    },
    {
      icon: 'calendar-outline',
      label: '本周计划',
      value: '0/7',
      target: '天',
      color: '#8B5CF6',
      progress: 0,
      route: 'StatsComparison'
    },
    {
      icon: 'document-text-outline',
      label: '健康档案',
      value: '查看',
      target: '详情',
      color: '#06B6D4',
      progress: 100,
      route: 'HealthProfile'
    },
  ]);

  // 加载今日统计数据
  const loadTodayStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 默认目标值
      let dietTarget = 2000;
      let exerciseTarget = 300;
      
      // 尝试从今日计划获取目标值
      try {
        const todayPlan = await apiGet('/v1/weekly-plans/today');
        if (todayPlan) {
          // 获取饮食计划的总热量目标 - 累加各餐热量（与饮食计划页面保持一致）
          if (todayPlan.diet) {
            const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
            let totalDietCalories = 0;
            for (const meal of meals) {
              const mealData = todayPlan.diet[meal];
              if (mealData) {
                // 优先使用 calories 字段
                if (mealData.calories) {
                  totalDietCalories += mealData.calories;
                } else if (mealData.nutrition?.calories) {
                  totalDietCalories += mealData.nutrition.calories;
                } else if (Array.isArray(mealData)) {
                  totalDietCalories += mealData.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
                }
              }
            }
            if (totalDietCalories > 0) {
              dietTarget = totalDietCalories;
            }
          }
          // 获取运动计划的消耗热量目标 (字段是 calories_target)
          if (todayPlan.exercise && todayPlan.exercise.calories_target) {
            exerciseTarget = todayPlan.exercise.calories_target;
          } else if (todayPlan.is_rest_day || !todayPlan.exercise) {
            // 休息日或无运动计划时，运动目标为0
            exerciseTarget = 0;
          }
        }
      } catch (e) {
        console.log('获取今日计划失败，使用默认目标值');
      }
      
      // 获取今日饮食和运动统计
      const dailyStats = await apiGet(`/logs/stats/daily?date=${today}`);
      
      const dietCalories = dailyStats?.diet?.actual?.calories || 0;
      const exerciseCalories = dailyStats?.exercise?.actual?.calories || 0;
      const mealsRecorded = Object.keys(dailyStats?.diet?.meals || {}).length;
      const coursesCompleted = dailyStats?.exercise?.actual?.courses_count || 0;
      
      // 尝试获取周统计
      let weeklyProgress = 0;
      let daysCompleted = 0;
      try {
        const weeklyStats = await apiGet('/logs/stats/weekly');
        if (weeklyStats?.daily_stats) {
          daysCompleted = weeklyStats.daily_stats.filter((d: any) => 
            d.diet.meals_recorded > 0 || d.exercise.courses_completed > 0
          ).length;
          weeklyProgress = Math.round((daysCompleted / 7) * 100);
        }
      } catch (e) {
        console.log('周统计获取失败，使用默认值');
      }

      // 获取健康档案完整度
      let profileCompleteness = 0;
      let profileFilled = 0;
      let profileTotal = 46;
      try {
        const completenessData = await apiGet('/v1/lab/health-profile/completeness');
        if (completenessData) {
          profileCompleteness = completenessData.percentage || 0;
          profileFilled = completenessData.filled || 0;
          profileTotal = completenessData.total || 46;
        }
      } catch (e) {
        console.log('获取健康档案完整度失败');
      }

      setTodayStats({
        dietCalories,
        dietTarget,
        exerciseCalories,
        exerciseTarget,
        mealsRecorded,
        coursesCompleted,
      });

      // 更新健康卡片数据
      setHealthStats([
        {
          icon: 'restaurant-outline',
          label: '今日饮食',
          value: dietCalories > 0 ? `${dietCalories}` : '未记录',
          target: `${dietTarget} kcal`,
          color: '#10B981',
          progress: dietTarget > 0 ? Math.min(Math.round((dietCalories / dietTarget) * 100), 100) : 0,
          route: 'Nutrition'
        },
        {
          icon: 'fitness-outline',
          label: '今日运动',
          value: exerciseCalories > 0 ? `${exerciseCalories}` : '未记录',
          target: `${exerciseTarget} kcal`,
          color: '#F59E0B',
          progress: exerciseTarget > 0 ? Math.min(Math.round((exerciseCalories / exerciseTarget) * 100), 100) : (exerciseCalories > 0 ? 100 : 0),
          route: 'SportsTraining'
        },
        {
          icon: 'calendar-outline',
          label: '本周记录',
          value: `${daysCompleted}/7`,
          target: '天',
          color: '#8B5CF6',
          progress: weeklyProgress,
          route: 'StatsComparison'
        },
        {
          icon: 'document-text-outline',
          label: '健康档案',
          value: `${profileFilled}/${profileTotal}`,
          target: '项',
          color: '#06B6D4',
          progress: profileCompleteness,
          route: 'HealthProfile'
        },
      ]);

    } catch (error) {
      console.log('加载今日统计失败:', error);
    }
  }, []);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadTodayStats();
    }, [loadTodayStats])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodayStats();
    setRefreshing(false);
  }, [loadTodayStats]);

  // 快捷操作 - 使用专业化的Ionicons图标
  const quickActions = [
    {
      icon: 'nutrition-outline',
      iconFilled: 'nutrition',
      label: '营养记录',
      color: '#10B981',
      description: '记录每日饮食摄入',
      route: 'Nutrition'
    },
    {
      icon: 'barbell-outline',
      iconFilled: 'barbell',
      label: '运动健身',
      color: '#F59E0B',
      description: '追踪运动数据',
      route: 'Workout'
    },
    {
      icon: 'analytics-outline',
      iconFilled: 'analytics',
      label: '体检解读',
      color: '#06B6D4',
      description: '智能分析风险画像',
      route: 'LabAnalysis'
    },
    {
      icon: 'calendar-outline',
      iconFilled: 'calendar',
      label: '月度计划',
      color: '#8B5CF6',
      description: 'AI生成健康计划',
      route: 'MonthlyPlan'
    },
    {
      icon: 'stats-chart-outline',
      iconFilled: 'stats-chart',
      label: '执行统计',
      color: '#EF4444',
      description: '对比计划与实际',
      route: 'StatsComparison'
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4ABAB8']} />
        }
      >
        {/* 渐变头部区域 */}
        <LinearGradient
          colors={['#B8E5E5', '#D4EDD4']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>你好，健康达人 👋</Text>
              <Text style={styles.subgreeting}>今天也要保持健康哦</Text>
            </View>

            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 今日统计卡片 */}
          <View style={styles.statsGrid}>
            {healthStats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                activeOpacity={0.8}
                onPress={() => {
                  // 跳转到对应页面
                  if (stat.route) {
                    navigation.navigate(stat.route);
                  }
                }}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                    <Ionicons
                      name={stat.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={stat.color}
                    />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>

                <View style={styles.statValueSection}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTarget}>/ {stat.target}</Text>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${stat.progress}%`,
                        backgroundColor: stat.color
                      }
                    ]}
                  />
                </View>

                <View style={styles.statFooter}>
                  <Text style={[styles.progressText, { color: stat.color }]}>
                    {stat.progress}%
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={stat.color}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* 快捷操作 */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>快捷操作</Text>

          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                activeOpacity={0.8}
                onPress={() => {
                  // 实现页面跳转
                  if (action.route === 'Nutrition') {
                    navigation.navigate('Nutrition');
                  } else if (action.route === 'Workout') {
                    // 跳转到运动健身页面
                    navigation.navigate('SportsTraining');
                  } else if (action.route === 'LabAnalysis') {
                    navigation.navigate('LabAnalysis');
                  } else if (action.route === 'MonthlyPlan') {
                    navigation.navigate('MonthlyPlan');
                  } else if (action.route === 'StatsComparison') {
                    navigation.navigate('StatsComparison');
                  } else {
                    Alert.alert(
                      '功能开发中',
                      `${action.label}功能即将上线，敬请期待！`,
                      [{ text: '确定', style: 'default' }]
                    );
                  }
                }}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: action.color + '15' }
                  ]}
                >
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 今日健康小贴士 */}
        <View style={styles.tipSection}>
          <LinearGradient
            colors={['#4ABAB820', '#4ABAB805']}
            style={styles.tipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.tipContent}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  '健康小贴士',
                  '保持规律的作息时间有助于维持身体的生物钟，建议每天在相同时间入睡和起床。\n\n了解更多健康知识，请关注我们的健康专栏。',
                  [
                    { text: '了解更多', style: 'default' },
                    { text: '知道了', style: 'cancel' }
                  ]
                );
              }}
            >
              <View style={styles.tipIcon}>
                <Ionicons name="bulb-outline" size={24} color="#4ABAB8" />
              </View>

              <View style={styles.tipTextContainer}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipTitle}>今日健康小贴士</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4ABAB8" />
                </View>
                <Text style={styles.tipDescription}>
                  保持规律的作息时间有助于维持身体的生物钟，建议每天在相同时间入睡和起床。
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // 为底部导航留出空间
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  notificationButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backdropFilter: 'blur(10px)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValueSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statTarget: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartSection: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartChange: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  chartChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    width: width - 48,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  chartDataText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  quickActionsSection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  tipSection: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  tipGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFD88C20',
  },
  tipContent: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#4ABAB820',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tipDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});