// src/App.tsx
import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

import DashboardView from './views/DashboardView'
import EmployeesView from './views/EmployeesView'
import EvaluationsView from './views/EvaluationsView'
import ReportsView from './views/ReportsView'
import AlertsView from './views/AlertsView'
import SettingsView from './views/SettingsView'
import LoginView from './views/LoginView'

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentView('dashboard')
  }

  const renderView = () => {
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
      case 'settings':
        return <SettingsView isDark={false} onToggleDark={() => {}} />
      default:
        return <DashboardView />
    }
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen flex bg-slate-50 transition-colors duration-300">
      <Sidebar activeId={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 ml-64 flex flex-col">
        <Header currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} />
        <div className="p-10 pb-20">{renderView()}</div>
      </main>
    </div>
  )
}

export default App
