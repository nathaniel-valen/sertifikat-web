'use client';
// app/page.tsx — Landing page publik CertiFlow
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';

type EventData = {
  id: number;
  eventName: string;
  slug: string;
  isActive: boolean;
  expiryDate?: string | null;
};

// ─── Floating particle background (Fixed) ────────────────────────────────────
const Particles = dynamic(() => Promise.resolve(function ParticlesClient() {
  const [mounted, setMounted] = useState(false);
  const [particles] = useState(() =>
    [...Array(25)].map((_, i) => ({
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      color: i % 3 === 0 ? '#C9A84C' : i % 3 === 1 ? '#cbd5e1' : '#94a3b8',
      opacity: Math.random() * 0.5 + 0.2,
      duration: Math.random() * 10 + 10, // Lebih lambat agar elegan
      delay: Math.random() * 5,
    }))
  );

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: p.width, height: p.height, left: p.left, top: p.top, backgroundColor: p.color, opacity: p.opacity }}
          animate={{ 
            y: [0, -100, 0], 
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity] 
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}), { ssr: false });

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: {
  icon: React.ReactNode; title: string; desc: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
    >
      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({ 
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch('/api/get-events')
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setEvents(data.events.filter((e: EventData) => e.isActive));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  }, []);

  const activeEvents = events.filter(ev => {
    if (!ev.isActive) return false;
    if (ev.expiryDate && new Date() > new Date(ev.expiryDate)) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#fcfdfe] font-sans overflow-x-hidden">

      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-5 bg-white/70 backdrop-blur-xl border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">CertiFlow</span>
        </div>
        {/* Admin Link Hidden as requested */}
      </motion.nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-[-5%] w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[100px]" />
        </div>
        
        <Particles />

        <motion.div 
            style={{ y: heroY, opacity: heroOpacity }} 
            className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-full mb-10 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Trusted Credential Partner</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-7xl md:text-[100px] font-black tracking-tighter text-slate-900 leading-[0.85] mb-8"
          >
            Sertifikat
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-amber-600 to-slate-800">
              Digital.
            </span>
            <span className="block text-4xl md:text-6xl text-slate-400 font-black mt-4">Cepat & Terverifikasi.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Platform mandiri untuk klaim sertifikat event Anda. Masukkan nama, verifikasi data, dan unduh sertifikat resmi dalam sekejap.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="#events"
              className="group flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-black transition-all shadow-2xl shadow-slate-900/30 active:scale-95">
              <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Cari Event Anda
            </a>
            <a href="#verify"
              className="flex items-center gap-3 px-10 py-5 bg-white text-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-50 transition-all border border-slate-200 active:scale-95">
              Validasi Kode
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 bg-white relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard delay={0.1} title="Self-Service"
              desc="Peserta dapat mengklaim sertifikat secara mandiri hanya dengan mengetikkan nama mereka."
              icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
            <FeatureCard delay={0.2} title="QR Verification"
              desc="Setiap lembar sertifikat dilengkapi kode unik dan QR untuk menjamin keaslian dokumen."
              icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
            <FeatureCard delay={0.3} title="Anti-Fraud"
              desc="Sistem proteksi memastikan satu nama hanya bisa melakukan klaim sesuai data manifes."
              icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
          </div>
        </div>
      </section>

      {/* ─── Active Events (List) ────────────────────────────────────────── */}
      <section id="events" className="py-32 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-600 mb-4">Available Now</p>
              <h2 className="text-5xl font-black tracking-tighter text-slate-900">Event yang Tersedia</h2>
            </div>
            <p className="text-slate-500 font-medium max-w-xs italic">
                Sertifikat tersedia hingga batas waktu yang ditentukan penyelenggara.
            </p>
          </div>

          {loadingEvents ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 5-8-5" strokeWidth="2" /></svg>
               </div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Belum ada event aktif</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEvents.map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/e/${ev.slug}`}
                    className="group block p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-slate-900 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full">Active</div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-amber-600 transition-colors">{ev.eventName}</h3>
                    {ev.expiryDate && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        Berakhir: {new Date(ev.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Verify Section ───────────────────────────────────────────────── */}
      <section id="verify" className="py-32 px-6 bg-white relative">
        <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Verification Center</p>
            <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-6">Validasi Sertifikat</h2>
            <p className="text-slate-500 font-medium mb-12 max-w-lg mx-auto leading-relaxed">
                Keaslian adalah prioritas kami. Masukkan kode unik yang tertera pada bagian bawah sertifikat Anda.
            </p>
            <div className="max-w-xl mx-auto">
                <VerifyForm />
            </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-20 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">CertiFlow</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-8">© 2024 CertiFlow Digital Credential</p>
          <div className="h-px w-20 bg-slate-800 mb-8" />
          <p className="text-slate-600 text-[10px] max-w-sm leading-relaxed uppercase tracking-widest font-medium">
            Sistem penerbitan sertifikat digital otomatis yang aman, cepat, dan mudah diverifikasi oleh institusi manapun.
          </p>
        </div>
      </footer>
    </main>
  );
}

function VerifyForm() {
  const [certNo, setCertNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNo.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify?certNo=${encodeURIComponent(certNo.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleVerify} className="relative group">
        <input
          type="text"
          value={certNo}
          onChange={e => setCertNo(e.target.value)}
          placeholder="Contoh: CF-2024-XXXX"
          className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 text-base rounded-[2rem] focus:bg-white focus:border-slate-900 p-6 pr-32 outline-none transition-all font-bold placeholder:text-slate-300 font-mono shadow-inner"
        />
        <button type="submit" disabled={loading || !certNo.trim()}
          className="absolute right-3 top-3 bottom-3 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40 shadow-xl shadow-slate-900/20">
          {loading ? '...' : 'Cek Sekarang'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-8 rounded-[2.5rem] border-2 text-left shadow-2xl ${result.valid ? 'bg-emerald-50/50 border-emerald-100 shadow-emerald-100/50' : 'bg-rose-50/50 border-rose-100 shadow-rose-100/50'}`}
          >
            {result.valid ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-[0.2em]">Verified Authenticity</span>
                  </div>
                  <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Nama Lengkap</p>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{result.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">ID Sertifikat</p>
                    <p className="font-mono font-black text-slate-900 text-lg">{result.certNo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Nama Event</p>
                    <p className="font-bold text-slate-800 leading-tight">{result.eventName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Tanggal Terbit</p>
                    <p className="font-bold text-slate-800">
                      {new Date(result.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 py-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                    <p className="text-lg font-black text-rose-900 leading-none mb-1">Data Tidak Ditemukan</p>
                    <p className="text-sm font-medium text-rose-600">Mohon periksa kembali nomor sertifikat Anda.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}