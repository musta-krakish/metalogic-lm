import type {ArcaLicense} from "@/types/arca.ts";
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
    Building, Calendar, Hash, MoreVertical,
    Power, Trash2, Edit, CreditCard
} from "lucide-react";

interface Props {
    license: ArcaLicense;
    onEdit: (license: ArcaLicense) => void;
    onDelete: (mac: string) => void;
    onToggleActive: (mac: string) => void;
}

export function ArcaLicenseCard({ license, onEdit, onDelete, onToggleActive }: Props) {
    const isActive = license.status === "True" || license.status === "active";
    const licenseKey = license.licences_key || license.license_key || "No Key";
    const licenseDate = license.licences_date || license.license_date;

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Не указано";
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
                    {/* Header: MAC & Status */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-md">
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span className="font-mono font-bold text-sm text-gray-700">
                                {license.mac_address}
                            </span>
                        </div>
                        <Badge variant={isActive ? "default" : "destructive"}>
                            {isActive ? "Активна" : "Неактивна"}
                        </Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Организация</span>
                                <span className="font-medium truncate max-w-[150px]" title={license.org}>
                                    {license.org || "—"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">BIN</span>
                                <span className="font-mono">{license.bin || "—"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Дата лицензии</span>
                                <span>{formatDate(licenseDate)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Истекает</span>
                                <span>{formatDate(license.expire_date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* License Key (Small) */}
                    <div className="text-xs text-gray-400 font-mono mt-1">
                        Key: {licenseKey}
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
                        <DropdownMenuItem onClick={() => onToggleActive(license.mac_address)}>
                            <Power className="w-4 h-4 mr-2" />
                            {isActive ? "Деактивировать" : "Активировать"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(license)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(license.mac_address)}
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