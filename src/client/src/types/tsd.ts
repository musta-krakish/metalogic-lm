export interface TsdUser {
    username: string;
    org?: string;
    bin?: string;
    role?: string;
    isActive?: boolean;
    availableDeviceCount?: number;
    registerDate?: string;
    expireDate?: string;
    deviceID?: string;
    deviceName?: string;
}

export interface TsdResponse {
    page: number;
    limit: number;
    total: number;
    items: TsdUser[];
}

export interface TsdFilters {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    org?: string;
    bin?: string;
}

export interface TsdCreateDto {
    username: string;
    password: string;
    role: string;
    org?: string;
    deviceID?: string;
    deviceName?: string;
}

export interface TsdUpdateDto {
    username: string;
    org?: string;
    bin?: string;
    count?: number;
    expire_date?: string;
}