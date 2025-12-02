export interface TindaUser {
    _Id?: string;
    login: string;
    org?: string;
    bin?: string;
    role?: number;
    isActive?: boolean;
    createDate?: string;
    expireDate?: string;
}

export interface TindaResponse {
    page: number;
    limit: number;
    total: number;
    items: TindaUser[];
}

export interface TindaFilters {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    org?: string;
    bin?: string;
}

export interface TindaCreateDto {
    username: string;
    password: string;
    org: string;
    bin: string;
    expireDate: string;
    role?: number;
}