import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  LayoutGrid,
  X,
  AlertTriangle,
  ArrowRight,
  LogOut,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

/* =========================
   TYPES (IGUAL AO BANCO)
========================= */
type EmployeeRow = {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
};

type AlertRow = {
  entry_id: string;
  user_id: string;
  name: string;
  score: number;
  created_at: string;
  day: string;
};

interface HeaderProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onLogout: () => void;
  onOpenEmployee?: (employeeId: string) => void;
}

/* =========================
   HELPERS
========================= */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

function emailPrefix(email?: string | null) {
  const e = String(email ?? "").trim();
  if (!e) return "";
  const at = e.indexOf("@");
  return at > 0 ? e.slice(0, at) : e;
}

function initialsFromName(name?: string | null) {
  const n = String(name ?? "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

/* =========================
   COMPONENT
========================= */
export default function Header({
  currentView,
  onNavigate,
  onLogout,
  onOpenEmployee,
}: HeaderProps) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ✅ displayName = tudo antes do @ (fallback)
  const [displayName, setDisplayName] = useState("Usuário");
  const initials = useMemo(() => initialsFromName(displayName), [displayName]);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /* =========================
     PERFIL: BUSCA NO BANCO
     prioridade:
     1) profiles.name
     2) prefixo do email (antes do @)
     3) metadata name/full_name
     4) "Usuário"
  ========================= */
  useEffect(() => {
    let alive = true;

    async function loadProfileName() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!alive) return;

        const email = user?.email ?? "";
        const prefix = emailPrefix(email);

        const metaName =
          (user?.user_metadata as any)?.name ||
          (user?.user_metadata as any)?.full_name ||
          "";

        // fallback final: prefixo do email > metadata > Usuário
        const fallback = prefix || String(metaName || "").trim() || "Usuário";

        if (!user?.id) {
          setDisplayName(fallback);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();

        if (!alive) return;

        if (error) {
          // se não achar profile, usa prefixo do email
          setDisplayName(fallback);
          return;
        }

        const profileName = String((data as any)?.name ?? "").trim();

        // ✅ se existir profile.name, usa ele; senão usa prefixo do email
        setDisplayName(profileName || fallback);
      } catch (e) {
        console.warn("PROFILE LOAD EXCEPTION:", e);
        if (!alive) return;
        setDisplayName("Usuário");
      }
    }

    loadProfileName();
    return () => {
      alive = false;
    };
  }, []);

  /* =========================
     FECHAR DROPDOWNS AO CLICAR FORA
  ========================= */
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const t = ev.target as Node;

      if (profileRef.current && !profileRef.current.contains(t)) {
        setProfileOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(t)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* =========================
     BUSCA GLOBAL REAL
  ========================= */
  useEffect(() => {
    if (!debounced.trim()) {
      setEmployees([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function run() {
      setLoading(true);

      const [empRes, alertRes] = await Promise.all([
        supabase
          .from("v_company_employees_real")
          .select("id,name,company_id,created_at")
          .ilike("name", `%${debounced}%`)
          .limit(5),

        supabase
          .from("v_global_recent_alerts")
          .select("entry_id,user_id,name,score,created_at,day")
          .or(`name.ilike.%${debounced}%`)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (!active) return;

      if (empRes.error) console.error("EMP SEARCH ERROR:", empRes.error);
      if (alertRes.error) console.error("ALERT SEARCH ERROR:", alertRes.error);

      setEmployees(empRes.data ?? []);
      setAlerts(alertRes.data ?? []);
      setLoading(false);
    }

    run();
    return () => {
      active = false;
    };
  }, [debounced]);

  /* =========================
     UI
  ========================= */
  const viewName =
    {
      dashboard: "Painel Geral",
      employees: "Funcionários",
      evaluations: "Avaliações",
      reports: "Relatórios",
      alerts: "Alertas",
      settings: "Configurações",
    }[currentView] ?? "Início";

  return (
    <header className="flex justify-between items-center px-10 py-6 bg-white border-b border-slate-100 sticky top-0 z-40">
      {/* LEFT */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
            <LayoutGrid size={18} />
          </div>
          <h2 className="text-xl font-black text-slate-900">{viewName}</h2>
        </div>

        {/* SEARCH */}
        <div className="relative hidden lg:block" ref={searchRef}>
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => search && setShowResults(true)}
            placeholder="Buscar dados no sistema..."
            className="pl-11 pr-10 py-3 w-80 rounded-2xl border border-slate-200 text-xs font-semibold outline-none"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={14} />
            </button>
          )}

          {/* RESULTS */}
          {showResults && search && (
            <div className="absolute mt-3 w-[420px] bg-white border border-slate-100 rounded-3xl shadow-xl z-50">
              <div className="p-4 text-[10px] font-black text-slate-400 uppercase flex justify-between">
                Resultados
                {loading && <Loader2 size={14} className="animate-spin" />}
              </div>

              <div className="max-h-[360px] overflow-auto p-2">
                {employees.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => {
                      onNavigate("employees");
                      onOpenEmployee?.(e.id);
                      setShowResults(false);
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-50 cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                      {(e.name?.[0] ?? "C").toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">{e.name}</p>
                      <p className="text-[10px] text-slate-400">Colaborador</p>
                    </div>
                    <ArrowRight size={12} className="text-blue-500" />
                  </div>
                ))}

                {alerts.map((a) => (
                  <div
                    key={a.entry_id}
                    onClick={() => {
                      onNavigate("alerts");
                      setShowResults(false);
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-t"
                  >
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">{a.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Score {a.score} • {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {!loading && employees.length === 0 && alerts.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-400 italic">
                    Nenhum dado encontrado para "{search}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">
        <div className="h-10 w-px bg-slate-100" />

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50"
          >
            <div className="text-right hidden sm:block">
              {/* ✅ agora exibe "policeno1" (prefixo do email) quando não tem profile.name */}
              <p className="text-sm font-black">{displayName}</p>
              <p className="text-[9px] text-emerald-500 font-black uppercase">
                Conectado
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs">
              {initials}
            </div>
            <ChevronDown size={14} />
          </div>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              {/* ✅ APENAS ENCERRAR SESSÃO */}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full p-4 flex items-center gap-3 hover:bg-red-50 text-red-600"
              >
                <LogOut size={16} />
                <span className="text-xs font-black">Encerrar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
