import type { Tier } from "@prisma/client";

export type Plan = {
  id?: string;
  tier: Tier;
  name: string;
  label: string;
  secondaryLabel: string;
  price: number;
  cadence: string;
  menu: string[];
  weekly: Record<string, string[]>;
};

export type FrozenGood = {
  id?: string;
  name: string;
  pack: string;
  price: number;
  stockNote?: string | null;
  active?: boolean;
};

export const plans: Plan[] = [
  {
    tier: "STANDARD",
    name: "Standard",
    label: "Budget Friendly",
    secondaryLabel: "Simple Daily Meals",
    price: 7800,
    cadence: "monthly office or hostel plan",
    menu: ["Chicken karahi rotation", "Seasonal sabzi", "Daal chawal", "Roti or rice", "Fresh raita"],
    weekly: {
      Monday: ["Chicken karahi", "Roti", "Cucumber raita"],
      Tuesday: ["Daal mash", "Zeera rice", "Kachumber"],
      Wednesday: ["Aloo keema", "Roti", "Mint chutney"],
      Thursday: ["Mix sabzi", "Rice", "Raita"],
      Friday: ["Chicken pulao", "Shami kebab", "Salad"]
    }
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    label: "Customer Favourite",
    secondaryLabel: "Better Daily Meals",
    price: 10800,
    cadence: "monthly upgraded meal plan",
    menu: ["Boneless chicken entrees", "Rice and roti options", "Dessert twice weekly", "Fresh salad", "Priority menu swaps"],
    weekly: {
      Monday: ["Boneless handi", "Garlic naan", "Raita"],
      Tuesday: ["Chicken chow mein", "Crisp salad", "Sauce cup"],
      Wednesday: ["Beef qeema", "Roti", "Gulab jamun"],
      Thursday: ["Chicken biryani", "Raita", "Fresh salad"],
      Friday: ["Malai boti roll bowl", "Rice", "Mint sauce"]
    }
  },
  {
    tier: "EXECUTIVE",
    name: "Executive",
    label: "Full Service Plan",
    secondaryLabel: "Best For Offices",
    price: 14800,
    cadence: "monthly executive service",
    menu: ["Chef-selected mains", "Better protein rotation", "Dessert and beverage", "Office-ready packaging", "Priority support"],
    weekly: {
      Monday: ["Mutton qorma", "Saffron rice", "Raita", "Kheer"],
      Tuesday: ["Grilled chicken steak", "Herb rice", "Sauteed vegetables"],
      Wednesday: ["Beef kabab platter", "Paratha", "Chutney trio"],
      Thursday: ["Chicken white karahi", "Naan", "Firni"],
      Friday: ["Executive biryani box", "Kabab", "Salad", "Beverage"]
    }
  }
];

export const frozenGoods: FrozenGood[] = [
  { name: "Chicken cheese rolls", pack: "12-piece freezer pack", price: 1450 },
  { name: "Beef shami kebab", pack: "18-piece freezer pack", price: 1700 },
  { name: "Mini samosa selection", pack: "24-piece freezer pack", price: 1320 }
];

export function planByTier(tier: Tier) {
  return plans.find((plan) => plan.tier === tier) ?? plans[0];
}
