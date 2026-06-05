import Constants from 'expo-constants';
import { DeviceEventEmitter, Platform } from 'react-native';

const API_PORT = '3000';
const API_PATH = '/api';
const CONFIGURED_API_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 8_000;

function normalizeApiUrl(url: string) {
  return url.replace(/\/$/, '');
}

function getExpoHostApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:${API_PORT}${API_PATH}` : undefined;
}

function getApiCandidates() {
  const candidates = [
    CONFIGURED_API_URL,
    getExpoHostApiUrl(),
    Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}${API_PATH}` : undefined,
    `http://localhost:${API_PORT}${API_PATH}`,
  ].filter(Boolean) as string[];

  return [...new Set(candidates.map(normalizeApiUrl))];
}

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  let response: Response;
  const apiCandidates = getApiCandidates();
  let failedApiUrl = apiCandidates[0] ?? `http://localhost:${API_PORT}${API_PATH}`;

  const requestOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  };

  for (const apiUrl of apiCandidates) {
    try {
      response = await fetchWithTimeout(`${apiUrl}${path}`, requestOptions);
      failedApiUrl = apiUrl;
      break;
    } catch {
      failedApiUrl = apiUrl;
    }
  }

  if (!response!) {
    throw new ApiError(
      `Não foi possível acessar a API em ${failedApiUrl}. Verifique se o backend está ativo, se o dispositivo está na mesma rede e se a API aceita conexões fora de localhost.`,
      0,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;

    if (response.status === 401) {
      DeviceEventEmitter.emit('vital-control.session-expired');
    }

    throw new ApiError(message ?? 'Não foi possível concluir a solicitação.', response.status);
  }

  return data as T;
}
