import { PrismaClient, Role, ProviderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { phone: '+10000000000' },
    update: {},
    create: {
      id: 'admin_uid_1',
      phone: '+10000000000',
      email: 'admin@homeservices.com',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin created: ${admin.id}`);

  // 2. Create Categories
  const catCleaning = await prisma.category.upsert({
    where: { name: 'Cleaning' },
    update: {},
    create: {
      name: 'Cleaning',
      description: 'Professional home cleaning services',
    },
  });

  const catPlumbing = await prisma.category.upsert({
    where: { name: 'Plumbing' },
    update: {},
    create: {
      name: 'Plumbing',
      description: 'Expert plumbing repairs and installations',
    },
  });

  const catElectrical = await prisma.category.upsert({
    where: { name: 'Electrical' },
    update: {},
    create: {
      name: 'Electrical',
      description: 'Certified electricians for your home',
    },
  });
  console.log('✅ Categories created');

  // 3. Create Services
  const svcDeepClean = await prisma.service.create({
    data: {
      name: 'Full Home Deep Cleaning',
      categoryId: catCleaning.id,
      pricingModel: 'FIXED',
      basePricePaise: 499900, // ₹4999.00
    },
  });

  const svcACRepair = await prisma.service.create({
    data: {
      name: 'AC Repair & Servicing',
      categoryId: catElectrical.id,
      pricingModel: 'HOURLY',
      basePricePaise: 59900, // ₹599.00
    },
  });

  const svcLeakFix = await prisma.service.create({
    data: {
      name: 'Pipe Leakage Fix',
      categoryId: catPlumbing.id,
      pricingModel: 'FIXED',
      basePricePaise: 29900, // ₹299.00
    },
  });
  console.log('✅ Services created');

  // 4. Create Customers
  const customerUser = await prisma.user.upsert({
    where: { phone: '+12345678901' },
    update: {},
    create: {
      id: 'customer_uid_1',
      phone: '+12345678901',
      email: 'customer@example.com',
      role: Role.CUSTOMER,
      customer: {
        create: {}
      }
    },
    include: { customer: true }
  });
  console.log('✅ Customer created');

  // 5. Create Providers
  const providerUser = await prisma.user.upsert({
    where: { phone: '+19876543210' },
    update: {},
    create: {
      id: 'provider_uid_1',
      phone: '+19876543210',
      email: 'provider@example.com',
      role: Role.PROVIDER,
      provider: {
        create: {
          status: ProviderStatus.APPROVED,
          services: {
            create: [
              { serviceId: svcDeepClean.id },
              { serviceId: svcACRepair.id }
            ]
          }
        }
      }
    },
  });

  const pendingProviderUser = await prisma.user.upsert({
    where: { phone: '+15555555555' },
    update: {},
    create: {
      id: 'provider_uid_2',
      phone: '+15555555555',
      email: 'pending_provider@example.com',
      role: Role.PROVIDER,
      provider: {
        create: {
          status: ProviderStatus.PENDING,
          services: {
            create: [
              { serviceId: svcLeakFix.id }
            ]
          }
        }
      }
    }
  });
  console.log('✅ Providers created');

  console.log('🎉 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
