import { useEffect, useState } from "react";
import { DashboardService, type SystemStats } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Smartphone, Users, Server, Activity, AlertCircle, CheckCircle, Wifi } from "lucide-react";
import { LogsService } from "@/services/logs.service";
import { LogCard } from "@/components/LogCard";
import type { LogEntry } from "@/types/log";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Грузим статистику и последние 3 лога
                const [statsData, logsData] = await Promise.all([
                    DashboardService.getStats(),
                    LogsService.getLogs(1, 3)
                ]);
                setStats(statsData);
                setRecentLogs(logsData.items);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Компонент скелетона для загрузки
    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Обзор системы
                </h2>
                <p className="text-gray-600 mt-1">
                    Сводная статистика по всем лицензиям и интеграциям
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Iiko Card */}
                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            iiko Licenses
                        </CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.iiko.total}</div>
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                            <span className="flex items-center text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {stats?.iiko.active} активных
                            </span>
                            <span className="flex items-center text-blue-600">
                                <Wifi className="w-3 h-3 mr-1" />
                                {stats?.iiko.online} онлайн
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Arca Card */}
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Arca Licenses
                        </CardTitle>
                        <Server className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.arca.total}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                            {stats?.arca.active} активных терминалов
                        </p>
                    </CardContent>
                </Card>

                {/* Tinda Card */}
                <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Tinda Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.tinda.total}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                            {stats?.tinda.active} активных аккаунтов
                        </p>
                    </CardContent>
                </Card>

                {/* TSD Card */}
                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            TSD Users
                        </CardTitle>
                        <Smartphone className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.tsd.total}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                            {stats?.tsd.active} активных устройств
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* System Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Logs Column */}
                <Card className="lg:col-span-2 border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-gray-500" />
                                Последние события
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/logs">Все логи</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentLogs.map((log) => (
                            <LogCard key={log.id} log={log} />
                        ))}
                    </CardContent>
                </Card>

                {/* System Status / Alerts Column */}
                <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-gray-500" />
                            Состояние системы
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-red-900">Ошибок в логах</p>
                                        <p className="text-xs text-red-700">Всего зафиксировано</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-red-600">{stats?.logs.errors}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <Server className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-900">API Status</p>
                                        <p className="text-xs text-green-700">Все системы доступны</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-green-600">ONLINE</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}