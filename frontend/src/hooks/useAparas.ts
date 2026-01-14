import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface AparasResumo {
    mes: string
    total_ops: number
    kg_extrusao: string | number
    kg_impressao: string | number
    kg_corte_solda: string | number
    kg_acerto: string | number
    kg_apara_total: string | number
}

export interface AparasMaterial {
    mes: string
    material_nome: string
    ops: number
    kg_apara: string | number
}

export interface AparasTopOP {
    mes: string
    op_numero: number
    cliente_nome: string
    material_nome: string
    kg_apara: number
}

export interface IndicadorTempo {
    total_homem_hora: number
    total_maquina_hora: number
    total_kg_produzido: number
    total_horas_parada: number
}

export function useAparas(mesSelecionado: string) {
    const queryClient = useQueryClient()

    // Diário de Produção Detalhado
    const { data: diarioProducao } = useQuery({
        queryKey: ['diario-producao', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('registro_horas_producao')
                .select(`
          *,
          op:ordens_producao (
            item,
            quantidade_programada
          )
        `)
                .eq('mes_referencia', mesSelecionado)
                .order('data_registro', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
    })

    // Mutation para excluir registro
    const deleteRegistroMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('registro_horas_producao')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Registro excluído com sucesso')
            queryClient.invalidateQueries({ queryKey: ['diario-producao'] })
            queryClient.invalidateQueries({ queryKey: ['indicadores-tempo'] })
            queryClient.invalidateQueries({ queryKey: ['indicadores-operador'] })
            queryClient.invalidateQueries({ queryKey: ['indicadores-maquina'] })
        },
        onError: (error) => {
            toast.error('Erro ao excluir: ' + error.message)
        }
    })

    // Resumo de aparas
    const { data: resumo, isLoading: loadingResumo } = useQuery<AparasResumo | null>({
        queryKey: ['aparas-resumo', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_aparas_resumo')
                .select('*')
                .eq('mes', mesSelecionado)
                .maybeSingle()

            if (error) throw error
            return data as AparasResumo | null
        },
    })

    // Kg produzido
    const { data: producao } = useQuery({
        queryKey: ['aparas-producao', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_producao_mensal')
                .select('kg_total_produzido')
                .eq('mes', mesSelecionado)
                .maybeSingle()

            if (error) throw error
            return (data as any)?.kg_total_produzido || 0
        },
    })

    // Aparas por material
    const { data: porMaterial } = useQuery<AparasMaterial[]>({
        queryKey: ['aparas-material', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_aparas_material')
                .select('*')
                .eq('mes', mesSelecionado)
                .order('kg_apara', { ascending: false })

            if (error) throw error
            return data as AparasMaterial[]
        },
    })

    // Top OPs
    const { data: topOPs } = useQuery<AparasTopOP[]>({
        queryKey: ['aparas-top-ops', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_aparas_top_ops')
                .select('*')
                .eq('mes', mesSelecionado)
                .order('kg_apara', { ascending: false })
                .limit(10)

            if (error) throw error
            return data as AparasTopOP[]
        },
    })

    // Operadores (Extrusão)
    const { data: operadores } = useQuery({
        queryKey: ['aparas-operadores', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_aparas_operadores_extrusao')
                .select('*')
                .eq('mes', mesSelecionado)
                .order('apara', { ascending: false })

            if (error) throw error
            return data
        },
    })

    // Meses disponíveis
    const { data: mesesDisponiveis } = useQuery({
        queryKey: ['aparas-meses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_meses_disponiveis')
                .select('mes')

            if (error) throw error
            return (data as any[])?.map(d => d.mes) || []
        },
    })

    // Indicadores de tempo por setor
    const { data: indicadoresTempo } = useQuery<IndicadorTempo[]>({
        queryKey: ['indicadores-tempo', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_indicadores_tempo')
                .select('*')
                .eq('mes_referencia', mesSelecionado)

            if (error) throw error
            return data as IndicadorTempo[]
        },
    })

    // Indicadores por operador
    const { data: indicadoresOperador } = useQuery({
        queryKey: ['indicadores-operador', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_indicadores_operador')
                .select('*')
                .eq('mes_referencia', mesSelecionado)
                .order('kg_por_hora', { ascending: false })

            if (error) throw error
            return data
        },
    })

    // Indicadores por máquina
    const { data: indicadoresMaquina } = useQuery({
        queryKey: ['indicadores-maquina', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_indicadores_maquina')
                .select('*')
                .eq('mes_referencia', mesSelecionado)
                .order('kg_por_hora', { ascending: false })

            if (error) throw error
            return data
        },
    })

    // Indicadores operador + máquina
    const { data: indicadoresOperadorMaquina } = useQuery({
        queryKey: ['indicadores-operador-maquina', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_indicadores_operador_maquina')
                .select('*')
                .eq('mes_referencia', mesSelecionado)
                .order('kg_por_hora_operador', { ascending: false })

            if (error) throw error
            return data
        },
    })

    // Lista de operadores
    const { data: listaOperadores } = useQuery({
        queryKey: ['lista-operadores'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('operadores')
                .select('id, nome, setor')
                .eq('ativo', true)
                .order('nome')

            if (error) throw error
            return data
        },
    })

    // Lista de máquinas
    const { data: listaMaquinas } = useQuery({
        queryKey: ['lista-maquinas'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('maquinas')
                .select('id, nome, setor')
                .eq('ativa', true)
                .order('nome')

            if (error) throw error
            return data
        },
    })

    // Mutation para salvar registro de horas
    const salvarHorasMutation = useMutation({
        mutationFn: async (dados: any) => {
            const { error } = await supabase.from('registro_horas_producao').insert({
                ...dados,
                mes_referencia: mesSelecionado,
            })
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Registro de horas salvo com sucesso!')
            queryClient.invalidateQueries({ queryKey: ['indicadores-tempo'] })
            queryClient.invalidateQueries({ queryKey: ['indicadores-operador'] })
            queryClient.invalidateQueries({ queryKey: ['indicadores-maquina'] })
            queryClient.invalidateQueries({ queryKey: ['indicadores-operador-maquina'] })
            queryClient.invalidateQueries({ queryKey: ['diario-producao'] })
        },
        onError: (error) => {
            toast.error('Erro ao salvar registro: ' + error.message)
        },
    })

    // Alertas inteligentes
    const { data: alertasInteligentes } = useQuery({
        queryKey: ['aparas-alertas', mesSelecionado],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_aparas_alertas')
                .select('*')
                .eq('mes', mesSelecionado)

            if (error) throw error
            return data
        },
    })

    return {
        diarioProducao,
        deleteRegistroMutation,
        resumo,
        loadingResumo,
        producao,
        porMaterial,
        topOPs,
        operadores,
        mesesDisponiveis,
        indicadoresTempo,
        indicadoresOperador,
        indicadoresMaquina,
        indicadoresOperadorMaquina,
        listaOperadores,
        listaMaquinas,
        salvarHorasMutation,
        alertasInteligentes,
    }
}
