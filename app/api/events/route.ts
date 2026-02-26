// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const eventName = formData.get('eventName') as string;
    
    // 1. TANGKEP DATA BARU YANG TADI KETINGGALAN
    const certPrefix = formData.get('certPrefix') as string;
    const expiryDateRaw = formData.get('expiryDate') as string; 
    
    // Ubah string datetime-local jadi objek Date buat Prisma
    const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;

    // 2. Parse koordinat
    const nameX = parseFloat(formData.get('nameX') as string);
    const nameY = parseFloat(formData.get('nameY') as string);
    const certX = parseFloat(formData.get('certX') as string);
    const certY = parseFloat(formData.get('certY') as string);

    // Validasi basic
    if (!file || !eventName || !certPrefix) {
      return NextResponse.json({ error: 'Data tidak lengkap (File/Nama/Prefix wajib)!' }, { status: 400 });
    }

    // 3. Simpan file PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'templates');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // 4. SIMPAN KE DATABASE (Update bagian 'data')
    const newEvent = await prisma.event.create({
      data: {
        eventName,
        certPrefix,   // <-- MASUKIN INI
        expiryDate,   // <-- MASUKIN INI
        templateUrl: fileName,
        nameX,
        nameY,
        certX,
        certY,
      }
    });

    return NextResponse.json({ success: true, event: newEvent });
    
  } catch (error: any) {
    console.error("DETAIL ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Nama event sudah ada!' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat event', detail: error.message }, { status: 500 });
  }
}