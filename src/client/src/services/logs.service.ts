import api from "@/lib/axios";
import type { LogsResponse } from "@/types/log";

export const LogsService = {
    async getLogs(page = 1, limit = 20): Promise<LogsResponse> {
        const { data } = await api.get(`/logs/?page=${page}&limit=${limit}`);
        return data;
    }
};