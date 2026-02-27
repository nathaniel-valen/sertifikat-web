// app/api/events/[id]/whitelist/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> }; // ✅ tambah Promise

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Event ID tidak valid.' }, { status: 400 });
    }

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama tidak boleh kosong.' }, { status: 400 });
    }

    await prisma.whitelist.create({
      data: {
        name: name.trim(),
        eventId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Nama sudah terdaftar di event ini.' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id: eventIdStr } = await params; // ✅ sudah benar
    const { id } = await req.json();

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'ID whitelist tidak valid.' }, { status: 400 });
    }

    await prisma.whitelist.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}