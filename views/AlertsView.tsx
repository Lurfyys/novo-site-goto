import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

import {
  fetchCriticalAlerts,
  type CriticalAlertRow,
} from "../services/dashboardService";

import EmployeeProfilePanel from "../components/EmployeeProfilePanel";

function formatDay(day?: string) {
  if (!day) return "—";
  const [y, m, d] = day.split("-");
  if (!y || !m || !d) return day;
  return `${d}/${m}/${y}`;
}

function statIconBg(kind: "blue" | "red" | "emerald") {
  if (kind === "blue") return "bg-blue-50 text-blue-600";
  if (kind === "red") return "bg-rose-50 text-rose-600";
  return "bg-emerald-50 text-emerald-600";
}

function makeKey(a: CriticalAlertRow) {
  // chave estável para usar em sets
  return `${a.user_id}-${a.day ?? a.created_at ?? "x"}-${a.score ?? "x"}`;
}

export default function AlertsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [alerts, setAlerts] = useState<CriticalAlertRow[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [resolvedSet, setResolvedSet] = useState<Set<string>>(new Set());

  // ✅ abrir painel do funcionário (igual DashboardView)
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const crit = await fetchCriticalAlerts({ days: 7, limit: 100 });

        if (!mounted) return;
        setAlerts(Array.isArray(crit) ? crit : []);
        setReadSet(new Set());
        setResolvedSet(new Set());
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError(e?.message ?? "Erro ao carregar alertas.");
        setAlerts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const normalized = query.trim().toLowerCase();

  const filteredAll = useMemo(() => {
    const base = alerts ?? [];
    if (!normalized) return base;

    return base.filter((a) => {
      const name = String(a.name ?? "").toLowerCase();
      const day = String(a.day ?? "").toLowerCase();
      const userId = String(a.user_id ?? "").toLowerCase();
      const score = String(a.score ?? "").toLowerCase();

      return (
        name.includes(normalized) ||
        day.includes(normalized) ||
        userId.includes(normalized) ||
        score.includes(normalized)
      );
    });
  }, [alerts, normalized]);

  // ✅ coluna ATIVOS (não resolvidos)
  const activeAlerts = useMemo(() => {
    return filteredAll.filter((a) => !resolvedSet.has(makeKey(a)));
  }, [filteredAll, resolvedSet]);

  // ✅ coluna RESOLVIDOS
  const resolvedAlerts = useMemo(() => {
    return filteredAll.filter((a) => resolvedSet.has(makeKey(a)));
  }, [filteredAll, resolvedSet]);

  const stats = useMemo(() => {
    const total = alerts.length;
    const resolved = resolvedSet.size;
    const active = Math.max(0, total - resolved);
    const critical = active; // aqui só críticos
    return { total, active, critical, resolved };
  }, [alerts, resolvedSet]);

  function markAllRead() {
    setReadSet((prev) => {
      const next = new Set(prev);
      for (const a of activeAlerts) next.add(makeKey(a));
      return next;
    });
  }

  function markReadOne(a: CriticalAlertRow) {
    const k = makeKey(a);
    setReadSet((prev) => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }

  function toggleResolved(a: CriticalAlertRow) {
    const k = makeKey(a);

    setResolvedSet((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

    // resolve => marca lido automaticamente
    markReadOne(a);
  }

  function openEmployeePanel(user_id: string, name?: string | null) {
    setSelectedEmployee({ id: user_id, name: name ?? "Sem nome" });
  }

  function isUnread(a: CriticalAlertRow) {
    return !readSet.has(makeKey(a));
  }

  const AlertRow = ({
    a,
    mode,
  }: {
    a: CriticalAlertRow;
    mode: "active" | "resolved";
  }) => {
    const unread = mode === "active" ? isUnread(a) : false;

    return (
      <div
        className={[
          "p-8 flex items-start justify-between hover:bg-slate-50/50 transition-all group",
          unread ? "border-l-4 border-blue-600" : "",
        ].join(" ")}
      >
        <div className="flex gap-6">
          <div
            className={[
              "p-4 rounded-[1.5rem] shadow-sm",
              mode === "resolved"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-500",
            ].join(" ")}
          >
            {mode === "resolved" ? (
              <CheckCircle2 size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h4 className="font-black text-lg text-slate-800 tracking-tight">
                {mode === "resolved"
                  ? "Alerta resolvido"
                  : "Alerta crítico (score=1)"}
              </h4>

              {unread && (
                <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-tighter">
                  Novo Evento
                </span>
              )}

              {mode === "resolved" && (
                <span className="bg-emerald-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-tighter">
                  Resolvido
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">
              <span className="font-black text-slate-700">
                {a.name ?? "Sem nome"}
              </span>{" "}
              {mode === "resolved"
                ? "teve o caso marcado como resolvido."
                : "apresentou sinal crítico."}
            </p>

            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                <ArrowUpRight size={12} />
                Score: {a.score} • {formatDay(a.day)}
              </div>

              <span className="text-slate-200">|</span>

              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                user_id:{" "}
                <span className="text-slate-600 normal-case font-bold">
                  {a.user_id}
                </span>
              </div>

              <span className="text-slate-200">|</span>

              {/* ✅ agora abre painel igual dashboard */}
              <button
                onClick={() => openEmployeePanel(a.user_id, a.name)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-colors"
              >
                Ver Perfil do Funcionário
              </button>
            </div>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="flex flex-col items-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
          {mode === "active" ? (
            <>
              <button
                onClick={() => markReadOne(a)}
                className="bg-white border border-slate-100 p-3 rounded-2xl text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:shadow-md transition-all"
                title="Marcar como lido"
              >
                <CheckCircle2 size={20} />
              </button>

              <button
                onClick={() => toggleResolved(a)}
                className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-md transition-all"
                title="Marcar como resolvido"
              >
                RESOLVIDO
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleResolved(a)}
              className="px-4 py-3 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
              title="Voltar para Ativos"
            >
              REABRIR <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ✅ painel do funcionário (igual DashboardView) */}
      {selectedEmployee && (
        <EmployeeProfilePanel
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Central de Alertas
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Anomalias psicossociais detectadas pelo motor de IA GNR1.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={markAllRead}
            className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> Marcar tudo como lido
          </button>
        </div>
      </div>

      {/* ERRO */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      {/* STATS (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        {[
          {
            label: "Total Ativos",
            count: stats.active,
            icon: <Bell size={18} />,
            color: "blue" as const,
          },
          {
            label: "Críticos",
            count: stats.critical,
            icon: <AlertTriangle size={18} />,
            color: "red" as const,
          },
          {
            label: "Resolvidos",
            count: stats.resolved,
            icon: <CheckCircle2 size={18} />,
            color: "emerald" as const,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all"
          >
            <div
              className={[
                "p-3 rounded-2xl group-hover:scale-110 transition-transform",
                statIconBg(stat.color),
              ].join(" ")}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-800">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BUSCA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Filtrar por nome, user_id, data, score..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button className="bg-white border border-slate-100 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Prioridade
          </button>
        </div>

        {/* ✅ 2 COLUNAS: ATIVOS / RESOLVIDOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* COLUNA ATIVOS */}
          <div className="border-r border-slate-50">
            <div className="px-8 py-5 bg-white">
              <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                ATIVOS
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">
                Alertas críticos não resolvidos
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-10 text-slate-400 font-bold">
                  Carregando alertas…
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="p-10 text-slate-400 font-bold">
                  Nenhum alerta ativo.
                </div>
              ) : (
                activeAlerts.map((a) => (
                  <AlertRow key={makeKey(a)} a={a} mode="active" />
                ))
              )}
            </div>
          </div>

          {/* COLUNA RESOLVIDOS */}
          <div>
            <div className="px-8 py-5 bg-white">
              <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                RESOLVIDOS
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">
                Itens marcados como resolvidos nesta tela
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-10 text-slate-400 font-bold">
                  Carregando…
                </div>
              ) : resolvedAlerts.length === 0 ? (
                <div className="p-10 text-slate-400 font-bold">
                  Nenhum alerta resolvido ainda.
                </div>
              ) : (
                resolvedAlerts.map((a) => (
                  <AlertRow key={makeKey(a)} a={a} mode="resolved" />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
