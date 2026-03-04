'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

type ImportResult = {
  success: string[];
  failed: { name: string; reason: string }[];
};

type Props = {
  eventId: number;
  eventName: string;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportParticipantsModal({ eventId, eventName, onClose, onImported }: Props) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [parsedNames, setParsedNames] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Parse CSV string ───────────────────────────────────────────────────────
  const parseCSV = (text: string): string[] => {
    const lines = text.split(/\r?\n/);
    const names: string[] = [];

    for (const line of lines) {
      // Coba ambil kolom pertama (kalau ada koma)
      const cols = line.split(',');
      const raw = cols[0].replace(/^["']|["']$/g, '').trim(); // hapus quote
      if (raw && raw.toLowerCase() !== 'name' && raw.toLowerCase() !== 'nama') {
        names.push(raw);
      }
    }
    return [...new Set(names)]; // deduplicate
  };

  // ─── Parse XLSX/XLS ─────────────────────────────────────────────────────────
  const parseXLSX = (buffer: ArrayBuffer): string[] => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const names: string[] = [];
    for (const row of rows) {
      const raw = String(row[0] || '').trim();
      if (raw && raw.toLowerCase() !== 'name' && raw.toLowerCase() !== 'nama') {
        names.push(raw);
      }
    }
    return [...new Set(names)];
  };

  // ─── Handle file drop/select ────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const names = parseCSV(text);
        setParsedNames(names);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const names = parseXLSX(buffer);
        setParsedNames(names);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ─── Handle paste text ──────────────────────────────────────────────────────
  const handleParsePaste = () => {
    const lines = pasteText.split(/\r?\n/);
    const names = lines
      .map(l => l.trim())
      .filter(l => l.length > 0 && l.toLowerCase() !== 'name' && l.toLowerCase() !== 'nama');
    setParsedNames([...new Set(names)]);
  };

  // ─── Remove name from preview ───────────────────────────────────────────────
  const removeName = (index: number) => {
    setParsedNames(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Import to API ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (parsedNames.length === 0) return;
    setImporting(true);

    const success: string[] = [];
    const failed: { name: string; reason: string }[] = [];

    // Import satu per satu biar bisa track mana yang gagal
    for (const name of parsedNames) {
      try {
        const res = await fetch(`/api/events/${eventId}/whitelist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (res.ok) {
          success.push(name);
        } else {
          failed.push({ name, reason: data.error || 'Gagal' });
        }
      } catch {
        failed.push({ name, reason: 'Koneksi error' });
      }
    }

    setResult({ success, failed });
    setImporting(false);
    if (success.length > 0) onImported();
  };

  const isImportDisabled = parsedNames.length === 0 || importing;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Import Participants</h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                ke event: <span className="text-slate-700">{eventName}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mt-5">
            <button onClick={() => { setMode('upload'); setParsedNames([]); setFileName(''); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${mode === 'upload' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              Upload File (CSV / XLSX)
            </button>
            <button onClick={() => { setMode('paste'); setParsedNames([]); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${mode === 'paste' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              Paste Teks
            </button>
          </div>
        </div>

        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Result View */}
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-black text-emerald-600">{result.success.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Berhasil</p>
                </div>
                <div className="bg-rose-50 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-black text-rose-500">{result.failed.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mt-1">Gagal / Duplikat</p>
                </div>
              </div>

              {result.failed.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Yang Gagal:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {result.failed.map((f, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                        <span className="text-sm font-bold text-rose-700">{f.name}</span>
                        <span className="text-[10px] text-rose-400 font-bold">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors">
                Selesai
              </button>
            </div>
          ) : (
            <>
              {/* Upload Mode */}
              {mode === 'upload' && (
                <div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {fileName ? (
                      <p className="text-sm font-black text-slate-700">{fileName}</p>
                    ) : (
                      <>
                        <p className="text-sm font-black text-slate-500">Drop file di sini atau klik untuk browse</p>
                        <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">CSV · XLSX · XLS</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </div>

                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Format yang didukung:</p>
                    <p className="text-xs text-slate-500 font-bold">Kolom pertama = nama peserta. Baris pertama bisa header (Name/Nama) akan otomatis dilewati.</p>
                  </div>
                </div>
              )}

              {/* Paste Mode */}
              {mode === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={'Budi Santoso\nSiti Rahma\nAndi Wijaya\n...'}
                    rows={8}
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl outline-none focus:bg-white focus:border-slate-900 transition-all text-sm font-bold resize-none font-mono"
                  />
                  <button onClick={handleParsePaste} disabled={!pasteText.trim()}
                    className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-40">
                    Parse Nama ({pasteText.split('\n').filter(l => l.trim()).length} baris)
                  </button>
                </div>
              )}

              {/* Preview Names */}
              {parsedNames.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Preview — {parsedNames.length} nama ditemukan
                    </p>
                    <button onClick={() => setParsedNames([])}
                      className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-wider">
                      Clear
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {parsedNames.map((name, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl">
                        <span className="text-sm font-bold text-slate-700">{name}</span>
                        <button onClick={() => removeName(i)} className="text-slate-300 hover:text-rose-500 transition-colors ml-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleImport} disabled={isImportDisabled}
                    className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-3">
                    {importing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Importing {parsedNames.length} nama...
                      </>
                    ) : (
                      `Import ${parsedNames.length} Participant`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}