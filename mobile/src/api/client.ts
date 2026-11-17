import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const PORT = 4000;

/**
 * Server address. On a real iPhone with Expo Go, the bundler's host
 * (e.g. "192.168.1.183:8081") is the laptop's LAN IP, so the API is assumed to
 * run on the same machine at port 4000. Set EXPO_PUBLIC_API_URL to override
 * (e.g. a deployed server on Render).
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:${PORT}`;
}

export const SERVER_URL = resolveBaseUrl();
export const TOKEN_KEY = 'foodsave.token';

export const api = axios.create({ baseURL: `${SERVER_URL}/api`, timeout: 15000 });

let token: string | null = null;
export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}
export async function setToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Turns any API/network error into a Vietnamese message for the UI. */
export function errorMessage(e: unknown): string {
  const err = e as AxiosError<{ message?: string }>;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED' || err?.message === 'Network Error')
    return `Không kết nối được máy chủ (${SERVER_URL}). Hãy kiểm tra server đang chạy và điện thoại dùng chung Wi-Fi với máy tính.`;
  return (e as Error)?.message ?? 'Đã có lỗi xảy ra';
}

/** Absolute URL for images uploaded to the server ("/uploads/x.jpg"). */
export function imageUrl(path?: string | null) {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${SERVER_URL}${path}`;
}
