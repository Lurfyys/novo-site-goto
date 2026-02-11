import { supabase } from './supabaseClient'

export type EmployeeContact = {
  email: string | null
  phone: string | null
  cpf: string | null
  role: string | null
}

export async function fetchEmployeeContact(employeeId: string): Promise<EmployeeContact> {
  if (!employeeId) {
    console.log('[fetchEmployeeContact] employeeId vazio')
    return { email: null, phone: null, cpf: null, role: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('email, phone, cpf, role')
    .eq('id', employeeId) // ✅ SOMENTE ID
    .maybeSingle()

  console.log('[fetchEmployeeContact]', {
    employeeId,
    data,
    error
  })

  if (error) {
    console.error('[fetchEmployeeContact ERROR]', error)
    throw error
  }

  return {
    email: data?.email ?? null,
    phone: data?.phone ?? null,
    cpf: data?.cpf ?? null,
    role: data?.role ?? null
  }
}
