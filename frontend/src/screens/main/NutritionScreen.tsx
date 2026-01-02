import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCurrentWeeklyPlan, convertWeeklyPlanToNutritionData, DayNutritionData, NutritionFood } from '../../hooks/useWeeklyPlan';
import { aiAdjustDietPlan, apiGet, apiPost } from '../../api/client';

const { width } = Dimensions.get('window');

// 食物图标映射
const foodIcons: Record<string, string> = {
  '全麦面包': '🍞',
  '水煮蛋': '🥚',
  '脱脂牛奶': '🥛',
  '燕麦': '🥣',
  '燕麦粥': '🥣',
  '鸡胸肉': '🍗',
  '沙拉': '🥗',
  '香蕉': '🍌',
  '煮鸡蛋': '🥚',
  '鸡蛋': '🥚',
  '全麦吐司': '🍞',
  '希腊酸奶': '🥛',
  '酸奶': '🥛',
  '牛奶': '🥛',
  '混合坚果': '🥜',
  '坚果': '🥜',
  '核桃': '🥜',
  '杏仁': '🥜',
  '豆浆': '🥛',
  '菜包': '🥟',
  '糙米': '🍚',
  '白米饭': '🍚',
  '三文鱼': '🐟',
  '鳕鱼': '🐟',
  '西兰花': '🥦',
  '菠菜': '🥬',
  '番茄': '🍅',
  '苹果': '🍎',
  '蓝莓': '🫐',
  '橙子': '🍊',
  '豆腐': '🧈',
  '藜麦': '🌾',
  '红薯': '🍠',
  '羽衣甘蓝': '🥬',
  '奇亚籽': '🌱',
  '野生米': '🌾',
  '胡萝卜': '🥕',
  '黄瓜': '🥒',
  '香菇': '🍄',
};

interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function NutritionScreen({ navigation }: { navigation: StackNavigationProp<any> }) {
  const { colors } = useTheme();
  
  // 使用后端周计划数据
  const { weeklyPlan, loading, error, refresh } = useCurrentWeeklyPlan();
  
  // 转换后的营养数据
  const nutritionData = useMemo(() => {
    return convertWeeklyPlanToNutritionData(weeklyPlan);
  }, [weeklyPlan]);

  // 日期和餐食选择状态
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');

  // AI微调状态
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustRequest, setAdjustRequest] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // 根据当前周生成日期列表（而不是周计划存储的日期）
  // 这样即使周计划是历史数据，日历也显示当前周的日期
  const dates = useMemo(() => {
    if (!weeklyPlan) return [];
    
    // 使用当前周的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;  // 计算到本周一的偏移
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
    
    return DAY_NAMES.map((day, index) => {
      const dateObj = new Date(weekStart);
      dateObj.setDate(weekStart.getDate() + index);
      const dateNum = dateObj.getDate();
      const isToday = dateObj.toDateString() === today.toDateString();
      
      return {
        day: isToday ? '今' : day,
        date: dateNum,
        isToday,
        fullDate: dateObj,
      };
    });
  }, [weeklyPlan]);

  // 设置默认选中日期为今天
  useEffect(() => {
    if (dates.length > 0 && selectedDate === null) {
      const todayItem = dates.find(d => d.isToday);
      setSelectedDate(todayItem ? todayItem.date : dates[0].date);
    }
  }, [dates, selectedDate]);

  // 获取当前选中日期的营养数据
  const currentDayData: DayNutritionData | null = useMemo(() => {
    if (!nutritionData || selectedDate === null) return null;
    return nutritionData[selectedDate] || null;
  }, [nutritionData, selectedDate]);

  // 计算当前日的目标和实际摄入
  const dailyGoal: NutritionGoal = useMemo(() => {
    // 从后端获取动态营养目标
    const targets = currentDayData?.nutritionTargets;
    return {
      calories: currentDayData?.targetCalories || 2000,
      protein: targets?.protein || 90,   // 默认值根据2000kcal计算
      carbs: targets?.carbs || 275,      // 默认值根据2000kcal计算
      fat: targets?.fat || 60,           // 默认值根据2000kcal计算
    };
  }, [currentDayData]);

  const currentIntake: NutritionGoal = useMemo(() => {
    if (!currentDayData) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: currentDayData.dailyTotals.calories,
      protein: currentDayData.dailyTotals.protein,
      carbs: currentDayData.dailyTotals.carbs,
      fat: currentDayData.dailyTotals.fat,
    };
  }, [currentDayData]);

  // 餐食类型配置
  const mealTypes = [
    { key: 'breakfast', label: '早餐', icon: 'sunny-outline', color: '#4ABAB8' },
    { key: 'lunch', label: '午餐', icon: 'restaurant-outline', color: '#4ABAB8' },
    { key: 'dinner', label: '晚餐', icon: 'moon-outline', color: '#4ABAB8' },
    { key: 'snacks', label: '加餐', icon: 'nutrition-outline', color: '#4ABAB8' }
  ];

  // 计算进度百分比
  const calculateProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  // 获取当前餐食的食物列表
  const getCurrentMealFoods = (): NutritionFood[] => {
    if (!currentDayData) return [];
    const meal = currentDayData.meals[selectedMeal];
    return meal?.foods || [];
  };

  // 获取当前餐食的卡路里
  const getCurrentMealCalories = (): number => {
    if (!currentDayData) return 0;
    const meal = currentDayData.meals[selectedMeal];
    return meal?.calories || 0;
  };

  // 获取食物图标
  const getFoodIcon = (foodName: string): string => {
    // 尝试完全匹配
    if (foodIcons[foodName]) return foodIcons[foodName];
    // 尝试部分匹配
    for (const [key, icon] of Object.entries(foodIcons)) {
      if (foodName.includes(key) || key.includes(foodName)) {
        return icon;
      }
    }
    return '🍽️';
  };

  // AI微调饮食计划
  const handleAdjustDietPlan = async () => {
    if (!adjustRequest.trim()) {
      Alert.alert('提示', '请输入调整需求');
      return;
    }
    if (!weeklyPlan?.id) {
      Alert.alert('错误', '暂无周计划数据');
      return;
    }

    try {
      setAdjusting(true);
      const result = await aiAdjustDietPlan(weeklyPlan.id, adjustRequest, 'diet');
      console.log('AI调整结果:', result);
      
      if (result.status === 'success') {
        // 先关闭Modal和清空输入
        setShowAdjustModal(false);
        setAdjustRequest('');
        
        // 刷新数据
        await refresh();
        
        // 延迟显示成功提示，确保Modal已关闭
        setTimeout(() => {
          const changesText = result.changes?.length > 0 
            ? `\n\n调整内容：\n${result.changes.join('\n')}` 
            : '';
          Alert.alert('✅ 调整成功', `${result.explanation || '饮食计划已更新'}${changesText}`);
        }, 300);
      } else {
        Alert.alert('❌ 调整失败', result.message || '无法完成调整，请尝试更具体的描述');
      }
    } catch (error: any) {
      console.error('调整饮食计划失败:', error);
      Alert.alert('❌ 调整失败', error.message || '请稍后重试');
    } finally {
      setAdjusting(false);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#4ABAB8" />
        <LinearGradient
          colors={['#4ABAB8', '#389BA2']}
          style={[styles.headerGradient, { justifyContent: 'center', alignItems: 'center' }]}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', marginTop: 16, fontSize: 16 }}>加载营养计划中...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // 错误或无数据状态
  if (error || !nutritionData || !currentDayData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#4ABAB8" />
        <LinearGradient
          colors={['#4ABAB8', '#389BA2']}
          style={styles.headerGradient}
        >
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>饮食计划</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="nutrition-outline" size={64} color="#9CA3AF" />
          <Text style={{ fontSize: 18, color: '#374151', marginTop: 16, textAlign: 'center' }}>
            {error || '暂无营养计划'}
          </Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            请先生成月度健康计划，系统将自动为您制定每周饮食方案
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: '#4ABAB8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
            onPress={refresh}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>刷新数据</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#4ABAB8" />

      {/* 顶部渐变头部区域 */}
      <LinearGradient
        colors={['#4ABAB8', '#389BA2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* 导航栏 */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>饮食计划</Text>
          <TouchableOpacity onPress={refresh}>
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 营养仪表盘 */}
        <View style={styles.dashboard}>
          {/* 左侧圆环 - 显示今日计划总热量 */}
          <View style={styles.circularProgress}>
            <View style={styles.progressRing}>
              <View style={styles.progressRingInner}>
                <Text style={styles.progressSmallText}>今日计划</Text>
                <Text style={styles.progressBigText}>{Math.round(currentIntake.calories)}</Text>
                <Text style={styles.progressSmallText}>kcal</Text>
              </View>
            </View>
          </View>

          {/* 右侧进度条 - 显示计划营养分布 */}
          <View style={styles.progressBars}>
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>蛋白质</Text>
                <Text style={styles.progressValueText}>{Math.round(currentIntake.protein)}g</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${calculateProgress(currentIntake.protein, dailyGoal.protein)}%` }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>碳水</Text>
                <Text style={styles.progressValueText}>{Math.round(currentIntake.carbs)}g</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${calculateProgress(currentIntake.carbs, dailyGoal.carbs)}%` }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>脂肪</Text>
                <Text style={styles.progressValueText}>{Math.round(currentIntake.fat)}g</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${calculateProgress(currentIntake.fat, dailyGoal.fat)}%` }]} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* 主要内容区域 */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* 营养记录入口 */}
        <TouchableOpacity
          style={styles.dietRecordEntry}
          onPress={() => navigation.navigate('DietRecord' as never)}
        >
          <View style={styles.dietRecordLeft}>
            <View style={styles.dietRecordIcon}>
              <Ionicons name="add-circle" size={28} color="#4ABAB8" />
            </View>
            <View>
              <Text style={styles.dietRecordTitle}>记录今天吃了什么</Text>
              <Text style={styles.dietRecordSubtitle}>追踪实际饮食，对比计划执行</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 日期选择条 */}
        <View style={styles.dateSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((dateItem, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  selectedDate === dateItem.date && styles.dateItemActive
                ]}
                onPress={() => setSelectedDate(dateItem.date)}
              >
                <Text style={[
                  styles.dateDay,
                  selectedDate === dateItem.date && styles.dateDayActive
                ]}>{dateItem.day}</Text>
                <Text style={[
                  styles.dateNumber,
                  selectedDate === dateItem.date && styles.dateNumberActive
                ]}>{dateItem.date}</Text>
                {dateItem.isToday && selectedDate === dateItem.date && <View style={styles.dateDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 餐食切换标签 */}
        <View style={styles.mealTabs}>
          {mealTypes.map((meal) => (
            <TouchableOpacity
              key={meal.key}
              style={styles.mealTab}
              onPress={() => setSelectedMeal(meal.key as any)}
            >
              <Text style={[
                styles.mealTabText,
                selectedMeal === meal.key && styles.mealTabTextActive
              ]}>{meal.label}</Text>
              <View style={[
                styles.mealTabIndicator,
                selectedMeal === meal.key && styles.mealTabIndicatorActive
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 计划热量总计 */}
        <View style={styles.intakeSummary}>
          <Text style={styles.intakeLabel}>{mealTypes.find(m => m.key === selectedMeal)?.label}计划</Text>
          <Text style={styles.intakeCalories}>
            {getCurrentMealCalories()}
            <Text style={styles.intakeUnit}> kcal</Text>
          </Text>
        </View>

        {/* 食物列表 */}
        <View style={styles.foodList}>
          {getCurrentMealFoods().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无{mealTypes.find(m => m.key === selectedMeal)?.label}安排</Text>
            </View>
          ) : (
            getCurrentMealFoods().map((food, idx) => (
              <View 
                key={`${food.food_id}-${idx}`} 
                style={styles.foodItem}
              >
                <View style={styles.foodIcon}>
                  <Text style={styles.foodEmoji}>{getFoodIcon(food.name)}</Text>
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodDetails}>
                    {food.portion} · {food.protein}g蛋白 · {food.carbs}g碳水 · {food.fat}g脂肪
                  </Text>
                </View>
                <View style={styles.foodCaloriesContainer}>
                  <Text style={styles.foodCalories}>{food.calories}</Text>
                  <Text style={styles.foodUnit}>kcal</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 运动-饮食联动卡片 */}
        {currentDayData?.exerciseDietLink && currentDayData.exerciseDietLink.exercise_calories > 0 && (
          <View style={styles.exerciseLinkCard}>
            <View style={styles.exerciseLinkHeader}>
              <Ionicons name="fitness-outline" size={20} color="#8B5CF6" />
              <Text style={styles.exerciseLinkTitle}>运动-饮食联动</Text>
              {currentDayData.exerciseDietLink.has_strength_training && (
                <View style={[styles.exerciseTag, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.exerciseTagText, { color: '#1D4ED8' }]}>💪 力量日</Text>
                </View>
              )}
              {currentDayData.exerciseDietLink.is_high_intensity && (
                <View style={[styles.exerciseTag, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.exerciseTagText, { color: '#D97706' }]}>⚡ 高强度</Text>
                </View>
              )}
            </View>
            
            <View style={styles.exerciseLinkStats}>
              <View style={styles.exerciseLinkStatItem}>
                <Text style={styles.exerciseLinkStatLabel}>运动消耗</Text>
                <Text style={[styles.exerciseLinkStatValue, { color: '#EF4444' }]}>
                  -{currentDayData.exerciseDietLink.exercise_calories} kcal
                </Text>
              </View>
              <View style={styles.exerciseLinkStatItem}>
                <Text style={styles.exerciseLinkStatLabel}>热量补充</Text>
                <Text style={[styles.exerciseLinkStatValue, { color: '#10B981' }]}>
                  +{currentDayData.exerciseDietLink.calorie_adjustment} kcal
                </Text>
              </View>
              {currentDayData.exerciseDietLink.primary_time_slot && (
                <View style={styles.exerciseLinkStatItem}>
                  <Text style={styles.exerciseLinkStatLabel}>运动时段</Text>
                  <Text style={styles.exerciseLinkStatValue}>
                    {currentDayData.exerciseDietLink.primary_time_slot}
                  </Text>
                </View>
              )}
            </View>
            
            {currentDayData.exerciseDietLink.post_exercise_tips && 
             currentDayData.exerciseDietLink.post_exercise_tips.length > 0 && (
              <View style={styles.exerciseLinkTips}>
                <Text style={styles.exerciseLinkTipsTitle}>💡 运动后饮食建议</Text>
                {currentDayData.exerciseDietLink.post_exercise_tips.slice(0, 3).map((tip, idx) => (
                  <View key={idx} style={styles.exerciseLinkTipItem}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.exerciseLinkTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 健康饮食建议卡片 */}
        {currentDayData && currentDayData.healthAdvice && currentDayData.healthAdvice.length > 0 && (
          <View style={styles.healthAdviceCard}>
            <View style={styles.healthAdviceHeader}>
              <Ionicons name="medical-outline" size={20} color="#F59E0B" />
              <Text style={styles.healthAdviceTitle}>个性化饮食建议</Text>
              {currentDayData.dietaryRestrictions && currentDayData.dietaryRestrictions.length > 0 && (
                <View style={styles.restrictionBadge}>
                  <Text style={styles.restrictionBadgeText}>
                    {currentDayData.dietaryRestrictions.length}项
                  </Text>
                </View>
              )}
            </View>
            {currentDayData.healthAdvice.map((advice, idx) => (
              <View key={idx} style={styles.healthAdviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.healthAdviceText}>{advice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 饮水目标 */}
        {currentDayData && (
          <View style={styles.hydrationCard}>
            <View style={styles.hydrationHeader}>
              <Ionicons name="water-outline" size={20} color="#4ABAB8" />
              <Text style={styles.hydrationTitle}>今日饮水目标</Text>
            </View>
            <Text style={styles.hydrationValue}>{currentDayData.hydrationGoal}</Text>
          </View>
        )}
        
        {/* 底部留白，避免被浮动按钮遮挡 */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* AI微调浮动按钮 */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowAdjustModal(true)}
      >
        <Ionicons name="sparkles" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* AI微调Modal */}
      <Modal
        visible={showAdjustModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🤖 AI 饮食微调</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>告诉AI你想怎么调整饮食计划</Text>
            
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>示例：</Text>
              <TouchableOpacity 
                style={styles.exampleTag}
                onPress={() => setAdjustRequest('把周三的早餐换成清淡点的')}
              >
                <Text style={styles.exampleText}>把周三的早餐换成清淡点的</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exampleTag}
                onPress={() => setAdjustRequest('周末减少碳水摄入')}
              >
                <Text style={styles.exampleText}>周末减少碳水摄入</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exampleTag}
                onPress={() => setAdjustRequest('周一午餐多加点蛋白质')}
              >
                <Text style={styles.exampleText}>周一午餐多加点蛋白质</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exampleTag}
                onPress={() => setAdjustRequest('把鸡蛋换成豆腐')}
              >
                <Text style={styles.exampleText}>把鸡蛋换成豆腐</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.adjustInput}
              placeholder="输入你的调整需求..."
              placeholderTextColor="#9CA3AF"
              value={adjustRequest}
              onChangeText={setAdjustRequest}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAdjustModal(false);
                  setAdjustRequest('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, adjusting && styles.buttonDisabled]}
                onPress={handleAdjustDietPlan}
                disabled={adjusting}
              >
                {adjusting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>调整</Text>
                )}
              </TouchableOpacity>
            </View>
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

  // 顶部渐变头部
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 仪表盘
  dashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  circularProgress: {
    width: 128,
    height: 128,
    marginRight: 32,
  },

  progressRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressRingInner: {
    alignItems: 'center',
  },

  progressSmallText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },

  progressBigText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  progressBars: {
    flex: 1,
    gap: 12,
  },

  progressItem: {
    gap: 4,
  },

  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressLabelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  progressValueText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },

  // 营养记录入口
  dietRecordEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#4ABAB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0F7F6',
  },

  dietRecordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  dietRecordIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0F7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dietRecordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },

  dietRecordSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // 主要内容区域
  mainContent: {
    flex: 1,
    marginTop: -16,
    paddingTop: 16,
  },

  // 日期选择器
  dateSelector: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },

  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },

  dateItemActive: {
    backgroundColor: '#4ABAB8',
    shadowColor: '#4ABAB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  dateDay: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },

  dateDayActive: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  dateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },

  dateNumberActive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  dateDot: {
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginTop: 4,
  },

  // 餐食标签
  mealTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
    gap: 24,
  },

  mealTab: {
    alignItems: 'center',
    paddingVertical: 4,
  },

  mealTabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },

  mealTabTextActive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ABAB8',
  },

  mealTabIndicator: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },

  mealTabIndicatorActive: {
    backgroundColor: '#4ABAB8',
  },

  // 摄入总结
  intakeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  intakeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  intakeCalories: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },

  intakeUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },

  // 食物列表
  foodList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },

  foodItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F9FAFB',
  },

  foodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  foodEmoji: {
    fontSize: 24,
  },

  foodInfo: {
    flex: 1,
  },

  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },

  foodDetails: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  foodCaloriesContainer: {
    alignItems: 'flex-end',
  },

  foodCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ABAB8',
  },

  foodUnit: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  // 空状态
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
  },

  addFirstButton: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },

  addFirstText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // 运动-饮食联动卡片
  exerciseLinkCard: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  exerciseLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },

  exerciseLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B21B6',
    marginLeft: 8,
    flex: 1,
  },

  exerciseTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  exerciseTagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  exerciseLinkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  exerciseLinkStatItem: {
    alignItems: 'center',
  },

  exerciseLinkStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },

  exerciseLinkStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  exerciseLinkTips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },

  exerciseLinkTipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },

  exerciseLinkTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
    marginTop: 6,
    marginRight: 8,
  },

  exerciseLinkTipText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },

  // 健康建议卡片
  healthAdviceCard: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  healthAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  healthAdviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },

  restrictionBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  restrictionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  healthAdviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 8,
  },

  healthAdviceText: {
    fontSize: 13,
    color: '#78350F',
    marginLeft: 8,
    lineHeight: 18,
    flex: 1,
  },

  // 饮水卡片
  hydrationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },

  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  hydrationTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },

  hydrationValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ABAB8',
  },

  // 悬浮按钮 (保留以备将来使用)
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#4ABAB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 模态框
  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  modalCancel: {
    fontSize: 16,
    color: '#9CA3AF',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },

  modalSave: {
    fontSize: 16,
    color: '#4ABAB8',
    fontWeight: '600',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },

  // 提示卡片
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },

  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  // AI微调浮动按钮
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4ABAB8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ABAB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // AI微调Modal样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },

  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  examplesTitle: {
    fontSize: 14,
    color: '#6B7280',
    width: '100%',
    marginBottom: 4,
  },

  exampleTag: {
    backgroundColor: '#E0F7F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  exampleText: {
    fontSize: 13,
    color: '#4ABAB8',
  },

  adjustInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#1F2937',
    marginBottom: 16,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4ABAB8',
    alignItems: 'center',
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // 饮食记录相关样式
  recordSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  recordedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
  },

  recordedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  recordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  recordedBadgeText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },

  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  adherenceText: {
    fontSize: 12,
    color: '#6B7280',
  },

  adherenceScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },

  recordedFoods: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },

  editRecordButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },

  editRecordText: {
    fontSize: 13,
    color: '#4ABAB8',
    fontWeight: '500',
  },

  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9F8',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2F1',
    borderStyle: 'dashed',
  },

  addRecordText: {
    fontSize: 14,
    color: '#4ABAB8',
    fontWeight: '500',
  },

  // 食物搜索和选择样式
  foodSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },

  foodSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },

  selectedFoodsPreview: {
    backgroundColor: '#E0F7F6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  selectedFoodsTitle: {
    fontSize: 13,
    color: '#4ABAB8',
    fontWeight: '600',
    marginBottom: 8,
  },

  selectedFoodsTags: {
    flexDirection: 'row',
    gap: 8,
  },

  selectedFoodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },

  selectedFoodTagText: {
    fontSize: 13,
    color: '#374151',
  },

  foodList: {
    flex: 1,
    marginBottom: 12,
  },

  foodListLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },

  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  foodItemSelected: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },

  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  foodCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  foodCheckboxChecked: {
    backgroundColor: '#4ABAB8',
    borderColor: '#4ABAB8',
  },

  foodItemName: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },

  foodItemDetail: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  foodItemRight: {
    alignItems: 'flex-end',
  },

  foodItemCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
  },

  foodItemCaloriesUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  emptyFoodList: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyFoodText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
});