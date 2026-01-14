import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCard } from '@/components/common/AlertCard'
import { formatCurrency } from '@/lib/utils'

interface AlertasOpsProps {
    alertasInteligentes: any[]
    topOPs: any[]
    percMedio: number
    metaApara: number
    custoKgApara: number
    dadosSetor: any[]
}

export function AlertasOps({
    alertasInteligentes,
    topOPs,
    percMedio,
    metaApara,
    custoKgApara,
    dadosSetor,
}: AlertasOpsProps) {
    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
                {alertasInteligentes && alertasInteligentes.length > 0 ? (
                    alertasInteligentes.map((alerta: any, i: number) => (
                        <AlertCard
                            key={i}
                            level={alerta.nivel === 'CRITICO' ? 'critical' : 'warning'}
                            title={alerta.titulo}
                            message={alerta.mensagem}
                        />
                    ))
                ) : (
                    <>
                        <AlertCard level="normal" title="Sem alertas críticos" message="A produção está rodando dentro dos parâmetros esperados." />
                        <AlertCard level="warning" title="% Médio de Apara" message={`Atual: ${percMedio.toFixed(2)}% | Meta: ${metaApara}%`} />
                        <AlertCard level={percMedio <= metaApara ? 'normal' : 'warning'} title="Status da Meta" message={percMedio <= metaApara ? 'Dentro da meta!' : `${((percMedio / metaApara) * 100 - 100).toFixed(0)}% acima da meta`} />
                    </>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Top 10 OPs com Maior Perda
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-red-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">OP</th>
                                    <th className="px-3 py-2 text-left">Cliente</th>
                                    <th className="px-3 py-2 text-center">Material</th>
                                    <th className="px-3 py-2 text-right">Apara (kg)</th>
                                    <th className="px-3 py-2 text-right">Prejuízo Est.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topOPs?.map((op, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-3 py-2 font-medium">{op.op_numero}</td>
                                        <td className="px-3 py-2">{op.cliente_nome}</td>
                                        <td className="px-3 py-2 text-center">
                                            <Badge variant="outline">{op.material_nome}</Badge>
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-red-600">{parseFloat(String(op.kg_apara)).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right text-red-600">{formatCurrency(parseFloat(String(op.kg_apara)) * custoKgApara)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-700">📋 Recomendações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                    <p>1. <strong>Foco na Extrusão:</strong> Responsável por {dadosSetor[0]?.percentual.toFixed(0)}% das perdas.</p>
                    <p>2. <strong>Operadores:</strong> Verificar necessidade de treinamento para operadores com maior % de apara.</p>
                    <p>3. <strong>OPs Críticas:</strong> Investigar as OPs com maior perda para identificar causas raiz.</p>
                    <p>4. <strong>Meta:</strong> Trabalhar para reduzir o % médio de apara para abaixo de {metaApara}%.</p>
                </CardContent>
            </Card>
        </div>
    )
}
