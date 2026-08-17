/**
 * Transactional email.
 *
 * Nothing in Lyvo told anyone anything: a driver only discovered a seat request
 * by opening their profile, and a passenger only learned the outcome by checking
 * back. The booking loop depended on both people refreshing the site.
 *
 * Resend is called over plain HTTP so this needs no SDK dependency. Without
 * RESEND_API_KEY every send is a no-op that reports why, so local development
 * and preview deployments behave normally without a mail provider.
 *
 * Nothing here throws. A booking must never fail because email is down.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Resend's shared sender works without a verified domain, which is enough to
 * see this working. Set NOTIFICATION_FROM to your own once a domain is verified.
 */
const DEFAULT_FROM = "Lyvo <onboarding@resend.dev>";

export type SendOutcome =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "no_recipient" | "provider_error" | "network_error" };

export interface EmailMessage {
  to: string | null | undefined;
  subject: string;
  text: string;
}

export const isNotificationsConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, text }: EmailMessage): Promise<SendOutcome> => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Deliberately quiet: this is the normal state until a key is configured.
    return { sent: false, reason: "not_configured" };
  }

  const recipient = typeof to === "string" ? to.trim() : "";
  if (!recipient) {
    return { sent: false, reason: "no_recipient" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFICATION_FROM ?? DEFAULT_FROM,
        to: [recipient],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      // Body may carry a provider explanation; log it but never surface it.
      const detail = await response.text().catch(() => "");
      console.error(`Notification send failed (${response.status}):`, detail.slice(0, 300));
      return { sent: false, reason: "provider_error" };
    }

    return { sent: true };
  } catch (error) {
    console.error("Notification send threw:", error);
    return { sent: false, reason: "network_error" };
  }
};
