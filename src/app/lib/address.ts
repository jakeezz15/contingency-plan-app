type NominatimAddress = Record<string, string | undefined>;

const REGION_PATTERNS = [
  /seutukunta/i,
  /suuralue/i,
  /sub-region/i,
  /region/i,
  /county/i,
  /state/i,
  /maakunta/i,
  /^Manner-/i,
  /^Uusimaa$/i,
  /^Southern Finland$/i,
  /^Mainland Finland$/i,
];

function normalizeAddressToken(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isHouseNumberOnly(part: string) {
  return /^\d+[A-Za-z0-9/-]*$/.test(part);
}

function isPostcode(part: string) {
  return /^\d{4,6}(-\d{4})?$/.test(part);
}

function isRegionalPart(part: string) {
  return REGION_PATTERNS.some((pattern) => pattern.test(part));
}

function normalizeCountry(country: string) {
  if (/finland|suomi/i.test(country)) {
    return "Finland";
  }

  return country;
}

function extractStreetFromQuery(
  query: string | undefined,
  nominatim: NominatimAddress
): string {
  if (!query?.trim()) return "";

  const trimmed = query.trim();
  let streetPart = trimmed.split(",")[0]?.trim() ?? "";

  const postcode = nominatim.postcode;
  if (postcode) {
    const postcodeIndex = trimmed.indexOf(postcode);
    if (postcodeIndex > 0) {
      streetPart = trimmed.slice(0, postcodeIndex).trim().replace(/,\s*$/, "");
    }
  } else {
    const postcodeMatch = trimmed.match(/^(.*?)(?:,\s*)?\b\d{4,6}\b.*$/);
    if (postcodeMatch) {
      streetPart = postcodeMatch[1].trim().replace(/,\s*$/, "");
    }
  }

  return streetPart;
}

function buildStreetLineFromNominatim(address: NominatimAddress): string {
  const line = [
    address.road,
    address.house_number,
    address.unit,
    address.level,
    address.block,
    address.entrance,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (line) return line;

  return (
    address.pedestrian ||
    address.footway ||
    address.hamlet ||
    address.neighbourhood ||
    address.building ||
    ""
  );
}

function pickStreetLine(
  nominatim: NominatimAddress,
  originalQuery?: string
): string {
  const fromNominatim = buildStreetLineFromNominatim(nominatim);
  const fromQuery = extractStreetFromQuery(originalQuery, nominatim);

  if (!fromQuery) return fromNominatim;
  if (!fromNominatim) return fromQuery;

  const queryNorm = normalizeAddressToken(fromQuery);
  const nominatimNorm = normalizeAddressToken(fromNominatim);

  if (queryNorm === nominatimNorm) return fromNominatim;

  if (
    queryNorm.startsWith(nominatimNorm) &&
    queryNorm.length > nominatimNorm.length
  ) {
    return fromQuery;
  }

  if (
    nominatimNorm.startsWith(queryNorm) &&
    nominatimNorm.length > queryNorm.length
  ) {
    return fromNominatim;
  }

  const road = nominatim.road;
  if (road && queryNorm.includes(normalizeAddressToken(road))) {
    return fromQuery.length >= fromNominatim.length ? fromQuery : fromNominatim;
  }

  return fromNominatim || fromQuery;
}

function parseLocationTail(tail: string) {
  const trimmed = tail.trim();
  if (!trimmed) {
    return { locationPart: "", country: "" };
  }

  const postcodeMatch = trimmed.match(/\b(\d{4,6})\b/);
  const postcode = postcodeMatch?.[1] ?? "";
  const country = normalizeCountry(trimmed);

  let city = trimmed;
  if (postcode) {
    city = city.replace(postcode, "");
  }

  city = city
    .replace(/suomi\s*\/\s*finland/gi, "")
    .replace(/finland/gi, "")
    .replace(/suomi/gi, "")
    .replace(/,/g, " ")
    .trim();

  const locationPart = [postcode, city].filter(Boolean).join(" ").trim();

  return { locationPart, country };
}

function parseStreetLineFromParts(parts: string[]) {
  if (parts.length >= 2 && isHouseNumberOnly(parts[0]) && !isPostcode(parts[0])) {
    return {
      streetLine: `${parts[1]} ${parts[0]}`,
      searchStartIndex: 2,
    };
  }

  return {
    streetLine: parts[0],
    searchStartIndex: 1,
  };
}

function findCityFromParts(parts: string[], searchStartIndex: number, postcodeIndex: number) {
  if (postcodeIndex > searchStartIndex) {
    for (let index = postcodeIndex - 1; index >= searchStartIndex; index -= 1) {
      const part = parts[index];
      if (!isRegionalPart(part) && !isPostcode(part) && !isHouseNumberOnly(part)) {
        return part;
      }
    }
  }

  const candidate = parts[searchStartIndex];
  if (
    candidate &&
    !isRegionalPart(candidate) &&
    !isPostcode(candidate) &&
    !isHouseNumberOnly(candidate)
  ) {
    return candidate;
  }

  return "";
}

export function buildCompactAddress(
  address: NominatimAddress,
  originalQuery?: string
): string {
  const streetLine = pickStreetLine(address, originalQuery);

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    "";

  const locationPart = [address.postcode, city].filter(Boolean).join(" ").trim();
  const country = normalizeCountry(address.country?.trim() ?? "");

  return [streetLine, locationPart, country].filter(Boolean).join(", ");
}

export function formatCompactAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return trimmed;

  const { streetLine, searchStartIndex } = parseStreetLineFromParts(parts);
  const tailParts = parts.slice(searchStartIndex);

  if (tailParts.length === 0) {
    return streetLine;
  }

  const hasRegionalTail = tailParts.some((part) => isRegionalPart(part));

  if (tailParts.length <= 2 && !hasRegionalTail) {
    const { locationPart, country } = parseLocationTail(tailParts.join(", "));
    return [streetLine, locationPart, country].filter(Boolean).join(", ");
  }

  const country = normalizeCountry(parts[parts.length - 1]);
  const postcodeIndex = parts.findIndex(
    (part, index) => index > 0 && isPostcode(part)
  );

  if (postcodeIndex === -1) {
    const city = findCityFromParts(parts, searchStartIndex, parts.length - 1);
    return [streetLine, city, country].filter(Boolean).join(", ");
  }

  const postcode = parts[postcodeIndex];
  const city = findCityFromParts(parts, searchStartIndex, postcodeIndex);

  return `${streetLine}, ${postcode} ${city} ${country}`.replace(/\s+/g, " ").trim();
}
