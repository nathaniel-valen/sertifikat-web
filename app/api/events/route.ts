import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase (Ambil URL & Key dari Dashboard Supabase lu)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const eventName = formData.get('eventName') as string;
    const certPrefix = formData.get('certPrefix') as string;
    const expiryDateRaw = formData.get('expiryDate') as string;
    
    // Koordinat
    const nameX = parseFloat(formData.get('nameX') as string);
    const nameY = parseFloat(formData.get('nameY') as string);
    const certX = parseFloat(formData.get('certX') as string);
    const certY = parseFloat(formData.get('certY') as string);

    if (!file || !eventName) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });

    // 1. UPLOAD KE SUPABASE (Ganti fs.writeFileSync)
    const arrayBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('templates') // Nama bucket lu
      .upload(fileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 2. AMBIL PUBLIC URL
    const { data: { publicUrl } } = supabase.storage
      .from('templates')
      .getPublicUrl(fileName);

    // 3. SIMPAN KE DATABASE (templateUrl sekarang isinya LINK https://...)
    const newEvent = await prisma.event.create({
      data: {
        eventName,
        certPrefix,
        expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
        templateUrl: publicUrl, // <-- Simpan URL-nya, bukan nama filenya
        nameX,
        nameY,
        certX,
        certY,
      }
    });

    return NextResponse.json({ success: true, event: newEvent });

  } catch (error: any) {
    console.error("UPLOAD_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}