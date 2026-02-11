import React from 'react'
import {
  Brain,
  ShieldAlert,
  LineChart,
  Users,
  Sparkles,
  Rocket
} from 'lucide-react'

export default function AboutView() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 space-y-16">

      {/* HEADER */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-[2.5rem] bg-blue-600 text-white flex items-center justify-center shadow-xl">
            <Brain size={36} />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          GNR1 Intelligence
        </h1>

        <p className="max-w-2xl mx-auto text-slate-500 font-medium">
          Inteligência organizacional focada em saúde mental, prevenção de riscos
          psicossociais e tomada de decisão estratégica.
        </p>
      </div>

      {/* SOBRE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800">Sobre a plataforma</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            A GNR1 nasce da necessidade de tornar visível o que normalmente é invisível
            dentro das organizações: o estado emocional, o estresse contínuo e os riscos
            psicossociais que afetam diretamente pessoas, equipes e resultados.
          </p>

          <p className="text-slate-600 leading-relaxed font-medium">
            Utilizando dados anônimos, análise comportamental e inteligência artificial,
            a plataforma transforma sinais subjetivos em indicadores claros para gestão.
          </p>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-4">
          <div className="flex items-center gap-4">
            <ShieldAlert className="text-rose-500" />
            <h3 className="font-black text-slate-800">Problema que resolvemos</h3>
          </div>

          <ul className="space-y-3 text-sm font-bold text-slate-600">
            <li>• Burnout silencioso e não detectado</li>
            <li>• Riscos psicossociais sem monitoramento</li>
            <li>• Decisões reativas em vez de preventivas</li>
            <li>• Falta de dados para gestão de saúde mental</li>
          </ul>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="space-y-10">
        <h2 className="text-2xl font-black text-center text-slate-800">
          Como a ideia funciona
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Users className="text-blue-600 mb-4" />
            <h4 className="font-black text-slate-800 mb-2">Coleta consciente</h4>
            <p className="text-sm text-slate-500 font-medium">
              Colaboradores registram humor, estresse e anotações de forma simples
              e segura.
            </p>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <LineChart className="text-emerald-600 mb-4" />
            <h4 className="font-black text-slate-800 mb-2">Análise inteligente</h4>
            <p className="text-sm text-slate-500 font-medium">
              A IA identifica padrões, tendências e pontos de atenção antes que
              se tornem crises.
            </p>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Sparkles className="text-purple-600 mb-4" />
            <h4 className="font-black text-slate-800 mb-2">Ação estratégica</h4>
            <p className="text-sm text-slate-500 font-medium">
              Relatórios claros, alertas críticos e recomendações práticas
              para gestores.
            </p>
          </div>
        </div>
      </section>

      {/* DIFERENCIAL */}
      <section className="bg-[#0f172a] text-white rounded-[3rem] p-12 space-y-6">
        <h2 className="text-2xl font-black text-center">
          O diferencial da GNR1
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold text-slate-200">
          <div>• Foco em prevenção, não apenas diagnóstico</div>
          <div>• Dados agregados e visão organizacional</div>
          <div>• Interface simples para decisões rápidas</div>
          <div>• IA aplicada à saúde mental no trabalho</div>
        </div>
      </section>

      {/* VISÃO FUTURA */}
      <section className="text-center space-y-4">
        <Rocket className="mx-auto text-blue-600" size={32} />
        <h2 className="text-2xl font-black text-slate-800">Visão</h2>
        <p className="max-w-2xl mx-auto text-slate-500 font-medium">
          Construir organizações mais humanas, conscientes e sustentáveis,
          onde dados emocionais são tratados com responsabilidade e propósito.
        </p>
      </section>

      {/* FOOTER */}
      <div className="text-center text-xs text-slate-400 font-bold">
        GNR1 Intelligence • Versão 1.0 • Projeto conceitual e estratégico
      </div>
    </div>
  )
}
