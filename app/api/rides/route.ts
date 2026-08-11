import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AuthToken = (JWT & { id?: string | null; email?: string | null; name?: string | null }) | null;

interface RideStop {
  city?: string;
  price?: string;
}

interface RideRow {
  id: string;
  from_city: string;
  to_city: string;
  departure: string;
  price_eur: number;
  seats: number | null;
  car?: string | null;
  options?: string[] | string | null;
  owner?: string | null;
  driver_name?: string | null;
  driver_rating?: number | null;
  created_at?: string | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  route_polyline?: string | null;
  stops?: unknown;
}

interface RidePayload {
  id: string;
  from: string;
  to: string;
  departure: string;
  price: number;
  seats: number | null;
  car: string | null;
  options: string[];
  owner: string | null;
  driverName: string | null;
  driverRating: number | null;
  createdAt: string | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  routePolyline: string | null;
  stops: RideStop[];
}

// Every column the client is allowed to see. Listed once so GET and POST cannot
// drift apart.
const RIDE_COLUMNS =
  "id, from_city, to_city, departure, price_eur, seats, car, options, owner, driver_name, driver_rating, created_at, distance_meters, duration_seconds, route_polyline, stops";

const TOTAL_MAX_RATE_PER_KM = 0.15;

const readString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeOptions = (value: RideRow["options"]): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Stops are stored as a JSON string on existing rows, so accept either form and
// always hand the client a real array.
const normalizeStops = (value: unknown): RideStop[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is RideStop => typeof entry === "object" && entry !== null);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is RideStop => typeof entry === "object" && entry !== null)
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

const mapRideRow = (row: RideRow): RidePayload | null => {
  const id = readString(row.id);
  const from = readString(row.from_city);
  const to = readString(row.to_city);
  const departure = readString(row.departure);
  const price = readNumber(row.price_eur);
  if (!id || !from || !to || !departure || price === null) {
    return null;
  }

  const seatsValue = readNumber(row.seats);

  return {
    id,
    from,
    to,
    departure,
    price,
    seats: seatsValue !== null ? Math.floor(seatsValue) : null,
    car: readString(row.car),
    options: normalizeOptions(row.options),
    owner: readString(row.owner),
    driverName: readString(row.driver_name),
    driverRating: readNumber(row.driver_rating),
    createdAt: readString(row.created_at),
    distanceMeters: readNumber(row.distance_meters),
    durationSeconds: readNumber(row.duration_seconds),
    routePolyline: readString(row.route_polyline),
    stops: normalizeStops(row.stops),
  };
};

const getCurrentUserId = (token: AuthToken): string | null => token?.id ?? token?.email ?? null;

// --- HAE KYYDIT ---
// `?mine=1` narrows the list to the signed-in user's own rides.
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const onlyMine = searchParams.get("mine") === "1";

    let query = supabase.from("rides").select(RIDE_COLUMNS);

    if (onlyMine) {
      const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
      const currentUserId = getCurrentUserId(token);

      if (!currentUserId) {
        return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
      }

      query = query.eq("owner", currentUserId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Virhe kyytien haussa:", error);
      return NextResponse.json({ error: "Kyytien hakeminen epäonnistui" }, { status: 500 });
    }

    const rides = Array.isArray(data) ? data : [];
    const payload = rides.reduce<RidePayload[]>((acc, row) => {
      const mapped = mapRideRow(row as unknown as RideRow);
      if (mapped) {
        acc.push(mapped);
      }
      return acc;
    }, []);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Virhe kyytien haussa:", error);
    return NextResponse.json({ error: "Kyytien hakeminen epäonnistui" }, { status: 500 });
  }
}

interface CreateRideBody {
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  price?: number | string;
  seats?: number | string;
  car?: string | null;
  options?: string[] | null;
  distanceMeters?: number | string | null;
  durationSeconds?: number | string | null;
  routePolyline?: string | null;
  stops?: unknown;
}

