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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Search, Save, Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

// Schema de validação
const formSchema = z.object({
  // Busca
  op_id: z.string().min(1, 'Selecione uma OP'),
  op_numero: z.number(),
  cliente_nome: z.string().optional(),
  
  // Aparas
  apara_extrusao: z.string().optional(),
  apara_impressao: z.string().optional(),
  apara_corte_solda: z.string().optional(),
  
  // Horários Máquina
  maquina_id: z.string().optional(),
  data_registro: z.string().optional(),
  kg_produzido: z.string().optional(),
  metros_produzido: z.string().optional(),
  hora_inicio_maquina: z.string().optional(),
  hora_fim_maquina: z.string().optional(),
  motivo_parada: z.string().optional(),
  horas_parada: z.string().optional(),
  
  // Horários Operador
  operador_id: z.string().optional(),
  hora_entrada_operador: z.string().optional(),
  hora_saida_operador: z.string().optional(),
  
  // Kanban
  novo_status: z.string().optional(),
})

export function ProductionEntryForm({ onSuccess, initialData }: { onSuccess?: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedOP, setSelectedOP] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  
  // Listas para selects
  const [maquinas, setMaquinas] = useState<any[]>([])
  const [operadores, setOperadores] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apara_extrusao: '',
      apara_impressao: '',
      apara_corte_solda: '',
      kg_produzido: '',
      metros_produzido: '',
      data_registro: new Date().toISOString().split('T')[0],
      hora_inicio_maquina: '',
      hora_fim_maquina: '',
      horas_parada: '',
      motivo_parada: '',
      hora_entrada_operador: '',
      hora_saida_operador: '',
      novo_status: '',
    }
  })

  // Helper para obter mês de referência da data
  const getMesReferencia = (data: string) => {
    if (!data) return new Date().toLocaleString('default', { month: 'long' }).toUpperCase()
    // Ajusta fuso horário
    const [year, month] = data.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('default', { month: 'long' }).toUpperCase()
  }

  // Load initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      // Pre-fill form with initial data
      const op = {
        id: initialData.ordem_producao_id,
        numero: initialData.op_numero,
        item: initialData.op?.item, // Assuming join
        status: initialData.op?.status || 'EXTRUSAO', // Fallback
      }
      setSelectedOP(op)
      setSearchTerm(`${op.numero} - ${op.item}`)
      
      form.reset({
        op_id: op.id,
        op_numero: op.numero,
        maquina_id: initialData.maquina_id,
        kg_produzido: String(initialData.kg_produzido || ''),
        metros_produzido: String(initialData.metros_produzido || ''),
        operador_id: initialData.operador_id,
        hora_inicio_maquina: initialData.hora_inicio ? initialData.hora_inicio.slice(0, 5) : '',
        hora_fim_maquina: initialData.hora_fim ? initialData.hora_fim.slice(0, 5) : '',
        hora_entrada_operador: initialData.hora_inicio ? initialData.hora_inicio.slice(0, 5) : '', // Assuming same logic for now
        hora_saida_operador: initialData.hora_fim ? initialData.hora_fim.slice(0, 5) : '',
        horas_parada: String(initialData.horas_parada || ''),
        motivo_parada: initialData.motivo_parada || '',
        novo_status: op.status,
        apara_extrusao: '', // Editing usually doesn't bring back scrap data yet as it's separate table
        apara_impressao: '',
        apara_corte_solda: '',
      })
    }
  }, [initialData, form])

  // Auto-calculate hours
  const watchOperadorEntrada = form.watch('hora_entrada_operador')
  const watchOperadorSaida = form.watch('hora_saida_operador')
  const watchMaquinaInicio = form.watch('hora_inicio_maquina')
  const watchMaquinaFim = form.watch('hora_fim_maquina')

  const calcularHoras = (inicio: string | undefined, fim: string | undefined) => {
    if (!inicio || !fim) return 0
    const dInicio = new Date(`1970-01-01T${inicio}`)
    const dFim = new Date(`1970-01-01T${fim}`)
    let diff = (dFim.getTime() - dInicio.getTime()) / (1000 * 60 * 60)
    if (diff < 0) diff += 24 // Handle overnight
    return diff
  }

  const horasTrabalhadas = calcularHoras(watchOperadorEntrada, watchOperadorSaida)
  const horasMaquina = calcularHoras(watchMaquinaInicio, watchMaquinaFim)

  // Carregar listas auxiliares
  useEffect(() => {
    const loadAuxData = async () => {
      const { data: mData } = await supabase.from('maquinas').select('*').eq('ativa', true).order('nome')
      if (mData) setMaquinas(mData)
      
      const { data: oData } = await supabase.from('operadores').select('*').eq('ativo', true).order('nome')
      if (oData) setOperadores(oData)
    }
    loadAuxData()
  }, [])

  // Busca de OPs
  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      // Tenta buscar por número da OP primeiro
      let query = supabase
        .from('ordens_producao')
        .select(`
          id,
          numero,
          item,
          quantidade_programada,
          status,
          material:materiais(nome)
        `)
        .limit(10)

      if (!isNaN(parseInt(term))) {
        query = query.eq('numero', parseInt(term))
      } else {
        // Se não for número, busca por item (produto)
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

  const selectOP = (op: any) => {
    setSelectedOP(op)
    form.setValue('op_id', op.id)
    form.setValue('op_numero', op.numero)
    form.setValue('novo_status', op.status)
    setSearchResults([])
    setSearchTerm(`${op.numero} - ${op.item}`)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedOP) {
      toast.error('Selecione uma OP primeiro')
      return
    }

    setLoading(true)
    try {
      // Validation
      const kgProd = parseFloat(values.kg_produzido || '0')
      const kgAparaExt = parseFloat(values.apara_extrusao || '0')
      const kgAparaImp = parseFloat(values.apara_impressao || '0')
      const kgAparaCorte = parseFloat(values.apara_corte_solda || '0')
      const totalApara = kgAparaExt + kgAparaImp + kgAparaCorte

      if (kgProd > 0 && totalApara > kgProd) {
        const confirm = window.confirm(`Atenção: O total de apara (${totalApara}kg) é maior que a produção (${kgProd}kg). Deseja continuar?`)
        if (!confirm) {
          setLoading(false)
          return
        }
      }

      // 1. Salvar Aparas (se houver)
      if (totalApara > 0) {
        // Verificar se já existe registro de apara para esta OP no mês atual
        // Para simplificar, vamos fazer um insert/update na tabela aparas
        // Nota: A tabela aparas tem muitas colunas específicas. Vamos focar nas principais solicitadas.
        
        const aparaData: any = {
          ordem_producao_id: values.op_id,
          op_numero: values.op_numero,
          mes: values.data_registro || new Date().toISOString().split('T')[0], // Usa data do registro
          // Mapeando para colunas específicas conforme schema (assumindo principal coluna de cada setor)
          extrusao_extrusora: parseFloat(values.apara_extrusao || '0'),
          impressao_impressora: parseFloat(values.apara_impressao || '0'),
          corte_solda_corte: parseFloat(values.apara_corte_solda || '0'),
        }

        const { error: aparaError } = await supabase
          .from('aparas')
          .insert(aparaData)
        
        if (aparaError) throw aparaError
      }

      // 2. Salvar Horários (Registro Unificado)
      if (values.hora_inicio_maquina || values.hora_entrada_operador) {
        // Calcular horas trabalhadas
        let horasTrab = 0
        let horasMaq = 0
        
        if (values.hora_entrada_operador && values.hora_saida_operador) {
          const inicio = new Date(`1970-01-01T${values.hora_entrada_operador}`)
          const fim = new Date(`1970-01-01T${values.hora_saida_operador}`)
          horasTrab = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
        }

        if (values.hora_inicio_maquina && values.hora_fim_maquina) {
          const inicio = new Date(`1970-01-01T${values.hora_inicio_maquina}`)
          const fim = new Date(`1970-01-01T${values.hora_fim_maquina}`)
          horasMaq = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
        }
        
        // Prepare record with explicit any to avoid TS error with generated types
        const registroData: any = {
            ordem_producao_id: values.op_id,
            op_numero: values.op_numero,
            operador_id: values.operador_id || null,
            // Precisamos buscar o nome do operador se tiver ID
            operador_nome: operadores.find(o => o.id === values.operador_id)?.nome || 'Não informado',
            maquina_id: values.maquina_id || null,
            maquina_nome: maquinas.find(m => m.id === values.maquina_id)?.nome || null,
            setor: selectedOP.status === 'EXTRUSAO' ? 'EXTRUSAO' : 
                   selectedOP.status === 'IMPRESSAO' ? 'IMPRESSAO' : 
                   selectedOP.status === 'CORTE_SOLDA' ? 'CORTE_SOLDA' : 'EXTRUSAO', // Fallback
            mes_referencia: getMesReferencia(values.data_registro || ''),
            data_registro: values.data_registro || new Date().toISOString().split('T')[0],
            horas_trabalhadas: horasTrab > 0 ? horasTrab : 0,
            horas_maquina: horasMaq > 0 ? horasMaq : 0,
            kg_produzido: parseFloat(values.kg_produzido || '0'),
            metros_produzido: parseFloat(values.metros_produzido || '0'),
            horas_parada: parseFloat(values.horas_parada || '0'),
            motivo_parada: values.motivo_parada,
        }

        const { error: horasError } = await supabase
          .from('registro_horas_producao')
          .insert(registroData)

        if (horasError) throw horasError
      }

      // 3. Atualizar Kanban (Status da OP)
      if (values.novo_status && values.novo_status !== selectedOP.status) {
        const { error: statusError } = await supabase
          .from('ordens_producao')
          .update({ status: values.novo_status })
          .eq('id', values.op_id) as any

        if (statusError) throw statusError
      }

      toast.success('Registros salvos com sucesso!')
      form.reset()
      setSelectedOP(null)
      setSearchTerm('')
      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao salvar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2">
          <Save className="w-6 h-6" />
          Apontamento de Produção Unificado
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 relative">
          <div className="flex gap-2">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder="Buscar OP por número ou produto..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {searching && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}
          
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
              {searchResults.map((op) => (
                <div
                  key={op.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                  onClick={() => selectOP(op)}
                >
                  <div className="flex justify-between">
                    <span className="font-bold text-blue-600">OP #{op.numero}</span>
                    <Badge variant="outline">{op.status}</Badge>
                  </div>
                  <p className="text-sm font-medium">{op.item}</p>
                  <p className="text-xs text-gray-500">
                    {op.cliente?.cliente_nome || 'Consumidor Final'} • {op.quantidade_programada}kg
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedOP && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
            <h3 className="font-bold text-blue-800">OP #{selectedOP.numero} Selecionada</h3>
            <p className="text-sm text-blue-600">Produto: {selectedOP.item}</p>
            <p className="text-sm text-blue-600">Material: {selectedOP.material?.nome}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="aparas" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aparas" className="flex gap-2">
                  <AlertTriangle className="w-4 h-4" /> Aparas
                </TabsTrigger>
                <TabsTrigger value="horarios" className="flex gap-2">
                  <Clock className="w-4 h-4" /> Horários
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> Kanban
                </TabsTrigger>
              </TabsList>

              {/* ABA APARAS */}
              <TabsContent value="aparas" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="apara_extrusao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apara Extrusão (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apara_impressao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apara Impressão (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apara_corte_solda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apara Corte e Solda (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* ABA HORÁRIOS */}
              <TabsContent value="horarios" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 border-b pb-2">Horários da Máquina</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_registro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Apontamento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="maquina_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máquina</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {maquinas.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hora_inicio_maquina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início (hh:mm)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hora_fim_maquina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fim (hh:mm)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="kg_produzido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produção (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="metros_produzido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produção (metros)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {horasMaquina > 0 && (
                     <div className="text-right text-sm text-green-600 font-bold">
                        Total Horas Máquina: {horasMaquina.toFixed(2)}h
                     </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="horas_parada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo Parada (horas)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motivo_parada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo da Parada</FormLabel>
                          <FormControl>
                            <Input placeholder="Descreva o motivo..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 border-b pb-2">Horários do Operador</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="operador_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operador</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {operadores.map((op) => (
                                <SelectItem key={op.id} value={op.id}>{op.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hora_entrada_operador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entrada (hh:mm)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hora_saida_operador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saída (hh:mm)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   {horasTrabalhadas > 0 && (
                     <div className="text-right text-sm text-blue-600 font-bold">
                        Total Horas Operador: {horasTrabalhadas.toFixed(2)}h
                     </div>
                  )}
                </div>
              </TabsContent>

              {/* ABA KANBAN */}
              <TabsContent value="kanban" className="space-y-4 pt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Atualizar Status da Produção</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Isso moverá o cartão da OP no quadro Kanban automaticamente.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="novo_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Atual</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AGUARDANDO">Aguardando Início</SelectItem>
                            <SelectItem value="EXTRUSAO">Extrusão</SelectItem>
                            <SelectItem value="IMPRESSAO">Impressão</SelectItem>
                            <SelectItem value="CORTE_SOLDA">Corte e Solda</SelectItem>
                            <SelectItem value="EXPEDIDO">Expedição</SelectItem>
                            <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-6 border-t">
              <Button type="submit" disabled={loading || !selectedOP} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Apontamento
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
