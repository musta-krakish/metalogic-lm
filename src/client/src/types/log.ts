export interface LogEntry {
    id: number;
    level: string;
    message: string;
    path?: string;
    method?: string;
    ip_address?: string;
    created_at: string;
    metadata?: {
        ip_address?: string;
        user_agent?: string;
        browser?: string;
        operating_system?: string;
        device?: string;
        processing_time?: number;
        status_code?: number;
        referer?: string;
        query_params?: string;
        headers?: Record<string, string>;
    };
}

export interface LogsResponse {
    page: number;
    limit: number;
    total: number;
    items: LogEntry[];
}