// --- LISÄÄ KYYTI ---
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    const currentUserId = getCurrentUserId(token);

    if (!token?.email || !currentUserId) {
      console.error("Käyttäjä ei kirjautunut sisään.");
      return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
    }

    const body = (await req.json()) as CreateRideBody;

    const from = readString(body.from);
    const to = readString(body.to);
    const date = readString(body.date);
    const time = readString(body.time);
    const car = body.car ?? null;
    const routePolyline = readString(body.routePolyline);
    const stops = normalizeStops(body.stops);
    const options = Array.isArray(body.options)
      ? body.options.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];

    if (!from || !to || !date || !time) {
      return NextResponse.json({ error: "Missing required ride fields" }, { status: 400 });
    }

    const departure = new Date(`${date}T${time}`);
    if (Number.isNaN(departure.getTime())) {
      return NextResponse.json({ error: "Invalid departure date or time" }, { status: 400 });
    }

    const parsedSeats = readNumber(body.seats) ?? 1;
    const parsedPrice = readNumber(body.price);
    if (parsedPrice === null || parsedPrice < 0) {
      return NextResponse.json({ error: "Invalid price provided" }, { status: 400 });
    }

    const parsedDistanceMeters = readNumber(body.distanceMeters);
    const parsedDurationSeconds = readNumber(body.durationSeconds);

    if (parsedDistanceMeters !== null && parsedDistanceMeters > 0) {
      const distanceKm = parsedDistanceMeters / 1000;
      const priceLimit = (distanceKm * TOTAL_MAX_RATE_PER_KM) / Math.max(parsedSeats, 1);
      if (Number.isFinite(priceLimit) && priceLimit >= 0 && parsedPrice > priceLimit + 1e-2) {
        return NextResponse.json(
          {
            error: "Price exceeds the allowed ceiling",
            maxPricePerPassenger: Number(priceLimit.toFixed(2)),
          },
          { status: 400 }
        );
      }
    }

    const { error: insertError, data: insertedRows } = await supabase
      .from("rides")
      .insert({
        // Owner, driver name and rating come from the session, never the body,
        // so a caller cannot publish a ride as somebody else.
        owner: currentUserId,
        driver_name: readString(token.name) ?? "Tuntematon",
        driver_rating: 0,
        from_city: from,
        to_city: to,
        departure: departure.toISOString(),
        seats: parsedSeats,
        price_eur: parsedPrice,
        car,
        options: options,
        distance_meters: parsedDistanceMeters,
        duration_seconds: parsedDurationSeconds,
        route_polyline: routePolyline,
        stops: JSON.stringify(stops),
      })
      .select(RIDE_COLUMNS);

    if (insertError || !Array.isArray(insertedRows) || insertedRows.length === 0) {
      console.error("Virhe kyydin lisäyksessä:", insertError);
      return NextResponse.json({ error: "Kyydin lisääminen epäonnistui" }, { status: 500 });
    }

    const ride = mapRideRow(insertedRows[0] as unknown as RideRow);

    return NextResponse.json({ success: true, ride });
  } catch (error) {
    console.error("Virhe kyydin lisäyksessä:", error);
    return NextResponse.json({ error: "Kyydin lisääminen epäonnistui" }, { status: 500 });
  }
}

// --- POISTA KYYTI ---
export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const token = (await getToken({ req: req as unknown as NextRequest })) as AuthToken;
    const currentUserId = getCurrentUserId(token);

    if (!currentUserId) {
      return NextResponse.json({ error: "Ei kirjautunut" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Kyydin ID puuttuu" }, { status: 400 });
    }

    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, owner")
      .eq("id", id)
      .maybeSingle();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Kyytiä ei löytynyt" }, { status: 404 });
    }

    if (ride.owner !== currentUserId) {
      return NextResponse.json({ error: "Ei oikeutta poistaa tätä kyytiä" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("rides")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Virhe kyydin poistossa:", deleteError);
      return NextResponse.json({ error: "Kyydin poistaminen epäonnistui" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Virhe kyydin poistossa:", error);
    return NextResponse.json({ error: "Kyydin poistaminen epäonnistui" }, { status: 500 });
  }
}
