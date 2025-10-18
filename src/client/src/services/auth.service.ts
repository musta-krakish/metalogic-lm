import api from "@/lib/axios";

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export const AuthService = {
    async login(email: string, password: string): Promise<AuthResponse> {
        const params = new URLSearchParams();
        params.append("grant_type", "password");
        params.append("username", email);
        params.append("password", password);
        params.append("scope", "");
        params.append("client_id", "string");
        params.append("client_secret", "********");

        const { data } = await api.post<AuthResponse>("/auth/token", params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        localStorage.setItem("token", data.access_token);
        return data;
    },

    logout() {
        localStorage.removeItem("token");
    },

    getToken() {
        return localStorage.getItem("token");
    },

    isAuthenticated() {
        return !!localStorage.getItem("token");
    },
};
