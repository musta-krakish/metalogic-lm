import type { TindaUser } from "@/types/tinda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Building,
    Calendar,
    Hash,
    MoreVertical,
    Power,
    Edit,
    User,
    Shield,
    Loader2
} from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";


interface Props {
    user: TindaUser;
    onEdit: (user: TindaUser) => void;
    onToggleActive: (id: string) => void;
    isLoading?: boolean;
}

export function TindaUserCard({ user, onEdit, onToggleActive, isLoading = false }: Props) {
    const isActive = user.isActive;
    const userId = user._Id || "";

    return (
        <Card className="p-4 border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-pink-50 px-2 py-1 rounded-md border border-pink-100">
                            <User className="w-4 h-4 text-pink-500" />
                            <span className="font-bold text-sm text-gray-700">
                                {user.login || "No Login"}
                            </span>
                        </div>
                        <Badge variant={isActive ? "default" : "destructive"}>
                            {isActive ? "Активен" : "Заблокирован"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Role: {user.role}
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
                            <Calendar className="w-4 h-4 text-green-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Создан</span>
                                <DateDisplay date={user.createDate} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Истекает</span>
                                <DateDisplay date={user.expireDate} checkExpiry={true} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
                            ) : (
                                <MoreVertical className="w-4 h-4" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onToggleActive(userId)}>
                            <Power className="w-4 h-4 mr-2" />
                            {isActive ? "Блокировать" : "Активировать"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
}