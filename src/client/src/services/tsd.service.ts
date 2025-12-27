import api from "@/lib/axios";
import type { TsdResponse, TsdFilters, TsdCreateDto, TsdUpdateDto } from "@/types/tsd";

export const TsdService = {
    async getUsers(page = 1, limit = 10, filters: TsdFilters = {}): Promise<TsdResponse> {
        // @ts-ignore
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        const { data } = await api.get(`/tsd/users?${params}`);
        return data;
    },

    async syncUsers() {
        return api.post('/tsd/update');
    },

    async exportUsers(filters: TsdFilters = {}): Promise<Blob> {
        // @ts-ignore
        const params = new URLSearchParams({ ...filters });
        const { data } = await api.get(`/tsd/users/export?${params}`, {
            responseType: 'blob'
        });
        return data;
    },

    async createUser(payload: TsdCreateDto) {
        return api.post('/tsd/users/create', payload);
    },

    async deleteUser(username: string) {
        return api.post('/tsd/users/delete', { username });
    },

    async toggleActive(username: string) {
        return api.patch('/tsd/users/active', { username });
    },

    async setPassword(username: string, password: string) {
        return api.patch('/tsd/users/password', { username, password });
    },

   async updateUser(payload: TsdUpdateDto) {
        return api.patch('/tsd/users/update', payload);
    },
};