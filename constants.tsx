
import React from 'react';
import { LayoutDashboard, Users, ClipboardCheck, FileBarChart, Bell, Settings } from 'lucide-react';
import { EmotionalStatus, Employee, Alert, MoodData, StressData } from './types';

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, active: true },
  { id: 'employees', label: 'Funcionários', icon: <Users size={20} />, active: false },
  { id: 'evaluations', label: 'Avaliações', icon: <ClipboardCheck size={20} />, active: false },
  { id: 'reports', label: 'Relatórios', icon: <FileBarChart size={20} />, active: false },
  { id: 'alerts', label: 'Alertas', icon: <Bell size={20} />, active: false },
  { id: 'settings', label: 'Configurações', icon: <Settings size={20} />, active: false },
];

const generateHistory = () => [
  { date: 'Seg', value: Math.floor(Math.random() * 50) },
  { date: 'Ter', value: Math.floor(Math.random() * 50) },
  { date: 'Qua', value: Math.floor(Math.random() * 50) },
  { date: 'Qui', value: Math.floor(Math.random() * 50) },
  { date: 'Sex', value: Math.floor(Math.random() * 50) },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Carlos Silveira', email: 'carlos.s@gnr1.com', phone: '(11) 98877-6655', department: 'Tecnologia', role: 'Engenheiro Software', status: EmotionalStatus.STABLE, tracking: 'Em acompanhamento', joinedDate: '12/05/2024', history: generateHistory() },
  { id: '2', name: 'Mariana Rocha', email: 'mari.rocha@gnr1.com', phone: '(11) 97766-5544', department: 'RH', role: 'Business Partner', status: EmotionalStatus.ANXIOUS, tracking: 'Em acompanhamento', joinedDate: '01/02/2025', history: generateHistory() },
  { id: '3', name: 'João Lucas', email: 'joao.l@gnr1.com', phone: '(11) 96655-4433', department: 'Financeiro', role: 'Analista Pleno', status: EmotionalStatus.STRESSED, tracking: 'Em acompanhamento', joinedDate: '15/11/2023', history: generateHistory() },
  { id: '4', name: 'Ana Paula', email: 'ana.paula@gnr1.com', phone: '(11) 95544-3322', department: 'Marketing', role: 'Diretora Criação', status: EmotionalStatus.WELL, tracking: 'Finalizado', joinedDate: '20/03/2022', history: generateHistory() },
  { id: '5', name: 'Felipe Martins', email: 'felipe.m@gnr1.com', phone: '(11) 94433-2211', department: 'Vendas', role: 'Account Executive', status: EmotionalStatus.SAD, tracking: 'Em acompanhamento', joinedDate: '10/08/2024', history: generateHistory() },
  { id: '6', name: 'Beatriz Lima', email: 'b.lima@gnr1.com', phone: '(11) 93322-1100', department: 'TI', role: 'DevOps', status: EmotionalStatus.ANXIOUS, tracking: 'Em acompanhamento', joinedDate: '05/04/2025', history: generateHistory() },
  { id: '7', name: 'Ricardo Dias', email: 'r.dias@gnr1.com', phone: '(11) 92211-0099', department: 'Operações', role: 'Gerente', status: EmotionalStatus.STRESSED, tracking: 'Em acompanhamento', joinedDate: '18/09/2023', history: generateHistory() },
  { id: '8', name: 'Juliana Costa', email: 'ju.costa@gnr1.com', phone: '(11) 91100-9988', department: 'CS', role: 'Analista', status: EmotionalStatus.STABLE, tracking: 'Em acompanhamento', joinedDate: '22/01/2024', history: generateHistory() },
  { id: '9', name: 'Thiago Mello', email: 't.mello@gnr1.com', phone: '(11) 90099-8877', department: 'Produto', role: 'PO', status: EmotionalStatus.ANXIOUS, tracking: 'Em acompanhamento', joinedDate: '30/06/2025', history: generateHistory() },
  { id: '10', name: 'Carla Nunes', email: 'c.nunes@gnr1.com', phone: '(11) 98877-5544', department: 'Jurídico', role: 'Advogada', status: EmotionalStatus.STRESSED, tracking: 'Em acompanhamento', joinedDate: '14/03/2024', history: generateHistory() },
  { id: '11', name: 'Lucas Jorge', email: 'l.jorge@gnr1.com', phone: '(11) 97766-4433', department: 'TI', role: 'Sênior', status: EmotionalStatus.SAD, tracking: 'Em acompanhamento', joinedDate: '10/10/2023', history: generateHistory() },
  { id: '12', name: 'Fernanda Luz', email: 'f.luz@gnr1.com', phone: '(11) 96655-3322', department: 'RH', role: 'Analista', status: EmotionalStatus.ANXIOUS, tracking: 'Em acompanhamento', joinedDate: '01/08/2025', history: generateHistory() },
  { id: '13', name: 'Gabriel Soto', email: 'g.soto@gnr1.com', phone: '(11) 95544-2211', department: 'Vendas', role: 'SDR', status: EmotionalStatus.STABLE, tracking: 'Em acompanhamento', joinedDate: '15/12/2024', history: generateHistory() },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: 'critical', title: 'Alto risco emocional', description: 'Funcionário com piora contínua nos últimos 5 dias.', timestamp: '27/01 21:15', read: false },
  { id: 'a2', type: 'critical', title: 'Queda brusca de humor', description: 'Oscilação significativa detectada no check-in diário.', timestamp: '27/01 15:15', read: false }
];

export const MOOD_CHART_DATA: MoodData[] = [
  { day: 'S', value: 30 }, { day: 'T', value: 45 }, { day: 'Q', value: 35 }, { day: 'Q', value: 40 }, { day: 'S', value: 32 }, { day: 'S', value: 38 }, { day: 'D', value: 42 },
];

export const STRESS_CHART_DATA: StressData[] = [
  { category: 'Sem', stress: 35, anxiety: 28 }, { category: 'Mod.', stress: 48, anxiety: 38 }, { category: 'Alto', stress: 22, anxiety: 21 },
];

export const BURNOUT_CHART_DATA = [
  { name: 'Baixo', value: 60, color: '#3b82f6' }, { name: 'Moderado', value: 25, color: '#fb923c' }, { name: 'Alto', value: 15, color: '#ef4444' },
];
