import { NextRequest, NextResponse } from "next/server";

import { buildCompactAddress } from "@/app/lib/address";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 5) {
    return NextResponse.json(
      { error: "Address must be at least 5 characters." },
      { status: 400 }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ContingencyPlanApp/1.0",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Address not found. Try adding city and country." },
        { status: 404 }
      );
    }

    const location = data[0];
    const displayName = location.display_name as string;
    const nominatimAddress = (location.address ?? {}) as Record<string, string>;
    const compactAddress =
      buildCompactAddress(nominatimAddress, query) || displayName;

    return NextResponse.json({
      displayName,
      compactAddress,
      lat: Number(location.lat),
      lng: Number(location.lon),
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while searching the address." },
      { status: 500 }
    );
  }
}
