import type { IIkoLicenseItem } from "@/types/license";
import { IikoLicenseCard } from "./IikoLicenseCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface IikoLicenseGroupProps {
    groupName: string;
    licenses: IIkoLicenseItem[];
}

export function IikoLicenseGroup({ groupName, licenses }: IikoLicenseGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const activeLicenses = licenses.filter(license => license.license?.isActive);

    return (
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader
                className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold">{groupName}</h3>
                        <Badge variant="outline" className="ml-2">
                            {licenses.length} лицензий
                        </Badge>
                        {activeLicenses.length > 0 && (
                            <Badge variant="default" className="bg-green-100 text-green-700">
                                {activeLicenses.length} активных
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                    {licenses.map((license, index) => (
                        <IikoLicenseCard
                            key={license.license?.id || index}
                            license={license}
                            showOrganization={false}
                        />
                    ))}
                </CardContent>
            )}
        </Card>
    );
}