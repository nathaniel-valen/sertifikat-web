// app/api/events/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ FIX: params harus di-await dulu di Next.js App Router
type Params = { params: Promise<{ id: string }> };

// GET: Detail event + whitelist + certificates
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const eventId = Number(id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        whitelists: { orderBy: { createdAt: 'desc' } },
        certificates: { orderBy: { date: 'desc' } },
        _count: { select: { whitelists: true, certificates: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      event: {
        ...event,
        whitelists: event.whitelists ?? [],
        certificates: event.certificates ?? [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Edit event (nama, expiry, koordinat, isActive, atau upload template baru)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params; // ✅ await params
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Kalau FormData → ada kemungkinan upload template baru
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const eventName = formData.get('eventName') as string;
      const certPrefix = formData.get('certPrefix') as string;
      const expiryDateRaw = formData.get('expiryDate') as string;
      const nameX = parseFloat(formData.get('nameX') as string);
      const nameY = parseFloat(formData.get('nameY') as string);
      const certX = parseFloat(formData.get('certX') as string);
      const certY = parseFloat(formData.get('certY') as string);

      let templateUrl: string | undefined;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
        const fileName = `${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });

        if (uploadError) {
          return NextResponse.json({ error: `Gagal upload template baru: ${uploadError.message}` }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(fileName);
        templateUrl = publicUrl;
      }

      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          ...(eventName && { eventName: eventName.trim() }),
          ...(certPrefix && { certPrefix: certPrefix.trim() }),
          expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
          ...(!isNaN(nameX) && { nameX }),
          ...(!isNaN(nameY) && { nameY }),
          ...(!isNaN(certX) && { certX }),
          ...(!isNaN(certY) && { certY }),
          ...(templateUrl && { templateUrl }),
        }
      });

      return NextResponse.json({ success: true, event: updated });
    }

    // Kalau JSON → toggle isActive atau update field sederhana
    const body = await req.json();
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: body,
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus event beserta semua data terkait
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params; // ✅ await params
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    await prisma.certificate.deleteMany({ where: { eventId } });
    await prisma.event.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}