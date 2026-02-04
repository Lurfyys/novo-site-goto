
export enum EmotionalStatus {
  WELL = 'Bem',
  STABLE = 'Estável',
  ANXIOUS = 'Ansiosa',
  STRESSED = 'Estressado',
  SAD = 'Triste'
}

export interface EmployeeHistory {
  date: string;
  value: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: EmotionalStatus;
  tracking: 'Em acompanhamento' | 'Sem acompanhamento' | 'Finalizado';
  joinedDate: string;
  history: EmployeeHistory[];
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface MoodData {
  day: string;
  value: number;
}

export interface StressData {
  category: string;
  stress: number;
  anxiety: number;
}
