// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  let newRecordId: number | null = null;

  try {
    const { name, eventId } = await req.json();

    if (!name || !eventId) {
      return NextResponse.json({ error: 'Nama dan Event harus diisi!' }, { status: 400 });
    }

    const parsedEventId = parseInt(eventId);

    // --- 1. AMBIL DATA EVENT ---
    const event = await prisma.event.findUnique({
      where: { id: parsedEventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 });
    }

    if (!event.isActive) {
      return NextResponse.json({ error: 'Event ini sudah tidak aktif.' }, { status: 403 });
    }

    // --- 2. CEK EXPIRY ---
    if (event.expiryDate) {
      const now = new Date();
      const deadline = new Date(event.expiryDate);
      if (now > deadline) {
        return NextResponse.json({
          error: `Masa klaim sudah berakhir pada ${deadline.toLocaleString('id-ID')}.`
        }, { status: 403 });
      }
    }

    // --- 3. VALIDASI WHITELIST PER EVENT ---
    // Cek apakah nama terdaftar di whitelist event ini (case-insensitive)
    const whitelistForEvent = await prisma.whitelist.findMany({
      where: { eventId: parsedEventId }
    });

    const userExists = whitelistForEvent.find(
      (w: { name: string }) => w.name.toLowerCase().trim() === name.trim().toLowerCase()
    );

    if (!userExists) {
      return NextResponse.json(
        { error: 'Nama kamu tidak terdaftar di event ini. Hubungi Admin!' },
        { status: 403 }
      );
    }

    // --- 4. FETCH TEMPLATE DARI SUPABASE ---
    const templateResponse = await fetch(event.templateUrl);
    if (!templateResponse.ok) {
      return NextResponse.json({ error: 'Template PDF tidak ditemukan.' }, { status: 404 });
    }

    const existingPdfBytes = await templateResponse.arrayBuffer();

    // --- 5. BUAT RECORD SERTIFIKAT ---
    const newRecord = await prisma.certificate.create({
      data: { name: name.trim(), eventId: event.id }
    });
    newRecordId = newRecord.id;

    // Generate nomor sertifikat
    const prefix = event.certPrefix || event.eventName.replace(/\s+/g, '').toUpperCase();
    const sequenceNumber = String(newRecord.id).padStart(3, '0');
    const finalCertNo = `${sequenceNumber}/${prefix}`;

    await prisma.certificate.update({
      where: { id: newRecord.id },
      data: { certNo: finalCertNo }
    });

    // --- 6. PROSES PDF ---
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    const pdfNameX = (event.nameX / 100) * width;
    const pdfNameY = height - ((event.nameY / 100) * height);
    const pdfCertX = (event.certX / 100) * width;
    const pdfCertY = height - ((event.certY / 100) * height);

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const nameFontSize = 35;

    const nameTextWidth = font.widthOfTextAtSize(name.trim(), nameFontSize);
    const finalNameX = pdfNameX - (nameTextWidth / 2);

    firstPage.drawText(name.trim(), {
      x: finalNameX, y: pdfNameY,
      size: nameFontSize, font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${finalCertNo}`, {
      x: pdfCertX, y: pdfCertY,
      size: 14, font,
      color: rgb(0.2, 0.2, 0.2),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sertifikat-${name.trim().replace(/\s+/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error("ERROR GENERATE:", error);

    if (newRecordId) {
      try {
        await prisma.certificate.delete({ where: { id: newRecordId } });
      } catch (e) {
        console.error("Gagal hapus orphan record:", e);
      }
    }

    return NextResponse.json({ error: 'Gagal memproses sertifikat.' }, { status: 500 });
  }
}