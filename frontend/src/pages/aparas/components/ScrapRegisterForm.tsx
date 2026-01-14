import { useState } from 'react'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Search, Save, AlertTriangle, ShieldCheck, Recycle, Factory } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
    op_id: z.string().min(1, 'Selecione uma OP'),
    op_numero: z.number(),
    data: z.string().min(1, 'Selecione a data'),
    impresso_liso: z.string().optional(),

    // Extrusão
    extrusao_extrusora: z.string().optional(),
    impressao_extrusora: z.string().optional(),
    corte_solda_extrusora: z.string().optional(),
    expedicao_extrusora: z.string().optional(),

    // Impressão
    impressao_impressora: z.string().optional(),
    corte_solda_impressora: z.string().optional(),
    expedicao_impressora: z.string().optional(),

    // Corte e Solda / Sacaria
    corte_solda_corte: z.string().optional(),
    corte_solda_sacaria: z.string().optional(),
    corte_solda_picote: z.string().optional(),
    expedicao_corte_solda: z.string().optional(),
    expedicao_sacaria: z.string().optional(),
    expedicao_picote: z.string().optional(),

    // Outros / Acerto / Produção Sacaria
    extrusao_sacaria: z.string().optional(),
    impressao_acerto: z.string().optional(),
    expedicao_acerto: z.string().optional(),
})

interface SelectedOP {
    id: string
    numero: number
    item: string
    cliente_nome?: string
    impresso_liso?: string
    materiais?: { nome: string }
}

