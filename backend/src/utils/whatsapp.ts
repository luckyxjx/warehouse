import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
const fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886"; // Twilio sandbox default
const toNumber = process.env.RETAILER_WHATSAPP_TO ?? "";

/**
 * Sends a WhatsApp message to the retailer via Twilio.
 * Silently logs the error so it never crashes the finalize flow.
 */
export async function sendWhatsAppNotification(message: string): Promise<void> {
  if (!accountSid || !authToken || !toNumber) {
    console.warn("[WhatsApp] Twilio credentials or retailer number not configured — skipping.");
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`,
      to: toNumber.startsWith("whatsapp:") ? toNumber : `whatsapp:${toNumber}`,
      body: message
    });
    console.info("[WhatsApp] Notification sent to", toNumber);
  } catch (err) {
    // Non-fatal — report is still saved even if WhatsApp fails
    console.error("[WhatsApp] Failed to send notification:", err);
  }
}
