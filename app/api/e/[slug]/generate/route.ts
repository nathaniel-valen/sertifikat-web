// app/api/e/[slug]/generate/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ slug: string }> };

function hexToRgb(hex: string) {
  const clean = (hex || '#000000').replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255,
  };
}

export async function POST(req: Request, { params }: Params) {
  let newRecordId: number | null = null;

  try {
    const { slug } = await params;
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama harus diisi!' }, { status: 400 });
    }

    // 1. Ambil event dari slug
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 });
    if (!event.isActive) return NextResponse.json({ error: 'Event ini sudah tidak aktif.' }, { status: 403 });

    // 2. Cek expiry
    if (event.expiryDate && new Date() > new Date(event.expiryDate)) {
      return NextResponse.json({
        error: `Masa klaim sudah berakhir pada ${new Date(event.expiryDate).toLocaleString('id-ID')}.`
      }, { status: 403 });
    }

    // 3. Validasi whitelist
    const whitelist = await prisma.whitelist.findMany({ where: { eventId: event.id } });
    const userExists = whitelist.find(
      (w: { name: string }) => w.name.toLowerCase().trim() === name.trim().toLowerCase()
    );
    if (!userExists) {
      return NextResponse.json({ error: 'Nama kamu tidak terdaftar di event ini. Hubungi Admin!' }, { status: 403 });
    }

    // 4. Cek duplikat claim — kalau sudah pernah claim, tolak
    const alreadyClaimed = await prisma.certificate.findFirst({
      where: {
        eventId: event.id,
        name: { equals: name.trim(), mode: 'insensitive' },
      },
    });

    if (alreadyClaimed) {
      return NextResponse.json({
        error: `Kamu sudah pernah mengklaim sertifikat ini! No. Sertifikat kamu: ${alreadyClaimed.certNo ?? '-'}`,
      }, { status: 400 });
    }

    // 5. Fetch template
    const templateResponse = await fetch(event.templateUrl);
    if (!templateResponse.ok) return NextResponse.json({ error: 'Template PDF tidak ditemukan.' }, { status: 404 });
    const existingPdfBytes = await templateResponse.arrayBuffer();

    // 6. Hitung sequence dari jumlah cert yang sudah ada di event ini
    const existingCount = await prisma.certificate.count({
      where: { eventId: event.id },
    });

    // 7. Buat record sertifikat
    const newRecord = await prisma.certificate.create({
      data: { name: name.trim(), eventId: event.id },
    });
    newRecordId = newRecord.id;

    // 8. Build nomor sertifikat
    const certStartNumber = (event as any).certStartNumber ?? 1;
    const certPadding = (event as any).certPadding ?? 3;
    const certFormat = (event as any).certFormat || '{nomor}/{prefix}/{tahun}';

    const seqNumber = certStartNumber + existingCount;
    const numStr = String(seqNumber).padStart(certPadding, '0');
    const year = new Date().getFullYear().toString();

    const finalCertNo = certFormat
      .replace('{nomor}', numStr)
      .replace('{prefix}', event.certPrefix)
      .replace('{tahun}', year);

    await prisma.certificate.update({
      where: { id: newRecord.id },
      data: { certNo: finalCertNo },
    });

    // 9. Proses PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const nameFontSize = 35;
    const certFontSize = 14;

    const pdfNameX = (event.nameX / 100) * width;
    const pdfNameY = height - (event.nameY / 100) * height;
    const pdfCertX = (event.certX / 100) * width;
    const pdfCertY = height - (event.certY / 100) * height;

    const nameTextWidth = font.widthOfTextAtSize(name.trim(), nameFontSize);
    const certTextWidth = font.widthOfTextAtSize(finalCertNo, certFontSize);

    const nameRgb = hexToRgb((event as any).nameColor || '#000000');
    const certRgb = hexToRgb((event as any).certColor || '#000000');

    firstPage.drawText(name.trim(), {
      x: pdfNameX - nameTextWidth / 2,
      y: pdfNameY,
      size: nameFontSize,
      font,
      color: rgb(nameRgb.r, nameRgb.g, nameRgb.b),
    });

    firstPage.drawText(finalCertNo, {
      x: pdfCertX - certTextWidth / 2,
      y: pdfCertY,
      size: certFontSize,
      font,
      color: rgb(certRgb.r, certRgb.g, certRgb.b),
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
    console.error('ERROR GENERATE (slug):', error);
    if (newRecordId) {
      try { await prisma.certificate.delete({ where: { id: newRecordId } }); } catch {}
    }
    return NextResponse.json({ error: 'Gagal memproses sertifikat.' }, { status: 500 });
  }
}