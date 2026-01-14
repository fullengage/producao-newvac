import { AlertTriangle, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AparasHeaderProps {
    mesSelecionado: string
    setMesSelecionado: (mes: string) => void
    mesesDisponiveis?: string[]
    prejuizoTotal: number
    prejuizoAcimaMeta: number
    metaApara: number
    onNewClick: () => void
}

export function AparasHeader({
    mesSelecionado,
    setMesSelecionado,
    mesesDisponiveis,
    prejuizoTotal,
    prejuizoAcimaMeta,
    metaApara,
    onNewClick,
}: AparasHeaderProps) {
    return (
        <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Controle de Aparas</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onNewClick}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-2 text-white font-medium"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Nova Apara
                    </button>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4" />
                        <select
                            value={mesSelecionado}
                            onChange={(e) => setMesSelecionado(e.target.value)}
                            className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer"
                        >
                            {mesesDisponiveis?.map((mes) => (
                                <option key={mes} value={mes} className="text-gray-800">
                                    {mes}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <p className="opacity-90">Módulo de Gestão de Desperdícios - {mesSelecionado}/2025</p>
            <div className="mt-4 flex flex-wrap gap-4">
                <div className="bg-white/20 rounded-lg px-4 py-2">
                    <span className="text-sm opacity-80">Prejuízo Total Estimado</span>
                    <p className="text-xl font-bold">{formatCurrency(prejuizoTotal)}</p>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2">
                    <span className="text-sm opacity-80">Prejuízo Acima da Meta ({metaApara}%)</span>
                    <p className="text-xl font-bold">{formatCurrency(Math.max(0, prejuizoAcimaMeta))}</p>
                </div>
            </div>
        </div>
    )
}
