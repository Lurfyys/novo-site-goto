
/**
 * SERVIÇO DE PROCESSAMENTO LOCAL (MOCK)
 * Substitui chamadas de API por retornos imediatos de dados estruturados.
 */

export const generateWorkflowPlan = async (context: any) => {
  // Simula um tempo de processamento local para UX
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    {
      step: 1,
      title: "Mapeamento de Sobrecarga",
      description: "Realizar entrevistas individuais com a equipe de Tecnologia para identificar gargalos operacionais."
    },
    {
      step: 2,
      title: "Pausa Estruturada",
      description: "Implementar janelas de 15 min sem notificações entre blocos de reuniões críticas."
    },
    {
      step: 3,
      title: "Workshop de Resiliência",
      description: "Treinamento para lideranças sobre como identificar sinais de burnout precocemente."
    },
    {
      step: 4,
      title: "Monitoramento Ativo",
      description: "Acompanhamento diário via check-in GNR1 para medir impacto das mudanças."
    }
  ];
};

export const generateRiskDeepDive = async (context: any) => {
  await new Promise(resolve => setTimeout(resolve, 600));

  return {
    summary: "O risco alto está concentrado no setor de Tecnologia devido ao aumento de 40% nas demandas de entrega no último trimestre.",
    factors: [
      {
        factor: "Pressão por Prazos",
        impact: "Alto",
        mitigation: "Revisão do cronograma e priorização de tarefas críticas via metodologia Agile."
      },
      {
        factor: "Fadiga Digital",
        impact: "Médio",
        mitigation: "Incentivo ao 'Digital Detox' pós-expediente e redução de e-mails noturnos."
      },
      {
        factor: "Isolamento Social",
        impact: "Médio",
        mitigation: "Atividades presenciais de integração e dinâmicas de grupo mensais."
      }
    ]
  };
};
