import { useState, useEffect } from "react";
import { IikoService } from "@/services/iiko.service";
import type { IIkoLicenseItem, IIkoLicenseFilters } from "@/types/license";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Key, Loader2, Plus } from "lucide-react";
import { IikoLicenseFilters } from "@/components/iikoLicenseFilters";
import { Pagination } from "@/components/Pagination";
import { IikoLicenseCard } from "@/components/IikoLicenseCard";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

interface IikoLicensesProps {
    onLoadingChange?: (loading: boolean) => void;
}

export function IikoLicenses({ onLoadingChange }: IikoLicensesProps) {
    const [licensesData, setLicensesData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState<IIkoLicenseFilters>({
        status: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc'
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createData, setCreateData] = useState({ uid: "", title: "" });

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
            toast.error("Не удалось загрузить лицензии Iiko");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLicenses(1);
    }, [filters]);

    const handleCreate = async () => {
        if (!createData.uid || !createData.title) {
            toast.warning("Заполните UID и Название");
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await IikoService.createLicense(createData.uid, createData.title);
            setIsCreateOpen(false);
            setCreateData({ uid: "", title: "" });
            await fetchLicenses(1);
            toast.success("Лицензия Iiko успешно добавлена");
        } catch (err) {
            console.error(err);
            toast.error("Ошибка при создании лицензии");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const blob = await IikoService.exportLicenses(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `iiko_licenses.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Экспорт завершен");
        } catch (err) {
            console.error('Ошибка при экспорте:', err);
            toast.error('Произошла ошибка при экспорте данных');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPages = licensesData ? Math.ceil(licensesData.total / itemsPerPage) : 0;

    return (
        <div className="space-y-6">
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

                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить
                    </Button>
                    <Button
                        onClick={() => fetchLicenses(currentPage)}
                        disabled={loading || isSubmitting}
                        variant="outline"
                        className="flex items-center gap-2 rounded-xl"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {loading ? "Обновление..." : "Обновить"}
                    </Button>
                </div>
            </div>

            <IikoLicenseFilters
                filters={filters}
                onFiltersChange={setFilters}
                onExport={handleExport}
                exportLoading={isSubmitting}
                totalCount={licensesData?.total || 0}
                filteredCount={licensesData?.items?.length || 0}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={fetchLicenses}
                loading={loading || isSubmitting}
            />

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
                        <EmptyState
                             title="Лицензии Iiko не найдены"
                             description="Попробуйте изменить параметры фильтрации или добавьте новую лицензию."
                             icon={Key}
                             actionLabel="Добавить лицензию"
                             onAction={() => setIsCreateOpen(true)}
                        />
                    )}
                </CardContent>
            </Card>

            {licensesData?.items?.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={fetchLicenses}
                    loading={loading || isSubmitting}
                />
            )}

            {/* Dialog create */}
            <Dialog open={isCreateOpen} onOpenChange={(val) => !isSubmitting && setIsCreateOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новая лицензия iiko</DialogTitle>
                        <DialogDescription>
                            Создание новой лицензии в системе.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>UID <span className="text-red-500">*</span></Label>
                            <Input
                                value={createData.uid}
                                onChange={(e) => setCreateData({...createData, uid: e.target.value})}
                                placeholder="Уникальный идентификатор"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Название <span className="text-red-500">*</span></Label>
                            <Input
                                value={createData.title}
                                onChange={(e) => setCreateData({...createData, title: e.target.value})}
                                placeholder="Название точки/организации"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                            Отмена
                        </Button>
                        <Button onClick={handleCreate} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Создаем...
                                </>
                            ) : (
                                "Создать"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}