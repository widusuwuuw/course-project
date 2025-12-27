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
  foods: Array<{ food_id: string; name: string; portion: string }>;
  calories: number;
}

export interface DietPlan {
  calories_target: number;
  breakfast: MealPlan;
  lunch: MealPlan;
  dinner: MealPlan;
  snacks: MealPlan;
  hydration_goal: string;
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

  // 获取当前周的日期范围
  const weekStart = new Date(weeklyPlan.week_start_date);

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

// 将周计划数据转换为营养页面需要的格式
export function convertWeeklyPlanToNutritionData(weeklyPlan: WeeklyPlanData | null) {
  if (!weeklyPlan?.daily_plans) {
    return null;
  }

  const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const weekData: Record<number, {
    date: number;
    meals: {
      breakfast: { foods: Array<{ name: string; portion: string }>; calories: number };
      lunch: { foods: Array<{ name: string; portion: string }>; calories: number };
      dinner: { foods: Array<{ name: string; portion: string }>; calories: number };
      snacks: { foods: Array<{ name: string; portion: string }>; calories: number };
    };
    totalCalories: number;
    targetCalories: number;
    hydrationGoal: string;
  }> = {};

  const weekStart = new Date(weeklyPlan.week_start_date);

  WEEKDAYS.forEach((day, index) => {
    const dayPlan = weeklyPlan.daily_plans[day];
    if (!dayPlan?.diet) return;

    const dateObj = new Date(weekStart);
    dateObj.setDate(weekStart.getDate() + index);
    const dateNum = dateObj.getDate();

    const diet = dayPlan.diet;

    weekData[dateNum] = {
      date: dateNum,
      meals: {
        breakfast: {
          foods: diet.breakfast.foods.map(f => ({ name: f.name, portion: f.portion })),
          calories: diet.breakfast.calories,
        },
        lunch: {
          foods: diet.lunch.foods.map(f => ({ name: f.name, portion: f.portion })),
          calories: diet.lunch.calories,
        },
        dinner: {
          foods: diet.dinner.foods.map(f => ({ name: f.name, portion: f.portion })),
          calories: diet.dinner.calories,
        },
        snacks: {
          foods: diet.snacks.foods.map(f => ({ name: f.name, portion: f.portion })),
          calories: diet.snacks.calories,
        },
      },
      totalCalories: diet.breakfast.calories + diet.lunch.calories + diet.dinner.calories + diet.snacks.calories,
      targetCalories: diet.calories_target,
      hydrationGoal: diet.hydration_goal,
    };
  });

  return weekData;
}
