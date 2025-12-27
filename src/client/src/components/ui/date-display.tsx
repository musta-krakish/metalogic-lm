import { cn } from "@/lib/utils";

interface DateDisplayProps {
    date: string | undefined | null;
    className?: string;
    showTime?: boolean;
}

export function DateDisplay({ date, className, showTime = false }: DateDisplayProps) {
    if (!date) return <span className="text-gray-300">-</span>;

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) return <span className="text-red-300">Invalid Date</span>;

    const now = new Date();
    const isExpired = targetDate < now;

    const formatted = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(showTime && { hour: '2-digit', minute: '2-digit' })
    }).format(targetDate);

    return (
        <span className={cn(
            "font-medium",
            isExpired ? "text-red-600" : "text-gray-700",
            className
        )}>
            {formatted}
            {isExpired && <span className="text-red-500 ml-1 text-xs">(Истекла)</span>}
        </span>
    );
}