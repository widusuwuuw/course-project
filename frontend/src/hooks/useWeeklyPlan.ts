/**
 * 周计划相关的 React Hooks
 * 用于获取和管理周计划、今日计划等数据
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentWeeklyPlan,
  getTodayPlan,
  generateWeeklyPlan,
  updateDayCompletion,
  adjustWeeklyPlan,
} from '../api/client';

// 类型定义
export interface ExercisePlan {
  exercise_id: string;
  name: string;
  duration: number;
  intensity: string;
  calories_target: number;
  time_slot: string;
  execution_guide: string;
  alternatives: Array<{ exercise_id: string; name: string }>;
}

export interface MealPlan {
  foods: Array<{ 
    food_id: string; 
    name: string; 
    portion: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
  calories: number;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DietPlan {
  calories_target: number;
  nutrition_targets?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  breakfast: MealPlan;
  lunch: MealPlan;
  dinner: MealPlan;
  snacks: MealPlan;
  hydration_goal: string;
  daily_totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  // 健康档案联动 - 饮食限制和建议
  dietary_restrictions?: string[];
  health_advice?: string[];
  // 运动-饮食联动信息
  exercise_diet_link?: {
    exercise_calories: number;      // 运动消耗卡路里
    calorie_adjustment: number;     // 热量调整量
    has_strength_training: boolean; // 是否包含力量训练
    is_high_intensity: boolean;     // 是否高强度
    primary_time_slot: string;      // 主要运动时段
    post_exercise_tips: string[];   // 运动后饮食建议
  };
}

export interface DayPlan {
  date: string;
  day_name: string;
  is_rest_day: boolean;
  exercise: ExercisePlan | null;  // 兼容旧版：单个运动
  exercises: ExercisePlan[];       // 新版：多时段多运动
  diet: DietPlan;
  tips: string;
}

export interface TodayPlanData {
  date: string;
  day_name: string;
  weekday: string;
  is_rest_day: boolean;
  exercise: ExercisePlan | null;
  diet: DietPlan;
  tips: string;
  completion: {
    exercise_completed: boolean;
    diet_adherence: number;
    notes: string;
  };
}

export interface WeeklyPlanData {
  id: number;
  user_id: number;
  monthly_plan_id: number;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  week_theme: string;
  daily_plans: Record<string, DayPlan>;
  ai_weekly_summary: string;
  completion_status: Record<string, any>;
}

// 获取今日计划的 Hook
export function useTodayPlan() {
  const [todayPlan, setTodayPlan] = useState<TodayPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTodayPlan();
      setTodayPlan(data);
    } catch (err: any) {
      console.log('获取今日计划失败:', err.message);
      setError(err.message || '获取今日计划失败');
      setTodayPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayPlan();
  }, [fetchTodayPlan]);

  const markExerciseComplete = useCallback(async (planId: number, day: string, completed: boolean) => {
    try {
      await updateDayCompletion(planId, day, { exercise_completed: completed });
      // 重新获取更新后的数据
      await fetchTodayPlan();
    } catch (err) {
      console.error('更新运动完成状态失败:', err);
      throw err;
    }
  }, [fetchTodayPlan]);

  const updateDietAdherence = useCallback(async (planId: number, day: string, adherence: number) => {
    try {
      await updateDayCompletion(planId, day, { diet_adherence: adherence });
      await fetchTodayPlan();
    } catch (err) {
      console.error('更新饮食遵守度失败:', err);
      throw err;
    }
  }, [fetchTodayPlan]);

  return {
    todayPlan,
    loading,
    error,
    refresh: fetchTodayPlan,
    markExerciseComplete,
    updateDietAdherence,
  };
}

// 获取当前周计划的 Hook
export function useCurrentWeeklyPlan() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useWeeklyPlan] 开始获取周计划...');
      const data = await getCurrentWeeklyPlan();
      console.log('[useWeeklyPlan] 获取到的数据:', data);
      console.log('[useWeeklyPlan] daily_plans:', data?.daily_plans);
      setWeeklyPlan(data);
      console.log('[useWeeklyPlan] 状态已更新');
    } catch (err: any) {
      console.log('获取周计划失败:', err.message);
      setError(err.message || '获取周计划失败');
      setWeeklyPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyPlan();
  }, [fetchWeeklyPlan]);

  // 获取某一天的计划
  const getDayPlan = useCallback((day: string): DayPlan | null => {
    if (!weeklyPlan?.daily_plans) return null;
    return weeklyPlan.daily_plans[day] || null;
  }, [weeklyPlan]);

  // 调整某天的计划
  const adjustDay = useCallback(async (
    day: string,
    adjustmentType: 'skip_exercise' | 'reduce_exercise' | 'change_exercise',
    options?: { new_exercise_id?: string; custom_note?: string }
  ) => {
    if (!weeklyPlan) return;
    try {
      await adjustWeeklyPlan(weeklyPlan.id, day, adjustmentType, options);
      await fetchWeeklyPlan();
    } catch (err) {
      console.error('调整计划失败:', err);
      throw err;
    }
  }, [weeklyPlan, fetchWeeklyPlan]);

  return {
    weeklyPlan,
    loading,
    error,
    refresh: fetchWeeklyPlan,
    getDayPlan,
    adjustDay,
  };
}

// 生成周计划的 Hook
export function useGenerateWeeklyPlan() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    monthlyPlanId: number,
    weekNumber: number,
    weekStartDate?: string
  ): Promise<WeeklyPlanData | null> => {
    try {
      setGenerating(true);
      setError(null);
      const data = await generateWeeklyPlan(monthlyPlanId, weekNumber, weekStartDate);
      return data;
    } catch (err: any) {
      console.error('生成周计划失败:', err);
      setError(err.message || '生成周计划失败');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    generate,
    generating,
    error,
  };
}

// 将周计划数据转换为运动页面需要的格式
export function convertWeeklyPlanToExerciseData(weeklyPlan: WeeklyPlanData | null) {
  console.log('[convertWeeklyPlanToExerciseData] 输入:', weeklyPlan ? { id: weeklyPlan.id, daily_plans_keys: Object.keys(weeklyPlan.daily_plans || {}) } : null);
  
  if (!weeklyPlan?.daily_plans) {
    console.log('[convertWeeklyPlanToExerciseData] 没有 daily_plans，返回 null');
    return null;
  }

  const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const weekData: Record<number, {
    date: number;
    totalDuration: number;
    totalCalories: number;
    exercises: Array<{
      id: string;
      name: string;
      duration: number;
      calories: number;
      category: string;
      icon: string;
      time: string;
    }>;
    goalDuration: number;
    goalCalories: number;
    isRestDay: boolean;
    tips: string;
  }> = {};

  // 使用当前周的日期范围（而不是周计划中存储的日期）
  // 这样即使周计划是历史数据，也能正确映射到当前周的日历上
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;  // 计算到本周一的偏移
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  WEEKDAYS.forEach((day, index) => {
    const dayPlan = weeklyPlan.daily_plans[day];
    if (!dayPlan) return;

    const dateObj = new Date(weekStart);
    dateObj.setDate(weekStart.getDate() + index);
    const dateNum = dateObj.getDate();

    // 根据运动类型选择图标
    const getExerciseIcon = (exerciseId: string): string => {
      const iconMap: Record<string, string> = {
        brisk_walking: 'walk-outline',
        jogging: 'walk-outline',
        running: 'walk-outline',
        cycling: 'bicycle-outline',
        swimming: 'water-outline',
        yoga: 'flower-outline',
        strength_training: 'fitness-outline',
        hiit: 'flash-outline',
        tai_chi: 'body-outline',
      };
      return iconMap[exerciseId] || 'fitness-outline';
    };

    // 转换运动数据 - 支持多时段多运动
    const exercises = [];
    
    // 优先使用新版 exercises 数组
    if (dayPlan.exercises && dayPlan.exercises.length > 0 && !dayPlan.is_rest_day) {
      dayPlan.exercises.forEach((ex) => {
        const exerciseItem = {
          id: ex.exercise_id,
          name: ex.name,
          duration: ex.duration,
          calories: ex.calories_target,
          category: ex.intensity === 'light' ? '轻度运动' :
                    ex.intensity === 'moderate' ? '中度运动' : '高强度运动',
          icon: getExerciseIcon(ex.exercise_id),
          time: ex.time_slot,
          timeSlot: ex.time_slot,  // 新增：用于分组显示
        };
        console.log(`[convertWeeklyPlanToExerciseData] Adding exercise: ${ex.name}, calories_target=${ex.calories_target}, calories=${exerciseItem.calories}`);
        exercises.push(exerciseItem);
      });
    } else if (dayPlan.exercise && !dayPlan.is_rest_day) {
      // 兼容旧版：使用单个 exercise
      exercises.push({
        id: dayPlan.exercise.exercise_id,
        name: dayPlan.exercise.name,
        duration: dayPlan.exercise.duration,
        calories: dayPlan.exercise.calories_target,
        category: dayPlan.exercise.intensity === 'light' ? '轻度运动' :
                  dayPlan.exercise.intensity === 'moderate' ? '中度运动' : '高强度运动',
        icon: getExerciseIcon(dayPlan.exercise.exercise_id),
        time: dayPlan.exercise.time_slot,
        timeSlot: dayPlan.exercise.time_slot,
      });
    }

    // 计算总时长和总卡路里（支持多运动）
    const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    const totalCalories = exercises.reduce((sum, ex) => sum + (ex.calories || 0), 0);
    
    weekData[dateNum] = {
      date: dateNum,
      totalDuration,
      totalCalories,
      exercises,
      goalDuration: totalDuration || 60,
      goalCalories: totalCalories || 500,
      isRestDay: dayPlan.is_rest_day,
      tips: dayPlan.tips,
    };
    
    console.log(`[convertWeeklyPlanToExerciseData] ${day} (${dateNum}): ${exercises.length} exercises, isRestDay=${dayPlan.is_rest_day}`);
  });

  console.log('[convertWeeklyPlanToExerciseData] 输出 weekData keys:', Object.keys(weekData));
  return weekData;
}

// 营养食物数据类型
export interface NutritionFood {
  food_id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// 餐食数据类型
export interface MealData {
  foods: NutritionFood[];
  calories: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// 每日营养数据类型
export interface DayNutritionData {
  date: number;
  dayName: string;
  meals: {
    breakfast: MealData;
    lunch: MealData;
    dinner: MealData;
    snacks: MealData;
  };
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  targetCalories: number;
  // 新增：营养目标
  nutritionTargets: {
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  hydrationGoal: string;
  // 健康档案联动
  dietaryRestrictions?: string[];
  healthAdvice?: string[];
  // 运动-饮食联动
  exerciseDietLink?: {
    exercise_calories: number;
    calorie_adjustment: number;
    has_strength_training: boolean;
    is_high_intensity: boolean;
    primary_time_slot: string;
    post_exercise_tips: string[];
  } | null;
}

// 将周计划数据转换为营养页面需要的格式
export function convertWeeklyPlanToNutritionData(weeklyPlan: WeeklyPlanData | null): Record<number, DayNutritionData> | null {
  console.log('[convertWeeklyPlanToNutritionData] 输入:', weeklyPlan ? { id: weeklyPlan.id } : null);
  
  if (!weeklyPlan?.daily_plans) {
    console.log('[convertWeeklyPlanToNutritionData] 没有 daily_plans，返回 null');
    return null;
  }

  const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  const weekData: Record<number, DayNutritionData> = {};
  
  // 使用当前周的日期范围（而不是周计划中存储的日期）
  // 这样即使周计划是历史数据，也能正确映射到当前周的日历上
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;  // 计算到本周一的偏移
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  WEEKDAYS.forEach((day, index) => {
    const dayPlan = weeklyPlan.daily_plans[day];
    if (!dayPlan?.diet) return;

    const dateObj = new Date(weekStart);
    dateObj.setDate(weekStart.getDate() + index);
    const dateNum = dateObj.getDate();

    const diet = dayPlan.diet;

    // 转换食物数据，确保包含完整的营养信息
    const convertFoods = (foods: any[]): NutritionFood[] => {
      return foods.map(f => ({
        food_id: f.food_id || '',
        name: f.name || '',
        portion: f.portion || '',
        calories: f.calories || 0,
        protein: f.protein || 0,
        carbs: f.carbs || 0,
        fat: f.fat || 0,
      }));
    };

    // 转换餐食数据
    const convertMeal = (meal: any): MealData => ({
      foods: convertFoods(meal?.foods || []),
      calories: meal?.calories || 0,
      nutrition: meal?.nutrition || {
        calories: meal?.calories || 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    });

    // 计算每日营养总计（从所有餐食的食物中实时计算）
    const calculateDailyTotals = (diet: any) => {
      const allMeals = ['breakfast', 'lunch', 'dinner', 'snacks'];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      
      allMeals.forEach(mealType => {
        const meal = diet[mealType];
        if (meal?.foods) {
          meal.foods.forEach((food: any) => {
            totalCalories += food.calories || 0;
            totalProtein += food.protein || 0;
            totalCarbs += food.carbs || 0;
            totalFat += food.fat || 0;
            totalFiber += food.fiber || 0;
          });
        }
      });
      
      return {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
        fiber: Math.round(totalFiber),
      };
    };

    // 实时计算每日营养总计
    const dailyTotals = calculateDailyTotals(diet);

    weekData[dateNum] = {
      date: dateNum,
      dayName: DAY_NAMES[index],
      meals: {
        breakfast: convertMeal(diet.breakfast),
        lunch: convertMeal(diet.lunch),
        dinner: convertMeal(diet.dinner),
        snacks: convertMeal(diet.snacks),
      },
      dailyTotals: dailyTotals,
      targetCalories: diet.calories_target || 2000,
      // 新增：营养目标（从后端获取，或根据卡路里计算默认值）
      nutritionTargets: diet.nutrition_targets || {
        protein: Math.round((diet.calories_target || 2000) * 0.18 / 4),
        carbs: Math.round((diet.calories_target || 2000) * 0.55 / 4),
        fat: Math.round((diet.calories_target || 2000) * 0.27 / 9),
        fiber: 25,
      },
      hydrationGoal: diet.hydration_goal || '2000ml',
      // 健康档案联动数据
      dietaryRestrictions: diet.dietary_restrictions || [],
      healthAdvice: diet.health_advice || [],
      // 运动-饮食联动数据
      exerciseDietLink: diet.exercise_diet_link || null,
    };
    
    console.log(`[convertWeeklyPlanToNutritionData] ${day} (${dateNum}): 目标${diet.calories_target}kcal, 早餐${diet.breakfast?.foods?.length || 0}项, 运动消耗${diet.exercise_diet_link?.exercise_calories || 0}kcal`);
  });

  console.log('[convertWeeklyPlanToNutritionData] 输出 weekData keys:', Object.keys(weekData));
  return weekData;
}
