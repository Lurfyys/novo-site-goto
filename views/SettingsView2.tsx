import React, { useState, useEffect } from 'react'
import {
  Moon, Sun, Monitor, Shield, Bell, Info, Activity,
  Check, Palette, RefreshCw, Globe, Type, Zap
} from 'lucide-react'

interface SettingsView2Props {
  isDark: boolean
  onToggleDark: () => void
}

// ─── Temas disponíveis ────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'light',
    label: 'Claro',
    icon: <Sun size={18} />,
    preview: 'bg-white border-slate-200',
    dot: 'bg-slate-200',
    css: `
      .gnr1-dark { display: none !important; }
    `
  },
  {
    id: 'dark',
    label: 'Escuro',
    icon: <Moon size={18} />,
    preview: 'bg-slate-900 border-slate-700',
    dot: 'bg-slate-700',
    css: null // controlado pelo App.tsx
  },
  {
    id: 'midnight',
    label: 'Meia-noite',
    icon: <Zap size={18} />,
    preview: 'bg-[#0d1117] border-blue-900',
    dot: 'bg-blue-900',
    css: `
      .gnr1-midnight body, .gnr1-midnight #root, .gnr1-midnight .min-h-screen {
        background-color: #0d1117 !important; color: #c9d1d9 !important;
      }
      .gnr1-midnight .bg-white { background-color: #161b22 !important; }
      .gnr1-midnight .bg-slate-50 { background-color: #0d1117 !important; }
      .gnr1-midnight .bg-slate-100 { background-color: #161b22 !important; }
      .gnr1-midnight .text-slate-900 { color: #e6edf3 !important; }
      .gnr1-midnight .text-slate-800 { color: #c9d1d9 !important; }
      .gnr1-midnight .text-slate-700 { color: #8b949e !important; }
      .gnr1-midnight .text-slate-600 { color: #8b949e !important; }
      .gnr1-midnight .text-slate-500 { color: #6e7681 !important; }
      .gnr1-midnight .text-slate-400 { color: #484f58 !important; }
      .gnr1-midnight .border-slate-100 { border-color: #30363d !important; }
      .gnr1-midnight .border-slate-200 { border-color: #30363d !important; }
      .gnr1-midnight .border-slate-50  { border-color: #161b22 !important; }
      .gnr1-midnight .border-r { border-color: #21262d !important; }
      .gnr1-midnight .hover\\:bg-slate-50:hover { background-color: #1c2128 !important; }
      .gnr1-midnight input, .gnr1-midnight textarea, .gnr1-midnight select {
        background-color: #0d1117 !important; border-color: #30363d !important; color: #c9d1d9 !important;
      }
      .gnr1-midnight .bg-blue-600 { background-color: #1f6feb !important; }
    `
  },
  {
    id: 'sepia',
    label: 'Sépia',
    icon: <Palette size={18} />,
    preview: 'bg-[#f5f0e8] border-[#d4c5a9]',
    dot: 'bg-[#d4c5a9]',
    css: `
      .gnr1-sepia body, .gnr1-sepia #root, .gnr1-sepia .min-h-screen {
        background-color: #f5f0e8 !important; color: #3d2b1f !important;
      }
      .gnr1-sepia .bg-white { background-color: #faf7f2 !important; }
      .gnr1-sepia .bg-slate-50 { background-color: #f0ebe0 !important; }
      .gnr1-sepia .bg-slate-100 { background-color: #e8e0d0 !important; }
      .gnr1-sepia .text-slate-900 { color: #2c1810 !important; }
      .gnr1-sepia .text-slate-800 { color: #3d2b1f !important; }
      .gnr1-sepia .text-slate-700 { color: #5c4033 !important; }
      .gnr1-sepia .text-slate-600 { color: #7a5c48 !important; }
      .gnr1-sepia .text-slate-500 { color: #9a7a60 !important; }
      .gnr1-sepia .text-slate-400 { color: #b89880 !important; }
      .gnr1-sepia .border-slate-100 { border-color: #d4c5a9 !important; }
      .gnr1-sepia .border-slate-200 { border-color: #c8b898 !important; }
      .gnr1-sepia .border-r { border-color: #d4c5a9 !important; }
      .gnr1-sepia .hover\\:bg-slate-50:hover { background-color: #ede5d8 !important; }
      .gnr1-sepia input, .gnr1-sepia textarea, .gnr1-sepia select {
        background-color: #f0ebe0 !important; border-color: #c8b898 !important; color: #3d2b1f !important;
      }
    `
  }
]

