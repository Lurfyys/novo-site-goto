import React, { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

import DashboardView from './views/DashboardView'
import EmployeesView from './views/EmployeesView'
import EvaluationsView from './views/EvaluationsView'
import ReportsView from './views/ReportsView'
import AlertsView from './views/AlertsView'
import SettingsView from './views/SettingsView'
import LoginView from './views/LoginView'
import SurveyResponsesView from './views/SurveyResponsesView'

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [viewError, setViewError] = useState<string | null>(null)

  // ✅ debug visível no console
  console.log('[App] currentView =>', currentView)

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentView('dashboard')
  }

  const safeRender = (node: React.ReactNode) => {
    try {
      // limpa erro anterior quando a view troca
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
        return <DashboardView />

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

      case 'settings':
        return <SettingsView isDark={false} onToggleDark={() => {}} />

      default:
        return <DashboardView />
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
          ) : (
            safeRender(viewNode)
          )}
        </div>
      </main>
    </div>
  )
}

export default App
