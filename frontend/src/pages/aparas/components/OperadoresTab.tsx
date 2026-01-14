import { Users, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

interface OperadoresProps {
    operadores: any[]
}

export function Operadores({ operadores }: OperadoresProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Desempenho por Operador - Extrusão
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={operadores || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nome" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => [`${Number(value).toFixed(2)} kg`, 'Apara']} />
                            <Bar dataKey="apara" name="Apara (kg)" radius={[4, 4, 0, 0]}>
                                {operadores?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={parseFloat(String(entry.perc)) > 5 ? '#ef4444' : parseFloat(String(entry.perc)) > 4 ? '#f97316' : '#22c55e'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento por Operador</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Operador</th>
                                    <th className="px-4 py-2 text-right">Kg Produzido</th>
                                    <th className="px-4 py-2 text-right">Apara (kg)</th>
                                    <th className="px-4 py-2 text-right">% Apara</th>
                                    <th className="px-4 py-2 text-right">OPs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operadores?.map((op, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-2 font-medium">{op.nome}</td>
                                        <td className="px-4 py-2 text-right">{parseFloat(String(op.kg_prod)).toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-2 text-right text-red-600 font-medium">{parseFloat(String(op.apara)).toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-2 text-right">
                                            <Badge className={parseFloat(String(op.perc)) > 5 ? 'bg-red-100 text-red-700' : parseFloat(String(op.perc)) > 4 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                                                {parseFloat(String(op.perc)).toFixed(2)}%
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-right">{op.ops}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <Award className="w-5 h-5" />
                        Melhores Desempenhos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        {operadores?.slice().sort((a, b) => parseFloat(String(a.perc)) - parseFloat(String(b.perc))).slice(0, 3).map((op, i) => (
                            <div key={i} className="bg-white rounded-lg p-3">
                                <span className="text-xs text-gray-500">#{i + 1} Menor % Apara</span>
                                <p className="font-bold text-green-700">{op.nome} - {parseFloat(String(op.perc)).toFixed(2)}%</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
