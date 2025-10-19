"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IikoLicenses } from "@/components/IikoLicenses";
import { Badge } from "@/components/ui/badge";
import { Shield, RefreshCw } from "lucide-react";

export default function LicensesPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("iiko");

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Управление лицензиями
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Управление лицензиями всех систем
                    </p>
                </div>

                {loading && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Загрузка...
                    </Badge>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start p-0 h-auto">
                    <TabsTrigger
                        value="iiko"
                        className="flex items-center gap-2 px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 rounded-none"
                    >
                        <Shield className="w-4 h-4" />
                        iiko
                    </TabsTrigger>
                    <TabsTrigger
                        value="arca"
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
                    <IikoLicenses onLoadingChange={setLoading} />
                </TabsContent>

                <TabsContent value="arca" className="space-y-4 mt-6">
                    <div className="text-center py-12">
                        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Скоро будет доступно
                        </h3>
                        <p className="text-gray-500">
                            Управление лицензиями Arca появится в ближайшее время
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="poster" className="space-y-4 mt-6">
                    <div className="text-center py-12">
                        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Скоро будет доступно
                        </h3>
                        <p className="text-gray-500">
                            Управление лицензиями Poster появится в ближайшее время
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}