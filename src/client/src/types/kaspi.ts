export interface KaspiUser {
    mongo_id: string;
    login: string;
    role: number;
    is_verified: boolean;
    created_at?: string;
}

export interface KaspiResponse {
    page: number;
    limit: number;
    total: number;
    items: KaspiUser[];
}

export interface KaspiFilters {
    search?: string;
    status?: 'all' | 'verified' | 'unverified';
}

export interface KaspiCreateDto {
    login: string;
    password: string;
}