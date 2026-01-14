import { Search, Eye, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface PedidoListProps {
    orders: any[]
    search: string
    setSearch: (search: string) => void
    isLoading: boolean
    approveLiliane: any
    approveBiani: any
}

export function PedidoList({
    orders,
    search,
    setSearch,
    isLoading,
    approveLiliane,
    approveBiani,
}: PedidoListProps) {
    const navigate = useNavigate()

    function getStatusBadge(order: any) {
        if (order.aprovado_biani === true) {
            return <Badge className="bg-green-500">Em Produção</Badge>
        }

        if (order.aprovado_liliani === true && order.aprovado_biani === false) {
            return <Badge className="bg-yellow-500">Pend. Fin.</Badge>
        }

        if (order.aprovado_liliani === false) {
            return <Badge variant="secondary">Pendente</Badge>
        }

        return <Badge variant="secondary">Pendente</Badge>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lista de Pedidos</CardTitle>
                <div className="flex items-center gap-4 pt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código, número ou vendedor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                                    <th className="pb-3">Código</th>
                                    <th className="pb-3">Cliente</th>
                                    <th className="pb-3">Vendedor</th>
                                    <th className="pb-3">Emissão</th>
                                    <th className="pb-3">Entrega</th>
                                    <th className="pb-3 text-right">Valor</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders?.map((order: any, index: number) => {
                                    const canApproveLiliane = order.aprovado_liliani === false
                                    const canApproveBiani = order.aprovado_liliani === true && order.aprovado_biani === false

                                    return (
                                        <tr key={`${order.id}-${index}`} className="border-b hover:bg-accent/50">
                                            <td className="py-3 font-medium">{order.numero_pedido}</td>
                                            <td className="py-3">
                                                {order.cliente_nome || '-'}
                                            </td>
                                            <td className="py-3">{order.vendedor_nome || '-'}</td>
                                            <td className="py-3">
                                                {order.data_emissao_pedido ? formatDate(order.data_emissao_pedido) : '-'}
                                            </td>
                                            <td className="py-3">
                                                {order.data_entrega ? formatDate(order.data_entrega) : '-'}
                                            </td>
                                            <td className="py-3 text-right">
                                                {formatCurrency(order.valor || 0)}
                                            </td>
                                            <td className="py-3">{getStatusBadge(order)}</td>
                                            <td className="py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/pedidos/${order.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {canApproveLiliane && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => approveLiliane.mutate(order.id)}
                                                            disabled={approveLiliane.isPending}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {canApproveBiani && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            onClick={() => approveBiani.mutate(order.id)}
                                                            disabled={approveBiani.isPending}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {orders?.length === 0 && (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                Nenhum pedido encontrado
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
