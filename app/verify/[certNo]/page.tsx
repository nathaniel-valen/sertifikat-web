'use client';
// app/verify/[certNo]/page.tsx
// Halaman publik — verifikasi nomor sertifikat
// Akses: /verify/001-CERT-2026 (ganti / dengan - di URL)
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

type VerifyResult = {
  valid: boolean;
  name?: string;
  certNo?: string;
  eventName?: string;
  date?: string;
};

export default function VerifyPage() {
  const { certNo: certNoParam } = useParams<{ certNo: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Decode URL param — "/" di certNo di-encode jadi "-" di URL
  const certNo = decodeURIComponent(certNoParam || '').replace(/-/g, '/');

  useEffect(() => {
    if (!certNo) return;
    fetch(`/api/verify?certNo=${encodeURIComponent(certNo)}`)
      .then(res => res.json())
      .then(data => setResult(data))
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [certNo]);

  return (
    <main className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-4">
      {/* Background Decor */}
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
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[2rem] mb-8 shadow-2xl transform -rotate-3 ${loading ? 'bg-slate-200' : result?.valid ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {loading ? (
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : result?.valid ? (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h1 className="text-3xl font-[900] text-slate-900 tracking-tighter">CertiFlow</h1>
          <p className="text-slate-400 mt-1 text-sm font-semibold tracking-wide uppercase italic">Certificate Verification</p>
        </div>

        <div className="px-10 pb-12">
          {loading && (
            <div className="text-center py-8">
              <p className="text-slate-400 font-bold text-sm">Memverifikasi sertifikat...</p>
            </div>
          )}

          {!loading && result?.valid && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Valid badge */}
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Sertifikat Valid</span>
              </div>

              {/* Detail sertifikat */}
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nama Penerima</p>
                  <p className="text-lg font-black text-slate-900">{result.name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">No. Sertifikat</p>
                  <p className="text-sm font-mono font-black text-slate-900">{result.certNo}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Event</p>
                  <p className="text-sm font-bold text-slate-900">{result.eventName}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tanggal Klaim</p>
                  <p className="text-sm font-bold text-slate-900">
                    {result.date && new Date(result.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {!loading && !result?.valid && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-3 bg-rose-50 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Sertifikat Tidak Valid</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <p className="text-sm font-bold text-slate-500">
                  Nomor sertifikat <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded-lg text-slate-700">{certNo}</code> tidak ditemukan dalam sistem kami.
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="h-px w-12 bg-slate-100" />
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Official Digital Certification</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}