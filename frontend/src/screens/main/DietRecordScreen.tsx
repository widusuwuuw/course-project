import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiGet, apiPost } from '../../api/client';

// 食物分类配置 - key对应后端返回的中文分类名
const FOOD_CATEGORIES = [
  { key: '谷物类', name: '谷物类', icon: '🍚', color: '#F59E0B', bgColor: '#FEF3C7' },
  { key: '蔬菜类', name: '蔬菜类', icon: '🥬', color: '#22C55E', bgColor: '#DCFCE7' },
  { key: '水果类', name: '水果类', icon: '🍎', color: '#EF4444', bgColor: '#FEE2E2' },
  { key: '蛋白质类', name: '蛋白质类', icon: '🍗', color: '#EC4899', bgColor: '#FCE7F3' },
  { key: '乳制品类', name: '乳制品类', icon: '🥛', color: '#3B82F6', bgColor: '#DBEAFE' },
  { key: '豆制品类', name: '豆制品类', icon: '🫘', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { key: '坚果种子类', name: '坚果种子类', icon: '🥜', color: '#D97706', bgColor: '#FEF3C7' },
  { key: '菌菇类', name: '菌菇类', icon: '🍄', color: '#78716C', bgColor: '#F5F5F4' },
];

// 餐次配置
const MEAL_TYPES = [
  { key: 'breakfast', name: '早餐', icon: '🌅', time: '6:00-9:00' },
  { key: 'lunch', name: '午餐', icon: '☀️', time: '11:00-13:00' },
  { key: 'dinner', name: '晚餐', icon: '🌙', time: '17:00-20:00' },
  { key: 'snacks', name: '加餐', icon: '🍪', time: '其他时间' },
];

interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  default_portion: string;
}

interface SelectedFood extends FoodItem {
  grams: number;  // 实际摄入克数
}

