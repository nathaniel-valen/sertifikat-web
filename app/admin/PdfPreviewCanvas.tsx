'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

type Props = {
  // Sumber PDF: bisa File (upload baru) atau URL (dari Supabase)
  pdfSource: File | string | null;
  previewName: string;
  previewCertNo: string;
  namePos: { x: number; y: number };
  certPos: { x: number; y: number };
  activeMode: 'none' | 'name' | 'cert';
  onCanvasClick: (x: number, y: number) => void;
};

export default function PdfPreviewCanvas({
  pdfSource,
  previewName,
  previewCertNo,
  namePos,
  certPos,
  activeMode,
  onCanvasClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const renderPdf = useCallback(async () => {
    if (!pdfSource || !canvasRef.current) return;

    setRendering(true);
    setError('');

    try {
      // 1. Load PDF bytes
      let pdfBytes: ArrayBuffer;
      if (pdfSource instanceof File) {
        pdfBytes = await pdfSource.arrayBuffer();
      } else {
        const res = await fetch(pdfSource);
        if (!res.ok) throw new Error('Gagal fetch template');
        pdfBytes = await res.arrayBuffer();
      }

      // 2. Modifikasi PDF dengan pdf-lib (tambah teks preview)
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const nameFontSize = 35;
      const certFontSize = 14;

      const displayName = previewName.trim() || 'Nama Peserta';
      const displayCertNo = previewCertNo.trim() || '001/CERT/EVENT';

      // Konversi % → koordinat PDF
      const pdfNameX = (namePos.x / 100) * width;
      const pdfNameY = height - (namePos.y / 100) * height;
      const pdfCertX = (certPos.x / 100) * width;
      const pdfCertY = height - (certPos.y / 100) * height;

      // Center teks secara horizontal
      const nameTextWidth = font.widthOfTextAtSize(displayName, nameFontSize);
      const certTextWidth = font.widthOfTextAtSize(displayCertNo, certFontSize);

      firstPage.drawText(displayName, {
        x: pdfNameX - nameTextWidth / 2,
        y: pdfNameY,
        size: nameFontSize,
        font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(displayCertNo, {
        x: pdfCertX - certTextWidth / 2,
        y: pdfCertY,
        size: certFontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      // 3. Render ke canvas pakai PDF.js (via CDN)
      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      // Load PDF.js dari CDN kalau belum ada
      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument(blobUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const containerWidth = container.clientWidth;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      setError(e.message || 'Gagal render preview');
    } finally {
      setRendering(false);
    }
  }, [pdfSource, previewName, previewCertNo, namePos, certPos]);

  // Debounce render supaya tidak terlalu sering saat user mengetik
  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      renderPdf();
    }, 300);
    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [renderPdf]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMode === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onCanvasClick(x, y);
  };

  if (!pdfSource) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-black uppercase tracking-[0.3em]">No Template Loaded</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Canvas PDF */}
      <div
        className={`relative w-full ${activeMode !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="w-full h-auto block rounded-2xl" />

        {/* Loading overlay */}
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendering...</p>
            </div>
          </div>
        )}

        {/* Crosshair mode overlay */}
        {activeMode !== 'none' && !rendering && (
          <div className="absolute inset-0 rounded-2xl bg-slate-900/10 flex items-center justify-center pointer-events-none">
            <div className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest text-white shadow-xl ${activeMode === 'name' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              Klik untuk set posisi {activeMode === 'name' ? 'Nama' : 'Nomor Sertifikat'}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-rose-500 font-bold text-center">{error}</div>
      )}
    </div>
  );
}

// Load PDF.js dari CDN sekali saja
let pdfJsPromise: Promise<any> | null = null;
function loadPdfJs(): Promise<any> {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return pdfJsPromise;
}