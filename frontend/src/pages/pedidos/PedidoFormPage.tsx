import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'

interface OrderItem {
  id?: string
  item_numero: number
  codigo_produto: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

export function PedidoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const { clients, createOrderMutation, fetchLatestOrder } = useOrders()

  const [formData, setFormData] = useState({
    codigo: '',
    numero_pedido: '',
    client_id: '',
    vendedor: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrega: '',
    valor: 0,
  })

  const [items, setItems] = useState<OrderItem[]>([
    { item_numero: 1, codigo_produto: '', descricao: '', quantidade: 0, valor_unitario: 0, valor_total: 0 }
  ])

  // Buscar pedido existente se estiver editando
  const { data: existingOrder } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Database['public']['Tables']['orders']['Row']
    },
    enabled: isEditing,
  })

  useEffect(() => {
    if (existingOrder) {
      setFormData({
        codigo: existingOrder.codigo || '',
        numero_pedido: existingOrder.numero_pedido || '',
        client_id: existingOrder.client_id || '',
        vendedor: existingOrder.vendedor || '',
        data_emissao: existingOrder.data_emissao || '',
        data_entrega: existingOrder.data_entrega || '',
        valor: existingOrder.valor || 0,
      })
    }
  }, [existingOrder])

  // Puxar dados do pedido anterior quando o cliente é selecionado
  useEffect(() => {
    async function loadPreviousOrder() {
      if (!isEditing && formData.client_id) {
        try {
          const result = await fetchLatestOrder(formData.client_id)
          if (result) {
            const { order, items: prevItems } = result

            // Sugerir dados do pedido anterior
            setFormData(prev => ({
              ...prev,
              vendedor: order.vendedor_nome || prev.vendedor,
              // Mantemos as datas vazias/padrão para o novo pedido
            }))

            if (prevItems && prevItems.length > 0) {
              const mappedItems = prevItems.map((item: any, index: number) => ({
                item_numero: index + 1,
                codigo_produto: item.codigo_produto || '',
                descricao: item.item || '', // No banco o campo é 'item' em vez de 'descricao'
                quantidade: item.quantidade || 0,
                valor_unitario: item.valor_unitario || 0,
                valor_total: item.valor_total || 0,
              }))
              setItems(mappedItems)

              // Recalcular valor total do pedido
              const total = mappedItems.reduce((sum, item) => sum + (item.valor_total || 0), 0)
              setFormData(prev => ({ ...prev, valor: total }))
            }
          }
        } catch (error) {
          console.error('Erro ao carregar pedido anterior:', error)
        }
      }
    }

    loadPreviousOrder()
  }, [formData.client_id, isEditing])

  function addItem() {
    setItems([
      ...items,
      {
        item_numero: items.length + 1,
        codigo_produto: '',
        descricao: '',
        quantidade: 0,
        valor_unitario: 0,
        valor_total: 0,
      },
    ])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems.map((item, i) => ({ ...item, item_numero: i + 1 })))
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalcular valor total do item
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItems[index].valor_total = (Number(newItems[index].quantidade) || 0) * (Number(newItems[index].valor_unitario) || 0)
    }

    setItems(newItems)

    // Recalcular valor total do pedido
    const total = newItems.reduce((sum, item) => sum + item.valor_total, 0)
    setFormData({ ...formData, valor: total })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createOrderMutation.mutate({ items, formData })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pedidos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Editar Pedido' : 'Novo Pedido'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Altere os dados do pedido' : 'Preencha os dados do novo pedido'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_pedido">Número do Pedido</Label>
              <Input
                id="numero_pedido"
                value={formData.numero_pedido}
                onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão</Label>
              <Input
                id="data_emissao"
                type="date"
                value={formData.data_emissao}
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_entrega">Data de Entrega</Label>
              <Input
                id="data_entrega"
                type="date"
                value={formData.data_entrega}
                onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="client_id">Cliente</Label>
              <select
                id="client_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Selecione um cliente</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.razao_social || client.nome_fantasia}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor</Label>
              <Input
                id="vendedor"
                value={formData.vendedor}
                onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-lg font-bold">
                {formatCurrency(formData.valor)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Itens do Pedido</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-6">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      value={item.codigo_produto}
                      onChange={(e) => updateItem(index, 'codigo_produto', e.target.value)}
                      placeholder="Código"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      placeholder="Descrição do item"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unit.</Label>
                    <Input
                      type="number"
                      value={item.valor_unitario}
                      onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Total</Label>
                      <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                        {formatCurrency(item.valor_total)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/pedidos')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createOrderMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createOrderMutation.isPending ? 'Salvando...' : 'Salvar Pedido'}
          </Button>
        </div>
      </form>
    </div>
  )
}
