import type { KaspiUser } from "@/types/kaspi";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Calendar,
    User,
    Shield,
    CheckCircle,
    XCircle,
    Fingerprint
} from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";

interface Props {
    user: KaspiUser;
    onClick: (user: KaspiUser) => void;
}

export function KaspiUserCard({ user, onClick }: Props) {
    const isVerified = user.is_verified;

    return (
        <Card
            onClick={() => onClick(user)}
            className="p-4 border border-gray-200 hover:shadow-md transition-all duration-300 bg-white cursor-pointer hover:border-red-200 group"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-md border border-red-100 group-hover:bg-red-100 transition-colors">
                            <User className="w-4 h-4 text-red-600" />
                            <span className="font-bold text-sm text-gray-800">
                                {user.login || "No Login"}
                            </span>
                        </div>

                        <Badge variant={isVerified ? "default" : "secondary"} className={isVerified ? "bg-red-600 hover:bg-red-700" : ""}>
                            {isVerified ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                            ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Unverified</>
                            )}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Роль</span>
                                <span className="font-mono">{user.role}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Дата создания</span>
                                <DateDisplay date={user.created_at} showTime />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Mongo ID</span>
                                <span className="font-mono text-xs truncate max-w-[150px]" title={user.mongo_id}>
                                    {user.mongo_id}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}