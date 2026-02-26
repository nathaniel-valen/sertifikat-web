// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { name, eventId } = await req.json();

    if (!name || !eventId) {
      return NextResponse.json({ error: 'Nama dan Event harus diisi!' }, { status: 400 });
    }

    // --- 1. VALIDASI WHITELIST DARI DATABASE ---
    // Kita ambil data yang namanya SAMA (tapi kita normalize dulu)
    const isWhitelisted = await prisma.whitelist.findFirst({
      where: {
        name: {
          // Kita pakai 'equals' tapi pastikan data di DB sudah seragam 
          // ATAU pakai 'contains' kalau SQLite-nya rewel
          equals: name.trim(), 
        },
      },
    });

    // KALAU cara di atas masih gagal karena masalah Case Sensitive di SQLite:
    // Kita ambil semua whitelist, lalu cari manual di kode (paling aman buat SQLite)
    const allWhitelist = await prisma.whitelist.findMany();
    const userExists = allWhitelist.find(
      (w) => w.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (!userExists) {
      return NextResponse.json(
        { error: 'Maaf, nama kamu tidak terdaftar di whitelist. Hubungi Admin!' },
        { status: 403 }
      );
    }

    // --- 2. AMBIL DATA EVENT ---
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    // --- TAMBAHAN LOGIC EXPIRY ---
    if ('expiryDate' in event && event.expiryDate) {
      const now = new Date();
      const deadline = new Date(event.expiryDate as Date);
      
      if (now > deadline) {
        return NextResponse.json({ 
          error: `Maaf, masa klaim sertifikat event ini sudah berakhir pada ${deadline.toLocaleString('id-ID')}` 
        }, { status: 403 });
      }
    }

    // --- 3. BIKIN RECORD & NOMOR SERTIFIKAT ---
    const newRecord = await prisma.certificate.create({
      data: { 
        name: name.trim(), 
        eventId: event.id 
      }
    });

    // AMBIL PREFIX DARI EVENT, KALAU KOSONG PAKE NAMA EVENT
    const customPrefix = event.eventName.replace(/\s+/g, '').toUpperCase();
    const sequenceNumber = String(newRecord.id).padStart(3, '0');
    const finalCertNo = `${customPrefix}/${sequenceNumber}`; 

    // Update ke database
    await prisma.certificate.update({
      where: { id: newRecord.id },
      data: { certNo: finalCertNo }
    });

    // --- 4. PROSES PDF ---
    const templatePath = path.join(process.cwd(), 'public', 'templates', event.templateUrl);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'File PDF template hilang di server' }, { status: 404 });
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    // Kalkulasi Koordinat Persentase
    const pdfNameX = (event.nameX / 100) * width;
    const pdfNameY = height - ((event.nameY / 100) * height);
    const pdfCertX = (event.certX / 100) * width;
    const pdfCertY = height - ((event.certY / 100) * height);

    // Font & Style
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const nameFontSize = 35;
    
    // Auto-Center Nama
    const nameTextWidth = font.widthOfTextAtSize(name, nameFontSize);
    const finalNameX = pdfNameX - (nameTextWidth / 2);

    // Gambar Nama
    firstPage.drawText(name, {
      x: finalNameX,
      y: pdfNameY,
      size: nameFontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Gambar Nomor
    firstPage.drawText(`No: ${finalCertNo}`, {
      x: pdfCertX,
      y: pdfCertY,
      size: 14,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // --- 5. RESPONSE ---
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sertifikat-${name}.pdf"`,
      },
    });

  } catch (error) {
    console.error("ERROR GENERATE:", error);
    return NextResponse.json({ error: 'Gagal memproses sertifikat' }, { status: 500 });
  }
}