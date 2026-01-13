import api from "@/lib/axios";
import type { KaspiResponse, KaspiFilters, KaspiCreateDto } from "@/types/kaspi";

export const KaspiService = {
    async getUsers(page = 1, limit = 10, filters: KaspiFilters = {}): Promise<KaspiResponse> {
        // @ts-ignore
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        const { data } = await api.get(`/kaspi/users?${params}`);
        return data;
    },

    async syncUsers() {
        return api.post('/kaspi/update');
    },

    async createUser(payload: KaspiCreateDto) {
        return api.post('/kaspi/users/create', payload);
    },

    async exportUsers(filters: KaspiFilters = {}): Promise<Blob> {
        // @ts-ignore
        const params = new URLSearchParams({ ...filters });
        const { data } = await api.get(`/kaspi/users/export?${params}`, {
            responseType: 'blob'
        });
        return data;
    },
};