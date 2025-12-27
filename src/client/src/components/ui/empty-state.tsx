import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ElementType;
}

export function EmptyState({
    title = "Ничего не найдено",
    description = "Нет данных, соответствующих вашим критериям.",
    actionLabel,
    onAction,
    icon: Icon = Search
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 mt-4">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-500 max-w-sm mt-2 mb-6 text-sm">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" className="rounded-lg">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}