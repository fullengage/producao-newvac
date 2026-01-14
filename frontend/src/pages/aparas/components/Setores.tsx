import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SetoresProps {
    dadosSetor: any[]
    custoKgApara: number
}

export function Setores({ dadosSetor, custoKgApara }: SetoresProps) {
    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
                {dadosSetor.map((setor, i) => (
                    <Card key={i} className="border-l-4" style={{ borderLeftColor: setor.cor }}>
                        <CardHeader>
                            <CardTitle>{setor.setor}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Participação:</span>
                                <span className="font-bold" style={{ color: setor.cor }}>{setor.percentual.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kg de Apara:</span>
                                <span className="font-bold">{setor.kg.toLocaleString('pt-BR')} kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Prejuízo Est.:</span>
                                <span className="font-bold text-red-600">{formatCurrency(setor.kg * custoKgApara)}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        Análise por Setor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700">
                        O setor de <strong>Extrusão</strong> é responsável por <strong>{dadosSetor[0]?.percentual.toFixed(2)}%</strong> de todas as aparas ({dadosSetor[0]?.kg.toLocaleString('pt-BR')} kg),
                        seguido pela <strong>Impressão</strong> com <strong>{dadosSetor[1]?.percentual.toFixed(2)}%</strong> ({dadosSetor[1]?.kg.toLocaleString('pt-BR')} kg).
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
