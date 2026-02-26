import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { id: 'desc' }
    });
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ events: [], error: "Gagal ambil data" }, { status: 500 });
  }
}