import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { Svg, Circle } from 'react-native-svg';
import { useCurrentWeeklyPlan, useGenerateWeeklyPlan, convertWeeklyPlanToExerciseData } from '../../hooks/useWeeklyPlan';
import { apiGet, apiPost, apiPut, apiDelete, aiAdjustWeeklyPlan } from '../../api/client';

const { width } = Dimensions.get('window');

// 课程类型定义
interface Course {
  id: string;
  exercise_id: string;
  category: string;
  title: string;
  instructor: string;
  duration: number;
  calories: number;
  difficulty: string;
  cover_image: string;
  description: string;
  tags: string[];
  rating: number;
  students: number;
  is_free: boolean;
  price: number;
}

// 运动记录类型
interface ExerciseRecord {
  course_id: string;
  course_title: string;
  exercise_id: string;
  instructor: string;
  duration: number;
  difficulty: string;
  calories: number;
  completed_at?: string;
  is_completed: boolean;
}

// 运动项目类型定义
interface ExerciseItem {
  id: string;
  name: string;
  duration?: number;
  calories?: number;
  category: string;
  sets?: number;
  reps?: number;
  intensity?: string;
  timeSlot?: string;  // 新增：时段（早晨/下午/晚上）
  time?: string;
}

// 日期数据类型定义
interface DayData {
  date: number;
  totalDuration: number;
  totalCalories: number;
  exercises: ExerciseItem[];
  goalDuration: number;
  goalCalories: number;
  isRestDay?: boolean;
  tips?: string;
}

// 按时段分组运动
const groupExercisesByTimeSlot = (exercises: ExerciseItem[]) => {
  const groups: { [key: string]: ExerciseItem[] } = {
    '早晨': [],
    '下午': [],
    '晚上': [],
  };
  
  exercises.forEach(ex => {
    const slot = ex.timeSlot || ex.time || '下午';
    if (slot.includes('早') || slot === '早晨') {
      groups['早晨'].push(ex);
    } else if (slot.includes('晚') || slot === '晚上') {
      groups['晚上'].push(ex);
    } else {
      groups['下午'].push(ex);
    }
  });
  
  return groups;
};

