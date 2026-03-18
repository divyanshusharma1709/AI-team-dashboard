import { NextResponse } from 'next/server';
import axios from 'axios';
const REQUEST_TIMEOUT_MS = 10000;

function backendCandidates() {
  const raw = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const normalized = raw ? raw.replace(/\/+$/, '') : '';
  const devFallbacks =
    process.env.NODE_ENV === 'development'
      ? ['http://127.0.0.1:8000', 'http://localhost:8000']
      : [];

  return Array.from(new Set([normalized, ...devFallbacks].filter(Boolean)));
}

export async function GET() {
  const candidates = backendCandidates();

  try {
    let lastError: unknown = null;

    for (const apiUrl of candidates) {
      try {
        const [tasksRes, employeesRes] = await Promise.all([
          axios.get(`${apiUrl}/tasks`, { timeout: REQUEST_TIMEOUT_MS }),
          axios.get(`${apiUrl}/employees`, { timeout: REQUEST_TIMEOUT_MS }),
        ]);

        const dashboardData = {
          tasks: tasksRes.data.data || [],
          employees: employeesRes.data.data || [],
          meetings: [],
        };

        return NextResponse.json(dashboardData);
      } catch (error) {
        lastError = error;
      }
    }

    console.error('Error fetching dashboard data from all backend candidates:', {
      candidates,
      lastError,
    });
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', candidatesTried: candidates },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 
