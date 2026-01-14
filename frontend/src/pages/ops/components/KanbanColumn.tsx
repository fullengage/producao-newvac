import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
    column: any
    ops: any[]
    draggedId: string | null
    setDraggedId: (id: string | null) => void
    openPopoverId: string | null
    setOpenPopoverId: (id: string | null) => void
    updateSituacao: any
    situacoes: any[]
    handleDrop: (e: React.DragEvent, column: any) => void
}

export function KanbanColumn({
    column,
    ops,
    draggedId,
    setDraggedId,
    openPopoverId,
    setOpenPopoverId,
    updateSituacao,
    situacoes,
    handleDrop,
}: KanbanColumnProps) {
    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    return (
        <div
            className={`min-h-[400px] rounded-lg p-3 transition-colors ${column.color} ${draggedId ? 'ring-2 ring-primary/20' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
        >
            <h3 className="mb-4 font-semibold text-sm uppercase tracking-wider text-gray-700 flex justify-between items-center">
                {column.title}
                <Badge variant="secondary" className="bg-white/50 text-gray-600">{ops.length}</Badge>
            </h3>
            <div className="space-y-3">
                {ops.map((op: any, index: number) => (
                    <KanbanCard
                        key={`${op.id}-${op.numero_pedido}-${index}`}
                        op={op}
                        draggedId={draggedId}
                        setDraggedId={setDraggedId}
                        openPopoverId={openPopoverId}
                        setOpenPopoverId={setOpenPopoverId}
                        updateSituacao={updateSituacao}
                        situacoes={situacoes}
                    />
                ))}

                {ops.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center text-sm text-muted-foreground">
                        Nenhum pedido
                    </div>
                )}
            </div>
        </div>
    )
}