export default function SportsTrainingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // 使用周计划数据
  const { weeklyPlan, loading, error, refresh } = useCurrentWeeklyPlan();
  const { generate, generating } = useGenerateWeeklyPlan();
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyPlan, setMonthlyPlan] = useState<any>(null);
  const [checkingPrerequisites, setCheckingPrerequisites] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);
  
  // 检测周计划是否需要更新（基于新的月度计划）
  const isWeeklyPlanOutdated = weeklyPlan && monthlyPlan && 
    weeklyPlan.monthly_plan_id !== monthlyPlan.id;
  
  // 微调对话框状态
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustRequest, setAdjustRequest] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  
  // 获取当前日期
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  // ========== 实际运动记录相关状态 ==========
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [todayExerciseLog, setTodayExerciseLog] = useState<any>(null);
  const [savingExercise, setSavingExercise] = useState(false);
  const [completingExercise, setCompletingExercise] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 选中的课程分类
  const [deletingExercise, setDeletingExercise] = useState<string | null>(null); // 正在删除的运动

  // 课程分类列表
  const COURSE_CATEGORIES = [
    { id: '有氧运动', name: '有氧运动', icon: 'heart-outline', color: '#EF4444' },
    { id: '力量训练', name: '力量训练', icon: 'barbell-outline', color: '#8B5CF6' },
    { id: '柔韧性训练', name: '柔韧性训练', icon: 'body-outline', color: '#10B981' },
    { id: '传统中式', name: '传统中式', icon: 'leaf-outline', color: '#F59E0B' },
    { id: '高强度间歇', name: '高强度间歇', icon: 'flash-outline', color: '#EC4899' },
    { id: '水中运动', name: '水中运动', icon: 'water-outline', color: '#06B6D4' },
    { id: '功能性训练', name: '功能性训练', icon: 'fitness-outline', color: '#6366F1' },
  ];

  // 获取选中日期的字符串格式
  const getSelectedDateStr = () => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`;
  };

  // 加载当天的运动记录
  const loadTodayExerciseLog = async () => {
    try {
      const dateStr = getSelectedDateStr();
      const response = await apiGet(`/logs/exercise?date=${dateStr}`);
      if (response.logs && response.logs.length > 0) {
        setTodayExerciseLog(response.logs[0]);
      } else {
        setTodayExerciseLog(null);
      }
    } catch (error) {
      console.error('加载运动记录失败:', error);
    }
  };

  // 加载课程列表
  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await apiGet('/logs/courses');
      setCourses(response.courses || []);
    } catch (error) {
      console.error('加载课程失败:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // 添加运动到今日记录
  const addExerciseToday = async (course: Course) => {
    setSavingExercise(true);
    try {
      const dateStr = getSelectedDateStr();
      const courseRecord = {
        course_id: course.id,
        course_title: course.title,
        exercise_id: course.exercise_id,
        instructor: course.instructor,
        duration: course.duration,
        difficulty: course.difficulty,
        calories: course.calories,
        is_completed: false, // 添加时未完成
      };

      await apiPost('/logs/exercise', {
        log_date: dateStr,
        courses: [courseRecord],
      });

      Alert.alert('成功', `已添加"${course.title}"到今日运动`);
      setShowCourseModal(false);
      await loadTodayExerciseLog(); // 刷新记录
    } catch (error) {
      console.error('添加运动失败:', error);
      Alert.alert('错误', '添加运动失败，请重试');
    } finally {
      setSavingExercise(false);
    }
  };

  // 删除运动记录
  const deleteExerciseFromToday = async (courseId: string, courseTitle: string) => {
    console.log('删除按钮点击:', courseId, courseTitle, todayExerciseLog);
    
    if (!todayExerciseLog) {
      console.log('todayExerciseLog 为空');
      return;
    }
    
    // 使用 window.confirm 兼容 Web 平台
    const confirmed = window.confirm(`确定要删除"${courseTitle}"吗？`);
    if (!confirmed) return;
    
    setDeletingExercise(courseId);
    try {
      // 过滤掉要删除的课程
      const updatedCourses = todayExerciseLog.courses.filter(
        (c: any) => c.course_id !== courseId
      );
      
      if (updatedCourses.length === 0) {
        // 如果没有课程了，删除整个记录
        await apiDelete(`/logs/exercise/${todayExerciseLog.id}`);
        // 立即更新本地状态
        setTodayExerciseLog(null);
      } else {
        // 否则更新记录
        await apiPut(`/logs/exercise/${todayExerciseLog.id}`, {
          courses: updatedCourses,
        });
        // 立即更新本地状态
        setTodayExerciseLog({
          ...todayExerciseLog,
          courses: updatedCourses,
        });
      }
    } catch (error) {
      console.error('删除运动失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingExercise(null);
    }
  };

  // 标记运动为完成
  const markExerciseCompleted = async (courseId: string) => {
    if (!todayExerciseLog) return;
    
    setCompletingExercise(courseId);
    try {
      // 更新记录中该课程的完成状态
      const updatedCourses = todayExerciseLog.courses.map((c: any) => {
        if (c.course_id === courseId) {
          return { ...c, is_completed: true, completed_at: new Date().toISOString() };
        }
        return c;
      });

      // 使用PUT API更新记录
      await apiPut(`/logs/exercise/${todayExerciseLog.id}`, {
        courses: updatedCourses,
      });

      const course = todayExerciseLog.courses.find((c: any) => c.course_id === courseId);
      Alert.alert('🎉 完成！', `恭喜完成"${course?.course_title}"！消耗了 ${course?.calories} 卡路里`);
      await loadTodayExerciseLog(); // 刷新记录
    } catch (error) {
      console.error('标记完成失败:', error);
      Alert.alert('错误', '操作失败，请重试');
    } finally {
      setCompletingExercise(null);
    }
  };

  // 页面获得焦点时刷新运动记录
  useFocusEffect(
    React.useCallback(() => {
      loadTodayExerciseLog();
    }, [selectedDate])
  );

  // 当选择日期变化时刷新
  useEffect(() => {
    loadTodayExerciseLog();
  }, [selectedDate]);

  // 检查前置条件（月计划和偏好设置）
  useEffect(() => {
    checkPrerequisites();
  }, []);

  const checkPrerequisites = async () => {
    try {
      setCheckingPrerequisites(true);
      // 并行检查月计划和偏好设置
      const [monthlyResponse, prefsResponse] = await Promise.all([
        apiGet('/api/v1/plans/monthly/current').catch(() => null),
        apiGet('/api/v1/preferences').catch(() => null),
      ]);
      
      console.log('月计划响应:', monthlyResponse);
      console.log('偏好设置响应:', prefsResponse);
      
      // 提取月计划数据（后端返回 {success, message, data} 格式）
      if (monthlyResponse?.success && monthlyResponse?.data) {
        setMonthlyPlan(monthlyResponse.data);
      } else {
        setMonthlyPlan(null);
      }
      
      // 检查是否有偏好设置（不是默认值）
      const hasPrefs = prefsResponse?.data && !prefsResponse.data._is_default;
      setHasPreferences(hasPrefs);
    } catch (error) {
      console.error('检查前置条件失败:', error);
    } finally {
      setCheckingPrerequisites(false);
    }
  };

  // 生成周计划
  const handleGenerateWeeklyPlan = async (isRegenerate: boolean = false) => {
    console.log('handleGenerateWeeklyPlan被调用, isRegenerate:', isRegenerate);
    
    if (!monthlyPlan) {
      Alert.alert('提示', '请先生成月度计划', [
        { text: '去生成', onPress: () => navigation.navigate('MonthlyPlan' as never) },
        { text: '取消', style: 'cancel' },
      ]);
      return;
    }

    console.log('月度计划数据:', monthlyPlan);
    console.log('月度计划ID:', monthlyPlan.id);

    if (!monthlyPlan.id) {
      Alert.alert('错误', '月度计划数据异常，缺少ID字段');
      return;
    }

    // 直接执行生成（Web端Alert确认框可能无法正常工作）
    console.log('开始生成周计划...');
    await doGenerateWeeklyPlan();
  };

  // 实际执行生成周计划的逻辑
  const doGenerateWeeklyPlan = async () => {
    // 计算当前是第几周
    const weekNumber = Math.ceil(new Date().getDate() / 7);
    console.log('准备生成第', weekNumber, '周的计划');
    
    try {
      const result = await generate(monthlyPlan.id, weekNumber);
      console.log('生成周计划结果:', result);
      console.log('生成的 daily_plans:', result?.daily_plans);
      if (result) {
        Alert.alert('成功', `第${weekNumber}周计划已生成！运动类型已根据新月度计划更新。`);
        console.log('开始刷新周计划...');
        await refresh(); // 刷新数据
        console.log('刷新完成！');
      } else {
        Alert.alert('失败', '生成周计划失败，请重试');
      }
    } catch (error: any) {
      console.error('生成周计划失败:', error);
      Alert.alert('错误', error.message || '生成周计划失败');
    }
  };

  // AI微调周计划
  const handleAdjustPlan = async () => {
    if (!adjustRequest.trim()) {
      Alert.alert('提示', '请输入您的调整需求');
      return;
    }
    
    if (!weeklyPlan?.id) {
      Alert.alert('错误', '没有找到周计划');
      return;
    }
    
    setAdjusting(true);
    try {
      const result = await aiAdjustWeeklyPlan(weeklyPlan.id, adjustRequest.trim());
      console.log('==== AI微调结果 ====');
      console.log('status:', result.status);
      console.log('explanation:', result.explanation);
      console.log('changes:', result.changes);
      console.log('updated_plan keys:', result.updated_plan ? Object.keys(result.updated_plan) : 'null');
      if (result.updated_plan) {
        Object.entries(result.updated_plan).forEach(([day, data]: [string, any]) => {
          console.log(`  ${day}: exercises=${data.exercises?.length || 0}, is_rest_day=${data.is_rest_day}`);
        });
      }
      
      if (result.status === 'success') {
        setShowAdjustModal(false);
        setAdjustRequest('');
        
        // 立即刷新数据
        await refresh();
        
        // 显示调整结果
        const changesText = result.changes?.length > 0 
          ? `\n\n调整内容：\n${result.changes.join('\n')}`
          : '';
        Alert.alert(
          '调整成功',
          `${result.explanation || '计划已按您的需求调整'}${changesText}`
        );
      } else {
        Alert.alert('调整失败', result.message || '无法完成调整，请尝试更具体的描述');
      }
    } catch (error: any) {
      console.error('AI微调失败:', error);
      Alert.alert('错误', error.message || '调整请求失败');
    } finally {
      setAdjusting(false);
    }
  };

  // 转换周计划数据为界面需要的格式
  const weekData = weeklyPlan ? convertWeeklyPlanToExerciseData(weeklyPlan) : {};
  
  // 调试日志：追踪数据变化
  console.log('=== 周计划数据调试 ===');
  console.log('weeklyPlan:', weeklyPlan ? { id: weeklyPlan.id, week_start_date: weeklyPlan.week_start_date } : null);
  console.log('weekData keys:', weekData ? Object.keys(weekData) : null);
  console.log('weekData详情:', weekData);

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 获取当前周的日期范围
  const getCurrentWeekDates = () => {
    const dates = [];
    const current = new Date(today);
    // 找到本周一
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setDate(current.getDate() + diff);
    
    // 生成周一到周日的日期
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(current).getDate());
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const currentWeekDates = getCurrentWeekDates();

  // 获取当前选中日期的数据
  const currentDayData = weekData ? weekData[selectedDate] : null;

  // 计算进度百分比
  const durationProgress = currentDayData
    ? Math.min((currentDayData.totalDuration / currentDayData.goalDuration) * 100, 100)
    : 0;

  const caloriesProgress = currentDayData
    ? Math.min((currentDayData.totalCalories / currentDayData.goalCalories) * 100, 100)
    : 0;

  // 渲染日期选择器项
  const renderDateItem = (date: number) => {
    const isSelected = date === selectedDate;
    const dayData = weekData ? weekData[date] : null;
    const hasData = dayData && dayData.exercises && dayData.exercises.length > 0;
    const isRestDay = dayData?.isRestDay;

    return (
      <TouchableOpacity
        key={date}
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
          {['一', '二', '三', '四', '五', '六', '日'][currentWeekDates.indexOf(date)]}
        </Text>
        <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>{date}</Text>
        {isRestDay ? (
          <View style={[styles.dateDot, { backgroundColor: '#F59E0B' }]} />
        ) : hasData ? (
          <View style={[styles.dateDot, { backgroundColor: '#4ABAB8' }]} />
        ) : null}
      </TouchableOpacity>
    );
  };

  // 渲染运动项目
  const renderExerciseItem = ({ item }: { item: ExerciseItem }) => {
    const getExerciseColor = (category: string) => {
      const colors: Record<string, string> = {
        '力量训练': '#FF6B6B',
        '有氧运动': '#4ABAB8',
        '柔韧性训练': '#9B59B6',
        '核心训练': '#3498db',
      };
      return colors[category] || '#6B7280';
    };

    const exerciseColor = getExerciseColor(item.category);

    return (
      <TouchableOpacity
        style={styles.exerciseItem}
        onPress={() => {
          const message = [
            `类型: ${item.category}`,
            item.sets ? `组数: ${item.sets}组` : '',
            item.reps ? `次数: ${item.reps}次` : '',
            item.duration ? `时长: ${item.duration}分钟` : '',
            item.intensity ? `强度: ${item.intensity}` : '',
            item.calories ? `消耗: ${item.calories}千卡` : '',
          ].filter(Boolean).join('\n');

          window.confirm(`${item.name}\n\n${message}`);
        }}
      >
        <View style={[styles.exerciseIcon, { backgroundColor: `${exerciseColor}20` }]}>
          <Ionicons name="barbell-outline" size={24} color={exerciseColor} />
        </View>

        <View style={styles.exerciseContent}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            {item.duration && <Text style={styles.exerciseTime}>{item.duration}分钟</Text>}
          </View>

          <View style={styles.exerciseMeta}>
            <Text style={styles.exerciseCategory}>{item.category}</Text>
            <View style={styles.exerciseStats}>
              {item.calories && (
                <View style={styles.statItem}>
                  <Ionicons name="flame-outline" size={14} color="#F59E0B" />
                  <Text style={styles.statText}>{item.calories}千卡</Text>
                </View>
              )}
              {item.intensity && (
                <View style={styles.statItem}>
                  <Ionicons name="trending-up-outline" size={14} color="#4ABAB8" />
                  <Text style={styles.statText}>{item.intensity}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 环形进度组件
  const CircularProgressRing = ({ progress, color, size }: { progress: number; color: string; size: number }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          stroke="#E5E7EB"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4ABAB8']} />
        }
      >
        {/* 头部区域 */}
        <LinearGradient colors={['#4ABAB8', '#3A9A98']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>运动健身</Text>
              <Text style={styles.headerSubtitle}>
                {weeklyPlan ? '本周运动计划' : '坚持运动，保持健康'}
              </Text>
              {weeklyPlan && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>第{weeklyPlan.week_number}周</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* 加载状态 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ABAB8" />
            <Text style={styles.loadingText}>加载运动计划...</Text>
          </View>
        )}

        {/* 无数据状态 - 提供完整引导 */}
        {!loading && !weeklyPlan && (
          <View style={styles.noDataContainer}>
            <View style={styles.noDataIconContainer}>
              <Ionicons name="fitness-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.noDataTitle}>暂无周计划数据</Text>
            
            {/* 前置条件检查 */}
            <View style={styles.prerequisitesList}>
              {/* 步骤1: 健康偏好 */}
              <View style={styles.prerequisiteItem}>
                <View style={[
                  styles.prerequisiteIcon,
                  hasPreferences ? styles.prerequisiteIconDone : styles.prerequisiteIconPending
                ]}>
                  {hasPreferences ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.prerequisiteNumber}>1</Text>
                  )}
                </View>
                <View style={styles.prerequisiteContent}>
                  <Text style={styles.prerequisiteTitle}>设置健康偏好</Text>
                  <Text style={styles.prerequisiteDesc}>
                    {hasPreferences ? '已完成' : '设置饮食、运动偏好'}
                  </Text>
                </View>
                {!hasPreferences && (
                  <TouchableOpacity
                    style={styles.prerequisiteButton}
                    onPress={() => navigation.navigate('Preferences' as never)}
                  >
                    <Text style={styles.prerequisiteButtonText}>去设置</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 步骤2: 月度计划 */}
              <View style={styles.prerequisiteItem}>
                <View style={[
                  styles.prerequisiteIcon,
                  monthlyPlan ? styles.prerequisiteIconDone : styles.prerequisiteIconPending
                ]}>
                  {monthlyPlan ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.prerequisiteNumber}>2</Text>
                  )}
                </View>
                <View style={styles.prerequisiteContent}>
                  <Text style={styles.prerequisiteTitle}>生成月度计划</Text>
                  <Text style={styles.prerequisiteDesc}>
                    {monthlyPlan ? `已有计划: ${monthlyPlan.plan_title || monthlyPlan.plan_month}` : '需要先生成长期规划'}
                  </Text>
                </View>
                {!monthlyPlan && (
                  <TouchableOpacity
                    style={styles.prerequisiteButton}
                    onPress={() => navigation.navigate('MonthlyPlan' as never)}
                  >
                    <Text style={styles.prerequisiteButtonText}>去生成</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 步骤3: 生成周计划 */}
              <View style={styles.prerequisiteItem}>
                <View style={[
                  styles.prerequisiteIcon,
                  styles.prerequisiteIconPending
                ]}>
                  <Text style={styles.prerequisiteNumber}>3</Text>
                </View>
                <View style={styles.prerequisiteContent}>
                  <Text style={styles.prerequisiteTitle}>生成周计划</Text>
                  <Text style={styles.prerequisiteDesc}>基于月计划生成本周详细安排</Text>
                </View>
              </View>
            </View>

            {/* 生成周计划按钮 */}
            <TouchableOpacity
              style={[
                styles.generateWeeklyButton,
                (!monthlyPlan || generating) && styles.generateWeeklyButtonDisabled
              ]}
              onPress={() => handleGenerateWeeklyPlan(false)}
              disabled={!monthlyPlan || generating}
            >
              {generating ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.generateWeeklyButtonText}>生成中...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="flash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.generateWeeklyButtonText}>
                    {monthlyPlan ? '生成本周计划' : '请先完成上述步骤'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 有数据时显示 */}
        {!loading && weeklyPlan && (
          <>
            {/* 周计划更新提示 - 当月度计划已更新时显示 */}
            {isWeeklyPlanOutdated && (
              <View style={styles.updateBanner}>
                <View style={styles.updateBannerContent}>
                  <Ionicons name="refresh-circle-outline" size={24} color="#F59E0B" />
                  <View style={styles.updateBannerText}>
                    <Text style={styles.updateBannerTitle}>月度计划已更新</Text>
                    <Text style={styles.updateBannerDesc}>检测到新的月度计划，建议重新生成周计划以获取多样化运动</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.updateBannerButton}
                  onPress={() => handleGenerateWeeklyPlan(true)}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.updateBannerButtonText}>立即更新</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* AI周计划总结卡片 */}
            {weeklyPlan?.ai_weekly_summary && (
              <View style={styles.aiSummaryCard}>
                <View style={styles.aiSummaryHeader}>
                  <View style={styles.aiSummaryIcon}>
                    <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={styles.aiSummaryTitle}>AI教练本周建议</Text>
                </View>
                <Text style={styles.aiSummaryText}>{weeklyPlan.ai_weekly_summary}</Text>
              </View>
            )}

            {/* 日期选择器 */}
            <View style={styles.dateSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {currentWeekDates.map((date) => renderDateItem(date))}
              </ScrollView>
            </View>

            {/* 休息日显示 */}
            {currentDayData && currentDayData.isRestDay && (
              <>
                <View style={styles.restDayContainer}>
                  <Ionicons name="moon-outline" size={48} color="#F59E0B" />
                  <Text style={styles.restDayTitle}>今日休息</Text>
                  <Text style={styles.restDayDescription}>
                    今天是休息日，让身体充分恢复。可以进行轻度的伸展活动，保持良好的作息习惯。
                  </Text>
                </View>

                {/* 休息日也可以记录运动 */}
                <View style={styles.exercisesSection}>
                  <View style={styles.exercisesHeader}>
                    <Text style={styles.exercisesTitle}>今日运动记录</Text>
                    <TouchableOpacity 
                      style={styles.addExerciseBtn}
                      onPress={() => {
                        loadCourses();
                        setSelectedCategory(null);
                        setShowCourseModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#4ABAB8" />
                      <Text style={styles.addExerciseBtnText}>添加运动</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {todayExerciseLog && todayExerciseLog.courses && todayExerciseLog.courses.length > 0 ? (
                    <View style={styles.recordedExercisesList}>
                      {todayExerciseLog.courses.map((course: any, index: number) => (
                        <View key={`${course.course_id}-${index}`} style={[
                          styles.recordedExerciseItem,
                          course.is_completed && styles.completedExerciseItem
                        ]}>
                          <View style={styles.recordedExerciseInfo}>
                            <View style={styles.recordedExerciseHeader}>
                              <Text style={styles.recordedExerciseName}>{course.course_title}</Text>
                              {course.is_completed && (
                                <View style={styles.completedBadge}>
                                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                  <Text style={styles.completedBadgeText}>已完成</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.recordedExerciseMeta}>
                              <Text style={styles.recordedExerciseMetaText}>
                                <Ionicons name="time-outline" size={12} color="#9CA3AF" /> {course.duration}分钟
                              </Text>
                              <Text style={styles.recordedExerciseMetaText}>
                                <Ionicons name="flame-outline" size={12} color="#F59E0B" /> {course.calories}千卡
                              </Text>
                            </View>
                          </View>
                          <View style={styles.exerciseActions}>
                            {!course.is_completed && (
                              <TouchableOpacity 
                                style={styles.completeBtn}
                                onPress={() => markExerciseCompleted(course.course_id)}
                              >
                                <Text style={styles.completeBtnText}>完成</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              style={styles.deleteExerciseBtn}
                              onPress={() => {
                                console.log('点击删除(休息日):', course.course_id);
                                deleteExerciseFromToday(course.course_id, course.course_title);
                              }}
                              activeOpacity={0.6}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      
                      {/* 统计信息 */}
                      {(() => {
                        const completedCourses = todayExerciseLog.courses.filter((c: any) => c.is_completed);
                        const totalCalories = completedCourses.reduce((sum: number, c: any) => sum + (c.calories || 0), 0);
                        const totalDuration = completedCourses.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
                        return (
                          <View style={styles.recordSummary}>
                            <Text style={styles.recordSummaryText}>
                              已完成 {completedCourses.length}/{todayExerciseLog.courses.length} 项运动
                              {completedCourses.length > 0 && ` · ${totalDuration}分钟 · ${totalCalories}千卡`}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  ) : (
                    <View style={styles.emptyRecords}>
                      <Ionicons name="add-circle-outline" size={40} color="#9CA3AF" />
                      <Text style={styles.emptyRecordsText}>休息日也可以记录运动</Text>
                      <Text style={styles.emptyRecordsHint}>点击"添加运动"开始记录</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* 运动进度 */}
            {currentDayData && !currentDayData.isRestDay && (
              <>
                <View style={styles.progressSection}>
                  <View style={styles.progressCards}>
                    {/* 运动时长进度卡片 */}
                    <View style={styles.progressCard}>
                      <View style={styles.progressHeader}>
                        <View
                          style={[styles.progressIconContainer, { backgroundColor: '#4ABAB820' }]}
                        >
                          <Ionicons name="timer-outline" size={20} color="#4ABAB8" />
                        </View>
                        <Text style={styles.progressLabel}>运动时长</Text>
                      </View>

                      <View style={styles.progressCircleContainer}>
                        <CircularProgressRing
                          progress={durationProgress}
                          color="#4ABAB8"
                          size={100}
                        />
                        <View style={styles.progressCenter}>
                          <Text style={styles.progressValue}>{currentDayData.totalDuration}</Text>
                          <Text style={styles.progressUnit}>分钟</Text>
                        </View>
                      </View>

                      <View style={styles.progressFooter}>
                        <Text style={styles.progressGoal}>
                          目标: {currentDayData.goalDuration}分钟
                        </Text>
                        <Text style={[styles.progressPercentage, { color: '#4ABAB8' }]}>
                          {Math.round(durationProgress)}%
                        </Text>
                      </View>
                    </View>

                    {/* 卡路里进度卡片 */}
                    <View style={styles.progressCard}>
                      <View style={styles.progressHeader}>
                        <View
                          style={[styles.progressIconContainer, { backgroundColor: '#F59E0B20' }]}
                        >
                          <Ionicons name="flame-outline" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.progressLabel}>消耗卡路里</Text>
                      </View>

                      <View style={styles.progressCircleContainer}>
                        <CircularProgressRing
                          progress={caloriesProgress}
                          color="#F59E0B"
                          size={100}
                        />
                        <View style={styles.progressCenter}>
                          <Text style={styles.progressValue}>{currentDayData.totalCalories}</Text>
                          <Text style={styles.progressUnit}>千卡</Text>
                        </View>
                      </View>

                      <View style={styles.progressFooter}>
                        <Text style={styles.progressGoal}>
                          目标: {currentDayData.goalCalories}千卡
                        </Text>
                        <Text style={[styles.progressPercentage, { color: '#F59E0B' }]}>
                          {Math.round(caloriesProgress)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 运动项目列表 - 按时段分组 */}
                <View style={styles.exercisesSection}>
                  <View style={styles.exercisesHeader}>
                    <Text style={styles.exercisesTitle}>运动项目</Text>
                    <Text style={styles.exerciseCount}>
                      共{currentDayData.exercises?.length || 0}项运动
                    </Text>
                  </View>
                  
                  {currentDayData.tips && (
                    <View style={styles.tipsContainer}>
                      <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
                      <Text style={styles.tipsText}>{currentDayData.tips}</Text>
                    </View>
                  )}

                  {currentDayData.exercises && currentDayData.exercises.length > 0 ? (
                    <>
                      {/* 按时段分组显示 */}
                      {(() => {
                        const groups = groupExercisesByTimeSlot(currentDayData.exercises);
                        const timeSlotIcons: { [key: string]: string } = {
                          '早晨': 'sunny-outline',
                          '下午': 'partly-sunny-outline',
                          '晚上': 'moon-outline',
                        };
                        const timeSlotColors: { [key: string]: string } = {
                          '早晨': '#F59E0B',
                          '下午': '#4ABAB8',
                          '晚上': '#8B5CF6',
                        };
                        
                        return Object.entries(groups).map(([slot, exercises]) => {
                          if (exercises.length === 0) return null;
                          return (
                            <View key={slot} style={styles.timeSlotGroup}>
                              <View style={styles.timeSlotHeader}>
                                <Ionicons 
                                  name={timeSlotIcons[slot] as any} 
                                  size={18} 
                                  color={timeSlotColors[slot]} 
                                />
                                <Text style={[styles.timeSlotTitle, { color: timeSlotColors[slot] }]}>
                                  {slot}
                                </Text>
                                <Text style={styles.timeSlotCount}>
                                  {exercises.length}项
                                </Text>
                              </View>
                              {exercises.map((item) => (
                                <View key={item.id + slot} style={styles.exerciseItemInGroup}>
                                  {renderExerciseItem({ item })}
                                </View>
                              ))}
                            </View>
                          );
                        });
                      })()}
                    </>
                  ) : (
                    <View style={styles.emptyExercises}>
                      <Ionicons name="fitness-outline" size={48} color="#9CA3AF" />
                      <Text style={styles.emptyText}>今日暂无运动安排</Text>
                    </View>
                  )}
                </View>

                {/* 今日运动记录 - 用户实际完成的运动 */}
                <View style={styles.exercisesSection}>
                  <View style={styles.exercisesHeader}>
                    <Text style={styles.exercisesTitle}>今日运动记录</Text>
                    <TouchableOpacity 
                      style={styles.addExerciseBtn}
                      onPress={() => {
                        loadCourses();
                        setSelectedCategory(null);
                        setShowCourseModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#4ABAB8" />
                      <Text style={styles.addExerciseBtnText}>添加运动</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {todayExerciseLog && todayExerciseLog.courses && todayExerciseLog.courses.length > 0 ? (
                    <View style={styles.recordedExercisesList}>
                      {todayExerciseLog.courses.map((course: any, index: number) => (
                        <View key={`${course.course_id}-${index}`} style={[
                          styles.recordedExerciseItem,
                          course.is_completed && styles.completedExerciseItem
                        ]}>
                          <View style={styles.recordedExerciseInfo}>
                            <View style={styles.recordedExerciseHeader}>
                              <Text style={styles.recordedExerciseName}>{course.course_title}</Text>
                              {course.is_completed && (
                                <View style={styles.completedBadge}>
                                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                  <Text style={styles.completedBadgeText}>已完成</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.recordedExerciseMeta}>
                              <Text style={styles.recordedExerciseMetaText}>
                                <Ionicons name="time-outline" size={12} color="#9CA3AF" /> {course.duration}分钟
                              </Text>
                              <Text style={styles.recordedExerciseMetaText}>
                                <Ionicons name="flame-outline" size={12} color="#F59E0B" /> {course.calories}千卡
                              </Text>
                            </View>
                          </View>
                          <View style={styles.exerciseActions}>
                            {!course.is_completed && (
                              <TouchableOpacity 
                                style={styles.completeBtn}
                                onPress={() => markExerciseCompleted(course.course_id)}
                              >
                                <Text style={styles.completeBtnText}>完成</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              style={styles.deleteExerciseBtn}
                              onPress={() => {
                                console.log('点击删除(非休息日):', course.course_id);
                                deleteExerciseFromToday(course.course_id, course.course_title);
                              }}
                              activeOpacity={0.6}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      
                      {/* 统计信息 */}
                      {(() => {
                        const completedCourses = todayExerciseLog.courses.filter((c: any) => c.is_completed);
                        const totalCalories = completedCourses.reduce((sum: number, c: any) => sum + (c.calories || 0), 0);
                        const totalDuration = completedCourses.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
                        return (
                          <View style={styles.recordSummary}>
                            <Text style={styles.recordSummaryText}>
                              已完成 {completedCourses.length}/{todayExerciseLog.courses.length} 项运动
                              {completedCourses.length > 0 && ` · ${totalDuration}分钟 · ${totalCalories}千卡`}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  ) : (
                    <View style={styles.emptyRecords}>
                      <Ionicons name="add-circle-outline" size={40} color="#9CA3AF" />
                      <Text style={styles.emptyRecordsText}>还没有记录今日运动</Text>
                      <Text style={styles.emptyRecordsHint}>点击"添加运动"开始记录</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* 微调浮动按钮 - 只在有周计划时显示 */}
      {weeklyPlan && (
        <TouchableOpacity
          style={styles.adjustFab}
          onPress={() => setShowAdjustModal(true)}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* AI微调对话框 */}
      <Modal
        visible={showAdjustModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                <Text style={styles.modalTitle}>智能微调计划</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              用自然语言描述您想要的调整，AI助手会帮您完成
            </Text>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>示例：</Text>
              <Text style={styles.exampleText}>• 周二晚上太忙，把运动改到早上</Text>
              <Text style={styles.exampleText}>• 把周四的太极拳换成八段锦</Text>
              <Text style={styles.exampleText}>• 周三我想休息，跳过运动</Text>
            </View>

            <TextInput
              style={styles.adjustInput}
              placeholder="请输入您的调整需求..."
              placeholderTextColor="#9CA3AF"
              value={adjustRequest}
              onChangeText={setAdjustRequest}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowAdjustModal(false);
                  setAdjustRequest('');
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton, adjusting && styles.modalButtonDisabled]}
                onPress={handleAdjustPlan}
                disabled={adjusting}
              >
                {adjusting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>AI调整</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 课程选择对话框 */}
      <Modal
        visible={showCourseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCourseModal(false);
          setSelectedCategory(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.courseModalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {selectedCategory ? (
                  <TouchableOpacity 
                    style={styles.backToCategoryBtn}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Ionicons name="arrow-back" size={20} color="#4ABAB8" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="fitness" size={24} color="#4ABAB8" />
                )}
                <Text style={styles.modalTitle}>
                  {selectedCategory ? selectedCategory : '选择运动类型'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowCourseModal(false);
                setSelectedCategory(null);
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loadingCourses ? (
              <View style={styles.loadingCourses}>
                <ActivityIndicator size="large" color="#4ABAB8" />
                <Text style={styles.loadingCoursesText}>加载课程中...</Text>
              </View>
            ) : !selectedCategory ? (
              /* 第一步：选择分类 */
              <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                {COURSE_CATEGORIES.map((category) => {
                  const categoryCount = courses.filter(c => c.category === category.id).length;
                  return (
                    <TouchableOpacity 
                      key={category.id}
                      style={styles.categorySelectItem}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                        <Ionicons name={category.icon as any} size={24} color={category.color} />
                      </View>
                      <View style={styles.categorySelectInfo}>
                        <Text style={styles.categorySelectName}>{category.name}</Text>
                        <Text style={styles.categorySelectCount}>{categoryCount}门课程</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              /* 第二步：选择具体课程 */
              <FlatList
                data={courses.filter(c => c.category === selectedCategory)}
                keyExtractor={(item) => item.id}
                style={styles.coursesList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.courseSelectItem}
                    onPress={() => addExerciseToday(item)}
                  >
                    <View style={styles.courseSelectInfo}>
                      <Text style={styles.courseSelectName}>{item.title}</Text>
                      <View style={styles.courseSelectMeta}>
                        <Text style={styles.courseSelectMetaText}>
                          <Ionicons name="time-outline" size={12} color="#9CA3AF" /> {item.duration}分钟
                        </Text>
                        <Text style={styles.courseSelectMetaText}>
                          <Ionicons name="flame-outline" size={12} color="#F59E0B" /> {item.calories}千卡
                        </Text>
                        <Text style={styles.courseSelectMetaText}>
                          <Ionicons name="star" size={12} color="#FBBF24" /> {item.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.courseInstructor}>教练: {item.instructor}</Text>
                    </View>
                    <Ionicons name="add-circle" size={28} color="#4ABAB8" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyCoursesModal}>
                    <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyCoursesModalText}>该分类暂无课程</Text>
                  </View>
                }
              />
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
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
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  planBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  planBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  noDataContainer: {
    flex: 1,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  noDataIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  prerequisitesList: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  prerequisiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  prerequisiteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prerequisiteIconDone: {
    backgroundColor: '#10B981',
  },
  prerequisiteIconPending: {
    backgroundColor: '#9CA3AF',
  },
  prerequisiteNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prerequisiteContent: {
    flex: 1,
  },
  prerequisiteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  prerequisiteDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  prerequisiteButton: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  prerequisiteButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  generateWeeklyButton: {
    flexDirection: 'row',
    backgroundColor: '#4ABAB8',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  generateWeeklyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateWeeklyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noDataButton: {
    marginTop: 20,
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  noDataButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateSelector: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  dateItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateItemSelected: {
    backgroundColor: '#4ABAB8',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  restDayContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  restDayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  restDayDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressUnit: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressGoal: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  exercisesSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  tipsText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  exerciseTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  exerciseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  // 周计划更新提示样式
  updateBanner: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  updateBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  updateBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  updateBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  updateBannerDesc: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },
  updateBannerButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // AI周计划总结样式
  aiSummaryCard: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiSummaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSummaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6D28D9',
    marginLeft: 10,
  },
  aiSummaryText: {
    fontSize: 14,
    color: '#4C1D95',
    lineHeight: 22,
  },
  // 多时段运动样式
  exerciseCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  timeSlotGroup: {
    marginBottom: 16,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeSlotTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  timeSlotCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  exerciseItemInGroup: {
    marginBottom: 8,
  },
  // 微调浮动按钮样式
  adjustFab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Modal样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  exampleContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  adjustInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  modalConfirmButton: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  // 添加运动按钮样式
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addExerciseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4ABAB8',
    marginLeft: 4,
  },
  // 已记录运动列表样式
  recordedExercisesList: {
    gap: 12,
  },
  recordedExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completedExerciseItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  recordedExerciseInfo: {
    flex: 1,
  },
  recordedExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordedExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#10B981',
    marginLeft: 2,
    fontWeight: '500',
  },
  recordedExerciseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  recordedExerciseMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  completeBtn: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordSummary: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  recordSummaryText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyRecords: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyRecordsText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyRecordsHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // 课程选择Modal样式
  courseModalContent: {
    maxHeight: '70%',
  },
  loadingCourses: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingCoursesText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  coursesList: {
    maxHeight: 400,
  },
  courseSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseSelectInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseSelectCategory: {
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  courseSelectMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  courseSelectMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyCoursesModal: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCoursesModalText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  // 删除按钮和操作区域样式
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteExerciseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  // 分类选择样式
  categoryList: {
    maxHeight: 400,
  },
  categorySelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categorySelectInfo: {
    flex: 1,
  },
  categorySelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  categorySelectCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  backToCategoryBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  courseInstructor: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
