import { useState, useEffect } from "react";
import { TsdService } from "@/services/tsd.service";
import type { TsdUser, TsdFilters, TsdCreateDto } from "@/types/tsd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Plus, Search } from "lucide-react";
import { TsdUserCard } from "./TsdUserCard";
import { Pagination } from "./Pagination";

export function TsdUsers() {
    // State
    const [data, setData] = useState<{ items: TsdUser[], total: number }>({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<TsdFilters>({ status: 'all' });

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPassOpen, setIsPassOpen] = useState(false);

    // Form Data
    const [editingUser, setEditingUser] = useState<TsdUser | null>(null);
    const [createData, setCreateData] = useState<Partial<TsdCreateDto>>({ role: "User" });
    const [editForm, setEditForm] = useState<{ org?: string, bin?: string, count?: number, expireDate?: string }>({});
    const [newPassword, setNewPassword] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await TsdService.getUsers(page, 10, filters);
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
        setLoading(true);
        try {
            await TsdService.syncUsers();
            await fetchUsers();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleCreate = async () => {
        if (!createData.username || !createData.password) {
            alert("Username and Password are required");
            return;
        }
        try {
            await TsdService.createUser(createData as TsdCreateDto);
            setIsCreateOpen(false);
            setCreateData({ role: "User" });
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Error creating user");
        }
    };

    const handleUpdate = async () => {
        if (!editingUser) return;
        const username = editingUser.username;

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
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Failed to update user");
        }
    };

    const handleChangePassword = async () => {
        if (!editingUser || !newPassword) return;
        try {
            await TsdService.setPassword(editingUser.username, newPassword);
            setIsPassOpen(false);
            setNewPassword("");
            setEditingUser(null);
            alert("Password updated");
        } catch (error) {
            console.error(error);
            alert("Failed to update password");
        }
    };

    const handleDelete = async (username: string) => {
        if (!confirm(`Are you sure you want to delete ${username}?`)) return;
        try {
            await TsdService.deleteUser(username);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Failed to delete user");
        }
    };

    const handleToggleActive = async (username: string) => {
        try {
            await TsdService.toggleActive(username);
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await TsdService.exportUsers(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tsd_users_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Helpers ---

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
            {/* Toolbar */}
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

            {/* List */}
            <div className="space-y-4">
                {data.items.map((user) => (
                    <TsdUserCard
                        key={user.username}
                        user={user}
                        onEdit={openEdit}
                        onPassword={openPass}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                    />
                ))}
                {data.items.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">Пользователи TSD не найдены</div>
                )}
            </div>

            <Pagination
                currentPage={page}
                totalPages={Math.ceil(data.total / 10)}
                onPageChange={setPage}
                loading={loading}
            />

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый пользователь TSD</DialogTitle>
                        <DialogDescription>Создание нового пользователя терминала.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Username <span className="text-red-500">*</span></Label>
                            <Input onChange={(e) => setCreateData({...createData, username: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Password <span className="text-red-500">*</span></Label>
                            <Input type="password" onChange={(e) => setCreateData({...createData, password: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select onValueChange={(v) => setCreateData({...createData, role: v})} defaultValue="User">
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
                            <Label>Organization (Optional)</Label>
                            <Input onChange={(e) => setCreateData({...createData, org: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
                        <Button onClick={handleCreate}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактирование пользователя</DialogTitle>
                        <DialogDescription>{editingUser?.username}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <Input defaultValue={editForm.org} onChange={(e) => setEditForm({...editForm, org: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>BIN</Label>
                            <Input defaultValue={editForm.bin} onChange={(e) => setEditForm({...editForm, bin: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Device Count</Label>
                                <Input type="number" defaultValue={editForm.count} onChange={(e) => setEditForm({...editForm, count: parseInt(e.target.value)})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Expire Date</Label>
                                <Input type="date" defaultValue={editForm.expireDate} onChange={(e) => setEditForm({...editForm, expireDate: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Отмена</Button>
                        <Button onClick={handleUpdate}>Сохранить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Password Dialog */}
            <Dialog open={isPassOpen} onOpenChange={setIsPassOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Смена пароля</DialogTitle>
                        <DialogDescription>{editingUser?.username}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Новый пароль</Label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPassOpen(false)}>Отмена</Button>
                        <Button onClick={handleChangePassword}>Изменить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}