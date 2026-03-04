'use client';
// app/e/[slug]/page.tsx
// Halaman publik per event — peserta langsung akses tanpa pilih event
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';

type EventData = {
  id: number;
  eventName: string;
  slug: string;
  isActive: boolean;
  expiryDate?: string | null;
};

export default function EventSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  // Fetch event by slug
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/e/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.event) {
          setEvent(data.event);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false));
  }, [slug]);

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertConfig({ show: true, type, title, message });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/e/${slug}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sertifikat_${name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showAlert('success', 'Berhasil!', 'Sertifikat kamu sedang diunduh. Selamat ya!');
      } else {
        const errorData = await res.json();
        showAlert('error', 'Gagal!', errorData.error || 'Nama kamu tidak terdaftar.');
      }
    } catch {
      showAlert('error', 'Koneksi Error', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#fcfdfe] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </main>
    );
  }

  // ─── Not Found ────────────────────────────────────────────────────────────
  if (notFound || !event) {
    return (
      <main className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-[2rem] mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Event Tidak Ditemukan</h1>
          <p className="text-slate-400 mt-2 text-sm font-semibold">Link yang kamu akses tidak valid atau sudah dihapus.</p>
        </div>
      </main>
    );
  }

  // ─── Expired / Inactive ───────────────────────────────────────────────────
  const isExpired = !!event.expiryDate && new Date() > new Date(event.expiryDate);
  const isClosed = !event.isActive || isExpired;  

  return (
    <main className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-4">
      {/* Alert Modal */}
      <AnimatePresence>
        {alertConfig.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${alertConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {alertConfig.type === 'success' ? (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{alertConfig.title}</h3>
              <p className="text-slate-500 font-medium mb-8">{alertConfig.message}</p>
              <button
                onClick={() => setAlertConfig({ ...alertConfig, show: false })}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="pt-14 pb-8 px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] mb-8 shadow-2xl shadow-slate-900/20 transform -rotate-3">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-[900] text-slate-900 tracking-tighter">CertiFlow</h1>
          <p className="text-slate-400 mt-1 text-sm font-semibold tracking-wide uppercase italic">Digital Credential Platform</p>

          {/* Event name badge */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className={`w-2 h-2 rounded-full ${isClosed ? 'bg-rose-400' : 'bg-emerald-400'}`} />
            <span className="text-xs font-black text-slate-700 tracking-wide">{event.eventName}</span>
          </div>

          {/* Closed / Expired warning */}
          {isClosed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 mx-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center"
            >
              <p className="text-xs font-black text-rose-600 uppercase tracking-wider">
                {!event.isActive ? '⛔ Event ini sudah ditutup oleh admin.' : `⏰ Masa klaim berakhir pada ${new Date(event.expiryDate!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
              </p>
            </motion.div>
          )}
        </div>

        <div className="p-10 pt-2">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your registered name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isClosed}
                className="w-full bg-slate-50 border-2 border-slate-50 text-slate-900 text-sm rounded-2xl focus:bg-white focus:border-slate-900 block p-4 outline-none transition-all placeholder:text-slate-300 font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !!isClosed}
                className={`w-full flex items-center justify-center gap-4 py-5 px-8 rounded-2xl font-[900] text-xs uppercase tracking-[0.25em] text-white transition-all active:scale-[0.96] shadow-2xl ${
                  loading || isClosed
                    ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none'
                    : 'bg-slate-900 hover:bg-black shadow-slate-200'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Get Certificate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 mb-2 flex flex-col items-center gap-3">
            <div className="h-px w-12 bg-slate-100" />
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Official Digital Certification</p>
          </div>
        </div>
      </div>
    </main>
  );
}