export function ScrapRegisterForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<SelectedOP[]>([])
    const [selectedOP, setSelectedOP] = useState<SelectedOP | null>(null)
    const [searching, setSearching] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            data: new Date().toISOString().split('T')[0],
            impresso_liso: '',
            extrusao_extrusora: '',
            impressao_extrusora: '',
            corte_solda_extrusora: '',
            expedicao_extrusora: '',
            impressao_impressora: '',
            corte_solda_impressora: '',
            expedicao_impressora: '',
            corte_solda_corte: '',
            corte_solda_sacaria: '',
            corte_solda_picote: '',
            expedicao_corte_solda: '',
            expedicao_sacaria: '',
            expedicao_picote: '',
            extrusao_sacaria: '',
            impressao_acerto: '',
            expedicao_acerto: '',
        }
    })

    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (term.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            let query = supabase
                .from('ordens_producao')
                .select(`
          id,
          numero,
          item,
          impresso_liso,
          quantidade_programada,
          status,
          materiais(nome)
        `)
                .limit(10)

            if (!isNaN(parseInt(term))) {
                query = query.eq('numero', parseInt(term))
            } else {
                query = query.ilike('item', `%${term}%`)
            }

            const { data, error } = await query
            if (error) throw error
            setSearchResults(data || [])
        } catch (error) {
            console.error(error)
            toast.error('Erro ao buscar OPs')
        } finally {
            setSearching(false)
        }
    }

    const selectOP = async (op: any) => {
        setSelectedOP(op)
        form.setValue('op_id', op.id)
        form.setValue('op_numero', op.numero)
        form.setValue('impresso_liso', op.impresso_liso || '')
        setSearchResults([])
        setSearchTerm(`${op.numero} - ${op.item}`)

        // Buscar nome do cliente na tabela de pedidos se não estiver disponível
        try {
            const { data: pedidoData } = await supabase
                .from('pedidos')
                .select('cliente_nome')
                .eq('numero_op', op.numero)
                .maybeSingle()

            if (pedidoData?.cliente_nome) {
                setSelectedOP((prev: any) => ({ ...prev, cliente_nome: pedidoData.cliente_nome }))
            }
        } catch (error) {
            console.error('Erro ao buscar cliente:', error)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedOP) {
            toast.error('Nenhuma OP selecionada')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            const payload = {
                ordem_producao_id: values.op_id,
                op_numero: values.op_numero,
                mes: values.data,
                cliente_nome: selectedOP.cliente_nome || 'N/D',
                produto: selectedOP.item,
                material_nome: selectedOP.materiais?.nome || 'N/D',
                impresso_liso: values.impresso_liso || selectedOP.impresso_liso || 'N/D',
                registrado_por: userData.user?.id,

                // Conversão de valores
                extrusao_extrusora: parseFloat(values.extrusao_extrusora || '0'),
                extrusao_sacaria: parseFloat(values.extrusao_sacaria || '0'),
                impressao_extrusora: parseFloat(values.impressao_extrusora || '0'),
                impressao_impressora: parseFloat(values.impressao_impressora || '0'),
                impressao_acerto: parseFloat(values.impressao_acerto || '0'),
                corte_solda_extrusora: parseFloat(values.corte_solda_extrusora || '0'),
                corte_solda_impressora: parseFloat(values.corte_solda_impressora || '0'),
                corte_solda_corte: parseFloat(values.corte_solda_corte || '0'),
                corte_solda_sacaria: parseFloat(values.corte_solda_sacaria || '0'),
                corte_solda_picote: parseFloat(values.corte_solda_picote || '0'),
                expedicao_extrusora: parseFloat(values.expedicao_extrusora || '0'),
                expedicao_impressora: parseFloat(values.expedicao_impressora || '0'),
                expedicao_corte_solda: parseFloat(values.expedicao_corte_solda || '0'),
                expedicao_sacaria: parseFloat(values.expedicao_sacaria || '0'),
                expedicao_picote: parseFloat(values.expedicao_picote || '0'),
                expedicao_acerto: parseFloat(values.expedicao_acerto || '0'),
            }

            const { error } = await supabase.from('aparas').insert(payload as any)
            if (error) throw error

            toast.success('Registro de apara salvo com sucesso!')
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full shadow-none border-none">
            <CardHeader className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Registro de Aparas
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="mb-6 relative">
                    <Label>Buscar Ordem de Produção (OP)</Label>
                    <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <Input
                                placeholder="Digite o número da OP ou nome do produto..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    {searching && <p className="text-xs text-slate-500 mt-1">Buscando...</p>}

                    {searchResults.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border rounded-md shadow-xl mt-1 max-h-60 overflow-auto">
                            {searchResults.map((op) => (
                                <div
                                    key={op.id}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                    onClick={() => selectOP(op)}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-red-600 uppercase text-xs tracking-wider">OP #{op.numero}</span>
                                        <Badge variant="outline" className="text-[10px]">{op.status}</Badge>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">{op.item}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedOP && (
                    <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-red-900 text-sm">OP #{selectedOP.numero} Selecionada</h3>
                            <p className="text-xs text-red-700">{selectedOP.item}</p>
                            {selectedOP.cliente_nome && (
                                <p className="text-[10px] text-red-600 font-bold mt-1 uppercase tracking-wider">Cliente: {selectedOP.cliente_nome}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-red-600">{selectedOP.materiais?.nome}</Badge>
                            <Badge variant="outline" className="border-red-200 text-red-700">{selectedOP.impresso_liso}</Badge>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="data"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data do Registro</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="impresso_liso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Impressa / Lisa</FormLabel>
                                        <FormControl>
                                            <select
                                                {...field}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="IMPRESSA">IMPRESSA</option>
                                                <option value="LISA">LISA</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Tabs defaultValue="extrusao" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-red-50 p-1 border border-red-100 rounded-xl">
                                <TabsTrigger value="extrusao" className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                    <Factory className="w-3 h-3 mr-2" /> Extrusão
                                </TabsTrigger>
                                <TabsTrigger value="impressao" className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                    <Recycle className="w-3 h-3 mr-2" /> Impressão
                                </TabsTrigger>
                                <TabsTrigger value="corte-solda" className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                    <ShieldCheck className="w-3 h-3 mr-2" /> Corte e Solda
                                </TabsTrigger>
                                <TabsTrigger value="outros" className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                                    <Recycle className="w-3 h-3 mr-2" /> Outros / Acerto
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="extrusao" className="space-y-4 pt-4">
                                <AlertTriangle className="w-4 h-4 text-red-600 inline mr-2" />
                                <span className="text-sm font-bold text-red-900">Total de aparas geradas na máquina Extrusora</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormField control={form.control} name="extrusao_extrusora" render={({ field }) => (
                                        <FormItem><FormLabel>Saída Prod. (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="impressao_extrusora" render={({ field }) => (
                                        <FormItem><FormLabel>Apara Proc. (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="corte_solda_extrusora" render={({ field }) => (
                                        <FormItem><FormLabel>Refugo Qual. (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="expedicao_extrusora" render={({ field }) => (
                                        <FormItem><FormLabel>Apara Limpa (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                </div>
                            </TabsContent>

                            <TabsContent value="impressao" className="space-y-4 pt-4">
                                <AlertTriangle className="w-4 h-4 text-orange-600 inline mr-2" />
                                <span className="text-sm font-bold text-orange-900">Total de aparas geradas na máquina Impressora</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="impressao_impressora" render={({ field }) => (
                                        <FormItem><FormLabel>Apara Processo (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="corte_solda_impressora" render={({ field }) => (
                                        <FormItem><FormLabel>Refugo Qual. (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="expedicao_impressora" render={({ field }) => (
                                        <FormItem><FormLabel>Apara Limpa (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                </div>
                            </TabsContent>

                            <TabsContent value="corte-solda" className="space-y-4 pt-4">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 inline mr-2" />
                                <span className="text-sm font-bold text-yellow-900">Aparas de Corte e Solda / Sacaria / Picote</span>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <FormField control={form.control} name="corte_solda_corte" render={({ field }) => (
                                        <FormItem><FormLabel>Corte/Sol (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="corte_solda_sacaria" render={({ field }) => (
                                        <FormItem><FormLabel>Sacaria (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="corte_solda_picote" render={({ field }) => (
                                        <FormItem><FormLabel>Picote (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="expedicao_corte_solda" render={({ field }) => (
                                        <FormItem><FormLabel>CS Limpa (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="expedicao_sacaria" render={({ field }) => (
                                        <FormItem><FormLabel>Sac. Limpa (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                </div>
                            </TabsContent>

                            <TabsContent value="outros" className="space-y-4 pt-4">
                                <AlertTriangle className="w-4 h-4 text-slate-600 inline mr-2" />
                                <span className="text-sm font-bold text-slate-900">Outros tipos de aparas e acertos de máquina</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormField control={form.control} name="extrusao_sacaria" render={({ field }) => (
                                        <FormItem><FormLabel>Produção Sacaria (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="impressao_acerto" render={({ field }) => (
                                        <FormItem><FormLabel>Acerto Proc. (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="expedicao_acerto" render={({ field }) => (
                                        <FormItem><FormLabel>Acerto Limpo (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="expedicao_picote" render={({ field }) => (
                                        <FormItem><FormLabel>Picote Limpo (kg)</FormLabel><Input type="number" step="0.1" {...field} /></FormItem>
                                    )} />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                            <Button type="submit" disabled={loading || !selectedOP} className="bg-red-600 hover:bg-red-700 h-11 px-8">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                Salvar Registros
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
