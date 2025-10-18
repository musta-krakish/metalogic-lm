import api from "@/lib/axios";

export interface LogEntry {
  id: number;
  level: string;
  message: string;
  path?: string;
  method?: string;
  created_at: string;
}

export interface LogsResponse {
  items: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

export const LogsService = {
  async getLogs(page = 1, limit = 20, level?: string) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (level) params.append("level", level);

    const { data } = await api.get<LogsResponse>(`/logs/?${params.toString()}`);
    return data;
  },
};
