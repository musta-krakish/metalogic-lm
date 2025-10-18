import api from "@/lib/axios";

export interface License {
    id: number;
    data: Record<string, any>;
    updated_at: string;
}

export const IikoService = {
    async getLicenses(page = 1, limit = 10) {
        const { data } = await api.get(`/iiko/licenses?page=${page}&limit=${limit}`);
        return data;
    },

    async updateLicenses() {
        const { data } = await api.post(`/iiko/update`);
        return data;
    },

    async createLicense(uid: string, title: string) {
        const { data } = await api.post(`/iiko/license/create`, { uid, title });
        return data;
    },

    async verifyLicense(licenseCode: string) {
        const { data } = await api.post(`/iiko/license/verify`, { license_code: licenseCode });
        return data;
    },
};
