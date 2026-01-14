import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  ShoppingCart,
  Factory,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  RefreshCcw,
  Package,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function DashboardPage() {
  const navigate = useNavigate()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Generate years array (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  // Query for KPIs - usando apenas a view que sabemos que existe
  const { data: kpis, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_dashboard_kpis')
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao buscar KPIs:', error)
        throw error
      }
      return data
    },
    retry: 2,
  })

  // Query for filtered daily data - with error handling
  const { data: dailyData } = useQuery({
    queryKey: ['daily-data', selectedYear, selectedMonth],
    queryFn: async () => {
      const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const monthEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('vw_pedidos_resumo_diario')
        .select('*')
        .gte('data', monthStart)
        .lte('data', monthEnd)
        .order('data', { ascending: true })

      if (error) {
        console.warn('Não foi possível carregar dados filtrados:', error.message)
        return null // Fallback to general KPIs
      }
      return data || []
    },
    retry: 1,
  })

  // Query for year data
  const { data: yearData } = useQuery({
    queryKey: ['year-data', selectedYear],
    queryFn: async () => {
      const yearStart = `${selectedYear}-01-01`
      const yearEnd = `${selectedYear}-12-31`

      const { data, error } = await supabase
        .from('vw_pedidos_resumo_diario')
        .select('*')
        .gte('data', yearStart)
        .lte('data', yearEnd)

      if (error) {
        console.warn('Não foi possível carregar dados do ano:', error.message)
        return null
      }
      return data || []
    },
    retry: 1,
  })

  // Calculate filtered KPIs from daily data
  const today = new Date().toISOString().split('T')[0]
  const todayData = dailyData?.find((d: any) => d.data === today)

  const monthPedidos = dailyData?.reduce((sum: number, d: any) => sum + (d.total_pedidos || 0), 0) || 0
  const monthValor = dailyData?.reduce((sum: number, d: any) => sum + (d.valor_total || 0), 0) || 0

  const yearPedidos = yearData?.reduce((sum: number, d: any) => sum + (d.total_pedidos || 0), 0) || 0
  const yearValor = yearData?.reduce((sum: number, d: any) => sum + (d.valor_total || 0), 0) || 0

  // Use filtered data if available, otherwise fall back to general KPIs
  const hasFilteredData = dailyData !== null && Array.isArray(dailyData)
  const displayKpis = {
    pedidos_hoje: hasFilteredData ? (todayData?.total_pedidos || 0) : (kpis?.pedidos_hoje ?? 0),
    pedidos_mes: hasFilteredData ? monthPedidos : (kpis?.pedidos_mes ?? 0),
    valor_pedidos_mes: hasFilteredData ? monthValor : (kpis?.valor_pedidos_mes ?? 0),
    pedidos_ano: yearData ? yearPedidos : 0,
    valor_pedidos_ano: yearData ? yearValor : 0,
    pendentes_liliane: kpis?.pendentes_liliane ?? 0,
    pendentes_biani: kpis?.pendentes_biani ?? 0,
    ops_planejadas: kpis?.ops_planejadas ?? 0,
    ops_em_producao: kpis?.ops_em_producao ?? 0,
    ops_concluidas_mes: kpis?.ops_concluidas_mes ?? 0,
    clientes_ativos: kpis?.clientes_ativos ?? 0,
    clientes_novos_30d: kpis?.clientes_novos_30d ?? 0,
  }


  const cards = [
    {
      title: 'Pedidos Hoje',
      value: displayKpis?.pedidos_hoje ?? 0,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/pedidos'
    },
    {
      title: `Pedidos do Mês`,
      value: displayKpis?.pedidos_mes ?? 0,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      href: '/pedidos'
    },
    {
      title: `Valor do Mês`,
      value: formatCurrency(Number(displayKpis?.valor_pedidos_mes) || 0),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      href: '/pedidos'
    },
    {
      title: 'Pendentes',
      value: displayKpis?.pendentes_liliane ?? 0,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      href: '/pedidos?status=pendente'
    },
    {
      title: 'Pend. Fin.',
      value: displayKpis?.pendentes_biani ?? 0,
      icon: Clock,
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      href: '/pedidos?status=financeiro'
    },
    {
      title: 'OPs Planejadas',
      value: displayKpis?.ops_planejadas ?? 0,
      icon: Package,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      href: '/ops?status=planejada'
    },
    {
      title: 'OPs em Produção',
      value: displayKpis?.ops_em_producao ?? 0,
      icon: Factory,
      gradient: 'from-fuchsia-500 to-fuchsia-600',
      iconBg: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      href: '/ops?status=producao'
    },
    {
      title: 'OPs Concluídas (Mês)',
      value: displayKpis?.ops_concluidas_mes ?? 0,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      href: '/ops?status=concluida'
    },
    {
      title: 'Clientes Ativos',
      value: displayKpis?.clientes_ativos ?? 0,
      icon: Users,
      gradient: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      href: '/clientes'
    },
    {
      title: 'Novos Clientes (30d)',
      value: displayKpis?.clientes_novos_30d ?? 0,
      icon: Users,
      gradient: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      href: '/clientes?filter=novos'
    },
  ]

  // Prepare OPs status data for chart
  const opsStatusData = [
    { name: 'Planejadas', value: displayKpis?.ops_planejadas ?? 0, fill: '#6366f1' },
    { name: 'Em Produção', value: displayKpis?.ops_em_producao ?? 0, fill: '#a855f7' },
    { name: 'Concluídas', value: displayKpis?.ops_concluidas_mes ?? 0, fill: '#22c55e' },
  ]

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Erro ao Carregar Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Não foi possível conectar ao banco de dados. Verifique sua conexão ou tente novamente.
            </p>
            {error && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </pre>
            )}
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema de gestão em tempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Período Selecionado</h3>
            <p className="text-sm text-blue-700 mt-1">
              Exibindo dados de <strong>{months.find(m => m.value === selectedMonth)?.label} de {selectedYear}</strong>.
              Os KPIs abaixo refletem os dados gerais do sistema.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 cursor-pointer group"
            onClick={() => navigate(card.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
              <div className={`h-1 mt-4 rounded-full bg-gradient-to-r ${card.gradient}`} />
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* OPs Status Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              Status das Ordens de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={opsStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Quantidade">
                  {opsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Orders Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução de Pedidos (Diário)
            </CardTitle>
          </CardHeader>
          <CardContent>
             {hasFilteredData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="data" 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}`;
                    }}
                    interval={0}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Data
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {new Date(label).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Pedidos
                                </span>
                                <span className="font-bold">
                                  {payload[0].value}
                                </span>
                              </div>
                              <div className="flex flex-col col-span-2">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Valor Total
                                </span>
                                <span className="font-bold text-emerald-600">
                                  {formatCurrency(Number(payload[0].payload.valor_total))}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="total_pedidos" name="Pedidos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                     <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                     <p>Nenhum pedido encontrado para este período.</p>
                  </div>
                </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Aprovações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comercial</span>
                <span className="text-2xl font-bold">{displayKpis?.pendentes_liliane ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pend. Fin.</span>
                <span className="text-2xl font-bold">{displayKpis?.pendentes_biani ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-500" />
              Base de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ativos</span>
                <span className="text-2xl font-bold">{displayKpis?.clientes_ativos ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Novos (30d)</span>
                <span className="text-2xl font-bold text-green-600">
                  +{displayKpis?.clientes_novos_30d ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="h-5 w-5 text-purple-500" />
              Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Em andamento</span>
                <span className="text-2xl font-bold">{displayKpis?.ops_em_producao ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Concluídas</span>
                <span className="text-2xl font-bold text-green-600">
                  {displayKpis?.ops_concluidas_mes ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
