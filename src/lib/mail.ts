import nodemailer from "nodemailer";

function smtpPort() {
  const value = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(value) ? value : 587;
}

export async function sendMail(input: { to: string; subject: string; text: string; html?: string }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  const isPlaceholder =
    user?.includes("YOUR_GMAIL_ADDRESS") ||
    pass?.includes("YOUR_GMAIL_APP_PASSWORD");

  if (!host || !user || !pass || !from || isPlaceholder) {
    console.log("\n-----------------------------------------");
    console.log(" [SMTP NOT CONFIGURED - SIMULATING EMAIL]");
    console.log(" To:      ", input.to);
    console.log(" Subject: ", input.subject);
    console.log(" Content: ", input.text);
    console.log("-----------------------------------------\n");
    return;
  }

  const client = nodemailer.createTransport({
    host,
    port: smtpPort(),
    secure: smtpPort() === 465,
    auth: { user, pass }
  });

  await client.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
}
