import { Clock, UserCog, Cpu, Package, AlertTriangle, FileText, Trash2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/common/KPICard'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users } from 'lucide-react'

interface IndicadoresTempoProps {
    mesSelecionado: string
    diarioProducao: any[]
    totaisIndicadores: {
        totalHomemHora: number
        totalMaquinaHora: number
        totalKgProduzido: number
        totalHorasParada: number
    }
    indicadoresOperador: any[]
    handleNew: () => void
    handleEdit: (row: any) => void
    deleteMutation: any
}

export function IndicadoresTempo({
    mesSelecionado,
    diarioProducao,
    totaisIndicadores,
    indicadoresOperador,
    handleNew,
    handleEdit,
    deleteMutation,
}: IndicadoresTempoProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Diário de Produção
                    </h2>
                    <p className="text-sm text-gray-500">Acompanhamento detalhado dos apontamentos</p>
                </div>
                <Button className="flex items-center gap-2" onClick={handleNew}>
                    <Plus className="w-4 h-4" />
                    Novo Apontamento
                </Button>
            </div>

            <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-blue-50/50 pb-3">
                    <CardTitle className="text-base font-medium text-blue-900">Registros de {mesSelecionado}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {diarioProducao && diarioProducao.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Data</th>
                                        <th className="px-4 py-3 text-left">OP / Produto</th>
                                        <th className="px-4 py-3 text-left">Setor</th>
                                        <th className="px-4 py-3 text-left">Recurso</th>
                                        <th className="px-4 py-3 text-center">Horário</th>
                                        <th className="px-4 py-3 text-right">Horas</th>
                                        <th className="px-4 py-3 text-right">Produção</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {diarioProducao.map((row: any) => (
                                        <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {new Date(row.data_registro).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-blue-700">OP #{row.op_numero}</span>
                                                    <span className="text-xs text-gray-500 truncate max-w-[200px]" title={row.op?.item}>
                                                        {row.op?.item || 'Produto não identificado'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="bg-white">
                                                    {row.setor}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    {row.operador_nome && (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <UserCog className="w-3 h-3 text-gray-400" /> {row.operador_nome}
                                                        </span>
                                                    )}
                                                    {row.maquina_nome && (
                                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Cpu className="w-3 h-3" /> {row.maquina_nome}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-gray-500">
                                                {row.hora_inicio && row.hora_fim ? (
                                                    `${row.hora_inicio.slice(0, 5)} - ${row.hora_fim.slice(0, 5)}`
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {row.horas_trabalhadas > 0 && (
                                                    <div title="Homem-Hora">{Number(row.horas_trabalhadas).toFixed(1)}h</div>
                                                )}
                                                {row.horas_parada > 0 && (
                                                    <div className="text-red-500 text-xs" title="Parada">
                                                        +{Number(row.horas_parada).toFixed(1)}h Parada
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.kg_produzido > 0 ? (
                                                    <span className="font-bold text-green-700">{Number(row.kg_produzido).toFixed(1)} kg</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleEdit(row)}
                                                    >
                                                        <UserCog className="w-4 h-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Essa ação não pode ser desfeita. Isso excluirá o apontamento de horas da OP #{row.op_numero}.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => deleteMutation.mutate(row.id)} className="bg-red-600 hover:bg-red-700">
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Nenhum apontamento encontrado para este mês.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <KPICard
                    title="Total Homem-Hora"
                    value={totaisIndicadores.totalHomemHora.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    unit="horas"
                    icon={Users}
                    color="blue"
                    subtitle="Horas trabalhadas"
                />
                <KPICard
                    title="Total Máquina-Hora"
                    value={totaisIndicadores.totalMaquinaHora.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    unit="horas"
                    icon={Cpu}
                    color="purple"
                    subtitle="Horas máquina"
                />
                <KPICard
                    title="Total Produzido"
                    value={totaisIndicadores.totalKgProduzido.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    unit="kg"
                    icon={Package}
                    color="green"
                    subtitle="Produção apontada"
                />
                <KPICard
                    title="Horas Parada"
                    value={totaisIndicadores.totalHorasParada.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    unit="horas"
                    icon={AlertTriangle}
                    color="orange"
                    subtitle="Tempo improdutivo"
                />
            </div>

            <div className="space-y-6 pt-6 border-t opacity-80 hover:opacity-100 transition-opacity">
                <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Visão Consolidada (Agregado)</h3>

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Produtividade Consolidada por Operador
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {indicadoresOperador && indicadoresOperador.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Operador</th>
                                            <th className="px-4 py-2 text-right">Horas</th>
                                            <th className="px-4 py-2 text-right">Kg Prod.</th>
                                            <th className="px-4 py-2 text-right">Kg/Hora</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {indicadoresOperador.map((op, i) => (
                                            <tr key={i} className="border-b last:border-0">
                                                <td className="px-4 py-2 font-medium">{op.operador_nome}</td>
                                                <td className="px-4 py-2 text-right">{parseFloat(String(op.total_horas)).toLocaleString('pt-BR')}</td>
                                                <td className="px-4 py-2 text-right">{parseFloat(String(op.kg_produzido)).toLocaleString('pt-BR')}</td>
                                                <td className="px-4 py-2 text-right font-bold text-blue-600">{parseFloat(String(op.kg_por_hora)).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-sm text-gray-500 p-2">Sem dados consolidados.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
