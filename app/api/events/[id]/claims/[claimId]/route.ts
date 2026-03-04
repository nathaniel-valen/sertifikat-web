// app/api/events/[id]/claims/[claimId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string; claimId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id, claimId } = await params;
    const eventId = parseInt(id);
    const certId = parseInt(claimId);

    if (isNaN(eventId) || isNaN(certId)) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    // Pastikan certificate ini memang milik event ini
    const cert = await prisma.certificate.findFirst({
      where: { id: certId, eventId },
    });

    if (!cert) {
      return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
    }

    await prisma.certificate.delete({ where: { id: certId } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}