import { useState, useEffect } from "react";
import { LogsService } from "@/services/logs.service";
import type { LogEntry } from "@/types/log";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { LogCard } from "@/components/LogCard";

export default function Logs() {
    const [logsData, setLogsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const data = await LogsService.getLogs(page, itemsPerPage);
            setLogsData(data);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const totalPages = logsData ? Math.ceil(logsData.total / itemsPerPage) : 0;

    return (
        <div className="space-y-6 p-6">
            {/* Заголовок и действия */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Журнал событий
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {logsData ? `Всего записей: ${logsData.total}` : 'Мониторинг активности системы'}
                    </p>
                </div>

                <Button
                    onClick={() => fetchLogs(currentPage)}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                >
                    {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    {loading ? "Обновление..." : "Обновить"}
                </Button>
            </div>

            {/* Пагинация */}
            {logsData && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Страница {currentPage} из {totalPages}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={fetchLogs}
                        loading={loading}
                    />
                </div>
            )}

            {/* Содержимое */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Журнал активности системы
                        </CardTitle>
                        <Badge variant="outline" className="text-sm">
                            Показано: {logsData?.items?.length || 0} из {logsData?.total || 0}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : logsData?.items?.length > 0 ? (
                        <div className="space-y-3 p-6 pt-0 max-h-[70vh] overflow-y-auto">
                            {logsData.items.map((log: LogEntry) => (
                                <LogCard key={log.id} log={log} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Журнал пуст
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Здесь будут отображаться события системы
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Пагинация внизу */}
            {logsData?.items?.length > 0 && (
                <div className="flex justify-end">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={fetchLogs}
                        loading={loading}
                    />
                </div>
            )}
        </div>
    );
}