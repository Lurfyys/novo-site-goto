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
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-[24px] sm:text-[30px] font-black text-slate-900 tracking-tight">
            Anotações e Insights
          </div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Capture pensamentos críticos e mantenha o histórico estratégico da unidade.
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="flex w-full items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm sm:w-auto lg:min-w-[280px]">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar notas..."
              className="outline-none text-sm font-bold text-slate-700 w-full bg-transparent"
            />
          </div>

          <button
            onClick={openCreate}
            className="w-full sm:w-auto bg-[#0f172a] text-white px-5 sm:px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} />
            Nova nota
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
          <CheckCircle2 className="text-emerald-400 shrink-0" />
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max px-1">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={[
                  "px-4 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filtered.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-6 hover:bg-slate-50/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={[
                    "text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border max-w-[140px] truncate",
                    catPillClass(n.category),
                  ].join(" ")}
                >
                  {catLabel(n.category)}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePinned(n)}
                    className={[
                      "p-2 rounded-xl border transition-colors",
                      n.pinned
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50",
                    ].join(" ")}
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

              <div className="mt-5 min-w-0">
                <div className="text-[16px] font-black text-slate-900 leading-tight break-words">
                  {n.title}
                </div>
                <div className="text-[12px] font-bold text-slate-500 mt-2 line-clamp-3 whitespace-pre-wrap break-words">
                  {n.content}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
                <span>{fmt(n.updated_at)}</span>
                {n.is_private && <span className="text-violet-400 shrink-0">Privado</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[220] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-[560px] bg-white rounded-[26px] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0f172a] px-5 py-4 text-white flex items-start justify-between">
              <div>
                <div className="text-[18px] sm:text-[20px] font-black">
                  {editingId ? "Editar nota" : "Nova nota"}
                </div>
                <div className="text-[11px] text-slate-300 font-bold mt-1">
                  Notes System • GNR1
                </div>
              </div>

              <button
                onClick={closeModal}
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Título
                  </label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Acompanhamento Carlos S."
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Conteúdo
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={5}
                    placeholder="Escreva sua nota aqui..."
                    className="w-full min-h-[140px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Categoria
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as NoteRow["category"])}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 appearance-none"
                    >
                      <option value="GERAL">GERAL</option>
                      <option value="FEEDBACK">FEEDBACK</option>
                      <option value="INTERVENCAO">INTERVENÇÃO</option>
                      <option value="PRIVADO">PRIVADO</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPrivate}
                      onChange={(e) => setFormPrivate(e.target.checked)}
                      className="h-4 w-4 shrink-0"
                    />
                    <div className="leading-tight">
                      <div className="text-[11px] font-black text-slate-700">Privada</div>
                      <div className="text-[10px] font-bold text-slate-400">Só você vê</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPinned}
                      onChange={(e) => setFormPinned(e.target.checked)}
                      className="h-4 w-4 shrink-0"
                    />
                    <div className="leading-tight">
                      <div className="text-[11px] font-black text-slate-700">Fixar</div>
                      <div className="text-[10px] font-bold text-slate-400">Fica no topo</div>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="w-full sm:w-auto h-12 px-6 rounded-2xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={saveNote}
                    disabled={saving}
                    className={[
                      "w-full sm:w-auto h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2",
                      saving
                        ? "bg-slate-300 text-slate-600"
                        : "bg-[#0f172a] text-white hover:bg-blue-600",
                    ].join(" ")}
                  >
                    {saving && <Loader2 className="animate-spin" size={16} />}
                    {editingId ? "Salvar" : "Criar nota"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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