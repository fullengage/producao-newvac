import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { ProductionEntryForm } from './components/ProductionEntryForm'
import { ScrapRegisterForm } from './components/ScrapRegisterForm'
import { useAparas } from '@/hooks/useAparas'
import { AparasHeader } from './components/AparasHeader'
import { VisaoGeral } from './components/VisaoGeral'
import { Setores } from './components/Setores'
import { Operadores } from './components/OperadoresTab'
import { IndicadoresTempo } from './components/IndicadoresTempo'
import { AlertasOps } from './components/AlertasOps'

const META_APARA = 5.0
const CUSTO_KG_APARA = 8.50

const COLORS = {
  extrusao: '#ef4444',
  impressao: '#f97316',
  corte_solda: '#eab308',
  outros: '#64748b',
}

export function AparasPage() {
  const [activeTab, setActiveTab] = useState('visao-geral')
  const [mesSelecionado, setMesSelecionado] = useState('NOVEMBRO')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [formType, setFormType] = useState<'production' | 'scrap'>('production')

  const {
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
    alertasInteligentes,
  } = useAparas(mesSelecionado)

  const handleEdit = (record: any) => {
    setFormType('production')
    setEditingRecord(record)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setFormType('production')
    setEditingRecord(null)
    setDialogOpen(true)
  }

  const handleNewScrap = () => {
    setFormType('scrap')
    setEditingRecord(null)
    setDialogOpen(true)
  }

  if (loadingResumo) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calcular valores derivados
  const kgProduzido = producao || 0
  const kgApara = parseFloat(String(resumo?.kg_apara_total || '0'))
  const totalOPs = resumo?.total_ops || 0
  const kgExtrusao = parseFloat(String(resumo?.kg_extrusao || '0'))
  const kgImpressao = parseFloat(String(resumo?.kg_impressao || '0'))
  const kgCorteSolda = parseFloat(String(resumo?.kg_corte_solda || '0'))
  const kgAcerto = parseFloat(String(resumo?.kg_acerto || '0'))
  const percMedio = kgProduzido > 0 ? (kgApara / kgProduzido) * 100 : 0
  const prejuizoTotal = kgApara * CUSTO_KG_APARA
  const prejuizoAcimaMeta = (kgApara - (kgProduzido * META_APARA) / 100) * CUSTO_KG_APARA

  // Dados para gráficos
  const dadosSetor = [
    { setor: 'Extrusão', percentual: kgApara > 0 ? (kgExtrusao / kgApara) * 100 : 0, kg: kgExtrusao, cor: COLORS.extrusao },
    { setor: 'Impressão', percentual: kgApara > 0 ? (kgImpressao / kgApara) * 100 : 0, kg: kgImpressao, cor: COLORS.impressao },
    { setor: 'Corte e Solda', percentual: kgApara > 0 ? (kgCorteSolda / kgApara) * 100 : 0, kg: kgCorteSolda, cor: COLORS.corte_solda },
    { setor: 'Outros/Acerto', percentual: kgApara > 0 ? (kgAcerto / kgApara) * 100 : 0, kg: kgAcerto, cor: COLORS.outros },
  ]

  const dadosMaterial = porMaterial?.map((m: any) => ({
    material: m.material_nome,
    ops: m.ops,
    kgApara: parseFloat(String(m.kg_apara || '0')),
  })) || []

  const totaisIndicadores = indicadoresTempo?.reduce(
    (acc: any, item: any) => ({
      totalHomemHora: acc.totalHomemHora + (parseFloat(String(item.total_homem_hora || '0'))),
      totalMaquinaHora: acc.totalMaquinaHora + (parseFloat(String(item.total_maquina_hora || '0'))),
      totalKgProduzido: acc.totalKgProduzido + (parseFloat(String(item.total_kg_produzido || '0'))),
      totalHorasParada: acc.totalHorasParada + (parseFloat(String(item.total_horas_parada || '0'))),
    }),
    { totalHomemHora: 0, totalMaquinaHora: 0, totalKgProduzido: 0, totalHorasParada: 0 }
  ) || { totalHomemHora: 0, totalMaquinaHora: 0, totalKgProduzido: 0, totalHorasParada: 0 }

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'setores', label: 'Por Setor' },
    { id: 'operadores', label: 'Operadores' },
    { id: 'tempo', label: 'Indicadores de Tempo' },
    { id: 'alertas', label: 'Alertas & OPs' },
  ]

  return (
    <div className="space-y-6">
      <AparasHeader
        mesSelecionado={mesSelecionado}
        setMesSelecionado={setMesSelecionado}
        mesesDisponiveis={mesesDisponiveis}
        prejuizoTotal={prejuizoTotal}
        prejuizoAcimaMeta={prejuizoAcimaMeta}
        metaApara={META_APARA}
        onNewClick={handleNewScrap}
      />

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-red-600 shadow-md' : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'visao-geral' && (
        <VisaoGeral
          kgProduzido={kgProduzido}
          kgApara={kgApara}
          percMedio={percMedio}
          totalOPs={totalOPs}
          metaApara={META_APARA}
          custoKgApara={CUSTO_KG_APARA}
          dadosSetor={dadosSetor}
          dadosMaterial={dadosMaterial}
        />
      )}

      {activeTab === 'setores' && (
        <Setores
          dadosSetor={dadosSetor}
          custoKgApara={CUSTO_KG_APARA}
        />
      )}

      {activeTab === 'operadores' && (
        <Operadores operadores={operadores || []} />
      )}

      {activeTab === 'tempo' && (
        <IndicadoresTempo
          mesSelecionado={mesSelecionado}
          diarioProducao={diarioProducao || []}
          totaisIndicadores={totaisIndicadores}
          indicadoresOperador={indicadoresOperador || []}
          handleNew={handleNew}
          handleEdit={handleEdit}
          deleteMutation={deleteRegistroMutation}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Registrar {formType === 'production' ? 'Produção' : 'Apara'}</DialogTitle>
          </DialogHeader>
          {formType === 'production' ? (
            <ProductionEntryForm
              onSuccess={() => setDialogOpen(false)}
              initialData={editingRecord}
            />
          ) : (
            <ScrapRegisterForm
              onSuccess={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {activeTab === 'alertas' && (
        <AlertasOps
          alertasInteligentes={alertasInteligentes || []}
          topOPs={topOPs || []}
          percMedio={percMedio}
          metaApara={META_APARA}
          custoKgApara={CUSTO_KG_APARA}
          dadosSetor={dadosSetor}
        />
      )}

      <div className="text-center text-xs text-gray-500">
        <p>Módulo de Controle de Aparas - New Vac | Dados: {mesSelecionado}/2025</p>
        <p>Meta de Apara: {META_APARA}% | Custo por Kg: 8,50</p>
      </div>
    </div>
  )
}
