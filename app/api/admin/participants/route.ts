import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Ambil data (Udah oke, cuma tambahin try-catch biar aman)
export async function GET() {
  try {
    // 1. Tes ambil Whitelist aja dulu tanpa urusan lain
    const whitelist = await prisma.whitelist.findMany();

    // 2. Tes ambil Certificate TANPA include event (ini sering bikin crash kalau eventId-nya null)
    const claimed = await prisma.certificate.findMany();

    return NextResponse.json({ whitelist, claimed });
  } catch (error: any) {
    console.error("DEBUG_ERROR_ASLI:", error.message);
    return NextResponse.json({ 
      error: "Database Crash", 
      detail: error.message 
    }, { status: 500 });
  }
}

// 2. POST: Tambah nama
export async function POST(req: Request) {
  try {
    const { name, eventId } = await req.json(); // ← tambah eventId
    
    if (!name) return NextResponse.json({ error: "Nama kosong" }, { status: 400 });
    if (!eventId) return NextResponse.json({ error: "Event ID kosong" }, { status: 400 });

    const newUser = await prisma.whitelist.create({ 
      data: { 
        name: name.trim(),
        eventId: Number(eventId)
      } 
    });
    return NextResponse.json(newUser);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: "Nama sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal tambah nama" }, { status: 500 });
  }
}

// 3. DELETE: Hapus nama (DI SINI BIASANYA ERROR 500 NYA)
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    
    // Pastikan ID diubah ke Number/Integer
    const id = parseInt(body.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    await prisma.whitelist.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE ERROR:", error);
    // Kalau ID gak ketemu, Prisma bakal lempar error P2025
    return NextResponse.json({ error: "Gagal hapus data" }, { status: 500 });
  }
}