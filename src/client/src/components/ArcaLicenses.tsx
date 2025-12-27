import { useState, useEffect } from "react";
import { ArcaService } from "@/services/arca.service";
import type { ArcaLicense, ArcaFilters, ArcaCreateDto } from "@/types/arca";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Plus, Search, Loader2, Server } from "lucide-react";
import { ArcaLicenseCard } from "./ArcaLicenseCard";
import { Pagination } from "./Pagination";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ArcaLicenses() {
    const [data, setData] = useState<{ items: ArcaLicense[], total: number }>({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<ArcaFilters>({ status: 'all' });

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState<ArcaLicense | null>(null);
    const [formData, setFormData] = useState<Partial<ArcaCreateDto & { expire_date?: string, status?: string }>>({});
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const res = await ArcaService.getLicenses(page, 10, filters);
            setData(res);
        } catch (error) {
            console.error(error);
            toast.error("Не удалось загрузить список лицензий");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLicenses(); }, [page, filters]);

    const handleSync = async () => {
        if (loading) return;
        setLoading(true);
        const promise = async () => {
            await ArcaService.syncLicenses();
            await fetchLicenses();
        };

        toast.promise(promise(), {
            loading: 'Синхронизация с Arca...',
            success: 'Синхронизация успешно выполнена',
            error: 'Ошибка при синхронизации'
        });

        try { await promise; }
        catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await ArcaService.createLicense(formData as ArcaCreateDto);
            setIsCreateOpen(false);
            setFormData({});
            await fetchLicenses();
            toast.success("Лицензия успешно создана");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка создания лицензии");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (mac: string) => {
        setDeleteId(mac);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        const promise = async () => {
            await ArcaService.deleteLicense(deleteId);
            await fetchLicenses();
        };

        toast.promise(promise(), {
            loading: 'Удаление...',
            success: 'Лицензия удалена',
            error: 'Не удалось удалить лицензию'
        });

        setDeleteId(null);
    };

    const handleToggleActive = async (mac: string) => {
        setTogglingId(mac);
        try {
            await ArcaService.toggleActive(mac);
            await fetchLicenses();
            toast.success("Статус лицензии изменен");
        }
        catch (error) {
            console.error(error);
            toast.error("Ошибка изменения статуса");
        } finally {
            setTogglingId(null);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await ArcaService.exportLicenses(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arca_licenses.xlsx`;
            a.click();
            toast.success("Файл экспорта скачан");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка при экспорте");
        }
    };

    const handleUpdate = async () => {
        if (!editingLicense || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await ArcaService.updateLicense({
                mac_address: editingLicense.mac_address,
                license_key: formData.license_key,
                license_date: formData.license_date,
                org: formData.org,
                bin: formData.bin,
                status: formData.status,
                expire_date: formData.expire_date
            });

            setIsEditOpen(false);
            setEditingLicense(null);
            setFormData({});
            await fetchLicenses();
            toast.success("Лицензия обновлена");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка обновления лицензии");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (license: ArcaLicense) => {
        setEditingLicense(license);
        setFormData({
            org: license.org,
            bin: license.bin,
            license_key: license.licences_key || license.license_key,
            license_date: license.licences_date ? license.licences_date.split('T')[0] :
                          license.license_date ? license.license_date.split('T')[0] : '',
            expire_date: license.expire_date ? license.expire_date.split('T')[0] : '',
            status: license.status
        });
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Поиск по MAC, Org, BIN..."
                            className="pl-10 bg-white"
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(v: string) => setFilters({...filters, status: v as ArcaFilters['status']})}
                    >
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            <SelectItem value="active">Активные</SelectItem>
                            <SelectItem value="inactive">Неактивные</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Excel
                    </Button>
                    <Button variant="outline" onClick={handleSync} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Sync...' : 'Sync'}
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Создать
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : data.items.length > 0 ? (
                    data.items.map((license) => (
                        <ArcaLicenseCard
                            key={license.mac_address}
                            license={license}
                            onEdit={openEdit}
                            onDelete={handleDeleteClick}
                            onToggleActive={handleToggleActive}
                            isLoading={togglingId === license.mac_address}
                        />
                    ))
                ) : (
                    <EmptyState title="Лицензии не найдены" icon={Server} actionLabel="Создать" onAction={() => setIsCreateOpen(true)} />
                )}
            </div>

             {data.items.length > 0 && <Pagination currentPage={page} totalPages={Math.ceil(data.total / 10)} onPageChange={setPage} loading={loading} />}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={(val) => !isSubmitting && setIsCreateOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новая лицензия Arca</DialogTitle>
                        <DialogDescription>Заполните обязательные поля.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>MAC Address</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, mac_address: e.target.value})} placeholder="AA:BB:CC:DD:EE:FF" />
                        </div>
                        <div className="grid gap-2">
                            <Label>License Key</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, license_key: e.target.value})} placeholder="UUID key" />
                        </div>
                        <div className="grid gap-2">
                            <Label>License Date</Label>
                            <Input type="date" disabled={isSubmitting} onChange={(e) => setFormData({...formData, license_date: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Organization (Optional)</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, org: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>BIN (Optional)</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, bin: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Отмена</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Создать"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(val) => !isSubmitting && setIsEditOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование лицензии</DialogTitle>
                        <DialogDescription>{editingLicense?.mac_address}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid gap-2">
                            <Label>License Key</Label>
                            <Input disabled={isSubmitting} defaultValue={formData.license_key} onChange={(e) => setFormData({...formData, license_key: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <Input disabled={isSubmitting} defaultValue={formData.org} onChange={(e) => setFormData({...formData, org: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>BIN</Label>
                            <Input disabled={isSubmitting} defaultValue={formData.bin} onChange={(e) => setFormData({...formData, bin: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>License Date</Label>
                                <Input type="date" disabled={isSubmitting} defaultValue={formData.license_date} onChange={(e) => setFormData({...formData, license_date: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-red-600">Expire Date</Label>
                                <Input
                                    type="date"
                                    disabled={isSubmitting}
                                    defaultValue={formData.expire_date}
                                    onChange={(e) => setFormData({...formData, expire_date: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>Отмена</Button>
                        <Button onClick={handleUpdate} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы собираетесь удалить лицензию <b>{deleteId}</b>.
                            Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}