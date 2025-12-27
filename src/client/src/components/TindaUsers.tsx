import { useState, useEffect } from "react";
import { TindaService } from "@/services/tinda.service";
import type { TindaUser, TindaFilters, TindaCreateDto } from "@/types/tinda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Plus, Search, Loader2 } from "lucide-react";
import { TindaUserCard } from "./TindaUserCard";
import { Pagination } from "./Pagination";

export function TindaUsers() {
    const [data, setData] = useState<{ items: TindaUser[], total: number }>({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Состояние отправки
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<TindaFilters>({ status: 'all' });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<TindaUser | null>(null);
    const [formData, setFormData] = useState<Partial<TindaCreateDto>>({});

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await TindaService.getUsers(page, 10, filters);
            setData(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, filters]);

    const handleSync = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await TindaService.syncUsers();
            await fetchUsers();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.username || !formData.password || !formData.expireDate) {
            alert("Заполните обязательные поля (Username, Password, Expire Date)");
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await TindaService.createUser({
                username: formData.username,
                password: formData.password,
                org: formData.org || "",
                bin: formData.bin || "",
                expireDate: formData.expireDate,
                role: 1 // Default role
            });
            setIsCreateOpen(false);
            setFormData({});
            await fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Ошибка создания пользователя");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingUser || !editingUser._Id || isSubmitting) return;
        const userId = editingUser._Id;

        setIsSubmitting(true);
        try {
            const promises = [];

            if (formData.org !== undefined && formData.org !== editingUser.org) {
                promises.push(TindaService.setOrg(userId, formData.org));
            }
            if (formData.bin !== undefined && formData.bin !== editingUser.bin) {
                promises.push(TindaService.setBin(userId, formData.bin));
            }
            if (formData.expireDate) {
                promises.push(TindaService.setExpireDate(userId, formData.expireDate));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }

            setIsEditOpen(false);
            setEditingUser(null);
            setFormData({});
            await fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Ошибка обновления пользователя");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await TindaService.toggleActive(id);
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const openEdit = (user: TindaUser) => {
        setEditingUser(user);
        setFormData({
            org: user.org,
            bin: user.bin,
            expireDate: user.expireDate ? user.expireDate.split('T')[0] : ''
        });
        setIsEditOpen(true);
    };

    const handleExport = async () => {
        try {
            const blob = await TindaService.exportUsers(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tinda_users_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Поиск по Login, Org..."
                            className="pl-10 bg-white"
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(v: string) => setFilters({...filters, status: v as TindaFilters['status']})}
                    >
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            <SelectItem value="active">Активные</SelectItem>
                            <SelectItem value="inactive">Заблокированные</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Excel
                    </Button>
                    <Button variant="outline" onClick={handleSync} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Sync' : 'Sync'}
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-pink-600 to-rose-600 border-0">
                        <Plus className="w-4 h-4 mr-2" /> Добавить
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {data.items.map((user) => (
                    <TindaUserCard
                        key={user._Id || Math.random()}
                        user={user}
                        onEdit={openEdit}
                        onToggleActive={handleToggleActive}
                    />
                ))}
                {data.items.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">Пользователи не найдены</div>
                )}
            </div>

            <Pagination
                currentPage={page}
                totalPages={Math.ceil(data.total / 10)}
                onPageChange={setPage}
                loading={loading}
            />

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={(val) => !isSubmitting && setIsCreateOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый пользователь Tinda</DialogTitle>
                        <DialogDescription>Создание нового аккаунта.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Username (Login) <span className="text-red-500">*</span></Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="login" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Password <span className="text-red-500">*</span></Label>
                            <Input type="password" disabled={isSubmitting} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="******" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Expire Date <span className="text-red-500">*</span></Label>
                                <Input type="date" disabled={isSubmitting} onChange={(e) => setFormData({...formData, expireDate: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Input value="1" disabled className="bg-gray-100" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, org: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>BIN</Label>
                            <Input disabled={isSubmitting} onChange={(e) => setFormData({...formData, bin: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Отмена</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Создаем...
                                </>
                            ) : "Создать"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(val) => !isSubmitting && setIsEditOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование пользователя</DialogTitle>
                        <DialogDescription>{editingUser?.login}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <Input disabled={isSubmitting} defaultValue={formData.org} onChange={(e) => setFormData({...formData, org: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>BIN</Label>
                            <Input disabled={isSubmitting} defaultValue={formData.bin} onChange={(e) => setFormData({...formData, bin: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Expire Date</Label>
                            <Input type="date" disabled={isSubmitting} defaultValue={formData.expireDate} onChange={(e) => setFormData({...formData, expireDate: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>Отмена</Button>
                        <Button onClick={handleUpdate} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Сохранить
                                </>
                            ) : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}