// ─── Tamanhos de fonte ────────────────────────────────────────────────────────
const FONT_SIZES = [
  { id: 'sm',     label: 'Pequena',  value: '14px' },
  { id: 'normal', label: 'Normal',   value: '16px' },
  { id: 'lg',     label: 'Grande',   value: '18px' },
]

// ─── Idiomas ──────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
  { id: 'en-US', label: '🇺🇸 English (US)' },
  { id: 'es',    label: '🇪🇸 Español' },
]

const LANG_LABELS: Record<string, { dashboard: string; employees: string; alerts: string; reports: string; settings: string; about: string; version: string; unit: string; online: string; compliant: string }> = {
  'pt-BR': { dashboard: 'Dashboard', employees: 'Funcionários', alerts: 'Alertas', reports: 'Relatórios', settings: 'Configurações', about: 'Sobre', version: 'Versão da plataforma', unit: 'Unidade', online: 'Online', compliant: 'Conforme' },
  'en-US': { dashboard: 'Dashboard', employees: 'Employees',    alerts: 'Alerts',   reports: 'Reports',    settings: 'Settings',       about: 'About', version: 'Platform version',   unit: 'Unit',     online: 'Online', compliant: 'Compliant' },
  'es':    { dashboard: 'Panel',      employees: 'Empleados',    alerts: 'Alertas',  reports: 'Informes',   settings: 'Configuración',  about: 'Acerca', version: 'Versión',            unit: 'Unidad',   online: 'En línea', compliant: 'Conforme' },
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">{children}</p>
)

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">{children}</div>
)

