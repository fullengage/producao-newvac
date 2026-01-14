import { Package, AlertTriangle, TrendingDown, Target, Factory } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/common/KPICard'
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
import { formatCurrency } from '@/lib/utils'

interface VisaoGeralProps {
    kgProduzido: number
    kgApara: number
    percMedio: number
    totalOPs: number
    metaApara: number
    custoKgApara: number
    dadosSetor: any[]
    dadosMaterial: any[]
}

export function VisaoGeral({
    kgProduzido,
    kgApara,
    percMedio,
    totalOPs,
    metaApara,
    custoKgApara,
    dadosSetor,
    dadosMaterial,
}: VisaoGeralProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Total Produzido" value={kgProduzido.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} unit="kg" icon={Package} color="blue" />
                <KPICard title="Total Aparas" value={kgApara.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} unit="kg" icon={AlertTriangle} color="red" subtitle="Desperdício do mês" />
                <KPICard title="% Médio de Apara" value={percMedio.toFixed(2)} unit="%" icon={TrendingDown} color="orange" trend={percMedio - metaApara} />
                <KPICard title="OPs Analisadas" value={totalOPs} unit="ordens" icon={Target} color="purple" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Factory className="w-5 h-5" />
                            Distribuição de Aparas por Setor
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={dadosSetor}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="percentual"
                                    nameKey="setor"
                                    label={({ setor, percentual }: any) => `${setor}: ${percentual.toFixed(1)}%`}
                                >
                                    {dadosSetor.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.cor} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2 text-sm flex-wrap">
                            {dadosSetor.map((item, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                                    <span>{item.setor}: {item.kg.toLocaleString('pt-BR')} kg</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aparas por Material (kg)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={dadosMaterial} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="material" type="category" width={60} />
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
                                <Bar dataKey="kgApara" radius={[0, 4, 4, 0]}>
                                    {dadosMaterial.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.kgApara > 500 ? '#ef4444' : entry.kgApara > 300 ? '#f97316' : '#22c55e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento por Material</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Material</th>
                                    <th className="px-4 py-2 text-right">Kg Apara</th>
                                    <th className="px-4 py-2 text-right">% do Total</th>
                                    <th className="px-4 py-2 text-right">Prejuízo Est.</th>
                                    <th className="px-4 py-2 text-right">OPs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dadosMaterial.map((item, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-2 font-medium">{item.material}</td>
                                        <td className="px-4 py-2 text-right text-red-600 font-medium">{item.kgApara.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-2 text-right">
                                            <Badge className={item.kgApara > 500 ? 'bg-red-100 text-red-700' : item.kgApara > 300 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                                                {kgApara > 0 ? ((item.kgApara / kgApara) * 100).toFixed(2) : 0}%
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-right text-red-600">{formatCurrency(item.kgApara * custoKgApara)}</td>
                                        <td className="px-4 py-2 text-right">{item.ops}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-200 font-bold">
                                <tr>
                                    <td className="px-4 py-2">TOTAL</td>
                                    <td className="px-4 py-2 text-right text-red-600">{kgApara.toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-2 text-right">100%</td>
                                    <td className="px-4 py-2 text-right text-red-600">{formatCurrency(kgApara * custoKgApara)}</td>
                                    <td className="px-4 py-2 text-right">{totalOPs}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
