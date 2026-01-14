import { PenLine, Check, Package, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useNavigate } from 'react-router-dom'
import { formatDate, cn } from '@/lib/utils'

interface KanbanCardProps {
    op: any
    draggedId: string | null
    setDraggedId: (id: string | null) => void
    openPopoverId: string | null
    setOpenPopoverId: (id: string | null) => void
    updateSituacao: any
    situacoes: any[]
}

export function KanbanCard({
    op,
    draggedId,
    setDraggedId,
    openPopoverId,
    setOpenPopoverId,
    updateSituacao,
    situacoes,
}: KanbanCardProps) {
    const navigate = useNavigate()
    function handleDragStart(e: React.DragEvent) {
        setDraggedId(op.id)
        e.dataTransfer.effectAllowed = 'move'
    }

    function handleDragEnd() {
        setDraggedId(null)
    }

    return (
        <Card
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => navigate(`/pedidos/${op.id}`)}
            className={`cursor-pointer hover:border-primary/50 transition-all group relative ${draggedId === op.id ? 'opacity-50' : ''}`}
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                <Popover open={openPopoverId === op.id} onOpenChange={(open) => setOpenPopoverId(open ? op.id : null)}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm">
                            <PenLine className="h-3 w-3 text-gray-500" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[200px]" align="end">
                        <Command>
                            <CommandInput placeholder="Mudar situação..." />
                            <CommandList>
                                <CommandEmpty>Nenhuma situação encontrada.</CommandEmpty>
                                <CommandGroup heading="Definir Situação">
                                    {situacoes.map((situacao) => (
                                        <CommandItem
                                            key={situacao.value}
                                            value={situacao.value}
                                            onSelect={() => {
                                                updateSituacao.mutate({
                                                    pedidoId: op.id,
                                                    situacao: situacao.value
                                                })
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <div className={`w-2 h-2 rounded-full mr-2 ${situacao.color}`} />
                                            {situacao.label}
                                            {op.situacao === situacao.value && (
                                                <Check className="ml-auto h-4 w-4 opacity-50" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <CardHeader className="p-3 pb-2">
                <div className="flex flex-wrap gap-1.5 mb-2 pr-6">
                    {op.vendedor_nome && (
                        <div className="bg-blue-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm truncate max-w-[100px]" title={`Vendedor: ${op.vendedor_nome}`}>
                            {op.vendedor_nome.split(' ')[0]}
                        </div>
                    )}

                    {op.material_nome && (
                        <div className="bg-emerald-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm truncate max-w-[100px]" title={`Material: ${op.material_nome}`}>
                            {op.material_nome}
                        </div>
                    )}

                    {op.situacao && (
                        <div className={cn(
                            "text-white text-[11px] font-medium px-2 py-0.5 rounded-sm truncate max-w-[100px]",
                            situacoes.find(s => s.value === op.situacao)?.color || "bg-gray-500"
                        )}>
                            {situacoes.find(s => s.value === op.situacao)?.label || op.situacao}
                        </div>
                    )}

                    {(() => {
                        if (!op.data_entrega) return null
                        const hoje = new Date()
                        const entrega = new Date(op.data_entrega)
                        const diffDias = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

                        if (diffDias < 0) {
                            return (
                                <div className="bg-red-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm">
                                    Atrasado
                                </div>
                            )
                        } else if (diffDias <= 3) {
                            return (
                                <div className="bg-orange-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm">
                                    Urgente
                                </div>
                            )
                        }
                        return null
                    })()}
                </div>

                <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium leading-tight">
                        Pedido {op.numero_pedido}
                    </CardTitle>
                    {op.numero_op && (
                        <span className="text-xs text-muted-foreground font-mono">#{op.numero_op}</span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="mb-2">
                    <p className="text-sm text-gray-700">{op.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate" title={op.item}>
                        {op.item}
                    </p>
                </div>

                <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Package className="h-3 w-3" />
                            <span>{op.quantidade}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{op.data_entrega ? formatDate(op.data_entrega) : '-'}</span>
                        </div>
                    </div>

                    {(() => {
                        let entryTime = null
                        if (op.estagio_producao === 'extrusao') entryTime = op.data_entrada_extrusao
                        if (op.estagio_producao === 'impressao') entryTime = op.data_entrada_impressao
                        if (op.estagio_producao === 'corte_solda') entryTime = op.data_entrada_corte_solda
                        if (op.estagio_producao === 'faturamento') entryTime = op.data_entrada_faturamento

                        if (!entryTime) return null

                        return (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-slate-50 p-1 rounded-sm border border-slate-100 italic">
                                <Clock className="h-2.5 w-2.5" />
                                <span>Entrou em: {new Date(entryTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )
                    })()}
                </div>
            </CardContent>
        </Card>
    )
}
