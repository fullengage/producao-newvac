import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

interface PedidoRelatoriosProps {
    salesByMonth: any[]
    salesBySeller: any[]
    abcCurve: any[]
}

export function PedidoRelatorios({
    salesByMonth,
    salesBySeller,
    abcCurve,
}: PedidoRelatoriosProps) {
    // Formatar dados para o gráfico de barras
    const salesByMonthFormatted = salesByMonth?.map((item: any) => {
        const parts = item.mes_ano.split('-')
        const year = parts[0]
        const month = parts[1]
        return {
            ...item,
            mes_ano_formatado: `${month}/${year}`
        }
    })

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Vendas por Mês (R$)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesByMonthFormatted || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes_ano_formatado" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="total_vendas" fill="#0088FE" name="Total Vendas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Vendas por Vendedor</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={salesBySeller || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="total_vendas"
                                >
                                    {salesBySeller?.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Curva ABC de Clientes (Top 50)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                                    <th className="pb-3">Classificação</th>
                                    <th className="pb-3">Cliente</th>
                                    <th className="pb-3 text-right">Total Compras</th>
                                    <th className="pb-3 text-right">% Acumulado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {abcCurve?.map((item: any, index: number) => (
                                    <tr key={index} className="border-b hover:bg-accent/50">
                                        <td className="py-3">
                                            <Badge
                                                variant={item.curva === 'A' ? 'default' : item.curva === 'B' ? 'secondary' : 'outline'}
                                                className={item.curva === 'A' ? 'bg-green-500' : item.curva === 'B' ? 'bg-yellow-500' : ''}
                                            >
                                                Curva {item.curva}
                                            </Badge>
                                        </td>
                                        <td className="py-3 font-medium">{item.cliente_nome}</td>
                                        <td className="py-3 text-right">{formatCurrency(item.valor_total)}</td>
                                        <td className="py-3 text-right">{item.percentual_acumulado?.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
