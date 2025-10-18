import { useEffect, useState } from "react";
import { LogsService, type LogEntry } from "@/services/logs.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    RefreshCw,
    Search,
    Filter,
    Download,
    AlertCircle,
    Info,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    FileText,
    ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Logs() {
    const [logsData, setLogsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const fetchLogs = async (page = 1, level?: string) => {
        setLoading(true);
        try {
            const data = await LogsService.getLogs(page, itemsPerPage, level === "all" ? undefined : level);
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

    // Фильтрация на клиенте по сообщению
    const filteredLogs = logsData?.items?.filter((log: LogEntry) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.method?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getLevelIcon = (level: string) => {
        switch (level) {
            case "ERROR":
                return <AlertCircle className="w-4 h-4" />;
            case "WARNING":
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Info className="w-4 h-4" />;
        }
    };

    const getLevelVariant = (level: string) => {
        switch (level) {
            case "ERROR":
                return "destructive";
            case "WARNING":
                return "default";
            case "INFO":
                return "secondary";
            default:
                return "outline";
        }
    };

    const getLevelStyles = (level: string) => {
        switch (level) {
            case "ERROR":
                return "border-red-200 bg-red-50/50 hover:bg-red-50";
            case "WARNING":
                return "border-amber-200 bg-amber-50/50 hover:bg-amber-50";
            case "INFO":
                return "border-blue-200 bg-blue-50/50 hover:bg-blue-50";
            default:
                return "border-gray-200 bg-gray-50/50 hover:bg-gray-50";
        }
    };

    const exportLogs = () => {
        // Логика экспорта логов
        console.log("Exporting logs...");
    };

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

                <div className="flex gap-3">
                    <Button
                        onClick={exportLogs}
                        variant="outline"
                        className="flex items-center gap-2 border-gray-300 rounded-xl"
                    >
                        <Download className="w-4 h-4" />
                        Экспорт
                    </Button>
                    <Button
                        onClick={() => fetchLogs(currentPage, filter)}
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
            </div>

            {/* Фильтры и поиск */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Поиск по сообщению или пути..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-xl border-gray-300 focus:border-purple-500"
                        />
                    </div>

                    <Select
                        value={filter}
                        onValueChange={(val) => {
                            setFilter(val);
                            fetchLogs(1, val);
                        }}
                    >
                        <SelectTrigger className="w-[180px] rounded-xl">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Все уровни" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all" className="rounded-lg">Все уровни</SelectItem>
                            <SelectItem value="INFO" className="rounded-lg flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" />
                                INFO
                            </SelectItem>
                            <SelectItem value="WARNING" className="rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                WARNING
                            </SelectItem>
                            <SelectItem value="ERROR" className="rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                ERROR
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Пагинация */}
                {logsData && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 whitespace-nowrap">
                            Страница {currentPage} из {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLogs(currentPage - 1, filter)}
                                disabled={currentPage <= 1 || loading}
                                className="rounded-xl"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLogs(currentPage + 1, filter)}
                                disabled={currentPage >= totalPages || loading}
                                className="rounded-xl"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Журнал активности системы
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-sm">
                                Показано: {filteredLogs.length} из {logsData?.total}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <div className="space-y-3 p-6 pt-0 max-h-[70vh] overflow-y-auto">
                            {filteredLogs.map((log: LogEntry) => (
                                <div
                                    key={log.id}
                                    className={cn(
                                        "group border rounded-xl p-4 transition-all duration-300 hover:shadow-md",
                                        getLevelStyles(log.level)
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getLevelIcon(log.level)}
                                                <Badge
                                                    variant={getLevelVariant(log.level) as any}
                                                    className="font-medium"
                                                >
                                                    {log.level}
                                                </Badge>
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(log.created_at).toLocaleString("ru-RU")}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-800 mb-2 leading-relaxed">
                                                {log.message}
                                            </p>

                                            {(log.path || log.method) && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    {log.method && (
                                                        <Badge variant="outline" className="font-mono">
                                                            {log.method}
                                                        </Badge>
                                                    )}
                                                    {log.path && (
                                                        <span className="flex items-center gap-1 font-mono bg-gray-100 px-2 py-1 rounded">
                                                            <ExternalLink className="w-3 h-3" />
                                                            {log.path}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchTerm || filter !== "all" ? "Записи не найдены" : "Журнал пуст"}
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                {searchTerm || filter !== "all"
                                    ? "Попробуйте изменить параметры поиска или фильтры"
                                    : "Здесь будут отображаться события системы"
                                }
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Статистика по уровням */}
            {logsData?.items && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 bg-blue-50/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Info className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {logsData.items.filter((log: LogEntry) => log.level === "INFO").length}
                                </p>
                                <p className="text-sm text-blue-600">INFO</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-amber-50/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                            <div>
                                <p className="text-2xl font-bold text-amber-600">
                                    {logsData.items.filter((log: LogEntry) => log.level === "WARNING").length}
                                </p>
                                <p className="text-sm text-amber-600">WARNING</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-red-50/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    {logsData.items.filter((log: LogEntry) => log.level === "ERROR").length}
                                </p>
                                <p className="text-sm text-red-600">ERROR</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}