import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Factory } from 'lucide-react'
import { useOpsKanban } from '@/hooks/useOpsKanban'
import { KanbanColumn } from './components/KanbanColumn'

type KanbanColumnType = {
  id: string
  title: string
  filter: (order: any) => boolean
  color: string
  approvalState: { liliani: boolean; biani: boolean }
}

const columns: KanbanColumnType[] = [
  {
    id: 'pendente',
    title: 'Pendente Aprovação',
    filter: (o) => o.estagio_producao === 'pendente',
    color: 'bg-slate-100',
    approvalState: { liliani: false, biani: false }
  },
  {
    id: 'extrusao',
    title: 'Extrusão',
    filter: (o) => o.estagio_producao === 'extrusao',
    color: 'bg-blue-50',
    approvalState: { liliani: true, biani: false }
  },
  {
    id: 'impressao',
    title: 'Impressão',
    filter: (o) => o.estagio_producao === 'impressao',
    color: 'bg-orange-50',
    approvalState: { liliani: true, biani: true }
  },
  {
    id: 'corte_solda',
    title: 'Corte e Solda',
    filter: (o) => o.estagio_producao === 'corte_solda',
    color: 'bg-yellow-50',
    approvalState: { liliani: true, biani: true }
  },
  {
    id: 'faturamento',
    title: 'Faturamento',
    filter: (o) => o.estagio_producao === 'faturamento',
    color: 'bg-green-50',
    approvalState: { liliani: true, biani: true }
  },
]

const situacoes = [
  { value: "em_analise", label: "Pedidos", color: "bg-blue-500" },
  { value: "financeiro", label: "Financeiro", color: "bg-purple-500" },
  { value: "bloqueado", label: "Bloqueado", color: "bg-red-500" },
  { value: "aguardando_material", label: "Aguardando Material", color: "bg-orange-500" },
  { value: "em_producao", label: "Em Produção", color: "bg-green-500" },
]

export function OpsKanbanPage() {
  const {
    ops,
    isLoading,
    draggedId,
    setDraggedId,
    openPopoverId,
    setOpenPopoverId,
    updateEstagio,
    updateSituacao,
  } = useOpsKanban()

  function getOpsByColumn(column: KanbanColumnType) {
    return ops?.filter(column.filter) || []
  }

  function handleDrop(e: React.DragEvent, column: KanbanColumnType) {
    e.preventDefault()
    if (!draggedId) return

    updateEstagio.mutate({
      pedidoId: draggedId,
      estagio: column.id
    })

    setDraggedId(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kanban de Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe o status de aprovação dos pedidos
        </p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {columns.slice(0, 4).map((column) => {
          const count = getOpsByColumn(column).length
          return (
            <Card key={column.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{column.title}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <Factory className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            ops={getOpsByColumn(column)}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            openPopoverId={openPopoverId}
            setOpenPopoverId={setOpenPopoverId}
            updateSituacao={updateSituacao}
            situacoes={situacoes}
            handleDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}
