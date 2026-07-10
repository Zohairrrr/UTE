import { publicSiteUrl } from "@/lib/security";

export async function triggerN8nWebhook(event: string, data: Record<string, unknown>) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    // If not configured, just log to console (non-blocking simulation)
    console.log(`\n[N8N WEBHOOK SIMULATION: ${event}]`);
    console.log("Payload:", JSON.stringify(data, null, 2));
    console.log("---------------------------------\n");
    return;
  }

  try {
    // Non-blocking fetch: fire and forget in the background
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET ?? ""
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        siteUrl: publicSiteUrl(),
        data
      })
    }).catch((err) => {
      console.error(`n8n Webhook Error [${event}]:`, err.message);
    });
  } catch (error) {
    console.error(`n8n Webhook Dispatch Failed [${event}]:`, error);
  }
}
