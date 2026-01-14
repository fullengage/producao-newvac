import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Search, Save, Calculator, Package, Ruler, Hash, User, Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

// Define types for better safety
interface KanbanOP {
    id: number | string
    numero_op?: number
    numero_pedido?: number
    item: string
    cliente_nome?: string
    quantidade?: string | number
    estagio_producao?: string
}

interface Operador {
    id: string
    nome: string
}

interface Maquina {
    id: string
    nome: string
}

// Schema de validação
const formSchema = z.object({
    op_id: z.string().min(1, 'Selecione uma OP'),
    operador_id: z.string().min(1, 'Selecione o operador'),
    maquina_id: z.string().min(1, 'Selecione a máquina'),
    largura_nominal: z.string().default('0'),
    espessura: z.string().default('0'),
    gpm: z.string().default('0'),
    metros: z.string().default('0'),
    bobinas: z.string().default('0'),
    observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ExtrusionForm() {
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<KanbanOP[]>([])
    const [selectedOP, setSelectedOP] = useState<KanbanOP | null>(null)
    const [searching, setSearching] = useState(false)
    const [operadores, setOperadores] = useState<Operador[]>([])
    const [maquinas, setMaquinas] = useState<Maquina[]>([])

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [opsRes, maqRes] = await Promise.all([
                    supabase.from('operadores').select('id, nome').order('nome'),
                    supabase.from('maquinas').select('id, nome').eq('setor', 'EXTRUSAO').order('nome')
                ])
                if (opsRes.data) setOperadores(opsRes.data)
                if (maqRes.data) setMaquinas(maqRes.data)
            } catch (error) {
                console.error('Erro ao buscar dados iniciais:', error)
            }
        }
        fetchInitialData()
    }, [])

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            op_id: '',
            operador_id: '',
            maquina_id: '',
            largura_nominal: '0',
            espessura: '0',
            gpm: '0',
            metros: '0',
            bobinas: '0',
            observacoes: '',
        }
    })

    // Watch fields for automatic calculation
    const watchGpm = form.watch('gpm')
    const watchMetros = form.watch('metros')
    const watchBobinas = form.watch('bobinas')

    const [calcs, setCalcs] = useState({
        pesoTotal: 0,
        pesoBobina: 0
    })

    useEffect(() => {
        const gpm = parseFloat(watchGpm) || 0
        const metros = parseFloat(watchMetros) || 0
        const bobinas = parseInt(watchBobinas) || 0

        const pesoTotal = (gpm * metros) / 1000
        const pesoBobina = bobinas > 0 ? pesoTotal / bobinas : 0

        setCalcs({ pesoTotal, pesoBobina })
    }, [watchGpm, watchMetros, watchBobinas])

    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (term.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            let query = supabase.from('vw_kanban_producao').select('*')

            const num = parseInt(term)
            if (!isNaN(num) && term.length > 0) {
                query = query.or(`numero_op.eq.${num},numero_pedido.eq.${num},item.ilike.%${term}%`)
            } else {
                query = query.ilike('item', `%${term}%`)
            }

            const { data, error } = await query.limit(10)
            if (error) throw error
            setSearchResults(data as KanbanOP[] || [])
        } catch (error) {
            console.error(error)
            toast.error('Erro ao buscar OPs')
        } finally {
            setSearching(false)
        }
    }

    const selectOP = (op: KanbanOP) => {
        setSelectedOP(op)
        form.setValue('op_id', String(op.id))
        setSearchResults([])
        setSearchTerm(`${op.numero_op || op.numero_pedido} - ${op.item}`)
    }

    const onSubmit = async (values: FormValues) => {
        if (!selectedOP) return

        setLoading(true)
        try {
            if (calcs.pesoTotal <= 0) {
                toast.error('Peso total deve ser maior que zero')
                setLoading(false)
                return
            }

            const payload = {
                ordem_producao_id: parseInt(values.op_id),
                op_numero: String(selectedOP.numero_op || selectedOP.numero_pedido),
                produto_nome: selectedOP.item,
                operador_id: values.operador_id,
                maquina_id: values.maquina_id,
                largura_nominal: parseFloat(values.largura_nominal) || 0,
                espessura: parseFloat(values.espessura) || 0,
                gramatura_linear: parseFloat(values.gpm) || 0,
                metros_totais: parseFloat(values.metros) || 0,
                quantidade_bobinas: parseInt(values.bobinas) || 0,
                peso_total: calcs.pesoTotal,
                peso_medio_bobina: calcs.pesoBobina,
                observacoes: values.observacoes,
                data_registro: new Date().toISOString()
            }

            console.log('Sending payload:', payload)

            const { error } = await supabase
                .from('producao_extrusao')
                .insert([payload])

            if (error) {
                console.error('Erro Supabase Insert:', error)
                throw error
            }

            toast.success('Apontamento de extrusão salvo com sucesso!')
            form.reset()
            setSelectedOP(null)
            setSearchTerm('')
        } catch (error: any) {
            console.error('Erro completo ao salvar:', error)
            toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto p-4"
        >
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-t-xl py-6">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <Calculator className="w-8 h-8" />
                        </div>
                        Ordem de Produção – Extrusão
                    </CardTitle>
                    <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 text-sm font-medium">
                        <p className="flex items-center gap-2">
                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Dica</span>
                            Para calcular, preencha os campos de <strong>Gramatura</strong> e <strong>Metros Totais</strong>.
                        </p>
                        <p className="mt-1 text-white/70 text-xs italic">Exemplo: 48g/mt × 5250mt = 252kg (Peso Total)</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {/* Busca de OPs */}
                    <div className="mb-8 relative">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Localizar OP</label>
                            <div className="relative group">
                                {searching ? (
                                    <Loader2 className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                )}
                                <Input
                                    placeholder="Número da OP ou nome do produto..."
                                    className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-2 max-h-72 overflow-auto"
                                >
                                    {searchResults.map((op) => (
                                        <div
                                            key={op.id}
                                            className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                                            onClick={() => selectOP(op)}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-blue-700 text-lg">OP #{op.numero_op || op.numero_pedido}</span>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{op.estagio_producao}</Badge>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-900">{op.item}</p>
                                            <p className="text-xs text-gray-500 mt-1 capitalize">
                                                {op.cliente_nome?.toLowerCase()} • {op.quantidade}
                                            </p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {selectedOP && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-indigo-50/50 p-6 rounded-2xl mb-8 border border-indigo-100/50 backdrop-blur-sm"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-600 p-2 rounded-xl text-white">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-900 text-lg">OP #{selectedOP.numero_op || selectedOP.numero_pedido} Selecionada</h3>
                                    <p className="text-sm text-indigo-700/80 font-medium">Produto: {selectedOP.item}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Seleção de Operador e Máquina */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField
                                    control={form.control}
                                    name="operador_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-gray-700 font-bold">
                                                <User className="w-4 h-4 text-blue-600" />
                                                Operador
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-white border-gray-200">
                                                        <SelectValue placeholder="Selecione o operador" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {operadores.map((op) => (
                                                        <SelectItem key={op.id} value={op.id}>
                                                            {op.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maquina_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-gray-700 font-bold">
                                                <Cpu className="w-4 h-4 text-blue-600" />
                                                Máquina
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-white border-gray-200">
                                                        <SelectValue placeholder="Selecione a máquina" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {maquinas.map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Campos de Medida */}
                                <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">
                                        <Ruler className="w-4 h-4 text-slate-500" />
                                        Parâmetros Nominais
                                    </h4>

                                    <FormField
                                        control={form.control}
                                        name="largura_nominal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-600 font-medium">Largura Nominal (mm)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" className="bg-white" placeholder="Ex: 500" {...field} />
                                                </FormControl>
                                                <FormDescription>Largura total do filme em milímetros</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="espessura"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-600 font-medium">Espessura (mm)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.001" className="bg-white" placeholder="Ex: 0.060" {...field} />
                                                </FormControl>
                                                <FormDescription>Espessura do filme em milímetros (micras)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Campos de Produção */}
                                <div className="space-y-6 bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
                                    <h4 className="flex items-center gap-2 font-bold text-blue-800 text-sm uppercase tracking-wider mb-4">
                                        <Hash className="w-4 h-4 text-blue-500" />
                                        Dados de Produção
                                    </h4>

                                    <FormField
                                        control={form.control}
                                        name="gpm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-blue-900 font-semibold">Gramatura Linear (g/metro)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Ex: 48.00"
                                                        className="bg-white border-blue-200 text-blue-900 font-bold focus:ring-blue-500"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-blue-700/60">Peso de 1 metro de material em gramas</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="metros"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-blue-900 font-semibold">Metros Totais</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Ex: 5250"
                                                        className="bg-white border-blue-200 text-blue-900 font-bold focus:ring-blue-500"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-blue-700/60">Soma da metragem de todas as bobinas</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="bobinas"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-blue-900 font-semibold">Quantidade de Bobinas</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Ex: 10"
                                                        className="bg-white border-blue-200 text-blue-900 font-bold focus:ring-blue-500"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-blue-700/60">Número total de bobinas produzidas</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Resultados Automáticos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-200"
                                >
                                    <p className="text-indigo-100 text-sm font-medium uppercase tracking-widest mb-1">Peso Total (Kg)</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-extrabold tracking-tighter">{calcs.pesoTotal.toFixed(2)}</h2>
                                        <span className="text-indigo-200 font-bold">kg</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200"
                                >
                                    <p className="text-emerald-50 text-sm font-medium uppercase tracking-widest mb-1">Média por Bobina</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-extrabold tracking-tighter">{calcs.pesoBobina.toFixed(2)}</h2>
                                        <span className="text-emerald-100 font-bold">kg</span>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-end gap-4 pt-10 border-t border-gray-100">
                                <Button
                                    type="submit"
                                    disabled={loading || !selectedOP}
                                    className="h-14 px-10 text-lg font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-6 w-6" />
                                    )}
                                    Salvar Produção
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </motion.div>
    )
}
