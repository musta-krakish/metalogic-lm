import api from "@/lib/axios";
import type { TindaResponse, TindaFilters, TindaCreateDto } from "@/types/tinda";

export const TindaService = {
    async getUsers(page = 1, limit = 10, filters: TindaFilters = {}): Promise<TindaResponse> {
        // @ts-ignore
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        const { data } = await api.get(`/tinda/users?${params}`);
        return data;
    },

    async syncUsers() {
        return api.post('/tinda/update');
    },

    async exportUsers(filters: TindaFilters = {}): Promise<Blob> {
        // @ts-ignore
        const params = new URLSearchParams({ ...filters });
        const { data } = await api.get(`/tinda/users/export?${params}`, {
            responseType: 'blob'
        });
        return data;
    },

    async createUser(payload: TindaCreateDto) {
        return api.post('/tinda/users/create', payload);
    },

    async updateUser(payload: { user_id: string, org?: string, bin?: string, expire_date?: string }) {
        return api.patch('/tinda/users/update', payload);
    },

    async toggleActive(user_id: string) {
        return api.patch('/tinda/users/active', { user_id });
    }
};