import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate, formatCNPJ, formatPhone } from '@/lib/utils'
import { Building2, Phone, MapPin, History, FileText, Users, AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ClienteDashboard } from './ClienteDashboard'

interface PedidoUnificado {
  id: number
  numero_pedido: number
  numero_op: number | null
  data_emissao_pedido: string
  data_entrega: string | null
  material_nome: string | null
  item: string | null
  valor: number | null
  situacao: string | null
  status_liliane: string | null
  vendedor_nome: string | null
  quantidade: number | null
  peso_total: number | null
}

interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  cpf: string | null
  inscricao_estadual: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  codigo?: string
}

interface ClienteDuplicado {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
}

interface ClienteDetailsDialogProps {
  clientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClienteDetailsDialog({ clientId, open, onOpenChange }: ClienteDetailsDialogProps) {
  // CORREÇÃO 1: Melhor tratamento de erro e logging
  const { data: client, isLoading: isLoadingClient, error: clientError } = useQuery<Cliente | null>({
    queryKey: ['cliente', clientId],
    queryFn: async () => {
      if (!clientId) return null
      
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clientId)
          .single()
        
        if (error) {
          console.error('Erro ao buscar cliente:', error)
          throw error
        }
        
        console.log('Cliente carregado:', data)
        return data as Cliente
      } catch (err) {
        console.error('Exception ao buscar cliente:', err)
        throw err
      }
    },
    enabled: !!clientId && open,
    retry: 1,
  })

  // CORREÇÃO 2: Query corrigida para buscar pedidos
  // Se a RPC não existir, usar uma query direta
  const { data: pedidos, isLoading: isLoadingPedidos, error: pedidosError } = useQuery({
    queryKey: ['cliente-pedidos-unificado', clientId],
    queryFn: async () => {
      if (!clientId || !client?.razao_social) return []
      
      try {
        // Opção 1: Tentar usar a RPC se existir
        try {
          const { data, error } = await supabase
            .rpc('get_cliente_pedidos_unificado', { p_cliente_id: clientId })
          
          if (!error && data) {
            console.log('Pedidos da RPC:', data)
            return data as PedidoUnificado[]
          }
        } catch (rpcError) {
          console.warn('RPC não disponível, usando query direta:', rpcError)
        }

        // Opção 2: Query direta se RPC não existir
        const nomeNormalizado = client.razao_social
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .replace(/(ltda|eireli|me|epp|sa|limitada)$/g, '')

        // Buscar todos os clientes com nome similar
        const { data: clientesSimilares, error: clientesError } = await supabase
          .from('clientes')
          .select('id')
          .ilike('razao_social', `%${client.razao_social}%`)

        if (clientesError) throw clientesError

        const clienteIds = clientesSimilares?.map(c => c.id) || [clientId]

        // Buscar pedidos desses clientes
        const { data: pedidosData, error: pedidosDataError } = await supabase
          .from('pedidos')
          .select('*')
          .in('cliente_id_mapped', clienteIds)
          .order('data_emissao_pedido', { ascending: false })

        if (pedidosDataError) throw pedidosDataError

        console.log('Pedidos carregados:', pedidosData)
        return (pedidosData || []) as PedidoUnificado[]
      } catch (err) {
        console.error('Erro ao buscar pedidos:', err)
        throw err
      }
    },
    enabled: !!clientId && open && !!client,
  })

  // CORREÇÃO 3: Busca por duplicados com melhor lógica
  const { data: clientesDuplicados } = useQuery<ClienteDuplicado[]>({
    queryKey: ['cliente-duplicados', client?.razao_social],
    queryFn: async () => {
      if (!client?.razao_social) return []
      
      try {
        // Normalizar apenas para busca
        const nomeNormalizado = client.razao_social
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .replace(/(ltda|eireli|me|epp|sa|limitada)$/g, '')

        const { data, error } = await supabase
          .from('clientes')
          .select('id, razao_social, nome_fantasia, cnpj')
          .ilike('razao_social', `%${client.razao_social}%`)
          .neq('id', clientId)

        if (error) {
          console.warn('Erro ao buscar duplicados:', error)
          return []
        }

        console.log('Clientes duplicados encontrados:', data)

        // Filtra clientes com nome similar
        const filtrados = (data as ClienteDuplicado[]).filter(c => {
          const outroNome = c.razao_social
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/(ltda|eireli|me|epp|sa|limitada)$/g, '')
          return outroNome === nomeNormalizado
        })

        return filtrados
      } catch (err) {
        console.error('Exception ao buscar duplicados:', err)
        return []
      }
    },
    enabled: !!client?.razao_social && open,
  })

  if (isLoadingClient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">Carregando dados do cliente...</div>
        </DialogContent>
      </Dialog>
    )
  }

  if (clientError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar cliente: {(clientError as Error).message}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            {client.razao_social || client.nome_fantasia}
          </DialogTitle>
          <div className="flex gap-2 text-sm text-muted-foreground mt-1">
            {client.cnpj && <span>{formatCNPJ(client.cnpj)}</span>}
            {client.codigo && <span>• Cód: {client.codigo}</span>}
          </div>
          
          {/* Mostrar aviso se há muitos campos vazios */}
          {!client.email && !client.telefone && !client.endereco && (
            <Alert className="mt-2 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                Este cliente possui dados cadastrais incompletos
              </AlertDescription>
            </Alert>
          )}
          
          {clientesDuplicados && clientesDuplicados.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
              <Users className="h-4 w-4" />
              <span>
                <strong>{clientesDuplicados.length + 1} cadastros</strong> encontrados com nome similar.
                Variações: {clientesDuplicados.map(c => c.razao_social).join(', ')}
              </span>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="px-6 border-b shrink-0">
            <TabsList>
              <TabsTrigger value="dashboard">Visão Geral</TabsTrigger>
              <TabsTrigger value="detalhes">Dados Cadastrais</TabsTrigger>
              <TabsTrigger value="historico">
                Lista de Pedidos {pedidos && pedidos.length > 0 && <Badge className="ml-2">{pedidos.length}</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="flex-1 overflow-auto m-0 p-0">
            <ClienteDashboard clienteId={clientId} />
          </TabsContent>

          <TabsContent value="detalhes" className="flex-1 overflow-auto p-6 m-0">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados Cadastrais
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Fantasia:</span>
                    <span className="col-span-2 font-medium">{client.nome_fantasia || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="col-span-2 font-medium">{client.cnpj ? formatCNPJ(client.cnpj) : '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">CPF:</span>
                    <span className="col-span-2 font-medium">{client.cpf || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Insc. Est.:</span>
                    <span className="col-span-2 font-medium">{client.inscricao_estadual || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contato
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="col-span-2 font-medium">{client.telefone ? formatPhone(client.telefone) : '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Celular:</span>
                    <span className="col-span-2 font-medium">{client.celular ? formatPhone(client.celular) : '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="col-span-2 font-medium break-all">{client.email || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="text-sm border rounded-md p-3 bg-slate-50">
                  {client.endereco || 'Não informado'}, {client.numero || ''} {client.complemento ? ` - ${client.complemento}` : ''}<br />
                  {client.bairro || 'Bairro não informado'} - {client.cidade || 'Cidade não informada'}/{client.estado || 'UF'}<br />
                  CEP: {client.cep || 'Não informado'}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="flex-1 overflow-hidden flex flex-col m-0">
            {pedidosError && (
              <Alert variant="destructive" className="m-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao carregar pedidos: {(pedidosError as Error).message}
                </AlertDescription>
              </Alert>
            )}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {isLoadingPedidos ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando histórico de pedidos...</div>
                ) : pedidos?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    Nenhum pedido encontrado para este cliente.
                  </div>
                ) : (
                  pedidos?.map((pedido: PedidoUnificado) => (
                    <div key={pedido.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Pedido #{pedido.numero_pedido}</span>
                          {pedido.numero_op && (
                            <Badge variant="outline" className="text-xs">OP {pedido.numero_op}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex gap-3">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {pedido.material_nome || 'Material não informado'}
                          </span>
                          <span>•</span>
                          <span>{formatDate(pedido.data_emissao_pedido)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {formatCurrency(pedido.valor || 0)}
                        </div>
                        {pedido.status_liliane?.toLowerCase().includes('cancel') ? (
                          <div className="flex flex-col items-end">
                            <Badge variant="destructive" className="mt-1">Cancelado</Badge>
                            <span className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate" title={pedido.status_liliane}>
                              {pedido.status_liliane}
                            </span>
                          </div>
                        ) : (
                          <Badge variant={
                            pedido.situacao === 'concluido' ? 'default' :
                            pedido.situacao === 'em_producao' ? 'secondary' :
                            pedido.situacao === 'bloqueado' ? 'destructive' : 'outline'
                          } className="mt-1">
                            {pedido.situacao || 'Pendente'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}