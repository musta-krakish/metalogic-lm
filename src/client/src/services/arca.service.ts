import api from "@/lib/axios";
import type { ArcaResponse, ArcaFilters, ArcaCreateDto, ArcaEditDto } from "@/types/arca";

export const ArcaService = {
    async getLicenses(page = 1, limit = 10, filters: ArcaFilters = {}): Promise<ArcaResponse> {
        // @ts-ignore
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        const { data } = await api.get(`/arca/licenses?${params}`);
        return data;
    },

    async syncLicenses() {
        return api.post('/arca/update');
    },

    async exportLicenses(filters: ArcaFilters = {}): Promise<Blob> {
        // @ts-ignore
        const params = new URLSearchParams({ ...filters });
        const { data } = await api.get(`/arca/licenses/export?${params}`, {
            responseType: 'blob'
        });
        return data;
    },

    async createLicense(payload: ArcaCreateDto) {
        return api.post('/arca/license/create', payload);
    },

    async deleteLicense(mac_address: string) {
        return api.post('/arca/license/delete', { mac_address });
    },

    async updateLicense(payload: ArcaEditDto) {
        return api.patch('/arca/license/change', payload);
    },

    async setExpireDate(mac_address: string, expire_date: string) {
        return api.patch('/arca/license/expire-date', { mac_address, expire_date });
    },

    async toggleActive(mac_address: string) {
        return api.patch('/arca/license/active', { mac_address });
    }
};