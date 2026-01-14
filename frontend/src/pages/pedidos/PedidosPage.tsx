import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { PedidoList } from './components/PedidoList'
import { PedidoRelatorios } from './components/PedidoRelatorios'

export function PedidosPage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const {
    orders,
    loadingOrders,
    salesByMonth,
    salesBySeller,
    abcCurve,
    approveLiliane,
    approveBiani,
  } = useOrders(search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie pedidos e acompanhe aprovações
          </p>
        </div>
        <Button onClick={() => navigate('/pedidos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Listagem</TabsTrigger>
          <TabsTrigger value="reports">Relatórios & KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <PedidoList
            orders={orders || []}
            search={search}
            setSearch={setSearch}
            isLoading={loadingOrders}
            approveLiliane={approveLiliane}
            approveBiani={approveBiani}
          />
        </TabsContent>

        <TabsContent value="reports">
          <PedidoRelatorios
            salesByMonth={salesByMonth || []}
            salesBySeller={salesBySeller || []}
            abcCurve={abcCurve || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
