'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type EventData = {
  id: number;
  eventName: string;
};

export default function Home() {
  const [name, setName] = useState('');
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State untuk Custom Alert
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetch('/api/get-events')
      .then(res => res.json())
      .then(data => {
        if (data.events) setEvents(data.events);
      })
      .catch(err => console.error("Gagal ambil event", err));
  }, []);

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertConfig({ show: true, type, title, message });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      showAlert('error', 'Ops!', 'Silakan pilih event terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, eventId: selectedEventId }),
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
        
        showAlert('success', 'Berhasil!', 'Sertifikat kamu sedang diunduh. Selamat ya!');
      } else {
        const errorData = await res.json();
        showAlert('error', 'Gagal!', errorData.error || "Nama kamu tidak terdaftar.");
      }
    } catch (error) {
      showAlert('error', 'Koneksi Error', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-4">
      {/* Custom Alert Modal */}
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
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
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
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="pt-14 pb-8 px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] mb-8 shadow-2xl shadow-slate-900/20 transform -rotate-3">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-[900] text-slate-900 tracking-tighter">CertiFlow</h1>
          <p className="text-slate-400 mt-2 text-sm font-semibold tracking-wide uppercase italic">Digital Credential Platform</p>
        </div>
        

        <div className="p-10 pt-2">
          <form onSubmit={handleGenerate} className="space-y-6">

            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="..." 
              required
            >
              <option value="" disabled>-- Choose Your Event --</option>
              {events.map((ev: any) => {
                const isExpired = ev.expiryDate && new Date() > new Date(ev.expiryDate);
                return (
                  <option key={ev.id} value={ev.id} disabled={isExpired} className={isExpired ? 'text-slate-300' : ''}>
                    {ev.eventName} {isExpired ? '(EXPIRED / CLOSED)' : ''}
                  </option>
                );
              })}
            </select>
            
            {/* Input Event */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Select Program</label>
              <div className="relative group">
                <select 
                  value={selectedEventId} 
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 text-slate-900 text-sm rounded-2xl focus:bg-white focus:border-slate-900 block p-4.5 appearance-none cursor-pointer outline-none transition-all font-bold shadow-sm"
                  required
                >
                  <option value="" disabled>-- Choose Your Event --</option>
                  {events.length > 0 ? (
                    events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.eventName}</option>
                    ))
                  ) : (
                    <option disabled>Fetching events...</option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Input Nama */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your registered name..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 text-slate-900 text-sm rounded-2xl focus:bg-white focus:border-slate-900 block p-4.5 outline-none transition-all placeholder:text-slate-300 font-bold shadow-sm"
                required
              />
            </div>

            {/* Button */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full flex items-center justify-center gap-4 py-5 px-8 rounded-2xl font-[900] text-xs uppercase tracking-[0.25em] text-white transition-all active:scale-[0.96] shadow-2xl ${
                  loading 
                  ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' 
                  : 'bg-slate-900 hover:bg-black shadow-slate-200'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>Get Certificate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 mb-2 flex flex-col items-center gap-3">
            <div className="h-px w-12 bg-slate-100"></div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Official Digital Certification</p>
          </div>
        </div>
      </div>
    </main>
  );
}