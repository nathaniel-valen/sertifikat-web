// app/api/e/[slug]/route.ts
// Endpoint publik — ambil data event berdasarkan slug (tanpa auth)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        eventName: true,
        slug: true,
        isActive: true,
        expiryDate: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}