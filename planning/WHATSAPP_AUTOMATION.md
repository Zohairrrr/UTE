# WhatsApp Automation Integration Plan via n8n

Integrating **n8n** (a node-based workflow automation engine) is the most robust, cost-effective, and flexible way to add WhatsApp automation to **Urban Tiffin & Events**. 

Instead of hardcoding API integrations for WhatsApp directly into Next.js, we can trigger **Webhooks** from Next.js to **n8n**, which handles the actual WhatsApp delivery pipeline.

---

## 🏗️ System Architecture

```
+------------------+         (Write DB)        +----------------------+
| Next.js Frontend | ------------------------> | Supabase PostgreSQL  |
+------------------+                           +----------------------+
         |
         | (POST JSON Webhook)
         v
+------------------+      (Forward Payload)    +----------------------+
|   n8n Engine     | ------------------------> |  WhatsApp Gateway    |
+------------------+                           | (Meta/Twilio/Green)  |
                                               +----------------------+
                                                          |
                                                          | (Deliver Alert)
                                                          v
                                               +----------------------+
                                               |    Customer Phone    |
                                               +----------------------+
```

---

## ⚡ 1. Triggering Webhooks from Next.js (Implementation)

Whenever an important state change occurs (e.g., payment approval, new booking request), we trigger a POST request to your n8n webhook URL.

### Outgoing Webhook Helper (`src/lib/webhook.ts`)
Create a simple utility to fire webhooks safely in the background:

```typescript
export async function triggerN8nWebhook(event: string, data: Record<string, any>) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL is not set. Skipping webhook trigger.");
    return;
  }

  try {
    // Fire and forget (in the background) so it does not block the user interface
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data
      })
    }).catch(err => console.error("n8n webhook fetch error:", err));
  } catch (error) {
    console.error("Failed to trigger n8n webhook:", error);
  }
}
```

### Hooking into Server Actions
We trigger the webhook inside your existing Next.js Server Actions:

#### A. When a New Order/Subscription is Created (`src/actions/checkout.ts`)
```typescript
// After creating order/payment in DB:
await triggerN8nWebhook("order.created", {
  orderId: order.id,
  customerName: user.name,
  customerPhone: user.phone,
  amount: order.estimatedTotal,
  type: order.type // CUSTOM, EVENT, SUBSCRIPTION
});
```

#### B. When an Admin Approves a Payment (`src/actions/admin-ops.ts`)
```typescript
// After approving payment:
await triggerN8nWebhook("payment.approved", {
  paymentId: payment.id,
  customerName: customer.name,
  customerPhone: customer.phone,
  amount: payment.amount,
  itemType: payment.subscriptionId ? "Subscription Plan" : "Catering/Food Order"
});
```

---

## ⚙️ 2. The n8n Workflow Design

In your self-hosted or cloud n8n dashboard, you set up a workflow with the following nodes:

### Step 1: Webhook Node (Trigger)
* **Method:** `POST`
* **Path:** `urban-tiffin-events`
* This creates a webhook URL (e.g. `https://n8n.yourdomain.com/webhook/urban-tiffin-events`) to place in your Next.js `.env` file as `N8N_WEBHOOK_URL`.

### Step 2: Switch Node (Route by Event)
* Routes the flow based on `{{ $json.event }}`:
  * Route 1: `order.created`
  * Route 2: `payment.approved`
  * Route 3: `payment.rejected`

### Step 3: Format Message (Set Node / Code Node)
* Formats the customer's phone number into international format (e.g. converting `03001234567` to `923001234567`).
* Drafts the text message:
  * *For `payment.approved`*: 
    > "🌟 *URBAN TIFFIN AND EVENTS* 🌟 \n\nHi **{{ $json.data.customerName }}**, your payment of **PKR {{ $json.data.amount }}** for your **{{ $json.data.itemType }}** has been approved! We are preparing your order. Thank you for choosing us! 🍲✨"

### Step 4: Outbox Node (WhatsApp Provider API)
* Send the formatted payload to your WhatsApp provider.

---

## 📞 3. WhatsApp Gateway Provider Options for n8n

n8n can connect to several different WhatsApp API gateways depending on your budget and requirements:

| Provider | Type | Pros | Cons | n8n Setup |
| :--- | :--- | :--- | :--- | :--- |
| **Official Meta Cloud API** | Official API | • 100% reliable<br>• No risk of number ban<br>• Official Meta dashboard | • Paid per-conversation<br>• Requires Meta Business verification<br>• Must use pre-approved templates | Use n8n's native **WhatsApp Business Cloud** Node. |
| **Evolution API / Baileys** (Self-Hosted) | Unofficial (Websockets) | • **100% Free** (Runs on your own number)<br>• Send any text/media instantly | • Server hosting required<br>• Risk of number ban if sending spam | Connect via n8n's **HTTP Request** Node. |
| **Green API / Whapi** (SaaS) | Unofficial (Managed) | • No hosting setup<br>• Setup in 5 minutes<br>• Flat monthly fee (~$15-$30) | • Risk of number ban if abused | Connect via n8n's **HTTP Request** Node. |

---

## 💎 Why using n8n is better than writing direct code:

1. **Instant Copy-Editing:** If you want to change the tone or words of the WhatsApp message, you don't need to rebuild or redeploy Next.js. You just edit the text card in n8n.
2. **Multi-Channel Delivery:** You can split the workflow in n8n to send a WhatsApp message, write a row in Google Sheets, and send an email alert to the kitchen staff simultaneously using visual drag-and-drop.
3. **Automatic Retries:** If the WhatsApp API gateway has a brief connection failure, n8n will automatically retry sending the message without affecting your web application.
