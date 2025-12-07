import api from "@/lib/axios";
import type { TsdResponse, TsdFilters, TsdCreateDto } from "@/types/tsd";

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

    async setDeviceCount(username: string, count: number) {
        return api.patch('/tsd/users/device-count', { username, count });
    },

    async setOrg(username: string, org: string) {
        return api.patch('/tsd/users/org', { username, org });
    },

    async setBin(username: string, bin: string) {
        return api.patch('/tsd/users/bin', { username, bin });
    },

    async setExpireDate(username: string, expire_date: string) {
        return api.patch('/tsd/users/expire-date', { username, expire_date });
    }
};