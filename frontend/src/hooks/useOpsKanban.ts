import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useOpsKanban() {
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { data: ops, isLoading } = useQuery({
        queryKey: ['pedidos-kanban'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_kanban_producao')
                .select('*')
                .order('data_emissao_pedido', { ascending: false })
                .limit(200)

            if (error) throw error
            return data
        },
    })

    const updateEstagio = useMutation({
        mutationFn: async ({ pedidoId, estagio }: { pedidoId: string; estagio: string }) => {
            const updates: any = { estagio_manual: estagio }
            const now = new Date().toISOString()

            // Encontrar o estágio atual antes da atualização
            const currentOp = ops?.find((o: any) => o.id === pedidoId)
            const previousEstagio = currentOp?.estagio_producao

            if (estagio === 'pendente') {
                updates.aprovado_liliani = false
                updates.aprovado_biani = false
                updates.situacao = 'em_analise'
            } else if (estagio === 'faturamento') {
                updates.aprovado_liliani = true
                updates.aprovado_biani = true
                updates.situacao = 'faturado'
                updates.data_entrada_faturamento = now

                // Se estava em algum estágio anterior, marca a saída
                if (previousEstagio === 'corte_solda') updates.data_saida_corte_solda = now
                if (previousEstagio === 'impressao') updates.data_saida_impressao = now
                if (previousEstagio === 'extrusao') updates.data_saida_extrusao = now
            } else {
                updates.aprovado_liliani = true
                updates.aprovado_biani = true
                updates.situacao = 'em_producao'

                // Lógica de transição de tempos
                if (previousEstagio === 'pendente') updates.data_aprovacao = now
                if (previousEstagio === 'extrusao') updates.data_saida_extrusao = now
                if (previousEstagio === 'impressao') updates.data_saida_impressao = now
                if (previousEstagio === 'corte_solda') updates.data_saida_corte_solda = now

                // Registra entrada no novo estágio
                if (estagio === 'extrusao') updates.data_entrada_extrusao = now
                if (estagio === 'impressao') updates.data_entrada_impressao = now
                if (estagio === 'corte_solda') updates.data_entrada_corte_solda = now
            }

            const { error } = await supabase
                .from('pedidos')
                .update(updates)
                .eq('id', pedidoId)

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Pedido movido!')
            queryClient.invalidateQueries({ queryKey: ['pedidos-kanban'] })
        },
        onError: (error: Error) => {
            toast.error(`Erro: ${error.message}`)
        },
    })

    const updateSituacao = useMutation({
        mutationFn: async ({ pedidoId, situacao }: { pedidoId: string; situacao: string }) => {
            const { error } = await supabase
                .from('pedidos')
                .update({ situacao })
                .eq('id', pedidoId)

            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Situação atualizada!')
            queryClient.invalidateQueries({ queryKey: ['pedidos-kanban'] })
            setOpenPopoverId(null)
        },
        onError: (error: Error) => {
            toast.error(`Erro: ${error.message}`)
        },
    })

    return {
        ops,
        isLoading,
        draggedId,
        setDraggedId,
        openPopoverId,
        setOpenPopoverId,
        updateEstagio,
        updateSituacao,
    }
}
