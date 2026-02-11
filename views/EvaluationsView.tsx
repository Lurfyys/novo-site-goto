import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Pencil,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

type NoteCategory = "TODAS" | "GERAL" | "FEEDBACK" | "INTERVENCAO" | "PRIVADO";

type NoteRow = {
  id: string;
  title: string;
  content: string;
  category: "GERAL" | "FEEDBACK" | "INTERVENCAO" | "PRIVADO";
  is_private: boolean;
  pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

function catLabel(cat: NoteRow["category"]) {
  if (cat === "FEEDBACK") return "FEEDBACK";
  if (cat === "INTERVENCAO") return "INTERVENÇÃO";
  if (cat === "PRIVADO") return "PRIVADO";
  return "GERAL";
}

function catPillClass(cat: NoteRow["category"]) {
  if (cat === "FEEDBACK") return "bg-blue-50 text-blue-700 border-blue-100";
  if (cat === "INTERVENCAO") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (cat === "PRIVADO") return "bg-violet-50 text-violet-700 border-violet-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
}

const tabs: { id: NoteCategory; label: string }[] = [
  { id: "TODAS", label: "Todas" },
  { id: "GERAL", label: "Geral" },
  { id: "FEEDBACK", label: "Feedback" },
  { id: "INTERVENCAO", label: "Intervenção" },
  { id: "PRIVADO", label: "Privado" },
];

export default function NotesView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<NoteCategory>("TODAS");

  const [notes, setNotes] = useState<NoteRow[]>([]);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<NoteRow["category"]>("GERAL");
  const [formPrivate, setFormPrivate] = useState(false);
  const [formPinned, setFormPinned] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("notes")
      .select("id,title,content,category,is_private,pinned,created_by,created_at,updated_at")
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message ?? "Erro ao carregar notas.");
      setNotes([]);
    } else {
      setNotes((data as NoteRow[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (notes ?? [])
      .filter((n) => {
        if (activeTab === "TODAS") return true;
        if (activeTab === "PRIVADO") return n.category === "PRIVADO" || n.is_private === true;
        return n.category === activeTab;
      })
      .filter((n) => {
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          catLabel(n.category).toLowerCase().includes(q)
        );
      });
  }, [notes, query, activeTab]);

  const stats = useMemo(() => {
    const total = notes.length;
    const privadas = notes.filter((n) => n.is_private || n.category === "PRIVADO").length;
    const pinned = notes.filter((n) => n.pinned).length;

    // “insights ia” fake / placeholder — se quiser eu integro com seu aiService depois.
    const insights = Math.min(12, Math.max(0, total * 3));

    return { total, privadas, insights, pinned };
  }, [notes]);

  function openCreate() {
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("GERAL");
    setFormPrivate(false);
    setFormPinned(false);
    setIsModalOpen(true);
    setError(null);
  }

  function openEdit(n: NoteRow) {
    setEditingId(n.id);
    setFormTitle(n.title);
    setFormContent(n.content);
    setFormCategory(n.category);
    setFormPrivate(n.is_private);
    setFormPinned(n.pinned);
    setIsModalOpen(true);
    setError(null);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setEditingId(null);
  }

  async function saveNote() {
    const title = formTitle.trim();
    const content = formContent.trim();

    if (!title || !content) {
      setError("Preencha título e conteúdo.");
      return;
    }

    setSaving(true);
    setError(null);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const uid = authData?.user?.id;

    if (authErr || !uid) {
      setSaving(false);
      setError("Sem usuário autenticado.");
      return;
    }

    const payload = {
      title,
      content,
      category: formCategory,
      is_private: formPrivate || formCategory === "PRIVADO",
      pinned: formPinned,
      created_by: uid,
    };

    if (!editingId) {
      const { data, error } = await supabase
        .from("notes")
        .insert([payload])
        .select("id,title,content,category,is_private,pinned,created_by,created_at,updated_at")
        .single();

      if (error) {
        console.error(error);
        setError(error.message ?? "Erro ao criar nota.");
      } else {
        setNotes((prev) => [data as NoteRow, ...prev]);
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from("notes")
        .update({
          title: payload.title,
          content: payload.content,
          category: payload.category,
          is_private: payload.is_private,
          pinned: payload.pinned,
        })
        .eq("id", editingId)
        .select("id,title,content,category,is_private,pinned,created_by,created_at,updated_at")
        .single();

      if (error) {
        console.error(error);
        setError(error.message ?? "Erro ao salvar edição.");
      } else {
        setNotes((prev) => prev.map((x) => (x.id === editingId ? (data as NoteRow) : x)));
        setIsModalOpen(false);
      }
    }

    setSaving(false);
  }

  async function togglePinned(n: NoteRow) {
    setError(null);
    const next = !n.pinned;

    setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, pinned: next } : x)));

    const { error } = await supabase.from("notes").update({ pinned: next }).eq("id", n.id);
    if (error) {
      console.error(error);
      setError(error.message ?? "Erro ao fixar nota.");
      setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, pinned: n.pinned } : x)));
    } else {
      // reordena localmente: pinned primeiro, depois updated_at
      setNotes((prev) =>
        [...prev].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return String(b.updated_at).localeCompare(String(a.updated_at));
        })
      );
    }
  }

  async function removeNote(id: string) {
    setError(null);

    const prev = notes;
    setNotes((p) => p.filter((x) => x.id !== id));

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error(error);
      setError(error.message ?? "Erro ao excluir nota.");
      setNotes(prev);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[30px] font-black text-slate-900 tracking-tight">Anotações e Insights</div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Capture pensamentos críticos e mantenha o histórico estratégico da unidade.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar notas..."
              className="outline-none text-sm font-bold text-slate-700 w-[220px]"
            />
          </div>

          <button
            onClick={openCreate}
            className="bg-[#0f172a] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} />
            Nova nota
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Privadas</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.privadas}</div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insights IA</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.insights}</div>
        </div>

        <div className="bg-[#0f172a] rounded-[2rem] border border-slate-900 shadow-sm p-6 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Status Notes</div>
            <div className="text-lg font-black mt-1">Organizado</div>
          </div>
          <CheckCircle2 className="text-emerald-400" />
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ERR/LOADING */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center gap-3 text-slate-500 font-bold">
          <Loader2 className="animate-spin" size={18} /> Carregando…
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-sm text-center text-slate-400 font-bold">
          Nenhuma nota encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filtered.map((n) => (
            <div key={n.id} className="bg-white rounded-[2.2rem] border border-slate-100 shadow-sm p-6 hover:bg-slate-50/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className={["text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border", catPillClass(n.category)].join(" ")}>
                  {catLabel(n.category)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinned(n)}
                    className={["p-2 rounded-xl border transition-colors", n.pinned ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"].join(" ")}
                    title="Fixar"
                  >
                    <Pin size={14} />
                  </button>

                  <button
                    onClick={() => openEdit(n)}
                    className="p-2 rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => removeNote(n.id)}
                    className="p-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-[16px] font-black text-slate-900 leading-tight">{n.title}</div>
                <div className="text-[12px] font-bold text-slate-500 mt-2 line-clamp-3 whitespace-pre-wrap">
                  {n.content}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-300">
                <span>{fmt(n.updated_at)}</span>
                {n.is_private && <span className="text-violet-400">Privado</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREATE/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[220] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-8 bg-[#0f172a] text-white relative">
              <button
                onClick={closeModal}
                className="absolute right-6 top-6 p-2 rounded-xl bg-white/10 hover:bg-white/20"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>

              <div className="text-2xl font-black tracking-tight">
                {editingId ? "Editar Nota" : "Nova Nota"}
              </div>
              <div className="text-slate-300 text-xs mt-1 font-bold">
                Notes System • GNR1
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Título
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Acompanhamento Carlos S."
                  className="w-full p-5 bg-slate-50/60 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Conteúdo
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  placeholder="Escreva sua nota aqui..."
                  className="w-full p-5 bg-slate-50/60 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-5 bg-slate-50/60 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 appearance-none"
                  >
                    <option value="GERAL">GERAL</option>
                    <option value="FEEDBACK">FEEDBACK</option>
                    <option value="INTERVENCAO">INTERVENÇÃO</option>
                    <option value="PRIVADO">PRIVADO</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                  <input
                    type="checkbox"
                    checked={formPrivate}
                    onChange={(e) => setFormPrivate(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="text-[11px] font-black text-slate-700">Privada</div>
                    <div className="text-[10px] font-bold text-slate-400">Só você vê</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                  <input
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="text-[11px] font-black text-slate-700">Fixar</div>
                    <div className="text-[10px] font-bold text-slate-400">Fica no topo</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-6 py-4 rounded-2xl border border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  onClick={saveNote}
                  disabled={saving}
                  className={[
                    "px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2",
                    saving ? "bg-slate-300 text-slate-600" : "bg-[#0f172a] text-white hover:bg-blue-600",
                  ].join(" ")}
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? "Salvar" : "Criar nota"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* refresh small */}
      <div className="pt-2">
        <button
          onClick={load}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
        >
          Recarregar notas
        </button>
      </div>
    </div>
  );
}
