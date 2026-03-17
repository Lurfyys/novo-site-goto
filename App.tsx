import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

import DashboardView from './views/DashboardView'
import EmployeesView from './views/EmployeesView'
import EvaluationsView from './views/EvaluationsView'
import ReportsView from './views/ReportsView'
import AlertsView from './views/AlertsView'
import SettingsView2 from './views/SettingsView2'
import SettingsView from './views/SettingsView'
import LoginView from './views/LoginView'
import SurveyResponsesView from './views/SurveyResponsesView'

/* =============================================================
   DARK MODE CSS — injetado via JS, sem precisar de index.css
   Usa a classe .gnr1-dark no <body> para sobrescrever Tailwind
============================================================= */
const DARK_CSS = `
  .gnr1-dark {
    color-scheme: dark;
  }

  /* Fundo geral */
  .gnr1-dark body,
  .gnr1-dark #root,
  .gnr1-dark .min-h-screen {
    background-color: #0f172a !important;
    color: #f1f5f9 !important;
  }
  .gnr1-dark .bg-slate-50 { background-color: #1e293b !important; }
  .gnr1-dark .bg-slate-100 { background-color: #1e293b !important; }

  /* Cards brancos */
  .gnr1-dark .bg-white { background-color: #1e293b !important; }

  /* Sidebar */
  .gnr1-dark .border-r { border-color: #1e293b !important; }
  .gnr1-dark .border-slate-200\\/60 { border-color: #1e293b !important; }
  .gnr1-dark .shadow-\\[4px_0_24px_rgba\\(0\\,0\\,0\\,0\\.02\\)\\] {
    box-shadow: 4px 0 24px rgba(0,0,0,0.4) !important;
  }

  /* Textos */
  .gnr1-dark .text-slate-900 { color: #f1f5f9 !important; }
  .gnr1-dark .text-slate-800 { color: #e2e8f0 !important; }
  .gnr1-dark .text-slate-700 { color: #cbd5e1 !important; }
  .gnr1-dark .text-slate-600 { color: #94a3b8 !important; }
  .gnr1-dark .text-slate-500 { color: #64748b !important; }
  .gnr1-dark .text-slate-400 { color: #475569 !important; }

  /* Bordas */
  .gnr1-dark .border-slate-100 { border-color: #334155 !important; }
  .gnr1-dark .border-slate-200 { border-color: #334155 !important; }
  .gnr1-dark .border-slate-50  { border-color: #1e293b !important; }

  /* Header */
  .gnr1-dark header,
  .gnr1-dark .border-b { border-color: #1e293b !important; }

  /* Inputs */
  .gnr1-dark input,
  .gnr1-dark textarea,
  .gnr1-dark select {
    background-color: #0f172a !important;
    border-color: #334155 !important;
    color: #f1f5f9 !important;
  }
  .gnr1-dark input::placeholder,
  .gnr1-dark textarea::placeholder { color: #475569 !important; }

  /* Hover rows */
  .gnr1-dark .hover\\:bg-slate-50:hover { background-color: #273549 !important; }
  .gnr1-dark .hover\\:bg-slate-100:hover { background-color: #273549 !important; }

  /* Sidebar nav items inativos */
  .gnr1-dark .text-slate-400 { color: #64748b !important; }

  /* Divisores */
  .gnr1-dark .divide-y > * + * { border-color: #1e293b !important; }

  /* Transição suave em tudo */
  .gnr1-dark *, .gnr1-dark *::before, .gnr1-dark *::after {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
`

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [viewError, setViewError] = useState<string | null>(null)

  // ─── DARK MODE ────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('gnr1_web_dark_mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Injeta o CSS uma única vez
    const styleId = 'gnr1-dark-style'
    if (!document.getElementById(styleId)) {
      const tag = document.createElement('style')
      tag.id = styleId
      tag.textContent = DARK_CSS
      document.head.appendChild(tag)
    }

    // Aplica/remove classe no body
    if (isDark) {
      document.body.classList.add('gnr1-dark')
    } else {
      document.body.classList.remove('gnr1-dark')
    }

    localStorage.setItem('gnr1_web_dark_mode', String(isDark))
  }, [isDark])

  const toggleDark = () => setIsDark(prev => !prev)
  // ─────────────────────────────────────────────────────────────────────────

  console.log('[App] currentView =>', currentView)

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentView('dashboard')
  }

  const safeRender = (node: React.ReactNode) => {
    try {
      return node
    } catch (e: any) {
      setViewError(e?.message ?? 'Erro ao renderizar a tela.')
      return null
    }
  }

  const viewNode = useMemo(() => {
    setViewError(null)

    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />

      case 'employees':
        return <EmployeesView />

      case 'evaluations':
        return <EvaluationsView />

      case 'reports':
        return <ReportsView />

      case 'alerts':
        return <AlertsView />

      case 'surveyResponses':
        return <SurveyResponsesView />

      case 'about':
        return <SettingsView />

      // settings é renderizado diretamente no JSX para sempre receber isDark atualizado
      default:
        return <DashboardView onNavigate={setCurrentView} />
    }
  }, [currentView])

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen flex bg-slate-50 transition-colors duration-300">
      <Sidebar
        activeId={currentView}
        onNavigate={(id) => {
          console.log('[Sidebar -> App] navigate =>', id)
          setCurrentView(id)
        }}
      />

      <main className="flex-1 ml-64 flex flex-col">
        <Header currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} />

        <div className="p-10 pb-20">
          {viewError ? (
            <div className="p-6 rounded-3xl border border-red-100 bg-red-50 text-red-700">
              <div className="text-sm font-black">Erro nessa tela</div>
              <div className="text-xs font-bold mt-2">{viewError}</div>
              <div className="text-xs font-bold mt-3 text-red-600">
                Dica: o erro normalmente está em <code>SurveyResponsesView</code> (import/serviço/caminho).
              </div>
            </div>
          ) : currentView === 'settings' ? (
            // Fora do useMemo para sempre receber isDark/toggleDark atualizados
            <SettingsView2 isDark={isDark} onToggleDark={toggleDark} />
          ) : (
            safeRender(viewNode)
          )}
        </div>
      </main>
    </div>
  )
}

export default App