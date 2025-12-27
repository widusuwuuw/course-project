import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path: string) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch(path: string, body: any) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function loginRequest(email: string, password: string) {
  try {
    // OAuth2PasswordRequestForm: x-www-form-urlencoded
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      // 处理不同类型的错误响应
      if (typeof data.detail === 'string') {
        throw new Error(data.detail);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }

    return data;
  } catch (error) {
    // 网络错误处理
    if (error instanceof TypeError) {
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
    // 重新抛出其他错误
    throw error;
  }
}

export async function checkEmailExists(email: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    return data.exists;
  } catch (error) {
    // 如果检查接口不存在，返回false（不阻止注册）
    console.log('Email check service unavailable:', error);
    return false;
  }
}

export async function registerRequest(email: string, password: string, gender?: string) {
  try {
    const body: any = { email, password };
    if (gender) {
      body.gender = gender;
    }
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      // 处理不同类型的错误响应
      if (typeof data.detail === 'string') {
        throw new Error(data.detail);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }

    return data;
  } catch (error) {
    // 网络错误处理
    if (error instanceof TypeError) {
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
    // 重新抛出其他错误
    throw error;
  }
}

export async function assistantQuery(question: string, questionType?: string) {
  const body: any = { question };
  if (questionType) body.question_type = questionType;
  return apiPost('/assistant/query', body);
}

export async function analyzeLabResults(metrics: Array<{name: string, value: number}>, gender: string = 'default', category: string = 'comprehensive') {
  const body = {
    metrics,
    gender,
    category,
  };
  return apiPost('/api/v1/lab/analyze', body);
}

export async function getAvailableLabMetrics() {
  return apiGet('/api/v1/lab/metrics');
}

export async function getCurrentUser() {
  return apiGet('/me');
}

export async function getUserGender(): Promise<string> {
  try {
    const currentUser = await getCurrentUser();
    return currentUser.gender || 'default';
  } catch (error) {
    console.warn('Failed to get user gender, using default:', error);
    return 'default';
  }
}

export async function getUserLabReports(limit: number = 10, offset: number = 0, category?: string) {
  let url = `/api/v1/lab/reports?limit=${limit}&offset=${offset}`;
  if (category) {
    url += `&category=${category}`;
  }
  return apiGet(url);
}

export async function generateAIBodyReport(daysRange: number = 30) {
  const body = {
    days_range: daysRange,
  };
  return apiPost('/api/v1/lab/ai-body-report', body);
}

// ============ 偏好设置 API ============

export async function getUserPreferences() {
  return apiGet('/api/v1/preferences');
}

export async function saveUserPreferences(preferences: any) {
  return apiPost('/api/v1/preferences', preferences);
}

export async function getPreferenceOptions(type: 'exercises' | 'foods' | 'allergens' | 'equipment') {
  return apiGet(`/api/v1/preferences/options/${type}`);
}

// ============ 周计划 API ============

export async function generateWeeklyPlan(monthlyPlanId: number, weekNumber: number, weekStartDate?: string) {
  const body: any = {
    monthly_plan_id: monthlyPlanId,
    week_number: weekNumber,
  };
  if (weekStartDate) {
    body.week_start_date = weekStartDate;
  }
  return apiPost('/api/v1/weekly-plans/generate', body);
}

export async function getCurrentWeeklyPlan() {
  return apiGet('/api/v1/weekly-plans/current');
}

export async function getTodayPlan() {
  return apiGet('/api/v1/weekly-plans/today');
}

export async function getWeeklyPlanById(planId: number) {
  return apiGet(`/api/v1/weekly-plans/${planId}`);
}

export async function getWeeklyPlansByMonthly(monthlyPlanId: number) {
  return apiGet(`/api/v1/weekly-plans/by-monthly/${monthlyPlanId}`);
}

export async function updateDayCompletion(planId: number, day: string, completion: {
  exercise_completed?: boolean;
  diet_adherence?: number;
  notes?: string;
}) {
  return apiPatch(`/api/v1/weekly-plans/${planId}/completion/${day}`, completion);
}

export async function adjustWeeklyPlan(planId: number, day: string, adjustmentType: string, options?: {
  new_exercise_id?: string;
  custom_note?: string;
}) {
  const body: any = {
    day,
    adjustment_type: adjustmentType,
    ...options,
  };
  return apiPatch(`/api/v1/weekly-plans/${planId}/adjust`, body);
}

// AI智能微调周计划
export async function aiAdjustWeeklyPlan(planId: number, userRequest: string) {
  return apiPost(`/api/v1/weekly-plans/${planId}/ai-adjust`, {
    user_request: userRequest
  });
}
// ============ 营养追踪 API ============

export interface FoodRecord {
  id?: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  serving_size?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface NutritionGoal {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fat: number;
  meals: {
    breakfast: any[];
    lunch: any[];
    dinner: any[];
    snack: any[];
  };
}

// 创建食物记录
export async function createFoodRecord(record: FoodRecord) {
  return apiPost('/api/v1/nutrition/records', record);
}

// 获取某天的营养摘要
export async function getDailyNutrition(date: string): Promise<DailyNutritionSummary> {
  return apiGet(`/api/v1/nutrition/records/daily/${date}`);
}

// 获取日期范围内的营养记录
export async function getNutritionRange(startDate: string, endDate: string) {
  return apiGet(`/api/v1/nutrition/records/range?start_date=${startDate}&end_date=${endDate}`);
}

// 更新食物记录
export async function updateFoodRecord(recordId: number, update: Partial<FoodRecord>) {
  return apiPut(`/api/v1/nutrition/records/${recordId}`, update);
}

// 删除食物记录
export async function deleteFoodRecord(recordId: number) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/nutrition/records/${recordId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
  return;
}

// 获取营养目标
export async function getNutritionGoals(): Promise<NutritionGoal> {
  return apiGet('/api/v1/nutrition/goals');
}

// 更新营养目标
export async function updateNutritionGoals(goals: Partial<NutritionGoal>) {
  return apiPut('/api/v1/nutrition/goals', goals);
}