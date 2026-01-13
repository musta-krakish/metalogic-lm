import { useState, useEffect } from "react";
import { KaspiService } from "@/services/kaspi.service";
import type { KaspiUser, KaspiFilters, KaspiCreateDto } from "@/types/kaspi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Plus, Search, Loader2, Store, Eye, EyeOff, Copy, Check } from "lucide-react";
import { KaspiUserCard } from "./KaspiUserCard";
import { Pagination } from "./Pagination";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { DateDisplay } from "@/components/ui/date-display";

export function KaspiUsers() {
    const [data, setData] = useState<{ items: KaspiUser[], total: number }>({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<KaspiFilters>({ status: 'all' });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createData, setCreateData] = useState<Partial<KaspiCreateDto>>({});
    const [showPassword, setShowPassword] = useState(false);

    const [selectedUser, setSelectedUser] = useState<KaspiUser | null>(null);
    const [copiedId, setCopiedId] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await KaspiService.getUsers(page, 10, filters);
            setData(res);
        } catch (error) {
            console.error(error);
            toast.error("Не удалось загрузить пользователей Kaspi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [page, filters]);

    const handleSync = async () => {
        if (loading) return;
        setLoading(true);

        const promise = async () => {
            await KaspiService.syncUsers();
            await fetchUsers();
        };

        toast.promise(promise(), {
            loading: 'Синхронизация с MongoDB...',
            success: 'Успешно синхронизировано',
            error: 'Ошибка синхронизации'
        });

        try { await promise; }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!createData.login || !createData.password) {
            toast.warning("Login и Password обязательны");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await KaspiService.createUser(createData as KaspiCreateDto);
            setIsCreateOpen(false);
            setCreateData({});
            setShowPassword(false);
            await fetchUsers();
            toast.success("Пользователь Kaspi создан");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка создания пользователя");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await KaspiService.exportUsers(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kaspi_users.xlsx`;
            a.click();
            toast.success("Экспорт завершен");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка экспорта");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        toast.success("ID скопирован");
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Поиск по Login..."
                            className="pl-10 bg-white"
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(v: string) => setFilters({...filters, status: v as KaspiFilters['status']})}
                    >
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="unverified">Unverified</SelectItem>
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
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-red-600 hover:bg-red-700 text-white border-0">
                        <Plus className="w-4 h-4 mr-2" /> Создать
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    </div>
                ) : data.items.length > 0 ? (
                    data.items.map((user) => (
                        <KaspiUserCard
                            key={user.mongo_id}
                            user={user}
                            onClick={(u) => setSelectedUser(u)}
                        />
                    ))
                ) : (
                    <EmptyState
                        title="Пользователи Kaspi не найдены"
                        description="Нет данных. Синхронизируйте с Mongo или создайте пользователя."
                        icon={Store}
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

            <Dialog open={isCreateOpen} onOpenChange={(val) => !isSubmitting && setIsCreateOpen(val)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Новый пользователь Kaspi</DialogTitle>
                        <DialogDescription>
                            Пользователь будет создан через внешний API и сохранен в БД.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Login (Email) <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="example@sobaka.kz"
                                disabled={isSubmitting}
                                onChange={(e) => setCreateData({...createData, login: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Password <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    disabled={isSubmitting}
                                    className="pr-10"
                                    onChange={(e) => setCreateData({...createData, password: e.target.value})}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Отмена</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Создать"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedUser} onOpenChange={(val) => !val && setSelectedUser(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Детали пользователя</DialogTitle>
                        <DialogDescription>Полная информация о пользователе Kaspi.</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-6 py-4">
                            {/* Main Info */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-500">Логин</p>
                                    <p className="font-semibold text-lg">{selectedUser.login}</p>
                                </div>
                                <Badge variant={selectedUser.is_verified ? "default" : "secondary"} className={selectedUser.is_verified ? "bg-green-600" : ""}>
                                    {selectedUser.is_verified ? "Verified" : "Unverified"}
                                </Badge>
                            </div>

                            {/* Technical Details */}
                            <div className="space-y-4">
                                <div className="grid gap-1">
                                    <Label className="text-gray-500 text-xs uppercase tracking-wider">Mongo ID</Label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-gray-100 p-2 rounded text-sm font-mono break-all">
                                            {selectedUser.mongo_id}
                                        </code>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(selectedUser.mongo_id)}
                                            className="h-8 w-8"
                                        >
                                            {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1">
                                        <Label className="text-gray-500 text-xs uppercase tracking-wider">Роль</Label>
                                        <div className="font-medium">{selectedUser.role}</div>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-gray-500 text-xs uppercase tracking-wider">Дата создания</Label>
                                        <div className="font-medium">
                                            <DateDisplay date={selectedUser.created_at} showTime />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedUser(null)}>Закрыть</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}