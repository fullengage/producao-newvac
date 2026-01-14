import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Package } from 'lucide-react'
import type { Product } from '@/types/database.types'

export function ProdutosPage() {
  const [search, setSearch] = useState('')

  const { data: products, isLoading } = useQuery({
    queryKey: ['materiais', search],
    queryFn: async () => {
      let query = supabase
        .from('materiais')
        .select('*')
        .order('nome', { ascending: true })
        .limit(50)

      if (search) {
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`)
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
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Catálogo de produtos e materiais
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products?.map((product: any) => (
                <div
                  key={product.id}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Código: {product.codigo}
                      </p>
                      {product.descricao && (
                        <p className="text-sm text-muted-foreground">
                          {product.descricao}
                        </p>
                      )}
                      {product.densidade && (
                        <p className="mt-2 text-sm">
                          Densidade: {product.densidade}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {products?.length === 0 && (
                <div className="col-span-full flex h-32 items-center justify-center text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
