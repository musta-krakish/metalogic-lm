import api from "@/lib/axios";

export interface SystemStats {
    iiko: { total: number; active: number; online: number };
    arca: { total: number; active: number };
    tinda: { total: number; active: number };
    tsd: { total: number; active: number };
    logs: { errors: number };
}

export const DashboardService = {
    async getStats(): Promise<SystemStats> {
        const [
            iikoTotal, iikoActive, iikoOnline,
            arcaTotal, arcaActive,
            tindaTotal, tindaActive,
            tsdTotal, tsdActive,
            logsErrors
        ] = await Promise.all([
            // Iiko Stats
            api.get("/iiko/licenses?limit=1"),
            api.get("/iiko/licenses?limit=1&status=active"),
            api.get("/iiko/licenses?limit=1&is_online=true"),

            // Arca Stats
            api.get("/arca/licenses?limit=1"),
            api.get("/arca/licenses?limit=1&status=active"),

            // Tinda Stats
            api.get("/tinda/users?limit=1"),
            api.get("/tinda/users?limit=1&status=active"),

            // TSD Stats
            api.get("/tsd/users?limit=1"),
            api.get("/tsd/users?limit=1&status=active"),

            // Logs Stats (ошибки за все время или можно добавить фильтр по дате на бэке)
            api.get("/logs?limit=1&level=ERROR"),
        ]);

        return {
            iiko: {
                total: iikoTotal.data.total,
                active: iikoActive.data.total,
                online: iikoOnline.data.total,
            },
            arca: {
                total: arcaTotal.data.total,
                active: arcaActive.data.total,
            },
            tinda: {
                total: tindaTotal.data.total,
                active: tindaActive.data.total,
            },
            tsd: {
                total: tsdTotal.data.total,
                active: tsdActive.data.total,
            },
            logs: {
                errors: logsErrors.data.total,
            }
        };
    }
};