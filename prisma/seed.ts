import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { frozenGoods, plans } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      name: "Urban Tiffin Admin",
      email,
      phone: process.env.BUSINESS_PHONE ?? "",
      passwordHash,
      role: Role.ADMIN
    }
  });

  for (const [index, plan] of plans.entries()) {
    const storedPlan = await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: {
        name: plan.name,
        label: plan.label,
        secondaryLabel: plan.secondaryLabel,
        price: plan.price,
        cadence: plan.cadence,
        displayOrder: index,
        active: true
      },
      create: {
        tier: plan.tier,
        name: plan.name,
        label: plan.label,
        secondaryLabel: plan.secondaryLabel,
        price: plan.price,
        cadence: plan.cadence,
        displayOrder: index
      }
    });

    await prisma.mealMenuItem.deleteMany({ where: { planId: storedPlan.id } });
    for (const [weekday, meals] of Object.entries(plan.weekly)) {
      for (const [mealIndex, itemText] of meals.entries()) {
        await prisma.mealMenuItem.create({
          data: {
            planId: storedPlan.id,
            weekday,
            itemText,
            displayOrder: mealIndex
          }
        });
      }
    }
  }

  for (const [index, item] of frozenGoods.entries()) {
    await prisma.frozenProduct.upsert({
      where: { id: `seed-${index}` },
      update: {
        name: item.name,
        pack: item.pack,
        price: item.price,
        displayOrder: index,
        active: true
      },
      create: {
        id: `seed-${index}`,
        name: item.name,
        pack: item.pack,
        price: item.price,
        displayOrder: index
      }
    });
  }

  const settings = {
    BUSINESS_PHONE: process.env.BUSINESS_PHONE ?? "",
    BUSINESS_WHATSAPP_URL: process.env.BUSINESS_WHATSAPP_URL ?? "",
    BANK_ACCOUNT_TITLE: process.env.BANK_ACCOUNT_TITLE ?? "URBAN TIFFIN AND EVENTS",
    BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER ?? "",
    BANK_IBAN: process.env.BANK_IBAN ?? "",
    BANK_NAME: process.env.BANK_NAME ?? "",
    LOGISTICS_POLICY: "Logistics Policy: Custom requests must be placed securely at least 1-day prior to delivery."
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.businessSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  // --- Seed Test Customer & Payments for receipt testing ---
  const customerEmail = "customer@urbantiffin.local";
  const customerPasswordHash = await bcrypt.hash("Password123", 12);
  
  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: customerPasswordHash },
    create: {
      name: "Jane Doe",
      email: customerEmail,
      phone: "+92 300 1234567",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      addressType: "Home",
      addressLine: "House 45, Street 3, Block Y, DHA Phase 3",
      area: "DHA"
    }
  });

  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const adminId = admin?.id ?? "system";

  await prisma.payment.deleteMany({ where: { userId: customer.id } });
  await prisma.subscription.deleteMany({ where: { userId: customer.id } });
  await prisma.order.deleteMany({ where: { userId: customer.id } });

  // 1. Confirmed Subscription + Approved Payment
  const confirmedSub = await prisma.subscription.create({
    data: {
      userId: customer.id,
      tier: "PREMIUM",
      status: "CONFIRMED",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),  // 25 days from now
      total: 10800,
      requestedDeliverySlot: "1:00 PM to 2:00 PM",
      approvedDeliverySlot: "1:00 PM to 2:00 PM",
      notes: "Please deliver close to 1:30 PM if possible."
    }
  });

  await prisma.payment.create({
    data: {
      id: "pay_confirmed_sub_123",
      userId: customer.id,
      subscriptionId: confirmedSub.id,
      amount: 10800,
      screenshotUrl: "seed/receipt-1.png",
      storagePath: "seed/receipt-1.png",
      status: "APPROVED",
      reviewedById: adminId,
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  });

  // 2. Pending Subscription + Pending Payment
  const pendingSub = await prisma.subscription.create({
    data: {
      userId: customer.id,
      tier: "STANDARD",
      status: "PENDING_PAYMENT",
      total: 7800,
      requestedDeliverySlot: "12:00 PM to 1:00 PM",
      notes: "Office reception delivery."
    }
  });

  await prisma.payment.create({
    data: {
      id: "pay_pending_sub_456",
      userId: customer.id,
      subscriptionId: pendingSub.id,
      amount: 7800,
      screenshotUrl: "seed/receipt-2.png",
      storagePath: "seed/receipt-2.png",
      status: "PENDING"
    }
  });

  // 3. Confirmed Event Order + Approved Payment
  const confirmedOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      type: "EVENT",
      status: "CONFIRMED",
      title: "Corporate Dinner for 30",
      details: "Main course with biryani, chicken karahi, seekh kebabs, salad, and kheer. Disposable cutlery required.",
      estimatedTotal: 45000,
      finalTotal: 45000,
      guestCount: 30,
      deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      deliverySlot: "8:00 PM to 9:00 PM",
      addressLine: "Floor 4, Software Park, Gulberg II",
      area: "Gulberg"
    }
  });

  await prisma.payment.create({
    data: {
      id: "pay_confirmed_ord_789",
      userId: customer.id,
      orderId: confirmedOrder.id,
      amount: 45000,
      screenshotUrl: "seed/receipt-3.png",
      storagePath: "seed/receipt-3.png",
      status: "APPROVED",
      reviewedById: adminId,
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  // 4. Pending Custom Order + Pending Payment
  const pendingOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      type: "CUSTOM",
      status: "PENDING_PAYMENT",
      title: "Frozen Chicken Samosas Bulk",
      details: "5 packs of mini samosas selection for guest reception.",
      estimatedTotal: 6600,
      addressLine: "House 12, Block G, Johar Town",
      area: "Johar Town"
    }
  });

  await prisma.payment.create({
    data: {
      id: "pay_pending_ord_901",
      userId: customer.id,
      orderId: pendingOrder.id,
      amount: 6600,
      screenshotUrl: "seed/receipt-4.png",
      storagePath: "seed/receipt-4.png",
      status: "PENDING"
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
