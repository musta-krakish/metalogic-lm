import { useState, useEffect } from "react";
import { TsdService } from "@/services/tsd.service";
import type { TsdUser, TsdFilters, TsdCreateDto } from "@/types/tsd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Plus, Search, Loader2, Smartphone } from "lucide-react";
import { TsdUserCard } from "./TsdUserCard";
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

export function TsdUsers() {
    const [data, setData] = useState<{ items: TsdUser[], total: number }>({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<TsdFilters>({ status: 'all' });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPassOpen, setIsPassOpen] = useState(false);

    const [editingUser, setEditingUser] = useState<TsdUser | null>(null);
    const [createData, setCreateData] = useState<Partial<TsdCreateDto>>({ role: "User" });
    const [editForm, setEditForm] = useState<{ org?: string, bin?: string, count?: number, expireDate?: string }>({});
    const [newPassword, setNewPassword] = useState("");
    const [deleteUsername, setDeleteUsername] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await TsdService.getUsers(page, 10, filters);
            setData(res);
        } catch (error) {
            console.error(error);
            toast.error("Не удалось загрузить пользователей TSD");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [page, filters]);

    const handleSync = async () => {
        if (loading) return;
        setLoading(true);

        const promise = async () => {
            await TsdService.syncUsers();
            await fetchUsers();
        };

        toast.promise(promise(), {
            loading: 'Синхронизация TSD...',
            success: 'Успешно синхронизировано',
            error: 'Ошибка синхронизации'
        });

        try { await promise; }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!createData.username || !createData.password) {
            toast.warning("Username и Password обязательны");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await TsdService.createUser(createData as TsdCreateDto);
            setIsCreateOpen(false);
            setCreateData({ role: "User" });
            await fetchUsers();
            toast.success("Пользователь TSD создан");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка создания пользователя");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingUser || isSubmitting) return;
        const username = editingUser.username;

        setIsSubmitting(true);
        try {
            const promises = [];
            if (editForm.org !== undefined && editForm.org !== editingUser.org) {
                promises.push(TsdService.setOrg(username, editForm.org));
            }
            if (editForm.bin !== undefined && editForm.bin !== editingUser.bin) {
                promises.push(TsdService.setBin(username, editForm.bin));
            }
            if (editForm.count !== undefined && editForm.count !== editingUser.availableDeviceCount) {
                promises.push(TsdService.setDeviceCount(username, editForm.count));
            }
            if (editForm.expireDate) {
                promises.push(TsdService.setExpireDate(username, editForm.expireDate));
            }

            await Promise.all(promises);
            setIsEditOpen(false);
            setEditingUser(null);
            await fetchUsers();
            toast.success("Данные обновлены");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка при обновлении");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangePassword = async () => {
        if (!editingUser || !newPassword || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await TsdService.setPassword(editingUser.username, newPassword);
            setIsPassOpen(false);
            setNewPassword("");
            setEditingUser(null);
            toast.success("Пароль успешно изменен");
        } catch (error) {
            console.error(error);
            toast.error("Не удалось сменить пароль");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (username: string) => {
        setDeleteUsername(username);
    };

    const confirmDelete = async () => {
        if (!deleteUsername) return;

        const promise = async () => {
             await TsdService.deleteUser(deleteUsername);
             await fetchUsers();
        };

        toast.promise(promise(), {
            loading: 'Удаление...',
            success: 'Пользователь удален',
            error: 'Ошибка удаления'
        });

        setDeleteUsername(null);
    };

    const handleToggleActive = async (username: string) => {
        try {
            await TsdService.toggleActive(username);
            await fetchUsers();
            toast.success("Статус изменен");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка смены статуса");
        }
    };

    const handleExport = async () => {
        try {
            const blob = await TsdService.exportUsers(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tsd_users.xlsx`;
            a.click();
            toast.success("Экспорт завершен");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка экспорта");
        }
    };

    const openEdit = (user: TsdUser) => {
        setEditingUser(user);
        setEditForm({
            org: user.org,
            bin: user.bin,
            count: user.availableDeviceCount,
            expireDate: user.expireDate ? user.expireDate.split('T')[0] : ''
        });
        setIsEditOpen(true);
    };

    const openPass = (user: TsdUser) => {
        setEditingUser(user);
        setNewPassword("");
        setIsPassOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Поиск по Username, Org..."
                            className="pl-10 bg-white"
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(v: string) => setFilters({...filters, status: v as TsdFilters['status']})}
                    >
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            <SelectItem value="active">Активные</SelectItem>
                            <SelectItem value="inactive">Отключенные</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Excel
                    </Button>
                    <Button variant="outline" onClick={handleSync} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 border-0 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Создать
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                    </div>
                ) : data.items.length > 0 ? (
                    data.items.map((user) => (
                        <TsdUserCard
                            key={user.username}
                            user={user}
                            onEdit={openEdit}
                            onPassword={openPass}
                            onDelete={handleDeleteClick}
                            onToggleActive={handleToggleActive}
                        />
                    ))
                ) : (
                    <EmptyState
                        title="Пользователи TSD не найдены"
                        description="Нет данных. Синхронизируйте устройства или добавьте нового пользователя."
                        icon={Smartphone}
                        actionLabel="Создать пользователя"
                        onAction={() => setIsCreateOpen(true)}
                    />
                )}
            </div>

            {data.items.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(data.total / 10)}
                    onPageChange={setPage}
                    loading={loading}
                />
            )}

            {/* Dialogs */}
            <Dialog open={isCreateOpen} onOpenChange={(val) => !isSubmitting && setIsCreateOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый пользователь TSD</DialogTitle>
                        <DialogDescription>Создание пользователя терминала.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Username <span className="text-red-500">*</span></Label>
                            <Input disabled={isSubmitting} onChange={(e) => setCreateData({...createData, username: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Password <span className="text-red-500">*</span></Label>
                            <Input type="password" disabled={isSubmitting} onChange={(e) => setCreateData({...createData, password: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select disabled={isSubmitting} onValueChange={(v) => setCreateData({...createData, role: v})} defaultValue="User">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="User">User</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setCreateData({...createData, org: e.target.value})} />
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

            <Dialog open={isEditOpen} onOpenChange={(val) => !isSubmitting && setIsEditOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <Input disabled={isSubmitting} defaultValue={editForm.org} onChange={(e) => setEditForm({...editForm, org: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>BIN</Label>
                            <Input disabled={isSubmitting} defaultValue={editForm.bin} onChange={(e) => setEditForm({...editForm, bin: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Device Count</Label>
                                <Input type="number" disabled={isSubmitting} defaultValue={editForm.count} onChange={(e) => setEditForm({...editForm, count: parseInt(e.target.value)})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Expire Date</Label>
                                <Input type="date" disabled={isSubmitting} defaultValue={editForm.expireDate} onChange={(e) => setEditForm({...editForm, expireDate: e.target.value})} />
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

            <Dialog open={isPassOpen} onOpenChange={(val) => !isSubmitting && setIsPassOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Смена пароля</DialogTitle>
                        <DialogDescription>{editingUser?.username}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Новый пароль</Label>
                            <Input type="password" disabled={isSubmitting} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPassOpen(false)} disabled={isSubmitting}>Отмена</Button>
                        <Button onClick={handleChangePassword} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Изменить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteUsername} onOpenChange={(open) => !open && setDeleteUsername(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Пользователь <b>{deleteUsername}</b> будет удален.
                            Устройства потеряют доступ.
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