import { Search, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { IIkoLicenseFilters } from "@/types/license";

interface IikoLicenseFiltersProps {
    filters: IIkoLicenseFilters;
    onFiltersChange: (filters: IIkoLicenseFilters) => void;
    onExport: () => void;
    exportLoading?: boolean;
    totalCount: number;
    filteredCount: number;
}

export function IikoLicenseFilters({
    filters,
    onFiltersChange,
    onExport,
    exportLoading = false,
    totalCount,
    filteredCount,
}: IikoLicenseFiltersProps) {

    const handleSearchChange = (value: string) => {
        onFiltersChange({
            ...filters,
            search: value || undefined
        });
    };

    const handleStatusChange = (value: string) => {
        onFiltersChange({
            ...filters,
            status: value as 'active' | 'expired' | 'all'
        });
    };

    const handleOnlineChange = (value: string) => {
        onFiltersChange({
            ...filters,
            isOnline: value === 'all' ? undefined : value === 'online'
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            search: undefined,
            status: 'all',
            isOnline: undefined,
            sortBy: 'updated_at',
            sortOrder: 'desc'
        });
    };

    const hasActiveFilters = filters.search || filters.status !== 'all' || filters.isOnline !== undefined;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Поиск */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Поиск по организации или коду лицензии..."
                            value={filters.search || ''}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 rounded-xl border-gray-300 focus:border-purple-500"
                        />
                    </div>

                    {/* Фильтр по статусу */}
                    <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[150px] rounded-xl">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            <SelectItem value="active">Активные</SelectItem>
                            <SelectItem value="expired">Истекшие</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Фильтр по онлайн статусу */}
                    <Select
                        value={filters.isOnline === undefined ? 'all' : filters.isOnline ? 'online' : 'offline'}
                        onValueChange={handleOnlineChange}
                    >
                        <SelectTrigger className="w-[150px] rounded-xl">
                            <SelectValue placeholder="Онлайн" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            <SelectItem value="online">Онлайн</SelectItem>
                            <SelectItem value="offline">Офлайн</SelectItem>
                        </SelectContent>
                    </Select>


                    {/* Кнопка сброса фильтров */}
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="rounded-xl"
                        >
                            Сбросить
                        </Button>
                    )}
                </div>

                {/* Кнопка экспорта */}
                <Button
                    onClick={onExport}
                    disabled={exportLoading}
                    variant="outline"
                    className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                >
                    {exportLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    {exportLoading ? "Экспорт..." : "Excel"}
                </Button>
            </div>

            {/* Информация о фильтрации */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Найдено: {filteredCount} из {totalCount}</span>
                {hasActiveFilters && (
                    <span className="text-purple-600">Применены фильтры</span>
                )}
            </div>
        </div>
    );
}