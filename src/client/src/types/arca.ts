export interface ArcaLicense {
    mac_address: string;
    licences_key?: string;
    license_key?: string;
    license_date?: string;
    licences_date?: string;
    status: string; // "True" | "False"
    org?: string;
    bin?: string;
    expire_date?: string;
}

export interface ArcaResponse {
    page: number;
    limit: number;
    total: number;
    items: ArcaLicense[];
}

export interface ArcaFilters {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    org?: string;
    bin?: string;
}

export interface ArcaCreateDto {
    mac_address: string;
    license_key: string;
    license_date: string;
    org?: string;
    bin?: string;
}

export interface ArcaEditDto {
    mac_address: string;
    license_key?: string;
    license_date?: string;
    status?: string;
    org?: string;
    bin?: string;
    expire_date?: string;
}