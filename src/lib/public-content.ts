import type { Tier } from "@prisma/client";
import { businessConfig } from "@/lib/config";
import { frozenGoods as fallbackFrozenGoods, plans as fallbackPlans, type FrozenGood, type Plan } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export type PublicContent = {
  business: {
    missing: string[];
    phone: string;
    whatsappUrl: string;
    bank: {
      title: string;
      accountNumber: string;
      iban: string;
      name: string;
    };
    logisticsPolicy?: string;
  };
  plans: Plan[];
  frozenGoods: FrozenGood[];
  setupMode: boolean;
};

function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);
}

function groupWeekly(items: { weekday: string; itemText: string }[]) {
  return weekdays.reduce<Record<string, string[]>>((weekly, weekday) => {
    weekly[weekday] = items.filter((item) => item.weekday === weekday).map((item) => item.itemText);
    return weekly;
  }, {});
}

export async function getPublicContent(): Promise<PublicContent> {
  if (!hasDatabaseConfig()) {
    return {
      business: businessConfig(),
      plans: fallbackPlans,
      frozenGoods: fallbackFrozenGoods,
      setupMode: true
    };
  }

  try {
    const [dbPlans, dbFrozenGoods, settings] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where: { active: true },
        orderBy: { displayOrder: "asc" },
        include: {
          menuItems: {
            where: { active: true },
            orderBy: [{ weekday: "asc" }, { displayOrder: "asc" }]
          }
        }
      }),
      prisma.frozenProduct.findMany({
        where: { active: true },
        orderBy: { displayOrder: "asc" }
      }),
      prisma.businessSetting.findMany()
    ]);

    const settingMap = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
    const envBusiness = businessConfig();
    const business = {
      missing: [] as string[],
      phone: settingMap.BUSINESS_PHONE || envBusiness.phone,
      whatsappUrl: settingMap.BUSINESS_WHATSAPP_URL || envBusiness.whatsappUrl,
      bank: {
        title: settingMap.BANK_ACCOUNT_TITLE || envBusiness.bank.title,
        accountNumber: settingMap.BANK_ACCOUNT_NUMBER || envBusiness.bank.accountNumber,
        iban: settingMap.BANK_IBAN || envBusiness.bank.iban,
        name: settingMap.BANK_NAME || envBusiness.bank.name
      },
      logisticsPolicy: settingMap.LOGISTICS_POLICY
    };

    business.missing = [
      !business.phone ? "BUSINESS_PHONE" : "",
      !business.whatsappUrl ? "BUSINESS_WHATSAPP_URL" : "",
      !business.bank.title ? "BANK_ACCOUNT_TITLE" : "",
      !business.bank.accountNumber ? "BANK_ACCOUNT_NUMBER" : "",
      !business.bank.name ? "BANK_NAME" : ""
    ].filter(Boolean);

    return {
      business,
      plans: dbPlans.length
        ? dbPlans.map((plan) => ({
            id: plan.id,
            tier: plan.tier as Tier,
            name: plan.name,
            label: plan.label,
            secondaryLabel: plan.secondaryLabel,
            price: plan.price,
            cadence: plan.cadence,
            menu: plan.menuItems.slice(0, 5).map((item) => item.itemText),
            weekly: groupWeekly(plan.menuItems)
          }))
        : fallbackPlans,
      frozenGoods: dbFrozenGoods.length
        ? dbFrozenGoods.map((item) => ({
            id: item.id,
            name: item.name,
            pack: item.pack,
            price: item.price,
            stockNote: item.stockNote,
            active: item.active
          }))
        : fallbackFrozenGoods,
      setupMode: false
    };
  } catch {
    return {
      business: businessConfig(),
      plans: fallbackPlans,
      frozenGoods: fallbackFrozenGoods,
      setupMode: true
    };
  }
}
