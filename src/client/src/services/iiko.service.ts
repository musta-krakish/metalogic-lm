import api from "@/lib/axios";
import type { IIkoLicensesResponse, IIkoLicenseFilters } from "@/types/license";

export const IikoService = {
    async getLicenses(
        page = 1,
        limit = 10,
        filters: IIkoLicenseFilters = {}
    ): Promise<IIkoLicensesResponse> {
        const params = new URLSearchParams(
            //@ts-ignore
            {
                page: page.toString(),
                limit: limit.toString(),
                ...filters
            });

        const { data } = await api.get(`/iiko/licenses?${params}`);
        return data;
    },

    async exportLicenses(filters: IIkoLicenseFilters = {}): Promise<Blob> {
        const params = new URLSearchParams(
            //@ts-ignore    
            {
                ...filters
            });

        const { data } = await api.get(`/iiko/licenses/export?${params}`, {
            responseType: 'blob'
        });
        return data;
    },

    async createLicense(uid: string, title: string) {
        const { data } = await api.post(`/iiko/license/create`, { uid, title });
        return data;
    },
};