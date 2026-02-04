
import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, Share2, Filter, TrendingUp, Calendar, 
  FileDown, PieChart as PieIcon, X, CheckCircle2, Loader2, Zap, ShieldCheck, Clock, FileStack
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';

const DATA = [
  { name: 'Jan', value: 40, eng: 80 },
  { name: 'Fev', value: 30, eng: 75 },
  { name: 'Mar', value: 65, eng: 90 },
  { name: 'Abr', value: 45, eng: 85 },
  { name: 'Mai', value: 55, eng: 88 },
];

const ReportsView: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStep, setExportStep] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activeDownloadName, setActiveDownloadName] = useState('');
  const [activeDate, setActiveDate] = useState('');

  const exportSteps = [
    { title: "Sincronizando Base GNR1 v1.0", duration: 400 },
    { title: "Consolidando Matriz de Risco", duration: 600 },
    { title: "Gerando Insights Técnicos", duration: 800 },
    { title: "Aplicando Assinatura Digital", duration: 400 }
  ];

  const triggerProfessionalPdf = (filename: string, docDate: string) => {
    const pdfHeader = `%PDF-1.1\n`;
    const obj1 = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n`;
    const obj2 = `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n`;
    const obj3 = `3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >> endobj\n`;
    const obj4 = `4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n`;
    const obj6 = `6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`;
    
    // Título truncado para o PDF se for muito longo
    const displayTitle = filename.length > 35 ? filename.substring(0, 32) + "..." : filename;

    const graphics = `
      q 0.98 0.98 1 rg 0 0 595 842 re f Q
      q 0.05 0.3 0.7 rg 0 780 595 62 re f Q 
      q 1 1 1 rg 40 660 515 100 re f 0.9 0.9 0.9 RG 0.5 w 40 660 515 100 re S Q
      q 0.95 0.96 0.98 rg 40 180 515 450 re f 0.8 0.8 0.9 RG 1 w 40 180 515 450 re S Q
      q 0.05 0.3 0.7 rg 40 610 515 20 re f Q 
    `;

    const text = `
      BT /F1 14 Tf 1 1 1 rg 60 812 Td (GNR1: AUDITORIA CORPORATIVA) Tj ET
      BT /F2 8 Tf 0.9 0.9 0.9 rg 60 800 Td (SISTEMA DE INTELIGENCIA v1.0.0-PRO) Tj ET
      BT /F2 8 Tf 1 1 1 rg 460 790 Td (DATA: ${docDate || '2026'}) Tj ET
      BT /F1 12 Tf 0.2 0.2 0.2 rg 60 720 Td (DOCUMENTO: ${displayTitle.toUpperCase()}) Tj ET
      BT /F2 9 Tf 0.4 0.4 0.4 rg 60 705 Td (Auditado em conformidade com as metricas da unidade BRA-01) Tj ET
      BT /F1 9 Tf 1 1 1 rg 60 616 Td (RESUMO EXECUTIVO E PARECER TECNICO) Tj ET
      BT /F1 10 Tf 0.1 0.2 0.4 rg 60 575 Td (1. ANALISE DE DADOS) Tj ET
      BT /F2 9 Tf 0.2 0.2 0.2 rg 60 560 Td (Relatorio gerado para o arquivo ${filename}.) Tj 0 -11 Td (Dados consolidados com 98% de precisao estatistica.) Tj ET
      BT /F2 7 Tf 0.6 0.6 0.6 rg 60 30 Td (Certificado GNR1 Lab - Autenticidade BRA-01-SEC-2026. Hash 1.0.0.) Tj ET
    `;

    const fullStream = graphics + text;
    const obj5 = `5 0 obj << /Length ${fullStream.length} >> stream\n${fullStream}\nendstream\nendobj\n`;
    const xref = `xref\n0 7\n0000000000 65535 f\n0000000010 00000 n\n0000000059 00000 n\n0000000116 00000 n\n0000000228 00000 n\n0000000305 00000 n\n0000000392 00000 n\n`;
    const trailer = `trailer << /Size 7 /Root 1 0 R >>\nstartxref\n${10+49+57+112+77+87+fullStream.length+30}\n%%EOF`;

    const fullPdf = pdfHeader + obj1 + obj2 + obj3 + obj4 + obj6 + obj5 + xref + trailer;
    const blob = new Blob([fullPdf], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename.replace(/\s+/g, '_')}_v1.0.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleStartExport = (name: string = "Auditoria_GNR1_2026", date: string = "") => {
    setActiveDownloadName(name);
    setActiveDate(date);
    setIsExportModalOpen(true);
    setExportStep(0);
  };

  useEffect(() => {
    if (isExportModalOpen && exportStep < exportSteps.length) {
      const timer = setTimeout(() => setExportStep(prev => prev + 1), exportSteps[exportStep].duration);
      return () => clearTimeout(timer);
    } else if (isExportModalOpen && exportStep === exportSteps.length) {
      triggerProfessionalPdf(activeDownloadName, activeDate);
      setTimeout(() => {
        setIsExportModalOpen(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }, 500);
    }
  }, [isExportModalOpen, exportStep, activeDownloadName, activeDate]);

  const DOCS = [
    { id: 1, name: 'Dashboard Corporativo GNR1 - Jan 2026', date: '28 Jan, 2026', size: '2.4 MB', icon: <FileText size={24} />, color: 'blue' },
    { id: 2, name: 'Analise de Burnout e Risco Operacional', date: '15 Jan, 2026', size: '5.1 MB', icon: <Zap size={24} />, color: 'orange' },
    { id: 3, name: 'Metricas de Bem-Estar - Tecnologia', date: '05 Jan, 2026', size: '1.8 MB', icon: <TrendingUp size={24} />, color: 'purple' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {showSuccessToast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-fade-in z-[500] border border-slate-700">
           <CheckCircle2 className="text-emerald-500" size={24} />
           <p className="font-bold text-sm">Download concluído!</p>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
               <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${(exportStep / exportSteps.length) * 100}%` }} />
            </div>
            <div className="mb-10 relative">
               <div className="w-20 h-20 border-4 border-slate-50 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Processando PDF</h3>
            <p className="text-xs text-slate-500 font-medium mb-12">{exportSteps[exportStep]?.title || "Finalizando..."}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Central de Relatórios</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Extraia inteligência organizacional v1.0.</p>
        </div>
        <button 
          onClick={() => handleStartExport()}
          className="bg-slate-900 text-white px-10 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl"
        >
          Exportar PDF Geral
        </button>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-16">Histórico de Auditoria</h3>
        <div className="grid grid-cols-1 gap-6">
          {DOCS.map((doc) => (
            <div key={doc.id} onClick={() => handleStartExport(doc.name, doc.date)} className="flex flex-col lg:flex-row items-center justify-between p-8 bg-slate-50/30 border border-slate-50 rounded-[3rem] hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all group cursor-pointer">
              <div className="flex items-center gap-8 w-full lg:w-auto">
                <div className={`p-6 bg-${doc.color}-50 text-${doc.color}-600 rounded-[2rem] group-hover:scale-110 transition-transform`}>
                  {doc.icon}
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight">{doc.name}</h4>
                  <div className="flex items-center gap-5 mt-3">
                    <Calendar size={14} className="text-slate-300" />
                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{doc.date}</span>
                    <span className="text-[11px] text-slate-400 font-black ml-4 opacity-30">|</span>
                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest ml-4">{doc.size}</span>
                  </div>
                </div>
              </div>
              <button className="mt-8 lg:mt-0 px-8 py-5 bg-white text-slate-800 hover:text-blue-600 border border-slate-100 hover:border-blue-400 rounded-3xl transition-all shadow-sm font-black text-xs uppercase tracking-widest">
                  BAIXAR PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
