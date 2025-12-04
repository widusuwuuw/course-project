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

export async function registerRequest(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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

export async function analyzeLabResults(metrics: Array<{name: string, value: number}>, gender: string = 'default') {
  const body = {
    metrics,
    gender,
  };
  return apiPost('/api/v1/lab/analyze', body);
}

export async function getAvailableLabMetrics() {
  return apiGet('/api/v1/lab/metrics');
}
