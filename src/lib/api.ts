const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callFunction(functionName: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  
  return res.json();
}

// Auth
export const login = (email: string, password: string) =>
  callFunction("auth-handler", { action: "login", email, password });

export const signup = (username: string, email: string, password: string, role: string) =>
  callFunction("auth-handler", { action: "signup", username, email, password, role });

// Daily Goals
export const fetchDailyGoals = (email?: string) =>
  callFunction("daily-goals", { action: "fetch", email });

export const addDailyGoal = (data: {
  username: string; email: string; dailyGoal: string;
  reflection?: string; wentWell?: string; challenges?: string; left?: string; status?: string;
}) => callFunction("daily-goals", { action: "add", ...data });

export const updateDailyGoal = (data: {
  rowIndex: number; username: string; email: string; dailyGoal: string;
  reflection?: string; wentWell?: string; challenges?: string; left?: string; date: string; status?: string;
}) => callFunction("daily-goals", { action: "update", ...data });

// Weekly Goals
export const fetchWeeklyGoals = (email?: string) =>
  callFunction("weekly-goals", { action: "fetch", email });

export const addWeeklyGoal = (data: {
  username: string; email: string; weeklyGoal: string;
  reflection?: string; wentWell?: string; challenges?: string; left?: string; status?: string;
}) => callFunction("weekly-goals", { action: "add", ...data });

export const updateWeeklyGoal = (data: {
  rowIndex: number; username: string; email: string; weeklyGoal: string;
  reflection?: string; wentWell?: string; challenges?: string; left?: string; week: string; status?: string;
}) => callFunction("weekly-goals", { action: "update", ...data });

// Reports
export const generateReport = (email: string, username: string) =>
  callFunction("generate-report", { email, username });

export const fetchReports = (email?: string) =>
  callFunction("fetch-reports", { email });
