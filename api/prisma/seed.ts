import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL database...');

  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Alex Morgan (Admin)',
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@example.com',
      name: 'Alex Morgan (Admin)',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      name: 'Jordan Taylor',
      role: Role.USER,
      isActive: true,
    },
    create: {
      email: 'user@example.com',
      name: 'Jordan Taylor',
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const secondUser = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {
      name: 'Sarah Chen',
      role: Role.USER,
      isActive: true,
    },
    create: {
      email: 'sarah@example.com',
      name: 'Sarah Chen',
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true,
    },
  });

  const existingLogsCount = await prisma.auditLog.count();
  if (existingLogsCount === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'SYSTEM_SEEDED',
          details: 'Initial ADMIN and USER accounts provisioned in PostgreSQL',
          userId: admin.id,
        },
        {
          action: 'USER_REGISTERED',
          details: `Registered user account ${regularUser.email} with role USER`,
          userId: regularUser.id,
        },
        {
          action: 'USER_REGISTERED',
          details: `Registered user account ${secondUser.email} with role USER`,
          userId: secondUser.id,
        },
      ],
    });
  }

  console.log('Seed completed successfully:', {
    admin: admin.email,
    user: regularUser.email,
    secondUser: secondUser.email,
  });
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
