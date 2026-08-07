import { api } from "@/lib/api";

export interface AdminMetrics {
  total_users: number;
  active_users: number;
  authenticated_users: number;
  total_searches: number;
  total_favorites: number;
  total_admins: number;
  uptime_pct: number;
  avg_latency_s: number;
}

export interface AdminSummaryResponse {
  metrics: AdminMetrics;
  services: {
    database: string;
    redis_cache: string;
    gemini_ai: string;
    twogis_api: string;
  };
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
  last_login_at: string | null;
}

export interface DiagnosticTestResult {
  id: number;
  name: string;
  category: string;
  status: "passed" | "failed";
  latency_ms: number;
  details: string;
}

export const adminService = {
  getSummary: async (): Promise<AdminSummaryResponse> => {
    const res = await api.get<AdminSummaryResponse>("/admin/summary");
    return res.data;
  },

  getUsers: async (): Promise<AdminUserItem[]> => {
    const res = await api.get<AdminUserItem[]>("/admin/users");
    return res.data;
  },

  runDiagnosticTests: async (): Promise<DiagnosticTestResult[]> => {
    const res = await api.post<DiagnosticTestResult[]>("/admin/tests/run");
    return res.data;
  },
};
