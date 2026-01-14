import { AlertCircle } from 'lucide-react'

export interface AlertCardProps {
    level: 'critical' | 'warning' | 'normal'
    title: string
    message: string
}

export function AlertCard({ level, title, message }: AlertCardProps) {
    const styles = {
        critical: 'bg-red-100 border-red-300 text-red-800',
        warning: 'bg-orange-100 border-orange-300 text-orange-800',
        normal: 'bg-green-100 border-green-300 text-green-800',
    }

    return (
        <div className={`p-3 rounded-lg border ${styles[level]}`}>
            <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold text-sm">{title}</span>
            </div>
            <p className="text-xs mt-1 opacity-90">{message}</p>
        </div>
    )
}
