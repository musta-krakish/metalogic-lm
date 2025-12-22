import { useState, useEffect } from "react";
import { IikoService } from "@/services/iiko.service";
import type { IIkoLicenseItem, IIkoLicenseFilters } from "@/types/license";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Key } from "lucide-react";
import { IikoLicenseFilters } from "@/components/iikoLicenseFilters";
import { Pagination } from "@/components/Pagination";
import { IikoLicenseCard } from "@/components/IikoLicenseCard";

interface IikoLicensesProps {
    onLoadingChange?: (loading: boolean) => void;
}

export function IikoLicenses({ onLoadingChange }: IikoLicensesProps) {
    const [licensesData, setLicensesData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState<IIkoLicenseFilters>({
        status: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc'
    });

    // Уведомляем родителя о состоянии загрузки
    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    const fetchLicenses = async (page = 1) => {
        setLoading(true);
        try {
            const data = await IikoService.getLicenses(page, itemsPerPage, filters);
            setLicensesData(data);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Обновляем данные при изменении фильтров
    useEffect(() => {
        fetchLicenses(1);
    }, [filters]);

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const blob = await IikoService.exportLicenses(filters);

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `iiko_licenses_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Ошибка при экспорте:', err);
            alert('Произошла ошибка при экспорте данных');
        } finally {
            setExportLoading(false);
        }
    };

    const totalPages = licensesData ? Math.ceil(licensesData.total / itemsPerPage) : 0;

    return (
        <div className="space-y-6">
            {/* Заголовок и действия */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Key className="w-5 h-5 text-purple-600" />
                        Лицензии iiko
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm">
                        {licensesData ? `Всего лицензий: ${licensesData.total}` : 'Загрузка...'}
                    </p>
                </div>

                <Button
                    onClick={() => fetchLicenses(currentPage)}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl"
                >
                    {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    {loading ? "Обновление..." : "Обновить"}
                </Button>
            </div>

            {/* Фильтры */}
            <IikoLicenseFilters
                filters={filters}
                onFiltersChange={setFilters}
                onExport={handleExport}
                exportLoading={exportLoading}
                totalCount={licensesData?.total || 0}
                filteredCount={licensesData?.items?.length || 0}
            />

            {/* Пагинация */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={fetchLicenses}
                loading={loading}
            />

            {/* Содержимое */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : licensesData?.items?.length > 0 ? (
                        <div className="space-y-6 p-6">
                            {licensesData.items.map((license: IIkoLicenseItem, index: number) => (
                                <IikoLicenseCard
                                    key={license.license?.id || index}
                                    license={license}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {filters.search || filters.status !== 'all' ? "Лицензии не найдены" : "Нет лицензий"}
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                {filters.search || filters.status !== 'all'
                                    ? "Попробуйте изменить параметры фильтрации"
                                    : "Лицензии iiko еще не добавлены в систему"
                                }
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Пагинация внизу */}
            {licensesData?.items?.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={fetchLicenses}
                    loading={loading}
                />
            )}
        </div>
    );
}