import type { SupabaseClient } from "@supabase/supabase-js";

import {
  renderBookingAccepted,
  renderBookingCancelled,
  renderBookingRejected,
  renderBookingRequested,
} from "./notificationTemplates";
import { sendEmail, type SendOutcome } from "./notifications";

/**
 * Booking emails, assembled from the ride and the two parties.
 *
 * Called from the booking routes. Every path is wrapped: a booking must succeed
 * or fail on its own merits, never because a lookup or a mail provider misbehaved.
 */

export type BookingEvent = "requested" | "accepted" | "rejected" | "cancelled";

interface NotifyInput {
  event: BookingEvent;
  rideId: string;
  /** The passenger's address, as stored on the booking. */
  passengerEmail: string | null | undefined;
}

const appUrl = (path: string): string => {
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
};

const nameForEmail = async (
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<string | null> => {
  if (!email) return null;
  const { data } = await supabase
    .from("User")
    .select("name")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return typeof data?.name === "string" ? data.name : null;
};

export const notifyBookingEvent = async (
  supabase: SupabaseClient,
  { event, rideId, passengerEmail }: NotifyInput
): Promise<SendOutcome> => {
  try {
    const { data: ride } = await supabase
      .from("rides")
      .select("id, from_city, to_city, departure, owner, driver_name")
      .eq("id", rideId)
      .maybeSingle();

    if (!ride) {
      return { sent: false, reason: "no_recipient" };
    }

    const base = {
      from: String(ride.from_city ?? ""),
      to: String(ride.to_city ?? ""),
      departure: String(ride.departure ?? ""),
    };

    if (event === "requested" || event === "cancelled") {
      // Both concern the driver: one needs a decision, the other frees a seat.
      const { data: driver } = await supabase
        .from("User")
        .select("email")
        .eq("id", ride.owner)
        .maybeSingle();

      const context = {
        ...base,
        counterpartName: await nameForEmail(supabase, passengerEmail),
        link: appUrl("/fi/profile"),
      };
      const message =
        event === "requested" ? renderBookingRequested(context) : renderBookingCancelled(context);

      return sendEmail({ to: driver?.email as string | undefined, ...message });
    }

    const message =
      event === "accepted"
        ? renderBookingAccepted({
            ...base,
            counterpartName: typeof ride.driver_name === "string" ? ride.driver_name : null,
            link: appUrl("/fi/bookings"),
          })
        : renderBookingRejected({
            ...base,
            counterpartName: typeof ride.driver_name === "string" ? ride.driver_name : null,
            link: appUrl("/fi/rides"),
          });

    return sendEmail({ to: passengerEmail, ...message });
  } catch (error) {
    console.error("Booking notification failed:", error);
    return { sent: false, reason: "network_error" };
  }
};
