'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import PdfPreviewCanvas from './PdfPreviewCanvas';

const ImportModal = dynamic(() => import('./ImportParticipantsModal'), { ssr: false });

type WhitelistEntry = { id: number; name: string; createdAt: string };
type Certificate = { id: number; name: string; certNo: string | null; date: string };
type EventSummary = {
  id: number;
  eventName: string;
  certPrefix: string;
  isActive: boolean;
  expiryDate: string | null;
  templateUrl: string;
  nameX: number; nameY: number;
  certX: number; certY: number;
  createdAt: string;
  _count: { whitelists: number; certificates: number };
};
type EventDetail = EventSummary & {
  whitelists: WhitelistEntry[];
  certificates: Certificate[];
};
type TabView = 'create' | number;

function useToast() {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });
  const show = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };
  return { toast, show };
}

function Spinner() {
  return (
    <svg className="animate-spin h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 ml-1">{label}</label>
      {children}
    </div>
  );
}

function PosMarker({ label, pos, color, active }: {
  label: string;
  pos: { x: number; y: number };
  color: 'blue' | 'emerald';
  active: boolean;
}) {
  return (
    <motion.div
      animate={{ scale: active ? 1.15 : 1 }}
      className={`absolute ${color === 'blue' ? 'bg-blue-600' : 'bg-emerald-600'} text-white px-3 py-1.5 text-[9px] font-black rounded-full shadow-xl transform -translate-x-1/2 -translate-y-1/2 uppercase tracking-tighter flex items-center gap-1.5 pointer-events-none`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      {label}
    </motion.div>
  );
}

export default function AdminPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>('create');
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { toast, show: showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      showToast('Gagal memuat daftar event.', 'error');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openEventTab = async (id: number) => {
    setDetailStatus('loading');
    setSelectedEvent(null);
    setActiveTab(id);
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.event && Array.isArray(data.event.whitelists) && Array.isArray(data.event.certificates)) {
        setSelectedEvent(data.event);
        setDetailStatus('ready');
      } else {
        throw new Error('Data tidak lengkap');
      }
    } catch {
      setDetailStatus('idle');
      showToast('Gagal memuat detail event.', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fb] p-4 md:p-6 font-sans text-slate-900">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-black text-sm text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black tracking-tighter">CertiFlow Admin</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Management Console</p>
          </div>
          <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100 px-4 pt-4 gap-2">
            <button
              onClick={() => { setActiveTab('create'); setDetailStatus('idle'); }}
              className={`flex-shrink-0 px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'create' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              + New Event
            </button>

            {loadingEvents && [1, 2].map(i => (
              <div key={i} className="flex-shrink-0 w-32 h-10 rounded-t-2xl bg-slate-100 animate-pulse" />
            ))}

            {!loadingEvents && events.map(ev => (
              <button
                key={ev.id}
                onClick={() => openEventTab(ev.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === ev.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                <span className="max-w-[120px] truncate">{ev.eventName}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${activeTab === ev.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {ev._count.whitelists}
                </span>
              </button>
            ))}

            {!loadingEvents && events.length === 0 && (
              <div className="flex items-center px-4 pb-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Belum ada event — buat yang pertama!
              </div>
            )}
          </div>

          <div className="p-6">
            {activeTab === 'create' && (
              <CreateEventTab onCreated={async () => { await fetchEvents(); showToast('Event berhasil di-publish!'); }} />
            )}
            {activeTab !== 'create' && detailStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Spinner />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Memuat event...</p>
              </div>
            )}
            {activeTab !== 'create' && detailStatus === 'ready' && selectedEvent && (
              <EventDetailTab
                event={selectedEvent}
                onRefresh={() => openEventTab(selectedEvent.id)}
                onDeleted={() => { fetchEvents(); setActiveTab('create'); setSelectedEvent(null); setDetailStatus('idle'); showToast('Event berhasil dihapus.'); }}
                onUpdated={() => { fetchEvents(); openEventTab(selectedEvent.id); showToast('Event berhasil diupdate!'); }}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function CreateEventTab({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);         // ← BARU: simpan File object
  const [activeMode, setActiveMode] = useState<'none' | 'name' | 'cert'>('none');
  const [namePos, setNamePos] = useState({ x: 50, y: 50 });
  const [certPos, setCertPos] = useState({ x: 10, y: 90 });
  const [certPrefix, setCertPrefix] = useState('CERT/EVENT/2026');
  const [previewName, setPreviewName] = useState('');               // ← BARU
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);                                       // ← simpan File, bukan ObjectURL
  };

  // ← BARU: handler klik canvas
  const handleCanvasClick = (x: number, y: number) => {
    if (activeMode === 'name') setNamePos({ x, y });
    else if (activeMode === 'cert') setCertPos({ x, y });
    setActiveMode('none');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('nameX', namePos.x.toString());
    formData.append('nameY', namePos.y.toString());
    formData.append('certX', certPos.x.toString());
    formData.append('certY', certPos.y.toString());
    try {
      const res = await fetch('/api/events', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        form.reset();
        setPdfFile(null);
        setCertPrefix('CERT/EVENT/2026');
        setNamePos({ x: 50, y: 50 });
        setCertPos({ x: 10, y: 90 });
        setPreviewName('');
        onCreated();
      } else {
        setError(data.error || 'Gagal publish event.');
      }
    } catch {
      setError('Koneksi bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  // Preview cert no dari prefix yang sedang diketik
  const previewCertNo = `001/${certPrefix}`;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <h2 className="text-lg font-black mb-5">Setup Event Baru</h2>
        {error && <p className="mb-4 text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Event Name">
            <input type="text" name="eventName" required placeholder="e.g. Workshop React 2026" className="input-field" />
          </Field>
          <Field label="Cert Number Format">
            <input
              type="text" name="certPrefix"
              value={certPrefix}
              onChange={e => setCertPrefix(e.target.value.toUpperCase())}
              required placeholder="e.g. SKILL/UX/2026"
              className="input-field font-mono"
            />
            <div className="mt-2 p-2.5 bg-slate-900 rounded-xl">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Preview:</p>
              <p className="text-xs font-mono text-emerald-400 font-bold">001/{certPrefix}</p>
            </div>
          </Field>
          <Field label="Event Deadline (Optional)">
            <input type="datetime-local" name="expiryDate" className="input-field" />
          </Field>
          <Field label="Template PDF">
            <input
              type="file" name="file" accept="application/pdf"
              onChange={handleFileChange} required
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
            />
          </Field>

          {/* ← BARU: Input preview nama */}
          <Field label="Preview Nama (untuk cek posisi)">
            <input
              type="text"
              value={previewName}
              onChange={e => setPreviewName(e.target.value)}
              placeholder="Ketik nama untuk preview..."
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button" onClick={() => setActiveMode('name')}
              className={`p-3 rounded-2xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${activeMode === 'name' ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 'bg-white text-blue-600 border-blue-100'}`}
            >
              {activeMode === 'name' ? 'Klik PDF →' : 'Set Posisi Nama'}
            </button>
            <button
              type="button" onClick={() => setActiveMode('cert')}
              className={`p-3 rounded-2xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${activeMode === 'cert' ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse' : 'bg-white text-emerald-600 border-emerald-100'}`}
            >
              {activeMode === 'cert' ? 'Klik PDF →' : 'Set Posisi No.'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
            <span className="bg-slate-50 p-2 rounded-xl">Name: {namePos.x.toFixed(1)}%, {namePos.y.toFixed(1)}%</span>
            <span className="bg-slate-50 p-2 rounded-xl">No: {certPos.x.toFixed(1)}%, {certPos.y.toFixed(1)}%</span>
          </div>

          <button
            type="submit" disabled={loading || !pdfFile}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Publishing...' : 'Publish Event'}
          </button>
        </form>
      </div>

      {/* ← BARU: Ganti iframe dengan PdfPreviewCanvas */}
      <div className="lg:col-span-2 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center min-h-[500px] overflow-hidden relative p-4">
        <PdfPreviewCanvas
          pdfSource={pdfFile}
          previewName={previewName}
          previewCertNo={previewCertNo}
          namePos={namePos}
          certPos={certPos}
          activeMode={activeMode}
          onCanvasClick={handleCanvasClick}
        />
      </div>
    </div>
  );
}

function EventDetailTab({ event, onRefresh, onDeleted, onUpdated, showToast }: {
  event: EventDetail;
  onRefresh: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [section, setSection] = useState<'participants' | 'edit' | 'claims'>('participants');
  const [newName, setNewName] = useState('');
  const [addingName, setAddingName] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // ✅ Guard
  if (!event || !Array.isArray(event.whitelists) || !Array.isArray(event.certificates)) {
    return <div className="flex justify-center py-32"><Spinner /></div>;
  }

  const isExpired = event.expiryDate && new Date() > new Date(event.expiryDate);

  const toggleActive = async () => {
    const res = await fetch(`/api/events/${event.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !event.isActive }),
    });
    if (res.ok) { onUpdated(); showToast(event.isActive ? 'Event dinonaktifkan.' : 'Event diaktifkan!'); }
    else showToast('Gagal update status.', 'error');
  };

  const deleteEvent = async () => {
    if (!confirm(`Hapus event "${event.eventName}"? Semua data participant & sertifikat akan ikut terhapus!`)) return;
    const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(); else showToast('Gagal hapus event.', 'error');
  };

  const addParticipant = async () => {
    if (!newName.trim()) return;
    setAddingName(true);
    const res = await fetch(`/api/events/${event.id}/whitelist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (res.ok) { setNewName(''); onRefresh(); showToast(`"${newName.trim()}" ditambahkan!`); }
    else showToast(data.error || 'Gagal tambah nama.', 'error');
    setAddingName(false);
  };

  const deleteParticipant = async (id: number, name: string) => {
    if (!confirm(`Hapus "${name}" dari whitelist?`)) return;
    const res = await fetch(`/api/events/${event.id}/whitelist`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { onRefresh(); showToast(`"${name}" dihapus.`); }
    else showToast('Gagal hapus peserta.', 'error');
  };

  return (
    <>
      <AnimatePresence>
        {showImport && (
          <ImportModal eventId={event.id} eventName={event.eventName}
            onClose={() => setShowImport(false)} onImported={() => onRefresh()} />
        )}
      </AnimatePresence>

      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 bg-slate-50 rounded-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-black">{event.eventName}</h2>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${event.isActive && !isExpired ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {isExpired ? 'Expired' : event.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-bold">
              <span>Prefix: <span className="font-mono text-slate-700">{event.certPrefix}</span></span>
              <span>{event._count.whitelists} Participants</span>
              <span>{event._count.certificates} Claimed</span>
              {event.expiryDate && <span>Deadline: {new Date(event.expiryDate).toLocaleString('id-ID')}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={toggleActive} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${event.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
              {event.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={deleteEvent} className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700 hover:bg-rose-200 transition-all">
              Delete Event
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['participants', 'edit', 'claims'] as const).map(s => (
            <button key={s} onClick={() => setSection(s)} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${section === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              {s === 'participants' ? `Participants (${event.whitelists.length})` : s === 'claims' ? `Claims (${event.certificates.length})` : 'Edit Event'}
            </button>
          ))}
        </div>

        {section === 'participants' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addParticipant()}
                placeholder="Ketik nama participant..." className="flex-1 bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl outline-none focus:bg-white focus:border-amber-400 text-sm font-bold transition-all" />
              <button onClick={addParticipant} disabled={addingName || !newName.trim()} className="bg-amber-500 text-white px-5 rounded-2xl font-black hover:bg-amber-600 transition-all disabled:opacity-40 text-lg">+</button>
              <button onClick={() => setShowImport(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 rounded-2xl font-black hover:bg-black transition-all text-[10px] uppercase tracking-wider">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {event.whitelists.length > 0 ? event.whitelists.map((w, i) => (
                <motion.div key={w.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-slate-200 transition-all group">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{w.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button onClick={() => deleteParticipant(w.id, w.name)} className="text-slate-200 group-hover:text-slate-400 hover:!text-rose-500 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </motion.div>
              )) : (
                <div className="py-20 text-center">
                  <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Belum ada participant</p>
                  <button onClick={() => setShowImport(true)} className="mt-4 text-xs font-black text-slate-400 underline underline-offset-4 hover:text-slate-700">Import dari file?</button>
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'edit' && <EditEventForm event={event} onUpdated={onUpdated} showToast={showToast} />}

        {section === 'claims' && (
          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate No</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {event.certificates.length > 0 ? event.certificates.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-bold text-slate-800">{c.name}</td>
                    <td className="p-4"><span className="bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-mono font-black">{c.certNo || '-'}</span></td>
                    <td className="p-4 text-xs text-slate-400 font-bold">{new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="p-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No Claims Yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function EditEventForm({ event, onUpdated, showToast }: {
  event: EventDetail;
  onUpdated: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);        // ← BARU
  const [activeMode, setActiveMode] = useState<'none' | 'name' | 'cert'>('none');
  const [namePos, setNamePos] = useState({ x: event.nameX, y: event.nameY });
  const [certPos, setCertPos] = useState({ x: event.certX, y: event.certY });
  const [previewName, setPreviewName] = useState('');               // ← BARU
  const [certPrefix, setCertPrefix] = useState(event.certPrefix);  // ← BARU: track prefix

  const formatForInput = (d: string | null) => d ? new Date(d).toISOString().slice(0, 16) : '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  // ← BARU: handler klik canvas
  const handleCanvasClick = (x: number, y: number) => {
    if (activeMode === 'name') setNamePos({ x, y });
    else if (activeMode === 'cert') setCertPos({ x, y });
    setActiveMode('none');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('nameX', namePos.x.toString());
    formData.append('nameY', namePos.y.toString());
    formData.append('certX', certPos.x.toString());
    formData.append('certY', certPos.y.toString());
    const res = await fetch(`/api/events/${event.id}`, { method: 'PATCH', body: formData });
    const data = await res.json();
    if (res.ok) onUpdated();
    else showToast(data.error || 'Gagal update.', 'error');
    setLoading(false);
  };

  // Sumber PDF: file baru (jika di-upload) atau URL existing dari Supabase
  const pdfSource = pdfFile ?? event.templateUrl;
  const previewCertNo = `001/${certPrefix}`;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Event Name">
            <input type="text" name="eventName" defaultValue={event.eventName} required className="input-field" />
          </Field>
          <Field label="Cert Number Format">
            <input
              type="text" name="certPrefix"
              defaultValue={event.certPrefix}
              onChange={e => setCertPrefix(e.target.value.toUpperCase())}
              required className="input-field font-mono"
            />
          </Field>
          <Field label="Event Deadline">
            <input type="datetime-local" name="expiryDate" defaultValue={formatForInput(event.expiryDate)} className="input-field" />
          </Field>
          <Field label="Upload Template PDF Baru (opsional)">
            <input
              type="file" name="file" accept="application/pdf"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
            />
          </Field>

          {/* ← BARU: Input preview nama */}
          <Field label="Preview Nama (untuk cek posisi)">
            <input
              type="text"
              value={previewName}
              onChange={e => setPreviewName(e.target.value)}
              placeholder="Ketik nama untuk preview..."
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button" onClick={() => setActiveMode('name')}
              className={`p-3 rounded-2xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${activeMode === 'name' ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 'bg-white text-blue-600 border-blue-100'}`}
            >
              {activeMode === 'name' ? 'Klik PDF →' : 'Set Posisi Nama'}
            </button>
            <button
              type="button" onClick={() => setActiveMode('cert')}
              className={`p-3 rounded-2xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${activeMode === 'cert' ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse' : 'bg-white text-emerald-600 border-emerald-100'}`}
            >
              {activeMode === 'cert' ? 'Klik PDF →' : 'Set Posisi No.'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
            <span className="bg-slate-50 p-2 rounded-xl">Name: {namePos.x.toFixed(1)}%, {namePos.y.toFixed(1)}%</span>
            <span className="bg-slate-50 p-2 rounded-xl">No: {certPos.x.toFixed(1)}%, {certPos.y.toFixed(1)}%</span>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 transition-all"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ← BARU: Ganti iframe dengan PdfPreviewCanvas */}
      <div className="lg:col-span-2 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden min-h-[400px] relative p-4">
        <PdfPreviewCanvas
          pdfSource={pdfSource}
          previewName={previewName}
          previewCertNo={previewCertNo}
          namePos={namePos}
          certPos={certPos}
          activeMode={activeMode}
          onCanvasClick={handleCanvasClick}
        />
      </div>
    </div>
  );
}
