import { prisma } from "@/lib/prisma";

interface SendOfferParams {
  offerId: string;
  customerId: string;
  businessId: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  subject: string;
  body: string;
  bookingUrl: string;
}

export async function sendOfferEmail(params: SendOfferParams): Promise<boolean> {
  if (!params.customerEmail) return false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return false;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "SlotSaver <noreply@example.com>",
      to: params.customerEmail,
      subject: params.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${params.subject}</h2>
          <p>${params.body}</p>
          <a href="${params.bookingUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
            Book Now
          </a>
        </div>
      `,
    });

    await prisma.messageLog.create({
      data: {
        businessId: params.businessId,
        offerId: params.offerId,
        customerId: params.customerId,
        channel: "EMAIL",
        status: "SENT",
        sentAt: new Date(),
        externalId: result.data?.id || null,
      },
    });

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    await prisma.messageLog.create({
      data: {
        businessId: params.businessId,
        offerId: params.offerId,
        customerId: params.customerId,
        channel: "EMAIL",
        status: "FAILED",
      },
    });
    return false;
  }
}

export async function sendOfferSms(params: SendOfferParams): Promise<boolean> {
  if (!params.customerPhone) return false;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn("Twilio credentials not set, skipping SMS");
    return false;
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(sid, token);

    const message = await client.messages.create({
      body: `${params.body}\n\nBook now: ${params.bookingUrl}`,
      from,
      to: params.customerPhone,
    });

    await prisma.messageLog.create({
      data: {
        businessId: params.businessId,
        offerId: params.offerId,
        customerId: params.customerId,
        channel: "SMS",
        status: "SENT",
        sentAt: new Date(),
        externalId: message.sid,
      },
    });

    return true;
  } catch (error) {
    console.error("SMS send failed:", error);
    await prisma.messageLog.create({
      data: {
        businessId: params.businessId,
        offerId: params.offerId,
        customerId: params.customerId,
        channel: "SMS",
        status: "FAILED",
      },
    });
    return false;
  }
}
