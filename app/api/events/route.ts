// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlug(text: string): string {
  return text
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { id: 'desc' },
      include: { _count: { select: { whitelists: true, certificates: true } } },
    });
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const eventName = formData.get('eventName') as string;
    const certPrefix = formData.get('certPrefix') as string;
    const expiryDateRaw = formData.get('expiryDate') as string;

    const nameX = parseFloat(formData.get('nameX') as string) || 50;
    const nameY = parseFloat(formData.get('nameY') as string) || 50;
    const certX = parseFloat(formData.get('certX') as string) || 10;
    const certY = parseFloat(formData.get('certY') as string) || 10;

    // ─── Field baru ──────────────────────────────────────────────────────────
    const nameColor = (formData.get('nameColor') as string) || '#000000';
    const certColor = (formData.get('certColor') as string) || '#000000';
    const certFormat = (formData.get('certFormat') as string) || '{nomor}/{prefix}/{tahun}';
    const certStartNumber = parseInt(formData.get('certStartNumber') as string) || 1;
    const certPadding = parseInt(formData.get('certPadding') as string) || 3;

    if (!file || !eventName || !certPrefix) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File harus berupa PDF.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const fileName = `${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('templates')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `Gagal upload: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(fileName);
    const slug = await uniqueSlug(generateSlug(eventName));

    const newEvent = await prisma.event.create({
      data: {
        eventName: eventName.trim(),
        slug,
        certPrefix: certPrefix.trim(),
        expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
        templateUrl: publicUrl,
        nameX, nameY, certX, certY,
        nameColor, certColor, certFormat, certStartNumber, certPadding,
      } as any,
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}