export default function DietRecordScreen() {
  const navigation = useNavigation();
  
  // 获取今天的日期字符串 (YYYY-MM-DD 格式，避免时区问题)
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  
  // 状态 - 使用日期字符串而不是Date对象，避免时区问题
  const [currentStep, setCurrentStep] = useState<'meal' | 'category' | 'foods'>('meal');
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayStr());  // 使用字符串格式
  const [existingRecords, setExistingRecords] = useState<{[key: string]: any}>({});
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // 加载食物数据库
  useEffect(() => {
    loadFoodDatabase();
  }, []);

  // 加载指定日期的已有记录
  const loadExistingRecords = useCallback(async (dateStr: string) => {
    try {
      console.log('[loadExistingRecords] 加载日期:', dateStr);
      const response = await apiGet(`/logs/diet?start_date=${dateStr}&end_date=${dateStr}`);
      
      console.log('[loadExistingRecords] 从后端获取的数据:', response);
      
      // 将记录按餐次组织
      const recordsMap: {[key: string]: any} = {};
      response.logs?.forEach((log: any) => {
        recordsMap[log.meal_type] = log;
      });
      
      console.log('[loadExistingRecords] 重组后的recordsMap:', recordsMap);
      setExistingRecords(recordsMap);
    } catch (error) {
      console.error('加载已有记录失败:', error);
    }
  }, []);

  // 每次页面获得焦点时重新加载记录（确保看到最新数据）
  useFocusEffect(
    useCallback(() => {
      loadExistingRecords(selectedDateStr);
    }, [selectedDateStr, loadExistingRecords])
  );

  // 日期变化时重新加载
  useEffect(() => {
    loadExistingRecords(selectedDateStr);
  }, [selectedDateStr, loadExistingRecords]);

  const loadFoodDatabase = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/logs/foods');
      setFoodDatabase(response.foods || []);
    } catch (error) {
      console.error('加载食物数据库失败:', error);
      Alert.alert('错误', '加载食物数据库失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前分类的食物列表
  const categoryFoods = useMemo(() => {
    if (!selectedCategory) return [];
    return foodDatabase.filter(f => f.category === selectedCategory);
  }, [foodDatabase, selectedCategory]);

  // 计算已选食物总热量（数据库中是每100g的营养值）
  const totalCalories = useMemo(() => {
    return selectedFoods.reduce((sum, f) => sum + (f.calories * f.grams / 100), 0);
  }, [selectedFoods]);

  const totalProtein = useMemo(() => {
    return selectedFoods.reduce((sum, f) => sum + (f.protein * f.grams / 100), 0);
  }, [selectedFoods]);

  const totalCarbs = useMemo(() => {
    return selectedFoods.reduce((sum, f) => sum + (f.carbs * f.grams / 100), 0);
  }, [selectedFoods]);

  const totalFat = useMemo(() => {
    return selectedFoods.reduce((sum, f) => sum + (f.fat * f.grams / 100), 0);
  }, [selectedFoods]);

  // 选择餐次（加载该餐次的已有记录）
  const handleSelectMeal = async (mealKey: string) => {
    setSelectedMeal(mealKey);
    
    // 检查该餐次是否有已有记录
    const existingRecord = existingRecords[mealKey];
    const hasExisting = existingRecord && existingRecord.foods?.length > 0;
    setIsEditingExisting(hasExisting);  // 记录是否在编辑已有记录
    
    if (hasExisting) {
      // 加载已有记录的食物
      const loadedFoods: SelectedFood[] = existingRecord.foods.map((f: any) => {
        // 解析克数：优先用 grams 字段，否则从 portion 解析
        let grams = f.grams || 100;
        if (!f.grams && f.portion) {
          const match = f.portion.match(/(\d+)/);
          if (match) grams = parseInt(match[1]);
        }
        
        // 后端保存的是计算后的总值，需要还原为每100g的值
        const ratio = grams / 100;
        
        return {
          id: f.food_id || f.id || `existing_${Date.now()}_${Math.random()}`,
          name: f.name,
          category: f.category || '',
          calories: ratio > 0 ? f.calories / ratio : f.calories,  // 还原为每100g
          protein: ratio > 0 ? f.protein / ratio : f.protein,
          carbs: ratio > 0 ? f.carbs / ratio : f.carbs,
          fat: ratio > 0 ? f.fat / ratio : f.fat,
          default_portion: '100g',
          grams: grams,
        };
      });
      setSelectedFoods(loadedFoods);
    } else {
      setSelectedFoods([]);
    }
    
    setCurrentStep('category');
  };

  // 选择分类
  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setCurrentStep('foods');
  };

  // 添加/移除食物（只更新状态，不自动保存）
  const toggleFood = (food: FoodItem) => {
    const existing = selectedFoods.find(f => f.id === food.id);
    if (existing) {
      setSelectedFoods(selectedFoods.filter(f => f.id !== food.id));
    } else {
      setSelectedFoods([...selectedFoods, { ...food, grams: 100 }]);
    }
  };

  // 修改食物克数
  const updateFoodGrams = (foodId: string, grams: number) => {
    setSelectedFoods(selectedFoods.map(f => {
      if (f.id === foodId) {
        // 限制在10-2000克之间
        const newGrams = Math.max(10, Math.min(2000, grams));
        return { ...f, grams: newGrams };
      }
      return f;
    }));
  };

  // 快捷增减克数
  const adjustFoodGrams = (foodId: string, delta: number) => {
    setSelectedFoods(selectedFoods.map(f => {
      if (f.id === foodId) {
        const newGrams = Math.max(10, Math.min(2000, f.grams + delta));
        return { ...f, grams: newGrams };
      }
      return f;
    }));
  };

  // 返回上一步
  const goBack = () => {
    if (currentStep === 'foods') {
      // 从食物列表(3)返回分类页(2)，保留选择
      setSelectedCategory(null);
      setCurrentStep('category');
    } else if (currentStep === 'category') {
      // 从分类页(2)返回餐次选择(1)，清空选择
      setSelectedFoods([]);
      setSelectedMeal(null);
      setCurrentStep('meal');
    } else {
      // 从餐次选择页退出
      navigation.goBack();
    }
  };

  // 保存记录（直接从页面3调用）
  const saveRecord = async () => {
    if (!selectedMeal) {
      Alert.alert('提示', '请选择餐次');
      return;
    }
    
    // 如果没有食物且是编辑模式，确认是否要删除
    if (selectedFoods.length === 0 && isEditingExisting) {
      Alert.alert(
        '确认删除',
        '您已清空所有食物，确定要删除这条饮食记录吗？',
        [
          { text: '取消', style: 'cancel' },
          { text: '确认删除', style: 'destructive', onPress: () => doSaveRecord() }
        ]
      );
      return;
    }
    
    // 直接保存
    doSaveRecord();
  };
  
  // 实际执行保存/删除操作
  const doSaveRecord = async () => {
    setSaving(true);
    try {
      // 直接使用字符串格式的日期，避免时区问题
      const dateStr = selectedDateStr;

      console.log('[doSaveRecord] 保存日期:', dateStr);

      const foods = selectedFoods.map(f => ({
        food_id: f.id,
        name: f.name,
        portion: `${f.grams}g`,
        quantity: 1,
        grams: f.grams,
        calories: Math.round(f.calories * f.grams / 100),
        protein: Math.round(f.protein * f.grams / 100 * 10) / 10,
        carbs: Math.round(f.carbs * f.grams / 100 * 10) / 10,
        fat: Math.round(f.fat * f.grams / 100 * 10) / 10,
      }));

      const isDeleting = foods.length === 0;
      const mealName = MEAL_TYPES.find(m => m.key === selectedMeal)?.name || '';
      
      // 后端API
      await apiPost(`/logs/diet?log_date=${dateStr}&meal_type=${selectedMeal}`, foods);

      // 删除后：清空所有状态，返回页面1，重新从后端加载
      if (isDeleting) {
        // 先清空本地状态
        setSelectedFoods([]);
        setSelectedCategory(null);
        setSelectedMeal(null);
        setIsEditingExisting(false);
        setCurrentStep('meal');
        
        // 强制重新从后端加载最新数据
        const freshResponse = await apiGet(`/logs/diet?start_date=${dateStr}&end_date=${dateStr}`);
        const freshRecordsMap: {[key: string]: any} = {};
        freshResponse.logs?.forEach((log: any) => {
          freshRecordsMap[log.meal_type] = log;
        });
        setExistingRecords(freshRecordsMap);
        
        Alert.alert('✅ 已删除', `${getDateDisplay()} ${mealName}记录已删除`);
      } else {
        // 保存后重新加载
        await loadExistingRecords(selectedDateStr);
        setIsEditingExisting(true);
        Alert.alert(
          '✅ 保存成功',
          `${getDateDisplay()} ${mealName}已保存\n共 ${foods.length} 种食物\n总热量: ${Math.round(totalCalories)} kcal`
        );
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 生成最近7天的日期列表 - 使用字符串格式避免时区问题
  const recentDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 0; i < 7; i++) {
      // 计算日期
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      dates.push({
        dateStr,  // 用于API和比较
        displayDate: `${d.getMonth() + 1}/${d.getDate()}`,  // 用于显示
        label: i === 0 ? '今天' : i === 1 ? '昨天' : dayNames[d.getDay()],
      });
    }
    return dates;
  }, []);

  // 切换日期（直接切换，丢弃未保存的选择）
  const handleSelectDate = (dateStr: string) => {
    if (selectedDateStr !== dateStr) {
      console.log('[handleSelectDate] 切换日期:', selectedDateStr, '->', dateStr);
      setSelectedFoods([]);
      setSelectedMeal(null);
      setCurrentStep('meal');
      setExistingRecords({});
      setSelectedDateStr(dateStr);
    }
  };

  // 渲染餐次选择
  const renderMealSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>记录饮食</Text>
      <Text style={styles.stepSubtitle}>选择日期和餐次，追踪每日营养</Text>
      
      {/* 日期选择器 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={styles.dateSelectorContent}
      >
        {recentDates.map((item, index) => {
          const isSelected = selectedDateStr === item.dateStr;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateItem, isSelected && styles.dateItemSelected]}
              onPress={() => handleSelectDate(item.dateStr)}
            >
              <Text style={[styles.dateLabel, isSelected && styles.dateLabelSelected]}>
                {item.label}
              </Text>
              <Text style={[styles.dateStr, isSelected && styles.dateStrSelected]}>
                {item.displayDate}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* 餐次选择 */}
      <Text style={styles.sectionTitle}>选择这是哪一餐</Text>
      <View style={styles.mealGrid}>
        {MEAL_TYPES.map(meal => {
          // 只显示后端已保存的数据
          const savedRecord = existingRecords[meal.key];
          const hasRecord = savedRecord?.foods?.length > 0;
          const recordCalories = hasRecord 
            ? savedRecord.foods.reduce((sum: number, f: any) => sum + (f.calories || 0), 0)
            : 0;
          
          return (
            <TouchableOpacity
              key={meal.key}
              style={[styles.mealCard, hasRecord && styles.mealCardHasRecord]}
              onPress={() => handleSelectMeal(meal.key)}
            >
              <Text style={styles.mealIcon}>{meal.icon}</Text>
              <Text style={styles.mealName}>{meal.name}</Text>
              {hasRecord ? (
                <Text style={styles.mealRecorded}>已记录 {Math.round(recordCalories)} kcal</Text>
              ) : (
                <Text style={styles.mealTime}>{meal.time}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // 获取格式化的日期显示
  const getDateDisplay = () => {
    // 找到当前选中日期的显示信息
    const dateInfo = recentDates.find(d => d.dateStr === selectedDateStr);
    if (dateInfo) {
      if (dateInfo.label === '今天' || dateInfo.label === '昨天') {
        return dateInfo.label;
      }
      return dateInfo.displayDate;
    }
    // 如果不在最近7天内，直接解析日期字符串
    const parts = selectedDateStr.split('-');
    return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };

  // 渲染分类选择
  const renderCategorySelection = () => {
    // 只显示后端已保存的数据
    const savedRecord = selectedMeal ? existingRecords[selectedMeal] : null;
    const savedFoodsCount = savedRecord?.foods?.length || 0;
    const savedCalories = savedRecord?.foods?.reduce((sum: number, f: any) => sum + (f.calories || 0), 0) || 0;
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>选择食物分类</Text>
        <Text style={styles.stepSubtitle}>
          {getDateDisplay()} · {MEAL_TYPES.find(m => m.key === selectedMeal)?.name} · 点击分类查看食物
        </Text>
        
        {/* 已保存记录提示 */}
        {savedFoodsCount > 0 && (
          <View style={styles.savedBanner}>
            <View style={styles.selectedBannerLeft}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              <Text style={styles.selectedBannerText}>
                已保存 {savedFoodsCount} 种食物 · {Math.round(savedCalories)} kcal
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.categoryGrid}>
          {FOOD_CATEGORIES.map(cat => (
            <TouchableOpacity
            key={cat.key}
            style={[styles.categoryCard, { backgroundColor: cat.bgColor }]}
            onPress={() => handleSelectCategory(cat.key)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
            <Text style={styles.categoryCount}>
              {foodDatabase.filter(f => f.category === cat.key).length} 种
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    );
  };

  // 渲染食物列表（整合克数设置和保存功能）
  const renderFoodsList = () => {
    const currentCategory = FOOD_CATEGORIES.find(c => c.key === selectedCategory);
    
    return (
      <View style={styles.stepContainer}>
        {/* 头部：分类名称 + 营养总览 */}
        <View style={styles.foodsHeader}>
          <View>
            <Text style={styles.stepTitle}>{currentCategory?.name}</Text>
            <Text style={styles.stepSubtitle}>
              {getDateDisplay()} · {MEAL_TYPES.find(m => m.key === selectedMeal)?.name}
            </Text>
          </View>
        </View>
        
        {/* 营养总览（当有选中食物时显示） */}
        {selectedFoods.length > 0 && (
          <View style={styles.nutritionSummaryCompact}>
            <View style={styles.nutritionItemCompact}>
              <Text style={styles.nutritionValueCompact}>{Math.round(totalCalories)}</Text>
              <Text style={styles.nutritionLabelCompact}>热量</Text>
            </View>
            <View style={styles.nutritionItemCompact}>
              <Text style={styles.nutritionValueCompact}>{Math.round(totalProtein)}g</Text>
              <Text style={styles.nutritionLabelCompact}>蛋白质</Text>
            </View>
            <View style={styles.nutritionItemCompact}>
              <Text style={styles.nutritionValueCompact}>{Math.round(totalCarbs)}g</Text>
              <Text style={styles.nutritionLabelCompact}>碳水</Text>
            </View>
            <View style={styles.nutritionItemCompact}>
              <Text style={styles.nutritionValueCompact}>{Math.round(totalFat)}g</Text>
              <Text style={styles.nutritionLabelCompact}>脂肪</Text>
            </View>
          </View>
        )}
        
        {loading ? (
          <ActivityIndicator size="large" color="#4ABAB8" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.foodsList} showsVerticalScrollIndicator={false}>
            {categoryFoods.map(food => {
              const isSelected = selectedFoods.some(f => f.id === food.id);
              const selectedFood = selectedFoods.find(f => f.id === food.id);
              
              return (
                <View key={food.id} style={[styles.foodItem, isSelected && styles.foodItemSelected]}>
                  {/* 点击区域：勾选/取消 */}
                  <TouchableOpacity
                    style={styles.foodItemTouchable}
                    onPress={() => toggleFood(food)}
                  >
                    <View style={[styles.foodCheckbox, isSelected && styles.foodCheckboxChecked]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      {!isSelected && (
                        <Text style={styles.foodPortion}>每100g: {food.calories} kcal</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* 已选中时显示克数输入和计算后的热量 */}
                  {isSelected && selectedFood && (
                    <View style={styles.foodGramsSection}>
                      <View style={styles.gramsControlInline}>
                        <TouchableOpacity
                          style={styles.gramsBtnSmall}
                          onPress={() => adjustFoodGrams(food.id, -10)}
                        >
                          <Ionicons name="remove" size={14} color="#6B7280" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.gramsInputInline}
                          value={String(selectedFood.grams)}
                          onChangeText={(text) => {
                            const num = parseInt(text) || 0;
                            updateFoodGrams(food.id, num);
                          }}
                          keyboardType="number-pad"
                          selectTextOnFocus
                        />
                        <Text style={styles.gramsUnitInline}>g</Text>
                        <TouchableOpacity
                          style={styles.gramsBtnSmall}
                          onPress={() => adjustFoodGrams(food.id, 10)}
                        >
                          <Ionicons name="add" size={14} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.calculatedCalories}>
                        {Math.round(food.calories * selectedFood.grams / 100)} kcal
                      </Text>
                    </View>
                  )}
                  
                  {/* 未选中时显示每100g热量 */}
                  {!isSelected && (
                    <View style={styles.foodItemRight}>
                      <Text style={styles.foodCalories}>{food.calories}</Text>
                      <Text style={styles.foodCaloriesUnit}>kcal</Text>
                    </View>
                  )}
                </View>
              );
            })}
            
            {categoryFoods.length === 0 && (
              <View style={styles.emptyList}>
                <Text style={styles.emptyIcon}>{currentCategory?.icon}</Text>
                <Text style={styles.emptyText}>该分类暂无食物数据</Text>
              </View>
            )}
            
            <View style={{ height: 120 }} />
          </ScrollView>
        )}
        
        {/* 底部操作栏 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backToCategoryBtn} onPress={goBack}>
            <Ionicons name="grid-outline" size={20} color="#4ABAB8" />
            <Text style={styles.backToCategoryText}>其他分类</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveBtn, 
              saving && styles.saveBtnDisabled,
              selectedFoods.length === 0 && !isEditingExisting && styles.saveBtnDisabledGray
            ]}
            onPress={saveRecord}
            disabled={saving || (selectedFoods.length === 0 && !isEditingExisting)}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : selectedFoods.length === 0 && isEditingExisting ? (
              <>
                <Ionicons name="trash" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>删除记录</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>
                  {selectedFoods.length > 0 ? `确认保存 (${selectedFoods.length})` : '请选择食物'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 获取当前步骤标题
  const getStepIndicator = () => {
    const steps = [
      { key: 'meal', label: '选餐次' },
      { key: 'category', label: '选分类' },
      { key: 'foods', label: '选食物' },
    ];
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <View style={[
              styles.stepDot,
              index <= currentIndex && styles.stepDotActive
            ]}>
              {index < currentIndex ? (
                <Ionicons name="checkmark" size={12} color="#FFF" />
              ) : (
                <Text style={[
                  styles.stepDotText,
                  index <= currentIndex && styles.stepDotTextActive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentIndex && styles.stepLineActive
              ]} />
            )}
          </React.Fragment>
        ))}
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
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>营养记录</Text>
          <View style={{ width: 24 }} />
        </View>
        {getStepIndicator()}
      </LinearGradient>

      {currentStep === 'meal' && renderMealSelection()}
      {currentStep === 'category' && renderCategorySelection()}
      {currentStep === 'foods' && renderFoodsList()}
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

  // 步骤指示器
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepDotActive: {
    backgroundColor: '#FFFFFF',
  },

  stepDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  stepDotTextActive: {
    color: '#4ABAB8',
  },

  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },

  stepLineActive: {
    backgroundColor: '#FFFFFF',
  },

  // 步骤容器
  stepContainer: {
    flex: 1,
    padding: 20,
  },

  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },

  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },

  // 日期选择器
  dateSelector: {
    marginBottom: 20,
    marginHorizontal: -20,
  },

  dateSelectorContent: {
    paddingHorizontal: 20,
    gap: 10,
  },

  dateItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    minWidth: 65,
  },

  dateItemSelected: {
    backgroundColor: '#4ABAB8',
  },

  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },

  dateLabelSelected: {
    color: '#FFFFFF',
  },

  dateStr: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  dateStrSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 14,
  },

  // 餐次选择
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  mealCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  mealCardHasRecord: {
    borderWidth: 2,
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },

  mealIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },

  mealTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  mealRecorded: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '500',
  },

  // 分类选择
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  selectedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  selectedBannerText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  categoryCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },

  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  categoryCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // 食物列表
  foodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  confirmBtnSmall: {
    backgroundColor: '#4ABAB8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  confirmBtnSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  foodsList: {
    flex: 1,
  },

  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  foodItemSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
  },

  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  foodCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  foodCheckboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },

  foodInfo: {
    flex: 1,
  },

  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },

  foodPortion: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  foodItemRight: {
    alignItems: 'flex-end',
  },

  foodCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },

  foodCaloriesUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  emptyList: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyIcon: {
    fontSize: 60,
    opacity: 0.4,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },

  // 食物列表项的点击区域
  foodItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // 内联克数控制（页面3）
  foodGramsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  gramsControlInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  gramsBtnSmall: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  gramsInputInline: {
    width: 45,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 4,
  },

  gramsUnitInline: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 2,
  },

  calculatedCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
    minWidth: 60,
    textAlign: 'right',
  },

  // 紧凑版营养总览
  nutritionSummaryCompact: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
  },

  nutritionItemCompact: {
    alignItems: 'center',
  },

  nutritionValueCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  nutritionLabelCompact: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // 保存按钮禁用灰色
  saveBtnDisabledGray: {
    backgroundColor: '#D1D5DB',
  },

  // 底部操作栏
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F8FAFB',
  },

  backToCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E0F7F6',
  },

  backToCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ABAB8',
  },

  continueBtn: {
    flex: 1,
    backgroundColor: '#4ABAB8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  continueBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },

  continueBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 确认页面
  nutritionSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },

  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },

  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  nutritionDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },

  confirmList: {
    flex: 1,
  },
  
  emptyConfirmList: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  
  emptyConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  
  emptyConfirmSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  
  deleteBtnStyle: {
    backgroundColor: '#EF4444',
  },

  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  confirmItemLeft: {
    flex: 1,
  },

  confirmItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },

  confirmItemCalories: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  gramsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 12,
  },

  gramsBtn: {
    padding: 8,
  },

  gramsInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  gramsInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },

  gramsUnit: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 4,
  },

  // 保留旧样式以防万一
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 12,
  },

  quantityBtn: {
    padding: 8,
  },

  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'center',
  },

  removeBtn: {
    padding: 8,
  },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0F2F1',
    borderStyle: 'dashed',
  },

  addMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4ABAB8',
  },

  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
  },

  saveBtnDisabled: {
    opacity: 0.6,
  },

  saveBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
