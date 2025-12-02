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

export async function apiPut(path: string, body: any) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path: string, body?: any) {
  const authHeaders = await getAuthHeaders();
  const options: RequestInit = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE_URL}${path}`, options);
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

// Assuming Message type is available or will be imported from AssistantScreen.tsx
// For now, defining a simple version for client.ts to avoid direct dependency
type SimpleMessage = {
  role: 'user' | 'assistant';
  content: string;
}

export async function assistantQuery(
  question: string,
  questionType?: string,
  messages: { role: 'user' | 'assistant'; text: string; id: string; }[] = [] // Expecting Message[] from frontend
) {
  const body: any = { question };
  if (questionType) body.question_type = questionType;

  // Filter and map messages to a simpler format for the backend
  const conversationHistory: SimpleMessage[] = messages
    .filter(m => m.id !== 'welcome' && m.text.trim() !== '') // Exclude welcome and empty messages
    .map(m => ({ role: m.role, content: m.text }));

  if (conversationHistory.length > 0) {
    body.messages = conversationHistory;
  }
  
  return apiPost('/assistant/query', body);
}
