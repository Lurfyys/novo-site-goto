import React from 'react'
import { LayoutDashboard, Users, ClipboardCheck, FileBarChart, Bell, Info } from 'lucide-react'
import { EmotionalStatus, Employee, Alert, MoodData, StressData } from './types'

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, active: true },
  { id: 'employees', label: 'Funcionários', icon: <Users size={20} />, active: false },
  { id: 'evaluations', label: 'Anotações', icon: <ClipboardCheck size={20} />, active: false },

  // ✅ NOVO ITEM (ID precisa bater com o App.tsx)
  { id: 'surveyResponses', label: 'Respostas NR-01', icon: <ClipboardCheck size={20} />, active: false },

  { id: 'reports', label: 'Relatórios', icon: <FileBarChart size={20} />, active: false },
  { id: 'alerts', label: 'Alertas', icon: <Bell size={20} />, active: false },
  { id: 'settings', label: 'Sobre', icon: <Info size={20} />, active: false }
]

const generateHistory = () => [
  { date: 'Seg', value: Math.floor(Math.random() * 50) },
  { date: 'Ter', value: Math.floor(Math.random() * 50) },
  { date: 'Qua', value: Math.floor(Math.random() * 50) },
  { date: 'Qui', value: Math.floor(Math.random() * 50) },
  { date: 'Sex', value: Math.floor(Math.random() * 50) }
]

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Carlos Silveira',
    email: 'carlos.s@gnr1.com',
    phone: '(11) 98877-6655',
    department: 'Tecnologia',
    role: 'Engenheiro Software',
    status: EmotionalStatus.STABLE,
    tracking: 'Em acompanhamento',
    joinedDate: '12/05/2024',
    history: generateHistory()
  },
  {
    id: '2',
    name: 'Mariana Rocha',
    email: 'mari.rocha@gnr1.com',
    phone: '(11) 97766-5544',
    department: 'RH',
    role: 'Business Partner',
    status: EmotionalStatus.ANXIOUS,
    tracking: 'Em acompanhamento',
    joinedDate: '01/02/2025',
    history: generateHistory()
  },
  {
    id: '3',
    name: 'João Lucas',
    email: 'joao.l@gnr1.com',
    phone: '(11) 96655-4433',
    department: 'Financeiro',
    role: 'Analista Pleno',
    status: EmotionalStatus.STRESSED,
    tracking: 'Em acompanhamento',
    joinedDate: '15/11/2023',
    history: generateHistory()
  },
  {
    id: '4',
    name: 'Ana Paula',
    email: 'ana.paula@gnr1.com',
    phone: '(11) 95544-3322',
    department: 'Marketing',
    role: 'Diretora Criação',
    status: EmotionalStatus.WELL,
    tracking: 'Finalizado',
    joinedDate: '20/03/2022',
    history: generateHistory()
  }
]

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    type: 'critical',
    title: 'Alto risco emocional',
    description: 'Funcionário com piora contínua nos últimos 5 dias.',
    timestamp: '27/01 21:15',
    read: false
  },
  {
    id: 'a2',
    type: 'critical',
    title: 'Queda brusca de humor',
    description: 'Oscilação significativa detectada no check-in diário.',
    timestamp: '27/01 15:15',
    read: false
  }
]

export const MOOD_CHART_DATA: MoodData[] = [
  { day: 'S', value: 30 },
  { day: 'T', value: 45 },
  { day: 'Q', value: 35 },
  { day: 'Q', value: 40 },
  { day: 'S', value: 32 },
  { day: 'S', value: 38 },
  { day: 'D', value: 42 }
]

export const STRESS_CHART_DATA: StressData[] = [
  { category: 'Sem', stress: 35, anxiety: 28 },
  { category: 'Mod.', stress: 48, anxiety: 38 },
  { category: 'Alto', stress: 22, anxiety: 21 }
]

export const BURNOUT_CHART_DATA = [
  { name: 'Baixo', value: 60, color: '#3b82f6' },
  { name: 'Moderado', value: 25, color: '#fb923c' },
  { name: 'Alto', value: 15, color: '#ef4444' }
]
