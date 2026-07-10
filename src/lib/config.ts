const requiredKeys = [
  "BUSINESS_PHONE",
  "BUSINESS_WHATSAPP_URL",
  "BANK_ACCOUNT_TITLE",
  "BANK_ACCOUNT_NUMBER",
  "BANK_NAME"
] as const;

export function businessConfig() {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  return {
    missing,
    phone: process.env.BUSINESS_PHONE ?? "",
    whatsappUrl: process.env.BUSINESS_WHATSAPP_URL ?? "",
    bank: {
      title: process.env.BANK_ACCOUNT_TITLE ?? "",
      accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? "",
      iban: process.env.BANK_IBAN ?? "",
      name: process.env.BANK_NAME ?? ""
    }
  };
}
