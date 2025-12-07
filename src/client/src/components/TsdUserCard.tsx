import type { TsdUser } from "@/types/tsd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Building,
    Calendar,
    Hash,
    MoreVertical,
    Power,
    Edit,
    Smartphone,
    Shield,
    Trash2,
    KeyRound,
    Monitor
} from "lucide-react";

interface Props {
    user: TsdUser;
    onEdit: (user: TsdUser) => void;
    onPassword: (user: TsdUser) => void;
    onDelete: (username: string) => void;
    onToggleActive: (username: string) => void;
}

export function TsdUserCard({ user, onEdit, onPassword, onDelete, onToggleActive }: Props) {
    const isActive = user.isActive;

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        try {
            return new Date(dateString).toLocaleDateString("ru-RU");
        } catch {
            return dateString;
        }
    };

    return (
        <Card className="p-4 border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                    {/* Header: Username & Status */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                            <Smartphone className="w-4 h-4 text-orange-500" />
                            <span className="font-bold text-sm text-gray-800">
                                {user.username}
                            </span>
                        </div>
                        <Badge variant={isActive ? "default" : "destructive"}>
                            {isActive ? "Активен" : "Отключен"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role}
                        </Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Организация</span>
                                <span className="font-medium truncate max-w-[150px]" title={user.org}>
                                    {user.org || "—"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">BIN</span>
                                <span className="font-mono">{user.bin || "—"}</span>
                            </div>
                        </div>

                         <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-orange-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Устройств</span>
                                <span className="font-medium">{user.availableDeviceCount ?? 0}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Истекает</span>
                                <span className={user.expireDate && new Date(user.expireDate) < new Date() ? "text-red-600 font-bold" : ""}>
                                    {formatDate(user.expireDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onToggleActive(user.username)}>
                            <Power className="w-4 h-4 mr-2" />
                            {isActive ? "Отключить" : "Активировать"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPassword(user)}>
                            <KeyRound className="w-4 h-4 mr-2" />
                            Сменить пароль
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(user.username)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
}