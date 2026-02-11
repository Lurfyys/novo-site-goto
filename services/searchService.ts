import { supabase } from "./supabaseClient";

export async function searchEmployeesScoped(q: string) {
  const { data, error } = await supabase
    .from("v_company_employees_real") // <-- TROCAR AQUI se for outra
    .select("user_id, name, department, entries") // <-- colunas da view
    .ilike("name", `%${q}%`)
    .limit(3);

  if (error) throw error;
  return data ?? [];
}

export async function searchAlertsScoped(q: string) {
  const { data, error } = await supabase
    .from("v_global_recent_alerts") // <-- TROCAR AQUI se for outra
    .select("id, title, description, type, created_at, user_id") // ajuste colunas
    .ilike("title", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