const Row = ({ icon, label, sub, right, onClick }: {
  icon: React.ReactNode; label: string; sub?: string; right?: React.ReactNode; onClick?: () => void
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-6 py-4 border-b border-slate-50 last:border-0 transition-colors ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
    {right !== undefined && <div className="flex items-center gap-2 shrink-0">{right}</div>}
  </div>
)

const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button
    onClick={e => { e.stopPropagation(); onToggle() }}
    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${active ? 'bg-blue-600' : 'bg-slate-200'}`}
  >
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
)

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SettingsView2({ isDark, onToggleDark }: SettingsView2Props) {
  const [activeTheme, setActiveTheme] = useState<string>(() =>
    localStorage.getItem('gnr1_theme') ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  const [fontSize, setFontSize] = useState<string>(() =>
    localStorage.getItem('gnr1_font_size') ?? 'normal'
  )
  const [language, setLanguage] = useState<string>(() =>
    localStorage.getItem('gnr1_language') ?? 'pt-BR'
  )
  const [resetDone, setResetDone] = useState(false)

  const t = LANG_LABELS[language] ?? LANG_LABELS['pt-BR']

  // ── Aplica tema ──────────────────────────────────────────────────────────
  useEffect(() => {
    const ALL_THEME_CLASSES = ['gnr1-dark', 'gnr1-midnight', 'gnr1-sepia']
    ALL_THEME_CLASSES.forEach(c => document.body.classList.remove(c))

    // Injeta CSS do tema se necessário
    const styleId = 'gnr1-theme-extra'
    let tag = document.getElementById(styleId) as HTMLStyleElement | null
    if (!tag) {
      tag = document.createElement('style')
      tag.id = styleId
      document.head.appendChild(tag)
    }

    const theme = THEMES.find(t => t.id === activeTheme)
    if (theme?.css) {
      tag.textContent = theme.css
      document.body.classList.add(`gnr1-${activeTheme}`)
    } else {
      tag.textContent = ''
    }

    // Sincroniza com o toggle do App (dark mode original)
    if (activeTheme === 'dark' && !isDark) onToggleDark()
    if (activeTheme !== 'dark' && isDark) onToggleDark()

    localStorage.setItem('gnr1_theme', activeTheme)
  }, [activeTheme])

  // ── Aplica tamanho de fonte ──────────────────────────────────────────────
  useEffect(() => {
    const size = FONT_SIZES.find(f => f.id === fontSize)?.value ?? '16px'
    document.documentElement.style.fontSize = size
    localStorage.setItem('gnr1_font_size', fontSize)
  }, [fontSize])

  // ── Aplica idioma ────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem('gnr1_language', language)
  }, [language])

  const handleReset = () => {
    localStorage.removeItem('gnr1_theme')
    localStorage.removeItem('gnr1_font_size')
    localStorage.removeItem('gnr1_language')
    localStorage.removeItem('gnr1_web_dark_mode')
    setResetDone(true)
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h1>
        <p className="text-slate-500 font-medium mt-1">Personalize sua experiência na plataforma.</p>
      </div>

      {/* ── TEMA ── */}
      <div>
        <SectionTitle>Tema</SectionTitle>
        <Card>
          {/* Seletor visual de temas */}
          <div className="px-6 py-5 border-b border-slate-50">
            <p className="text-sm font-bold text-slate-800 mb-4">Escolher tema</p>
            <div className="grid grid-cols-4 gap-3">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={[
                    'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all',
                    activeTheme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  ].join(' ')}
                >
                  {/* Preview do tema */}
                  <div className={`w-full h-10 rounded-xl border-2 ${theme.preview} flex items-center justify-center gap-1`}>
                    <div className={`w-2 h-2 rounded-full ${theme.dot}`} />
                    <div className={`w-4 h-1.5 rounded ${theme.dot} opacity-60`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {activeTheme === theme.id && (
                      <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" />
                      </div>
                    )}
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                      {theme.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Row
            icon={<Monitor size={18} />}
            label="Interface"
            sub="Painel executivo GNR1 • Web"
            right={<span className="text-[11px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">v1.0</span>}
          />
        </Card>
      </div>

      {/* ── ACESSIBILIDADE ── */}
      <div>
        <SectionTitle>Acessibilidade</SectionTitle>
        <Card>
          <div className="px-6 py-5">
            <p className="text-sm font-bold text-slate-800 mb-1">Tamanho da fonte</p>
            <p className="text-[11px] text-slate-400 font-medium mb-4">Afeta toda a interface do navegador</p>
            <div className="flex gap-3">
              {FONT_SIZES.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id)}
                  className={[
                    'flex-1 py-3 rounded-2xl border-2 text-center transition-all font-bold',
                    fontSize === f.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-100 text-slate-500 hover:border-slate-300'
                  ].join(' ')}
                  style={{ fontSize: f.value }}
                >
                  Aa
                  <p className="text-[10px] font-black uppercase tracking-wide mt-1">{f.label}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── IDIOMA ── */}
      <div>
        <SectionTitle>Idioma & Região</SectionTitle>
        <Card>
          <div className="px-6 py-5 border-b border-slate-50">
            <p className="text-sm font-bold text-slate-800 mb-4">Idioma da interface</p>
            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={[
                    'w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all',
                    language === lang.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  ].join(' ')}
                >
                  <span className={`text-sm font-bold ${language === lang.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {lang.label}
                  </span>
                  {language === lang.id && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-3">
              ⚠ Apenas o atributo <code>lang</code> do documento é alterado. Tradução completa em breve.
            </p>
          </div>

          <Row
            icon={<Globe size={18} />}
            label="Região"
            sub="Brasil • UTC-3"
            right={<span className="text-[11px] font-bold text-slate-400">BRA</span>}
          />
        </Card>
      </div>

      {/* ── SISTEMA ── */}
      <div>
        <SectionTitle>Sistema</SectionTitle>
        <Card>
          <Row
            icon={<Activity size={18} />}
            label={t.unit}
            sub="BRA-01 • Corporativo"
            right={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-40" />
                </div>
                <span className="text-[11px] font-black text-green-600">{t.online}</span>
              </div>
            }
          />
          <Row
            icon={<Shield size={18} />}
            label="Conformidade NR-01"
            sub="Riscos psicossociais monitorados"
            right={
              <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Check size={11} /> {t.compliant}
              </span>
            }
          />
          <Row
            icon={<Bell size={18} />}
            label="Alertas críticos"
            sub="Notificações de score=1 ativas"
            right={<span className="text-[11px] font-bold text-slate-400">Ativo</span>}
          />
          <Row
            icon={<Info size={18} />}
            label={t.version}
            sub="Build web estável"
            right={<span className="text-[11px] font-black text-slate-400">1.0.0</span>}
          />
        </Card>
      </div>

      {/* ── AVANÇADO ── */}
      <div>
        <SectionTitle>Avançado</SectionTitle>
        <Card>
          <Row
            icon={<RefreshCw size={18} className={resetDone ? 'text-emerald-500' : 'text-rose-400'} />}
            label={resetDone ? 'Preferências redefinidas!' : 'Redefinir preferências'}
            sub="Restaura tema, fonte e idioma para o padrão"
            onClick={resetDone ? undefined : handleReset}
            right={
              resetDone
                ? <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Feito ✓</span>
                : <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Redefinir</span>
            }
          />
        </Card>
      </div>

      <p className="text-center text-[11px] text-slate-300 font-black uppercase tracking-widest">
        GNR1 Intelligence • Sistema de Gestão Psicossocial
      </p>
    </div>
  )
}