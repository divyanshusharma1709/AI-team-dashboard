import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';
const REQUEST_TIMEOUT_MS = 12000;

function apiCandidates() {
  const devFallbacks =
    process.env.NODE_ENV === 'development'
      ? ['http://127.0.0.1:8000', 'http://localhost:8000']
      : [];

  return Array.from(new Set([normalizedApiUrl, ...devFallbacks].filter(Boolean)));
}

async function getWithFallback<T>(path: string, config: object = {}) {
  let lastError: unknown = null;
  for (const base of apiCandidates()) {
    try {
      return await axios.get<T>(`${base}${path}`, {
        timeout: REQUEST_TIMEOUT_MS,
        ...config,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function postWithFallback<T>(path: string, body: unknown) {
  let lastError: unknown = null;
  for (const base of apiCandidates()) {
    try {
      return await axios.post<T>(`${base}${path}`, body, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function deleteWithFallback(path: string) {
  let lastError: unknown = null;
  for (const base of apiCandidates()) {
    try {
      return await axios.delete(`${base}${path}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  transcription?: string;
  sentiment?: {
    label: string;
    score: number;
  };
  summary?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const tasksApi = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await getWithFallback<PaginatedResponse<Task>>('/tasks', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
  create: async (task: Omit<Task, 'id'>) => {
    const response = await postWithFallback<Task>('/tasks', task);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await deleteWithFallback(`/tasks/${id}`);
    return response.data;
  },
};

export const employeesApi = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await getWithFallback<PaginatedResponse<Employee>>('/employees', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
  create: async (employee: Omit<Employee, 'id'>) => {
    const response = await postWithFallback<Employee>('/employees', employee);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await deleteWithFallback(`/employees/${id}`);
    return response.data;
  },
};

export const aiApi = {
  analyzeSentiment: async (text: string) => {
    const response = await postWithFallback('/ai/sentiment', { text });
    return response.data;
  },
  summarize: async (text: string) => {
    const response = await postWithFallback('/ai/summarize', { text });
    return response.data;
  },
};
