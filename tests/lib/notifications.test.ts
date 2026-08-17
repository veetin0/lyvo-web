import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { isNotificationsConfigured, sendEmail } from "@/lib/notifications";
import {
  renderBookingAccepted,
  renderBookingCancelled,
  renderBookingRejected,
  renderBookingRequested,
} from "@/lib/notificationTemplates";

const originalFetch = global.fetch;
const originalKey = process.env.RESEND_API_KEY;

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.RESEND_API_KEY;
  delete process.env.NOTIFICATION_FROM;
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalKey;
  }
});

describe("sendEmail without a key", () => {
  it("no-ops and never touches the network", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendEmail({ to: "rider@example.com", subject: "s", text: "t" });

    expect(result).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(isNotificationsConfigured()).toBe(false);
  });
});

describe("sendEmail with a key", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key";
  });

  it("posts the message to the provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendEmail({ to: " rider@example.com ", subject: "Hei", text: "Body" });

    expect(result).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");

    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["rider@example.com"]);
    expect(body.subject).toBe("Hei");
    expect(body.text).toBe("Body");
  });

  it("uses NOTIFICATION_FROM when set", async () => {
    process.env.NOTIFICATION_FROM = "Lyvo <hello@lyvo.fi>";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    global.fetch = fetchMock as unknown as typeof fetch;

    await sendEmail({ to: "rider@example.com", subject: "s", text: "t" });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).from).toBe("Lyvo <hello@lyvo.fi>");
  });

  it("refuses to send without a recipient", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await sendEmail({ to: null, subject: "s", text: "t" })).toEqual({
      sent: false,
      reason: "no_recipient",
    });
    expect(await sendEmail({ to: "   ", subject: "s", text: "t" })).toEqual({
      sent: false,
      reason: "no_recipient",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a provider rejection without throwing", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 422, text: async () => "bad sender" }) as unknown as typeof fetch;

    await expect(sendEmail({ to: "rider@example.com", subject: "s", text: "t" })).resolves.toEqual({
      sent: false,
      reason: "provider_error",
    });
  });

  it("survives the network being down", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;

    // A booking must never fail because email did.
    await expect(sendEmail({ to: "rider@example.com", subject: "s", text: "t" })).resolves.toEqual({
      sent: false,
      reason: "network_error",
    });
  });
});

describe("templates", () => {
  const context = {
    from: "Helsinki",
    to: "Tampere",
    departure: "2026-08-20T06:30:00+00:00",
    link: "https://lyvo-web.vercel.app/fi/profile",
  };

  it("tells the driver who asked and where to act", () => {
    const mail = renderBookingRequested({ ...context, counterpartName: "Matti" });

    expect(mail.subject).toBe("Uusi varauspyyntö: Helsinki → Tampere");
    expect(mail.text).toContain("Matti");
    expect(mail.text).toContain("Helsinki → Tampere");
    expect(mail.text).toContain(context.link);
  });

  it("renders departure in Helsinki time regardless of server zone", () => {
    // 06:30 UTC is 09:30 in Helsinki during summer.
    const mail = renderBookingRequested(context);
    expect(mail.text).toContain("9.30");
  });

  it("falls back to a neutral noun when the name is unknown", () => {
    expect(renderBookingRequested({ ...context, counterpartName: null }).text).toContain("Matkustaja");
    expect(renderBookingRequested({ ...context, counterpartName: "  " }).text).toContain("Matkustaja");
    expect(renderBookingAccepted({ ...context, counterpartName: null }).text).toContain("Kuljettaja");
  });

  it("distinguishes acceptance from rejection", () => {
    const accepted = renderBookingAccepted({ ...context, counterpartName: "Veeti" });
    const rejected = renderBookingRejected({ ...context, counterpartName: "Veeti" });

    expect(accepted.subject).toContain("hyväksytty");
    expect(rejected.subject).toContain("hylätty");
    expect(accepted.text).not.toEqual(rejected.text);
  });

  it("tells the driver a seat came back when a passenger cancels", () => {
    const mail = renderBookingCancelled({ ...context, counterpartName: "Matti" });

    expect(mail.subject).toBe("Varaus peruttu: Helsinki → Tampere");
    expect(mail.text).toContain("Matti");
    expect(mail.text).toContain("vapaana");
    // Must not read like the driver's own rejection.
    expect(mail.text).not.toContain("hylät");
  });

  it("gives each event a distinct subject", () => {
    const subjects = [
      renderBookingRequested(context),
      renderBookingAccepted(context),
      renderBookingRejected(context),
      renderBookingCancelled(context),
    ].map((m) => m.subject);

    expect(new Set(subjects).size).toBe(4);
  });

  it("leaves an unparseable departure untouched rather than printing Invalid Date", () => {
    const mail = renderBookingRequested({ ...context, departure: "not-a-date" });
    expect(mail.text).toContain("not-a-date");
    expect(mail.text).not.toContain("Invalid");
  });
});
