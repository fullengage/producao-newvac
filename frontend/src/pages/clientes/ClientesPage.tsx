import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCNPJ, formatPhone } from '@/lib/utils'
import { Plus, Search, Building2 } from 'lucide-react'
import type { Client } from '@/types/database.types'
import { ClienteDetailsDialog } from './ClienteDetailsDialog'

export function ClientesPage() {
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: async () => {
      let query = supabase
        .from('clientes')
        .select('*')
        .eq('ativo', true)
        .order('razao_social', { ascending: true })
        .limit(50)

      if (search) {
        query = query.or(`razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes cadastrados
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por razão social, fantasia ou CNPJ..."
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
            <div className="space-y-4">
              {clients?.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {client.razao_social || client.nome_fantasia || 'Sem nome'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.cnpj ? formatCNPJ(client.cnpj) : 'CNPJ não informado'}
                        {client.cidade && ` • ${client.cidade}/${client.estado}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {client.telefone ? formatPhone(client.telefone) : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {client.email || '-'}
                    </p>
                  </div>
                </div>
              ))}

              {clients?.length === 0 && (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ClienteDetailsDialog 
        clientId={selectedClientId} 
        open={!!selectedClientId} 
        onOpenChange={(open) => !open && setSelectedClientId(null)} 
      />
    </div>
  )
}
