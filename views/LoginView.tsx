import React, { useState } from 'react'
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react'

import { signIn } from '../services/authService'

interface LoginViewProps {
  onLogin: () => void
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      onLogin()
    } catch (e: any) {
      setError(e?.message ?? 'Falha no login. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-['Inter']">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px]" />

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] border border-white overflow-hidden relative z-10">
        {/* Lado Esquerdo: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-[#0f172a] text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-16">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
                <Activity size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter leading-none">GNR1</h1>
                <p className="text-[10px] text-blue-400 uppercase tracking-[0.4em] font-black mt-1">
                  Intelligence Platform
                </p>
              </div>
            </div>

            <h2 className="text-5xl font-black tracking-tighter leading-[1.1] mb-8">
              Controle total da <span className="text-blue-500">Saúde Mental Corporativa.</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-md leading-relaxed">
              Acesse o painel restrito para monitorar indicadores de bem-estar e risco psicossocial.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center pt-8 border-t border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Versão 1.0.0-PRO
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                © 2026 GNR1 LABS
              </span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Login */}
        <div className="p-10 md:p-20 flex flex-col justify-center">
          <div className="mb-10">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Sparkles size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Acesso Restrito
              </span>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">
              Login Administrativo
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                E-mail de Acesso
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  required
                  placeholder="gestor@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Senha
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-fade-in">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <p className="text-[11px] font-bold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-6 bg-[#0f172a] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-2 ${
                isLoading ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando Chave...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <p className="text-[10px] font-bold text-blue-900 leading-tight">
              Criptografia RSA 2048-bit ativa. Suas credenciais são processadas em ambiente isolado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginView
