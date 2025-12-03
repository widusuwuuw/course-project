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
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

// 食物图标映射
const foodIcons = {
  '全麦面包': '🍞',
  '水煮蛋': '🥚',
  '脱脂牛奶': '🥛',
  '燕麦粥': '🥣',
  '鸡胸肉': '🍗',
  '沙拉': '🥗',
  '香蕉': '🍌',
  '煮鸡蛋': '🥚',
  '全麦吐司': '🍞',
  '希腊酸奶': '🥛',
  '混合坚果': '🥜',
  '豆浆': '🥛',
  '菜包': '🥟',
};

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function NutritionScreen({ navigation }: { navigation: StackNavigationProp<any> }) {
  const { colors } = useTheme();

  // 模拟数据
  const [dailyGoal] = useState<NutritionGoal>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  });

  // 日期选择数据
  const [dates, setDates] = useState([
    { day: '一', date: 25, isToday: false },
    { day: '二', date: 26, isToday: false },
    { day: '今', date: 27, isToday: true },
    { day: '四', date: 28, isToday: false },
    { day: '五', date: 29, isToday: false },
  ]);

  const [selectedDate, setSelectedDate] = useState(27); // 默认选中今天

  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showAddFood, setShowAddFood] = useState(false);
  // 不同日期的食物数据
  const foodsDataByDate = {
    25: [
      {
        id: '1',
        name: '燕麦粥',
        calories: 158,
        protein: 6,
        carbs: 28,
        fat: 3,
        serving: '1碗',
        meal: 'breakfast'
      },
      {
        id: '2',
        name: '香蕉',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        serving: '1根',
        meal: 'breakfast'
      }
    ],
    26: [
      {
        id: '1',
        name: '煮鸡蛋',
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        serving: '2个',
        meal: 'breakfast'
      },
      {
        id: '2',
        name: '全麦吐司',
        calories: 120,
        protein: 4,
        carbs: 20,
        fat: 3,
        serving: '2片',
        meal: 'breakfast'
      }
    ],
    27: [
      {
        id: '1',
        name: '全麦面包',
        calories: 140,
        protein: 6,
        carbs: 28,
        fat: 3,
        serving: '2片',
        meal: 'breakfast'
      },
      {
        id: '2',
        name: '水煮蛋',
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        serving: '2个',
        meal: 'breakfast'
      },
      {
        id: '3',
        name: '脱脂牛奶',
        calories: 80,
        protein: 6.5,
        carbs: 8,
        fat: 0.2,
        serving: '200ml',
        meal: 'breakfast'
      }
    ],
    28: [
      {
        id: '1',
        name: '希腊酸奶',
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.7,
        serving: '150g',
        meal: 'breakfast'
      },
      {
        id: '2',
        name: '混合坚果',
        calories: 180,
        protein: 6,
        carbs: 6,
        fat: 16,
        serving: '30g',
        meal: 'breakfast'
      }
    ],
    29: [
      {
        id: '1',
        name: '豆浆',
        calories: 80,
        protein: 7,
        carbs: 4,
        fat: 4,
        serving: '250ml',
        meal: 'breakfast'
      },
      {
        id: '2',
        name: '菜包',
        calories: 200,
        protein: 8,
        carbs: 35,
        fat: 6,
        serving: '1个',
        meal: 'breakfast'
      }
    ]
  };

  const [foods, setFoods] = useState<Food[]>(foodsDataByDate[selectedDate as keyof typeof foodsDataByDate] || []);

  // 不同日期的营养摄入数据
  const nutritionDataByDate = {
    25: { calories: 1200, protein: 80, carbs: 150, fat: 40 },
    26: { calories: 1350, protein: 90, carbs: 165, fat: 45 },
    27: { calories: 1456, protein: 98, carbs: 180, fat: 52 },
    28: { calories: 1600, protein: 105, carbs: 195, fat: 58 },
    29: { calories: 1100, protein: 75, carbs: 140, fat: 38 }
  };

  const [currentIntake, setCurrentIntake] = useState<NutritionGoal>(
    nutritionDataByDate[selectedDate as keyof typeof nutritionDataByDate]
  );

  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    serving: ''
  });

  // 餐食类型配置
  const mealTypes = [
    { key: 'breakfast', label: '早餐', icon: 'sunny-outline', color: '#4ABAB8' },
    { key: 'lunch', label: '午餐', icon: 'restaurant-outline', color: '#4ABAB8' },
    { key: 'dinner', label: '晚餐', icon: 'moon-outline', color: '#4ABAB8' },
    { key: 'snack', label: '加餐', icon: 'nutrition-outline', color: '#4ABAB8' }
  ];

  // 计算进度百分比
  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  // 日期切换处理函数
  const handleDateSelect = (date: number) => {
    setSelectedDate(date);
    // 更新食物数据
    const newFoods = foodsDataByDate[date as keyof typeof foodsDataByDate] || [];
    setFoods(newFoods);

    // 更新营养摄入数据
    const newNutrition = nutritionDataByDate[date as keyof typeof nutritionDataByDate];
    if (newNutrition) {
      setCurrentIntake(newNutrition);
    }

    // 更新日期选中状态
    const updatedDates = dates.map(d => ({
      ...d,
      isToday: d.date === date
    }));
    setDates(updatedDates);
  };

  // 过滤选中餐食的食物
  const getFoodsByMeal = (meal: string) => {
    return foods.filter(food => food.meal === meal);
  };

  // 添加新食物
  const handleAddFood = () => {
    if (!newFood.name || !newFood.calories) {
      Alert.alert('提示', '请至少填写食物名称和热量');
      return;
    }

    const food: Food = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: parseFloat(newFood.calories) || 0,
      protein: parseFloat(newFood.protein) || 0,
      carbs: parseFloat(newFood.carbs) || 0,
      fat: parseFloat(newFood.fat) || 0,
      serving: newFood.serving || '1份',
      meal: selectedMeal
    };

    setFoods([...foods, food]);
    setNewFood({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      serving: ''
    });
    setShowAddFood(false);

    // 更新摄入量
    setCurrentIntake(prev => ({
      calories: prev.calories + food.calories,
      protein: prev.protein + food.protein,
      carbs: prev.carbs + food.carbs,
      fat: prev.fat + food.fat
    }));
  };

  // 删除食物
  const handleDeleteFood = (foodId: string) => {
    const food = foods.find(f => f.id === foodId);
    if (food) {
      setFoods(foods.filter(f => f.id !== foodId));
      setCurrentIntake(prev => ({
        calories: Math.max(0, prev.calories - food.calories),
        protein: Math.max(0, prev.protein - food.protein),
        carbs: Math.max(0, prev.carbs - food.carbs),
        fat: Math.max(0, prev.fat - food.fat)
      }));
    }
  };

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
          <Text style={styles.navTitle}>营养追踪</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert('分享', '营养记录分享功能即将上线！');
          }}>
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 营养仪表盘 */}
        <View style={styles.dashboard}>
          {/* 左侧圆环 */}
          <View style={styles.circularProgress}>
            <View style={styles.progressRing}>
              <View style={styles.progressRingInner}>
                <Text style={styles.progressSmallText}>剩余</Text>
                <Text style={styles.progressBigText}>{dailyGoal.calories - currentIntake.calories}</Text>
                <Text style={styles.progressSmallText}>kcal</Text>
              </View>
            </View>
          </View>

          {/* 右侧进度条 */}
          <View style={styles.progressBars}>
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>蛋白质</Text>
                <Text style={styles.progressValueText}>{currentIntake.protein}/{dailyGoal.protein}g</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${calculateProgress(currentIntake.protein, dailyGoal.protein)}%` }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>碳水</Text>
                <Text style={styles.progressValueText}>{currentIntake.carbs}/{dailyGoal.carbs}g</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${calculateProgress(currentIntake.carbs, dailyGoal.carbs)}%` }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>脂肪</Text>
                <Text style={styles.progressValueText}>{currentIntake.fat}/{dailyGoal.fat}g</Text>
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
        {/* 日期选择条 */}
        <View style={styles.dateSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  date.isToday && styles.dateItemActive
                ]}
                onPress={() => handleDateSelect(date.date)}
              >
                <Text style={[
                  styles.dateDay,
                  date.isToday && styles.dateDayActive
                ]}>{date.day}</Text>
                <Text style={[
                  styles.dateNumber,
                  date.isToday && styles.dateNumberActive
                ]}>{date.date}</Text>
                {date.isToday && <View style={styles.dateDot} />}
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

        {/* 摄入总计 */}
        <View style={styles.intakeSummary}>
          <Text style={styles.intakeLabel}>{mealTypes.find(m => m.key === selectedMeal)?.label}摄入</Text>
          <Text style={styles.intakeCalories}>
            {getFoodsByMeal(selectedMeal).reduce((sum, food) => sum + food.calories, 0)}
            <Text style={styles.intakeUnit}> kcal</Text>
          </Text>
        </View>

        {/* 食物列表 */}
        <View style={styles.foodList}>
          {getFoodsByMeal(selectedMeal).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>还没有记录{mealTypes.find(m => m.key === selectedMeal)?.label}</Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setShowAddFood(true)}
              >
                <Text style={styles.addFirstText}>添加食物</Text>
              </TouchableOpacity>
            </View>
          ) : (
            getFoodsByMeal(selectedMeal).map((food) => (
              <View key={food.id} style={styles.foodItem}>
                <View style={styles.foodIcon}>
                  <Text style={styles.foodEmoji}>{foodIcons[food.name as keyof typeof foodIcons] || '🍽️'}</Text>
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodDetails}>{food.serving} · {food.protein}g 蛋白质</Text>
                </View>
                <View style={styles.foodCaloriesContainer}>
                  <Text style={styles.foodCalories}>{food.calories}</Text>
                  <Text style={styles.foodUnit}>kcal</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 悬浮添加按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddFood(true)}
      >
        <LinearGradient
          colors={['#4ABAB8', '#389BA2']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* 添加食物模态框 */}
      <Modal
        visible={showAddFood}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFood(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: '#F8FAFB' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFood(false)}>
              <Text style={styles.modalCancel}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>添加食物</Text>
            <TouchableOpacity onPress={handleAddFood}>
              <Text style={styles.modalSave}>保存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>食物名称 *</Text>
              <TextInput
                style={styles.input}
                value={newFood.name}
                onChangeText={(text) => setNewFood({...newFood, name: text})}
                placeholder="请输入食物名称"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>热量 (kcal) *</Text>
              <TextInput
                style={styles.input}
                value={newFood.calories}
                onChangeText={(text) => setNewFood({...newFood, calories: text})}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>蛋白质 (g)</Text>
                <TextInput
                  style={styles.input}
                  value={newFood.protein}
                  onChangeText={(text) => setNewFood({...newFood, protein: text})}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                <Text style={styles.inputLabel}>碳水 (g)</Text>
                <TextInput
                  style={styles.input}
                  value={newFood.carbs}
                  onChangeText={(text) => setNewFood({...newFood, carbs: text})}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>脂肪 (g)</Text>
                <TextInput
                  style={styles.input}
                  value={newFood.fat}
                  onChangeText={(text) => setNewFood({...newFood, fat: text})}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                <Text style={styles.inputLabel}>分量</Text>
                <TextInput
                  style={styles.input}
                  value={newFood.serving}
                  onChangeText={(text) => setNewFood({...newFood, serving: text})}
                  placeholder="1份"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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

  // 悬浮按钮
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
    padding: 24,
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
});