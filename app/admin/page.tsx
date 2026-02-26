'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'none' | 'name' | 'cert'>('none');
  const [namePos, setNamePos] = useState({ x: 50, y: 50 });
  const [certPos, setCertPos] = useState({ x: 10, y: 10 });

  // State Management
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [claimed, setClaimed] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  
  // State for Dynamic Prefix Preview
  const [certPrefix, setCertPrefix] = useState('CERT/EVENT/2026');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/admin/participants');
      const data = await res.json();
      setWhitelist(data.whitelist || []);
      setClaimed(data.claimed || []);
    } catch (err) {
      console.error("Gagal refresh data:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addWhitelist = async () => {
    if (!newName) return;
    await fetch('/api/admin/participants', {
      method: 'POST',
      body: JSON.stringify({ name: newName })
    });
    setNewName('');
    refreshData();
  };

  const deleteWhitelist = async (id: number) => {
    if (!confirm('Hapus nama ini dari daftar?')) return;
    await fetch('/api/admin/participants', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    refreshData();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMode === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeMode === 'name') setNamePos({ x: xPercent, y: yPercent });
    else if (activeMode === 'cert') setCertPos({ x: xPercent, y: yPercent });
    
    setActiveMode('none'); 
  };

  const handleSubmitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget; 
    const formData = new FormData(form);
    
    formData.append('nameX', namePos.x.toString());
    formData.append('nameY', namePos.y.toString());
    formData.append('certX', certPos.x.toString());
    formData.append('certY', certPos.y.toString());

    try {
      const res = await fetch('/api/events', { method: 'POST', body: formData });
      if (res.ok) {
        alert('Event CertiFlow berhasil di-publish!');
        form.reset(); 
        setPreviewUrl(null);
      } else {
        const err = await res.json();
        alert('Gagal: ' + err.error);
      }
    } catch (error) {
      alert('Koneksi bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfdfe] p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">CertiFlow Admin</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Management Console</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server Status</p>
              <p className="text-xs font-bold text-green-500">Operational</p>
            </div>
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
            </div>
          </div>
        </div>

        {/* SECTION 1: EVENT CREATOR */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <h2 className="text-xl font-black mb-6">Setup Event</h2>
              
              <form onSubmit={handleSubmitEvent} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Input Expiry Date */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Event Deadline (Optional)
                    </label>
                    <input 
                      type="datetime-local" 
                      name="expiryDate" 
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-bold text-sm" 
                    />
                    <p className="text-[9px] text-slate-400 mt-1 ml-1">*Kosongkan jika tidak ada batas waktu</p>
                  </div>

                  {/* Status Preview */}
                  <div className="flex flex-col justify-end">
                    <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400">Auto-Status:</span>
                      <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
                {/* Event Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Event Name</label>
                  <input type="text" name="eventName" required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm" placeholder="e.g. Workshop React 2026" />
                </div>

                {/* DYNAMIC PREFIX INPUT */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Cert Number Format</label>
                  <input 
                    type="text" 
                    name="certPrefix" 
                    value={certPrefix}
                    onChange={(e) => setCertPrefix(e.target.value.toUpperCase())}
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-mono font-bold text-sm" 
                    placeholder="e.g. SKILL/UX/2026" 
                  />
                  <div className="mt-3 p-3 bg-slate-900 rounded-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Preview Nomor:</p>
                    <p className="text-xs font-mono text-emerald-400 font-bold">{certPrefix}/001</p>
                  </div>
                </div>

                {/* Template Upload */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Template PDF</label>
                  <input type="file" name="file" accept="application/pdf" onChange={handleFileChange} required className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer" />
                </div>

                {/* Coordinate Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setActiveMode('name')} className={`p-4 rounded-2xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${activeMode === 'name' ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 'bg-white text-blue-600 border-blue-50'}`}>
                    {activeMode === 'name' ? 'Click on PDF' : 'Set Name Area'}
                  </button>
                  <button type="button" onClick={() => setActiveMode('cert')} className={`p-4 rounded-2xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${activeMode === 'cert' ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse' : 'bg-white text-emerald-600 border-emerald-50'}`}>
                    {activeMode === 'cert' ? 'Click on PDF' : 'Set No Area'}
                  </button>
                </div>

                <button type="submit" disabled={loading || !previewUrl} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black disabled:bg-slate-200 transition-all shadow-xl shadow-slate-200">
                  {loading ? 'Saving Data...' : 'Publish Event'}
                </button>
              </form>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="lg:col-span-2 bg-white p-4 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
            {previewUrl ? (
              <div className="relative w-full aspect-[1.414/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div className={`absolute inset-0 z-10 ${activeMode !== 'none' ? 'cursor-crosshair bg-slate-900/5' : ''}`} onClick={handlePreviewClick}>
                  <motion.div 
                    animate={{ scale: activeMode === 'name' ? 1.1 : 1 }}
                    className="absolute bg-blue-600 text-white px-4 py-2 text-[10px] font-black rounded-full shadow-2xl transform -translate-x-1/2 -translate-y-1/2 uppercase tracking-tighter flex items-center gap-2" 
                    style={{ left: `${namePos.x}%`, top: `${namePos.y}%` }}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    Name Position
                  </motion.div>
                  <motion.div 
                    animate={{ scale: activeMode === 'cert' ? 1.1 : 1 }}
                    className="absolute bg-emerald-600 text-white px-4 py-2 text-[10px] font-black rounded-full shadow-2xl transform -translate-x-1/2 -translate-y-1/2 uppercase tracking-tighter flex items-center gap-2" 
                    style={{ left: `${certPos.x}%`, top: `${certPos.y}%` }}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    No. Position
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 opacity-30">
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                <p className="text-sm font-black uppercase tracking-[0.3em]">No Template Loaded</p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: MANAGEMENT */}
        <section className="grid lg:grid-cols-2 gap-8">
          {/* WHITELIST */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              Whitelist Participants
            </h2>
            <div className="flex gap-3 mb-8">
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWhitelist()} className="flex-1 bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl outline-none focus:bg-white focus:border-amber-500 text-sm font-bold transition-all" placeholder="Type participant name..." />
              <button onClick={addWhitelist} className="bg-amber-500 text-white px-8 rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-100">+</button>
            </div>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {whitelist.length > 0 ? whitelist.map(w => (
                <div key={w.id} className="group flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent hover:border-slate-200 transition-all">
                  <span className="text-sm font-bold text-slate-700">{w.name}</span>
                  <button onClick={() => deleteWhitelist(w.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              )) : <div className="p-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Database Empty</div>}
            </div>
          </div>

          {/* CLAIM LOGS */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              Claim History
            </h2>
            <div className="overflow-hidden border border-slate-100 rounded-[1.5rem]">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Certificate No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claimed.length > 0 ? claimed.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                         <p className="text-sm font-black text-slate-800">{c.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{c.event?.eventName}</p>
                      </td>
                      <td className="p-5 text-center">
                        <span className="bg-slate-900 text-emerald-400 px-3 py-2 rounded-xl text-[10px] font-mono font-black shadow-lg shadow-slate-900/10">
                          {c.certNo}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="p-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No Claims Yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}