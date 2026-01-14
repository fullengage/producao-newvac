import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Factory,
  User,
  Calendar,
  History
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ClienteDashboardProps {
  clienteId: string | null
}

interface DashboardKPIs {
  total_pedidos: number
  pedidos_faturados: number
  pedidos_cancelados: number
  conversao_venda: number
  ticket_medio: number
  valor_total_comprado: number
  total_ops_geradas: number
  situacao_cliente: string
  vendedor_atual_nome: string
  vendedor_atual_id: string
}

interface VendedorHistory {
  vendedor_nome: string
  data_inicio: string
  data_fim: string
  qtd_pedidos: number
  valor_total: number
}

export function ClienteDashboard({ clienteId }: ClienteDashboardProps) {
  // Generate year options
  const currentYear = new Date().getFullYear().toString()
  const years = Array.from({ length: 5 }, (_, i) => (parseInt(currentYear) - i).toString())
  
  const [periodo, setPeriodo] = useState<string>(currentYear) // Default to current year dynamically

  const { data: kpis, isLoading: isLoadingKPIs } = useQuery({
    queryKey: ['cliente-kpis', clienteId, periodo],
    queryFn: async () => {
      if (!clienteId) return null
      let startDate = null
      let endDate = null

      if (periodo !== 'todos') {
        startDate = `${periodo}-01-01`
        endDate = `${periodo}-12-31`
      }

      const { data, error } = await supabase
        // @ts-ignore
        .rpc('get_cliente_dashboard_kpis', {
          p_cliente_id: clienteId,
          p_data_inicio: startDate,
          p_data_fim: endDate
        })
        .single()

      if (error) throw error
      return data as unknown as DashboardKPIs
    },
    enabled: !!clienteId
  })

  const { data: vendedoresHistory, isLoading: isLoadingVendedores } = useQuery({
    queryKey: ['cliente-vendedores', clienteId],
    queryFn: async () => {
      if (!clienteId) return []
      const { data, error } = await supabase
        // @ts-ignore
        .rpc('get_cliente_vendedores_history', {
          p_cliente_id: clienteId
        })

      if (error) throw error
      return data as unknown as VendedorHistory[]
    },
    enabled: !!clienteId
  })


  if (!clienteId) return null

  if (isLoadingKPIs) {
    return <div className="p-4 text-center">Carregando indicadores...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header & Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h2 className="text-xl font-bold">Resumo Geral</h2>
           {kpis?.situacao_cliente && (
             <Badge variant={kpis.situacao_cliente === 'ATIVO' ? 'default' : 'secondary'}>
               {kpis.situacao_cliente}
             </Badge>
           )}
        </div>
        <div className="w-[180px]">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o Período</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.total_pedidos || 0}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Concretizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pedidos_faturados || 0}</div>
            <p className="text-xs text-emerald-600 font-medium">
              {kpis?.conversao_venda || 0}% de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pedidos_cancelados || 0}</div>
            <p className="text-xs text-muted-foreground">
               Perda de vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.valor_total_comprado || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket Médio: {formatCurrency(kpis?.ticket_medio || 0)}
            </p>
          </CardContent>
        </Card>
        
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OPs Geradas</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.total_ops_geradas || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendedores Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Responsável Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {(kpis?.vendedor_atual_nome || 'N/A').substring(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-medium">{kpis?.vendedor_atual_nome || 'Não definido'}</p>
                <p className="text-sm text-muted-foreground">Vendedor responsável pelo cadastro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Histórico de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <div className="p-4 space-y-4">
                {isLoadingVendedores ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : vendedoresHistory?.map((v: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{v.vendedor_nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(v.data_inicio)} - {formatDate(v.data_fim)}
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-sm">{v.qtd_pedidos} pedidos</p>
                       <p className="text-xs text-muted-foreground">{formatCurrency(v.valor_total || 0)}</p>
                    </div>
                  </div>
                ))}
                {!isLoadingVendedores && vendedoresHistory?.length === 0 && (
                   <p className="text-sm text-muted-foreground text-center">Nenhum histórico encontrado.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
