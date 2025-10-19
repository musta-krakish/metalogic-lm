import type { LogEntry } from "@/types/log";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, User, Clock, Monitor, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogCardProps {
    log: LogEntry;
}

export function LogCard({ log }: LogCardProps) {
    const getLevelIcon = (level: string) => {
        switch (level) {
            case "ERROR":
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case "WARNING":
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("ru-RU", {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div
            className={cn(
                "group border rounded-xl p-4 transition-all duration-300 hover:shadow-md",
                getLevelStyles(log.level)
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Заголовок */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {getLevelIcon(log.level)}
                        <Badge
                            variant={getLevelVariant(log.level) as any}
                            className="font-medium"
                        >
                            {log.level}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(log.created_at)}
                        </span>

                        {/* Время выполнения */}
                        {log.metadata?.processing_time && (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.metadata.processing_time}s
                            </Badge>
                        )}

                        {/* Статус код */}
                        {log.metadata?.status_code && (
                            <Badge
                                variant={log.metadata.status_code >= 400 ? "destructive" : "default"}
                                className="font-mono"
                            >
                                {log.metadata.status_code}
                            </Badge>
                        )}
                    </div>

                    {/* Сообщение */}
                    <p className="text-sm text-gray-800 mb-3 leading-relaxed">
                        {log.message}
                    </p>

                    {/* Детали запроса */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {/* Метод и путь */}
                        {(log.method || log.path) && (
                            <div className="flex items-center gap-2">
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

                        {/* IP адрес */}
                        {log.metadata?.ip_address && (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.metadata.ip_address}
                            </Badge>
                        )}

                        {/* Браузер и ОС */}
                        {(log.metadata?.browser || log.metadata?.operating_system) && (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                {log.metadata.browser} {log.metadata.operating_system && `• ${log.metadata.operating_system}`}
                            </Badge>
                        )}

                        {/* Устройство */}
                        {log.metadata?.device && (
                            <Badge variant="outline">
                                {log.metadata.device}
                            </Badge>
                        )}
                    </div>

                    {/* Дополнительные данные */}
                    {log.metadata?.query_params && (
                        <div className="mt-2">
                            <Badge variant="outline" className="text-xs font-mono">
                                {log.metadata.query_params}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}