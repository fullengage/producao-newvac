import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function useOrders(search: string = '') {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    // Query Lista de Pedidos
    const { data: orders, isLoading: loadingOrders } = useQuery({
        queryKey: ['pedidos', search],
        queryFn: async () => {
            let query = supabase
                .from('pedidos')
                .select('*')
                .order('data_emissao_pedido', { ascending: false })
                .limit(50)

            if (search) {
                query = query.or(`numero_pedido.ilike.%${search}%,cliente_nome.ilike.%${search}%,vendedor_nome.ilike.%${search}%`)
            }

            const { data, error } = await query
            if (error) throw error
            return data
        },
    })

    // Query Vendas por Mês
    const { data: salesByMonth } = useQuery({
        queryKey: ['sales-by-month'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vw_vendas_por_mes').select('*')
            if (error) throw error
            return data
        },
    })

    // Query Vendas por Vendedor
    const { data: salesBySeller } = useQuery({
        queryKey: ['sales-by-seller'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vw_vendas_por_vendedor').select('*').limit(10)
            if (error) throw error
            return data
        },
    })

    // Query Curva ABC
    const { data: abcCurve } = useQuery({
        queryKey: ['abc-curve'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vw_curva_abc_clientes').select('*').limit(50)
            if (error) throw error
            return data
        },
    })

    // Buscar clientes para o select
    const { data: clients } = useQuery({
        queryKey: ['clients-select'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clientes')
                .select('id, razao_social, nome_fantasia')
                .order('razao_social')
                .limit(3000)
            if (error) throw error
            return data
        },
    })

    // Mutations
    const approveLiliane = useMutation({
        mutationFn: async (orderId: string) => {
            const { data, error } = await supabase.rpc('approve_liliane', {
                p_order_id: orderId,
            })
            if (error) throw error
            return data
        },
        onSuccess: () => {
            toast.success('Pedido aprovado por Liliane!')
            queryClient.invalidateQueries({ queryKey: ['pedidos'] })
        },
        onError: (error: Error) => {
            toast.error(`Erro: ${error.message}`)
        },
    })

    const approveBiani = useMutation({
        mutationFn: async (orderId: string) => {
            const { data, error } = await supabase.rpc('approve_biani', {
                p_order_id: orderId,
            })
            if (error) throw error
            return data
        },
        onSuccess: () => {
            toast.success('Pedido aprovado por Biani e enviado para produção!')
            queryClient.invalidateQueries({ queryKey: ['pedidos'] })
        },
        onError: (error: Error) => {
            toast.error(`Erro: ${error.message}`)
        },
    })

    const createOrderMutation = useMutation({
        mutationFn: async ({ items, formData }: { items: any[]; formData: any }) => {
            const { data, error } = await (supabase.rpc as any)('create_order_with_items', {
                p_items: items,
                p_order_data: formData,
            })
            if (error) throw error
            return data
        },
        onSuccess: () => {
            toast.success('Pedido processado com sucesso!')
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['pedidos'] })
            navigate('/pedidos')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao processar pedido: ${error.message}`)
        },
    })

    const fetchLatestOrder = async (clientId: string) => {
        // Primeiro, busca o numero_pedido mais recente para este cliente
        const { data: lastOrder, error: orderError } = await supabase
            .from('pedidos')
            .select('numero_pedido, vendedor_nome, data_entrega')
            .eq('cliente_id_mapped', clientId)
            .order('data_emissao_pedido', { ascending: false })
            .limit(1)
            .single()

        if (orderError) {
            if (orderError.code === 'PGRST116') return null // Nenhum pedido encontrado
            throw orderError
        }

        // Agora busca todos os itens (linhas) desse numero_pedido
        const { data: items, error: itemsError } = await supabase
            .from('pedidos')
            .select('*')
            .eq('numero_pedido', lastOrder.numero_pedido)
            .eq('cliente_id_mapped', clientId)

        if (itemsError) throw itemsError

        return {
            order: lastOrder,
            items: items || []
        }
    }

    return {
        orders,
        loadingOrders,
        salesByMonth,
        salesBySeller,
        abcCurve,
        clients,
        approveLiliane,
        approveBiani,
        createOrderMutation,
        fetchLatestOrder,
    }
}
