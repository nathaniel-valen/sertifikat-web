import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@certiflow.com';   // ← ganti
const ADMIN_PASSWORD = 'password123';         // ← ganti
const ADMIN_NAME = 'Admin CertiFlow';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`✅ Admin "${ADMIN_EMAIL}" sudah ada. Skip.`);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: hashed,
      role: 'admin',
    },
  });

  console.log(`✅ Admin berhasil dibuat: ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());