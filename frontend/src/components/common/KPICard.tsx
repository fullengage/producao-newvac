import { TrendingDown } from 'lucide-react'

export interface KPICardProps {
  title: string
  value: string | number
  unit: string
  icon: React.ElementType
  trend?: number
  color: 'red' | 'orange' | 'green' | 'blue' | 'purple'
  subtitle?: string
}

export function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color,
  subtitle,
}: KPICardProps) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }

  return (
    <div className={`p-4 rounded-xl border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm opacity-70">{unit}</span>
      </div>
      {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
          <TrendingDown className={`w-3 h-3 ${trend > 0 ? 'rotate-180' : ''}`} />
          {Math.abs(trend).toFixed(1)}% vs meta
        </div>
      )}
    </div>
  )
}
