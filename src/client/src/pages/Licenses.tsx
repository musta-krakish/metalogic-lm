import { useState, useEffect } from "react";
import { IikoService } from "@/services/iiko.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    Search,
    Download,
    Key,
    Building,
    Calendar,
    Code,
    MoreVertical,
    Shield,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Hash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Licenses() {
    const [licensesData, setLicensesData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchLicenses = async (page = 1) => {
        setLoading(true);
        try {
            const data = await IikoService.getLicenses(page, itemsPerPage);
            setLicensesData(data);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLicenses(1);
    }, []);

    // Фильтрация на клиенте (если нужно)
    const filteredLicenses = licensesData?.items?.filter((license: any) => {
        const orgName = license.license?.organization?.name || '';
        const licenseCode = license.license?.licenseCode || '';

        return orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            licenseCode.toLowerCase().includes(searchTerm.toLowerCase());
    }) || [];

    const isLicenseActive = (license: any) => {
        // Здесь должна быть реальная логика проверки активности лицензии
        // Например, проверка даты expiration
        return license.license?.isActive !== false;
    };

    const getLicenseStatus = (license: any) => {
        return isLicenseActive(license) ? "active" : "expired";
    };

    const getStatusVariant = (status: string) => {
        return status === "active" ? "default" : "destructive";
    };

    const exportLicenses = () => {
        // Логика экспорта
        console.log("Exporting licenses...");
    };

    const totalPages = licensesData ? Math.ceil(licensesData.total / itemsPerPage) : 0;

    return (
        <div className="space-y-6 p-6">
            {/* Заголовок и действия */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Управление лицензиями
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {licensesData ? `Всего лицензий: ${licensesData.total}` : 'Загрузка...'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={exportLicenses}
                        variant="outline"
                        className="flex items-center gap-2 border-gray-300 rounded-xl"
                    >
                        <Download className="w-4 h-4" />
                        Экспорт
                    </Button>
                    <Button
                        onClick={() => fetchLicenses(currentPage)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {loading ? "Обновление..." : "Обновить"}
                    </Button>
                </div>
            </div>

            {/* Поиск */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Поиск по организации или коду лицензии..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl border-gray-300 focus:border-purple-500"
                    />
                </div>

                {/* Пагинация */}
                {licensesData && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Страница {currentPage} из {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLicenses(currentPage - 1)}
                                disabled={currentPage <= 1 || loading}
                                className="rounded-xl"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLicenses(currentPage + 1)}
                                disabled={currentPage >= totalPages || loading}
                                className="rounded-xl"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Tabs defaultValue="iiko" className="w-full">
                <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start p-0 h-auto">
                    <TabsTrigger
                        value="iiko"
                        className="flex items-center gap-2 px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 rounded-none"
                    >
                        <Shield className="w-4 h-4" />
                        iiko
                        <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
                            {licensesData?.total || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="arca"
                        disabled
                        className="flex items-center gap-2 px-6 py-3 rounded-none"
                    >
                        <Shield className="w-4 h-4" />
                        Arca
                        <Badge variant="secondary" className="ml-2">
                            Скоро
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="poster"
                        disabled
                        className="flex items-center gap-2 px-6 py-3 rounded-none"
                    >
                        <Shield className="w-4 h-4" />
                        Poster
                        <Badge variant="secondary" className="ml-2">
                            Скоро
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="iiko" className="space-y-4 mt-6">
                    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                                    <Key className="w-5 h-5 text-purple-600" />
                                    Лицензии iiko
                                </CardTitle>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="text-sm">
                                        Показано: {filteredLicenses.length} из {licensesData?.total}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                                </div>
                            ) : filteredLicenses.length > 0 ? (
                                <div className="space-y-3 p-6 pt-0">
                                    {filteredLicenses.map((license: any, index: number) => (
                                        <div
                                            key={license.id || index}
                                            className="group border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all duration-300 hover:border-purple-200"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Building className="w-4 h-4 text-gray-400" />
                                                        <h3 className="font-semibold text-gray-900">
                                                            {license.license?.organization?.name || "Неизвестная организация"}
                                                        </h3>
                                                        <Badge
                                                            variant={getStatusVariant(getLicenseStatus(license))}
                                                            className="ml-2"
                                                        >
                                                            {getLicenseStatus(license) === "active" ? (
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                            ) : (
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                            )}
                                                            {getLicenseStatus(license) === "active" ? "Активна" : "Истекла"}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Hash className="w-4 h-4 text-gray-400" />
                                                            <span>ID: {license.license?.organizationId}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Code className="w-4 h-4 text-gray-400" />
                                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                                                {license.license?.licenseCode ?
                                                                    `${license.license.licenseCode.slice(0, 25)}...` :
                                                                    'Нет кода'
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span>
                                                                Обновлено: {new Date().toLocaleString("ru-RU")}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Дополнительная информация если есть */}
                                                    {license.license?.additionalInfo && (
                                                        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                                            <p className="text-xs text-blue-700">
                                                                {license.license.additionalInfo}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {searchTerm ? "Лицензии не найдены" : "Нет лицензий"}
                                    </h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        {searchTerm
                                            ? "Попробуйте изменить поисковый запрос"
                                            : "Лицензии iiko еще не добавлены в систему"
                                        }
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}