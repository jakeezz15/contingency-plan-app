import { NextRequest, NextResponse } from "next/server";

import { buildCompactAddress } from "@/app/lib/address";

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lngParam = request.nextUrl.searchParams.get("lng");
  const lat = Number(latParam);
  const lng = Number(lngParam);

  if (
    latParam == null ||
    lngParam == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return NextResponse.json(
      { error: "Valid lat and lng are required." },
      { status: 400 }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
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
        { error: "Reverse geocoding service unavailable." },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
      error?: string;
    };

    if (data.error || !data.display_name) {
      return NextResponse.json(
        { error: "No address found for this map point." },
        { status: 404 }
      );
    }

    const displayName = data.display_name;
    const nominatimAddress = data.address ?? {};
    const compactAddress =
      buildCompactAddress(nominatimAddress, displayName) || displayName;

    return NextResponse.json({
      displayName,
      compactAddress,
      lat,
      lng,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while looking up this map point." },
      { status: 500 }
    );
  }
}
