/**
 * Message bodies for booking events.
 *
 * Kept pure and separate from sending so they can be asserted on directly.
 *
 * Finnish only for now: the app has no per-user locale — `User` stores id, name
 * and email — so there is nothing to branch on. Adding a `locale` column is the
 * prerequisite for translating these.
 */

export interface BookingEmailContext {
  /** Where the ride starts, as stored on the ride. */
  from: string;
  to: string;
  /** ISO timestamp of departure. */
  departure: string;
  /** Display name of the other party, when known. */
  counterpartName?: string | null;
  /** Absolute link back into the app. */
  link: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
}

const formatDeparture = (departure: string): string => {
  const date = new Date(departure);
  if (Number.isNaN(date.getTime())) {
    return departure;
  }
  // Fixed to Helsinki so the time reads the same regardless of server region.
  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Helsinki",
  }).format(date);
};

const route = (context: BookingEmailContext) => `${context.from} → ${context.to}`;

/** To the driver, when someone asks for a seat. */
export const renderBookingRequested = (context: BookingEmailContext): RenderedEmail => {
  const who = context.counterpartName?.trim() || "Matkustaja";
  return {
    subject: `Uusi varauspyyntö: ${route(context)}`,
    text: [
      `${who} pyytää paikkaa kyydillesi.`,
      "",
      `Reitti: ${route(context)}`,
      `Lähtö: ${formatDeparture(context.departure)}`,
      "",
      "Hyväksy tai hylkää pyyntö profiilissasi:",
      context.link,
      "",
      "— Lyvo",
    ].join("\n"),
  };
};

/** To the passenger, when the driver accepts. */
export const renderBookingAccepted = (context: BookingEmailContext): RenderedEmail => {
  const who = context.counterpartName?.trim() || "Kuljettaja";
  return {
    subject: `Varaus hyväksytty: ${route(context)}`,
    text: [
      `${who} hyväksyi varauksesi.`,
      "",
      `Reitti: ${route(context)}`,
      `Lähtö: ${formatDeparture(context.departure)}`,
      "",
      "Näet varauksesi täältä:",
      context.link,
      "",
      "— Lyvo",
    ].join("\n"),
  };
};

/** To the passenger, when the driver rejects. */
export const renderBookingRejected = (context: BookingEmailContext): RenderedEmail => {
  const who = context.counterpartName?.trim() || "Kuljettaja";
  return {
    subject: `Varaus hylätty: ${route(context)}`,
    text: [
      `${who} ei voinut ottaa sinua tälle kyydille.`,
      "",
      `Reitti: ${route(context)}`,
      `Lähtö: ${formatDeparture(context.departure)}`,
      "",
      "Etsi toinen kyyti:",
      context.link,
      "",
      "— Lyvo",
    ].join("\n"),
  };
};
