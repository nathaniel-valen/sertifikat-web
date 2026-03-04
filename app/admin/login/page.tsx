'use client';
import { Suspense } from 'react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Pisah komponen yang pakai useSearchParams ke dalam komponen sendiri
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email atau password salah.');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
      >
        <div className="pt-14 pb-8 px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] mb-8 shadow-2xl shadow-slate-900/20 transform -rotate-3">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-[900] text-slate-900 tracking-tighter">Admin Panel</h1>
          <p className="text-slate-400 mt-2 text-sm font-semibold tracking-wide uppercase italic">CertiFlow Dashboard</p>
        </div>

        <div className="p-10 pt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl"
              >
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-xs font-bold text-rose-600">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email</label>
              <input type="email" placeholder="admin@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 text-slate-900 text-sm rounded-2xl focus:bg-white focus:border-slate-900 block p-4 outline-none transition-all placeholder:text-slate-300 font-bold shadow-sm"
                required />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 text-slate-900 text-sm rounded-2xl focus:bg-white focus:border-slate-900 block p-4 outline-none transition-all placeholder:text-slate-300 font-bold shadow-sm"
                required />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading}
                className={`w-full flex items-center justify-center gap-4 py-5 px-8 rounded-2xl font-[900] text-xs uppercase tracking-[0.25em] text-white transition-all active:scale-[0.96] shadow-2xl ${
                  loading ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' : 'bg-slate-900 hover:bg-black shadow-slate-200'
                }`}>
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 mb-2 flex flex-col items-center gap-3">
            <div className="h-px w-12 bg-slate-100" />
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Restricted Access</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

// ← Wrap dengan Suspense di default export
export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}