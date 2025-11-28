import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

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
  // OAuth2PasswordRequestForm: x-www-form-urlencoded
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function registerRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function assistantQuery(question: string, questionType?: string) {
  const body: any = { question };
  if (questionType) body.question_type = questionType;
  return apiPost('/assistant/query', body);
}
