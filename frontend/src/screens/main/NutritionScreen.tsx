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

  const [currentIntake, setCurrentIntake] = useState<NutritionGoal>({
    calories: 1456,
    protein: 98,
    carbs: 180,
    fat: 52
  });

  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showAddFood, setShowAddFood] = useState(false);
  const [foods, setFoods] = useState<Food[]>([
    {
      id: '1',
      name: '燕麦粥',
      calories: 158,
      protein: 6,
      carbs: 28,
      fat: 3,
      serving: '1碗 (200g)',
      meal: 'breakfast'
    },
    {
      id: '2',
      name: '煮鸡蛋',
      calories: 155,
      protein: 13,
      carbs: 1,
      fat: 11,
      serving: '2个',
      meal: 'breakfast'
    },
    {
      id: '3',
      name: '鸡胸肉沙拉',
      calories: 320,
      protein: 35,
      carbs: 12,
      fat: 8,
      serving: '1份',
      meal: 'lunch'
    }
  ]);

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
    { key: 'breakfast', label: '早餐', icon: 'sunny-outline', color: '#F59E0B' },
    { key: 'lunch', label: '午餐', icon: 'restaurant-outline', color: '#10B981' },
    { key: 'dinner', label: '晚餐', icon: 'moon-outline', color: '#6366F1' },
    { key: 'snack', label: '加餐', icon: 'nutrition-outline', color: '#8B5CF6' }
  ];

  // 计算进度百分比
  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* 顶部营养概览卡片 */}
      <LinearGradient
        colors={['#B8E5E5', '#D4EDD4']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>营养记录</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert('分享', '营养记录分享功能即将上线！');
            }}>
              <Ionicons name="share-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* 热量环形进度 */}
          <View style={styles.caloriesOverview}>
            <View style={styles.caloriesCircle}>
              <Text style={styles.caloriesCurrent}>{currentIntake.calories}</Text>
              <Text style={styles.caloriesGoal}>/ {dailyGoal.calories} kcal</Text>
            </View>
            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesTitle}>今日热量</Text>
              <Text style={styles.caloriesPercentage}>
                已摄入 {Math.round(calculateProgress(currentIntake.calories, dailyGoal.calories))}%
              </Text>
            </View>
          </View>

          {/* 三大营养素进度条 */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>蛋白质</Text>
              <View style={styles.macroProgress}>
                <View style={[
                  styles.macroFill,
                  { width: `${calculateProgress(currentIntake.protein, dailyGoal.protein)}%`, backgroundColor: '#FFB5C5' }
                ]} />
              </View>
              <Text style={styles.macroValue}>{currentIntake.protein}g/{dailyGoal.protein}g</Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>碳水</Text>
              <View style={styles.macroProgress}>
                <View style={[
                  styles.macroFill,
                  { width: `${calculateProgress(currentIntake.carbs, dailyGoal.carbs)}%`, backgroundColor: '#FFD88C' }
                ]} />
              </View>
              <Text style={styles.macroValue}>{currentIntake.carbs}g/{dailyGoal.carbs}g</Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>脂肪</Text>
              <View style={styles.macroProgress}>
                <View style={[
                  styles.macroFill,
                  { width: `${calculateProgress(currentIntake.fat, dailyGoal.fat)}%`, backgroundColor: '#B8E5E5' }
                ]} />
              </View>
              <Text style={styles.macroValue}>{currentIntake.fat}g/{dailyGoal.fat}g</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* 餐食选择标签 */}
      <View style={styles.mealTabs}>
        {mealTypes.map((meal) => (
          <TouchableOpacity
            key={meal.key}
            style={[
              styles.mealTab,
              selectedMeal === meal.key && { backgroundColor: meal.color }
            ]}
            onPress={() => setSelectedMeal(meal.key as any)}
          >
            <Ionicons
              name={meal.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={selectedMeal === meal.key ? colors.textWhite : '#6B7280'}
            />
            <Text style={[
              styles.mealTabText,
              selectedMeal === meal.key && { color: colors.textWhite }
            ]}>
              {meal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 食物列表 */}
      <ScrollView style={styles.foodsList} showsVerticalScrollIndicator={false}>
        <View style={styles.foodsHeader}>
          <Text style={styles.foodsTitle}>{mealTypes.find(m => m.key === selectedMeal)?.label}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddFood(true)}
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {getFoodsByMeal(selectedMeal).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>还没有记录{mealTypes.find(m => m.key === selectedMeal)?.label}</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddFood(true)}
            >
              <Text style={styles.addFirstText}>添加第一个食物</Text>
            </TouchableOpacity>
          </View>
        ) : (
          getFoodsByMeal(selectedMeal).map((food) => (
            <View key={food.id} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodServing}>{food.serving}</Text>
              </View>
              <View style={styles.foodNutrients}>
                <Text style={styles.foodCalories}>{food.calories} kcal</Text>
                <Text style={styles.foodMacros}>P:{food.protein}g C:{food.carbs}g F:{food.fat}g</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    '删除食物',
                    `确定要删除${food.name}吗？`,
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '删除', style: 'destructive', onPress: () => handleDeleteFood(food.id) }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* 添加食物模态框 */}
      <Modal
        visible={showAddFood}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFood(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
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
                style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text }]}
                value={newFood.name}
                onChangeText={(text) => setNewFood({...newFood, name: text})}
                placeholder="请输入食物名称"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>热量 (kcal) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text }]}
                value={newFood.calories}
                onChangeText={(text) => setNewFood({...newFood, calories: text})}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>蛋白质 (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text }]}
                  value={newFood.protein}
                  onChangeText={(text) => setNewFood({...newFood, protein: text})}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                <Text style={styles.inputLabel}>碳水 (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text }]}
                  value={newFood.carbs}
                  onChangeText={(text) => setNewFood({...newFood, carbs: text})}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>脂肪 (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text }]}
                  value={newFood.fat}
                  onChangeText={(text) => setNewFood({...newFood, fat: text})}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                <Text style={styles.inputLabel}>分量</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text }]}
                  value={newFood.serving}
                  onChangeText={(text) => setNewFood({...newFood, serving: text})}
                  placeholder="1份"
                  placeholderTextColor={colors.textSecondary}
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
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  caloriesOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  caloriesCurrent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  caloriesGoal: {
    fontSize: 12,
    color: '#6B7280',
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesTitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  caloriesPercentage: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  macrosContainer: {
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroLabel: {
    width: 60,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  macroProgress: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    width: 80,
    fontSize: 12,
    color: '#374151',
    textAlign: 'right',
  },
  mealTabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
  },
  mealTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  mealTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  foodsList: {
    flex: 1,
    marginHorizontal: 24,
    marginTop: 24,
  },
  foodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  foodsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addFirstText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  foodItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  foodInfo: {
    flex: 2,
    marginRight: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 12,
    color: '#6B7280',
  },
  foodNutrients: {
    flex: 1,
    alignItems: 'flex-end',
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  foodMacros: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    color: '#10B981',
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
  },
});