import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { from, to } = await req.json();

    if (!from || !to) {
      return NextResponse.json({ error: "Lähtö- ja päätepaikka vaaditaan" }, { status: 400 });
    }

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!mapsApiKey) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
    }

    // Get directions from Google Maps Directions API
    const directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json");
    directionsUrl.searchParams.append("origin", from);
    directionsUrl.searchParams.append("destination", to);
    directionsUrl.searchParams.append("mode", "driving");
    directionsUrl.searchParams.append("key", mapsApiKey);

    console.log("Requesting directions from:", directionsUrl.toString());

    const directionsResponse = await fetch(directionsUrl.toString());
    const directionsData = await directionsResponse.json();

    console.log("Directions API response:", directionsData);

    if (directionsData.status !== "OK") {
      console.error("Directions API error:", directionsData.status, directionsData.error_message);
      return NextResponse.json({ error: `Reitin haku epäonnistui: ${directionsData.status}` }, { status: 400 });
    }

    const route = directionsData.routes[0];
    const leg = route.legs[0];

    const distance = leg.distance.text;
    const duration = leg.duration.text;

    // Convert directions to format Google Maps component expects
    const directions = {
      request: {
        origin: { query: from },
        destination: { query: to },
        travelMode: "DRIVING",
      },
      routes: directionsData.routes,
      status: directionsData.status,
    };

    return NextResponse.json({
      directions,
      distance,
      duration,
      polyline: route.overview_polyline.points,
    });
  } catch (error) {
    console.error("Directions API error:", error);
    return NextResponse.json({ error: "Virhe reitin haussa" }, { status: 500 });
  }
}
