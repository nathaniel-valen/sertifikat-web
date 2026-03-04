// app/api/verify/route.ts
// Endpoint publik — verifikasi nomor sertifikat
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const certNo = searchParams.get('certNo')?.trim();

    if (!certNo) {
      return NextResponse.json({ valid: false, error: 'certNo tidak diberikan.' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { certNo },
      include: {
        event: {
          select: { eventName: true },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      name: certificate.name,
      certNo: certificate.certNo,
      eventName: certificate.event.eventName,
      date: certificate.date,
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 });
  }
}