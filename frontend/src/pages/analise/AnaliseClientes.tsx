import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { 
  Users, 
  TrendingUp, 
  Award, 
  Package, 
  DollarSign,
  Calendar
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b']

interface ClienteABC {
  cliente_nome: string
  valor_total: number
  qtd_pedidos: number
  mix_produtos: number
  ticket_medio: number
  percentual_acumulado: number
  curva: 'A' | 'B' | 'C'
  percentual_do_total: number
}

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const YEARS = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

export function AnaliseClientes() {
  const [abaSelecionada, setAbaSelecionada] = useState('geral')
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  // Query para buscar dados da View de Curva ABC
  const { data: abcData, isLoading } = useQuery({
    queryKey: ['abc-analysis', selectedMonth, selectedYear],
    queryFn: async () => {
      const year = parseInt(selectedYear)
      const month = parseInt(selectedMonth)
      
      // Criar datas de início e fim do mês
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .rpc('get_analise_clientes_periodo', {
          data_inicio: startDate,
          data_fim: endDate
        })
      
      if (error) throw error
      return data as ClienteABC[]
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Processamento dos dados para o Dashboard
  const processData = () => {
    if (!abcData || abcData.length === 0) return null

    // Totais Gerais
    const totalVendas = abcData.reduce((acc, curr) => acc + curr.valor_total, 0)
    const totalClientes = abcData.length
    const ticketMedioGeral = totalVendas / (totalClientes || 1) // Evitar divisão por zero
    const maiorCliente = abcData[0] // Já vem ordenado
    const mixMedio = abcData.reduce((acc, curr) => acc + curr.mix_produtos, 0) / (totalClientes || 1)

    // Agrupamento por Classe (A, B, C)
    const porClasse = ['A', 'B', 'C'].map(classe => {
      const clientesClasse = abcData.filter(c => c.curva === classe)
      const valorClasse = clientesClasse.reduce((acc, curr) => acc + curr.valor_total, 0)
      
      return {
        classificacao: classe,
        clientes: clientesClasse.length,
        percentualClientes: totalClientes > 0 ? (clientesClasse.length / totalClientes) * 100 : 0,
        valor: valorClasse,
        percentualValor: totalVendas > 0 ? (valorClasse / totalVendas) * 100 : 0,
        cor: classe === 'A' ? '#22c55e' : classe === 'B' ? '#eab308' : '#ef4444'
      }
    })

    // Top 10 Clientes
    const top10 = abcData.slice(0, 10).map(c => ({
      nome: c.cliente_nome,
      valor: c.valor_total,
      percentual: c.percentual_do_total,
      mix: c.mix_produtos,
      classificacao: c.curva,
      ticket: c.ticket_medio
    }))

    // Clientes Classe A
    const classeA = abcData.filter(c => c.curva === 'A').map((c, index) => ({
      ...c,
      ranking: index + 1
    }))

    // Clientes Maior Mix (Top 5)
    const maiorMix = [...abcData]
      .sort((a, b) => b.mix_produtos - a.mix_produtos)
      .slice(0, 5)
      .map(c => ({
        nome: c.cliente_nome,
        mix: c.mix_produtos,
        valor: c.valor_total
      }))

    // Concentração
    const concentracao = [
      { 
        grupo: 'Top 1', 
        valor: abcData[0]?.valor_total || 0,
        percentual: abcData[0]?.percentual_do_total || 0
      },
      { 
        grupo: 'Top 2-3', 
        valor: (abcData[1]?.valor_total || 0) + (abcData[2]?.valor_total || 0),
        percentual: (abcData[1]?.percentual_do_total || 0) + (abcData[2]?.percentual_do_total || 0)
      },
      { 
        grupo: 'Top 4-10', 
        valor: abcData.slice(3, 10).reduce((acc, curr) => acc + curr.valor_total, 0),
        percentual: abcData.slice(3, 10).reduce((acc, curr) => acc + curr.percentual_do_total, 0)
      },
      { 
        grupo: `Demais ${Math.max(0, totalClientes - 10)}`, 
        valor: abcData.slice(10).reduce((acc, curr) => acc + curr.valor_total, 0),
        percentual: abcData.slice(10).reduce((acc, curr) => acc + curr.percentual_do_total, 0)
      }
    ]

    return {
      totalVendas,
      totalClientes,
      ticketMedioGeral,
      maiorCliente,
      mixMedio,
      porClasse,
      top10,
      classeA,
      maiorMix,
      concentracao
    }
  }

  const metrics = processData()
  
  return (
    <div className="w-full h-full bg-slate-50/50 p-4 rounded-xl overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Análise de Clientes por Vendas
              </h1>
              <p className="text-gray-600">
                Performance comercial baseada na Curva ABC
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                <Calendar className="w-5 h-5 text-gray-500" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px] bg-white">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {metrics && (
                <div className="text-right pl-4 border-l">
                  <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
                  <p className="text-4xl font-bold text-blue-600">{metrics.totalClientes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {!metrics ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">Nenhum dado encontrado</h3>
            <p className="text-gray-500">Não há registros de vendas para o período selecionado.</p>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Faturamento Total</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(metrics.totalVendas)}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Médio</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(metrics.ticketMedioGeral)}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Maior Cliente</p>
                    <p className="text-xl font-bold text-gray-800">
                      {metrics.maiorCliente?.percentual_do_total.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">do faturamento</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mix Médio</p>
                    <p className="text-xl font-bold text-gray-800">{metrics.mixMedio.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">produtos/cliente</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Abas de Navegação */}
            <div className="bg-white rounded-lg shadow-sm p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setAbaSelecionada('geral')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    abaSelecionada === 'geral' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setAbaSelecionada('classeA')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    abaSelecionada === 'classeA' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Clientes Classe A
                </button>
                <button
                  onClick={() => setAbaSelecionada('ranking')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    abaSelecionada === 'ranking' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Ranking Top 10
                </button>
              </div>
            </div>

            {/* Conteúdo das Abas */}
            {abaSelecionada === 'geral' && (
              <>
                {/* Curva ABC Clientes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {metrics.porClasse.map((item) => (
                    <div key={item.classificacao} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold" style={{ color: item.cor }}>
                          Classe {item.classificacao}
                        </h3>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                             style={{ backgroundColor: item.cor }}>
                          {item.classificacao}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Faturamento</p>
                          <p className="text-xl font-bold text-gray-800">{formatCurrency(item.valor)}</p>
                          <p className="text-sm font-semibold" style={{ color: item.cor }}>
                            {item.percentualValor.toFixed(2)}% do total
                          </p>
                        </div>
                        
                        <div className="border-t pt-3">
                          <p className="text-sm text-gray-600">Quantidade de Clientes</p>
                          <p className="text-xl font-bold text-gray-800">{item.clientes} clientes</p>
                          <p className="text-sm text-gray-500">
                            {item.percentualClientes.toFixed(2)}% da base
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pizza - Distribuição por Classe */}
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Distribuição de Faturamento</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics.porClasse}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ classificacao, percentualValor }) => `Classe ${classificacao}: ${percentualValor.toFixed(1)}%`}
                          outerRadius={100}
                          dataKey="valor"
                        >
                          {metrics.porClasse.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Barras - Clientes x Valor */}
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Quantidade vs Faturamento</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics.porClasse}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="classificacao" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value: number, name: string) => 
                          name === 'Faturamento (R$)' ? formatCurrency(value) : value
                        } />
                        <Legend />
                        <Bar yAxisId="left" dataKey="valor" name="Faturamento (R$)" fill="#3b82f6" />
                        <Bar yAxisId="right" dataKey="clientes" name="Nº Clientes" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Concentração de Clientes */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Concentração de Vendas por Grupos de Clientes</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.concentracao}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grupo" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="valor" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                        {metrics.concentracao.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      O <span className="font-bold text-green-600">cliente #1</span> sozinho representa 
                      <span className="font-bold text-green-600"> {metrics.maiorCliente?.percentual_do_total.toFixed(2)}%</span> do faturamento total
                    </p>
                  </div>
                </Card>
              </>
            )}

            {abaSelecionada === 'classeA' && (
              <>
                {/* Destaque Classe A */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-10 h-10" />
                    <h2 className="text-3xl font-bold">Clientes Classe A - Elite</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                      <p className="text-green-100 text-sm mb-1">
                        Apenas {metrics.porClasse[0].clientes} clientes ({metrics.porClasse[0].percentualClientes.toFixed(2)}%)
                      </p>
                      <p className="text-3xl font-bold">{formatCurrency(metrics.porClasse[0].valor)}</p>
                      <p className="text-green-100 text-sm mt-1">
                        {metrics.porClasse[0].percentualValor.toFixed(2)}% do faturamento total
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                      <p className="text-green-100 text-sm mb-1">Ticket Médio Classe A</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(metrics.porClasse[0].valor / (metrics.porClasse[0].clientes || 1))}
                      </p>
                      <p className="text-green-100 text-sm mt-1">
                        {(metrics.porClasse[0].valor / (metrics.porClasse[0].clientes || 1) / (metrics.ticketMedioGeral || 1)).toFixed(1)}x maior que a média geral
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                      <p className="text-green-100 text-sm mb-1">Maior Faturamento</p>
                      <p className="text-3xl font-bold">{formatCurrency(metrics.maiorCliente.valor_total)}</p>
                      <p className="text-green-100 text-sm mt-1">{metrics.maiorCliente.cliente_nome}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhamento dos Clientes Classe A */}
                <div className="space-y-4">
                  {metrics.classeA.map((cliente: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{cliente.cliente_nome}</h3>
                            <p className="text-sm text-gray-500">{cliente.qtd_pedidos} pedidos realizados</p>
                          </div>
                        </div>
                        <div className="bg-green-100 px-4 py-2 rounded-full">
                          <span className="text-green-700 font-bold text-sm">CLASSE A</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Faturamento</p>
                          <p className="text-xl font-bold text-blue-700">{formatCurrency(cliente.valor_total)}</p>
                          <p className="text-sm text-blue-600 font-semibold mt-1">
                            {cliente.percentual_do_total.toFixed(2)}% do total
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Mix de Produtos</p>
                          <p className="text-xl font-bold text-purple-700">{cliente.mix_produtos} itens</p>
                          <p className="text-sm text-purple-600 font-semibold mt-1">Diversificação</p>
                        </div>
                        
                        <div className="bg-orange-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                          <p className="text-xl font-bold text-orange-700">{formatCurrency(cliente.ticket_medio)}</p>
                          <p className="text-sm text-orange-600 font-semibold mt-1">Por pedido</p>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Participação</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-green-500 h-3 rounded-full" 
                                style={{ width: `${Math.min(cliente.percentual_do_total * 3, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <p className="text-sm text-green-600 font-semibold mt-1">Alta relevância</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {abaSelecionada === 'ranking' && (
              <>
                {/* Top 10 Clientes */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">🏆 Top 10 Clientes por Faturamento</h2>
                  <div className="space-y-3">
                    {metrics.top10.map((cliente: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all border border-gray-100"
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-500 to-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-bold text-gray-800 truncate">{cliente.nome}</p>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              cliente.classificacao === 'A' ? 'bg-green-100 text-green-700' :
                              cliente.classificacao === 'B' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {cliente.classificacao}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{cliente.percentual.toFixed(2)}% do total</span>
                            <span>•</span>
                            <span>{cliente.mix} produto{cliente.mix > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-800">{formatCurrency(cliente.valor)}</p>
                          <div className="mt-1 w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(cliente.percentual * 3, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Análise de Mix de Produtos */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Clientes com Maior Diversificação (Mix de Produtos)</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.maiorMix} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nome" type="category" width={200} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number, name: string) => 
                        name === 'mix' ? `${value} produtos` : formatCurrency(value)
                      } />
                      <Bar dataKey="mix" fill="#8b5cf6" name="Qtd. Produtos" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Insight:</strong> Clientes com maior mix de produtos tendem a ter relacionamento mais sólido e menor risco de churn.
                      A diversificação indica confiança e satisfação com o portfólio.
                    </p>
                  </div>
                </Card>
              </>
            )}

            {/* Recomendações Estratégicas */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Recomendações Estratégicas para Gestão de Clientes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <p className="font-semibold mb-2">🎯 Clientes Classe A</p>
                  <p className="text-sm">Implementar programa VIP com atendimento prioritário, condições especiais e visitas periódicas. São {metrics.porClasse[0].percentualValor.toFixed(0)}% da receita!</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <p className="font-semibold mb-2">📈 Clientes Classe B</p>
                  <p className="text-sm">Potencial de crescimento! Estratégias de upselling e cross-selling podem elevar para Classe A.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <p className="font-semibold mb-2">⚡ Clientes Classe C</p>
                  <p className="text-sm">Avaliar rentabilidade vs custo de atendimento. Considerar automação e atendimento digital.</p>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}
