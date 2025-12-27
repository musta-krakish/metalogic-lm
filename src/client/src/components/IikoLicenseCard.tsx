import type { IIkoLicenseItem } from "@/types/license";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building,
    Calendar,
    Code,
    MoreVertical,
    CheckCircle,
    XCircle,
    Hash,
    Download,
    RefreshCw,
    Wifi,
    WifiOff,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateDisplay } from "@/components/ui/date-display";

interface IikoLicenseCardProps {
    license: IIkoLicenseItem;
    showOrganization?: boolean;
}

export function IikoLicenseCard({ license, showOrganization = true }: IikoLicenseCardProps) {
    const isActive = license.license?.isActive !== false;
    const isOnline = license.license?.isOnline !== false;
    const status = isActive ? "active" : "expired";
    const statusVariant = status === "active" ? "default" : "destructive";

    return (
        <div className="group border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all duration-300 hover:border-purple-200">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    {showOrganization && (
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Building className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">
                                {license.license?.organization?.name || "Неизвестная организация"}
                            </h3>
                            <Badge variant={statusVariant} className="ml-2">
                                {status === "active" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                {status === "active" ? "Активна" : "Истекла"}
                            </Badge>
                            <Badge variant={isOnline ? "default" : "secondary"} className="ml-2">
                                {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                                {isOnline ? "Онлайн" : "Офлайн"}
                            </Badge>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500">ID организации</div>
                                <span className="font-mono text-xs">{license.license?.organizationId}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500">Код лицензии</div>
                                <span className="font-mono text-xs">
                                    {license.license?.licenseCode
                                        ? `${license.license.licenseCode.slice(0, 20)}...`
                                        : "Нет кода"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500">Истекает</div>
                                <DateDisplay date={license.license?.licenseExpirationDate} checkExpiry={true} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500">Последний запрос</div>
                                <DateDisplay date={license.license?.lastRequestDate} />
                            </div>
                        </div>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                            {license.license?.productSubName || 'Без подписки'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            AP: {license.license?.apUId || 'Не указан'}
                        </Badge>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="rounded-lg flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Скачать данные
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Обновить лицензию
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}