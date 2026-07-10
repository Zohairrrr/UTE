export interface AreaInfo {
  name: string;
  surcharge: number;
  deliveryTimeSlots: string[];
}

export const SUPPORTED_AREAS: AreaInfo[] = [
  {
    name: "DHA",
    surcharge: 0,
    deliveryTimeSlots: ["12:00 PM to 1:00 PM", "1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "7:00 PM to 8:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Gulberg",
    surcharge: 0,
    deliveryTimeSlots: ["12:00 PM to 1:00 PM", "1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "7:00 PM to 8:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Johar Town",
    surcharge: 50,
    deliveryTimeSlots: ["1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Model Town",
    surcharge: 0,
    deliveryTimeSlots: ["12:00 PM to 1:00 PM", "1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "7:00 PM to 8:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Cantt",
    surcharge: 0,
    deliveryTimeSlots: ["12:00 PM to 1:00 PM", "1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "7:00 PM to 8:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Faisal Town",
    surcharge: 50,
    deliveryTimeSlots: ["1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Garden Town",
    surcharge: 0,
    deliveryTimeSlots: ["12:00 PM to 1:00 PM", "1:00 PM to 2:00 PM", "2:00 PM to 3:00 PM", "7:00 PM to 8:00 PM", "8:00 PM to 9:00 PM"]
  },
  {
    name: "Iqbal Town",
    surcharge: 100,
    deliveryTimeSlots: ["1:30 PM to 2:30 PM", "2:30 PM to 3:30 PM", "8:30 PM to 9:30 PM"]
  }
];

export function isSupportedArea(areaName: string): boolean {
  return areaName.trim().length > 0;
}

export function getAreaDetails(areaName: string): AreaInfo | undefined {
  const normalized = areaName.trim().toLowerCase();
  return SUPPORTED_AREAS.find((a) => a.name.toLowerCase() === normalized);
}

export function getEstimatedDeliverySurcharge(areaName: string): number {
  const details = getAreaDetails(areaName);
  return details ? details.surcharge : 0;
}
