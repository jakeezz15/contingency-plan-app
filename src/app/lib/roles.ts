export type MarkerStyle = {
  label: string;
  color: string;
};

export const PERSON_MARKER: MarkerStyle = {
  label: "Person",
  color: "#2563eb",
};

export const MEETING_POINT_LEGEND: MarkerStyle = {
  label: "Meeting Point",
  color: "#dc2626",
};

/** Suggest the next unused numeric label for a new person. */
export function suggestNextPersonLabel(existingLabels: string[]): string {
  return suggestNextPersonLabels(existingLabels, 1)[0];
}

/** Suggest several unused numeric labels in sequence. */
export function suggestNextPersonLabels(
  existingLabels: string[],
  count: number
): string[] {
  const used = new Set(
    existingLabels.map((label) => label.trim()).filter(Boolean)
  );
  const suggestions: string[] = [];
  let next = 1;

  while (suggestions.length < count) {
    const candidate = String(next);
    if (!used.has(candidate)) {
      suggestions.push(candidate);
      used.add(candidate);
    }
    next += 1;
  }

  return suggestions;
}

/** Parse names from a multi-line / comma-separated text field. */
export function parseNamesText(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Legend line for a pin, e.g. "1 - Jake Family: Jake, Janine"
 * or "1 - Jake" when there is only one name.
 */
export function formatPersonLegendEntry(person: {
  label: string;
  members: { name: string }[];
}): string {
  const label = person.label.trim() || "•";
  const names = person.members
    .map((member) => member.name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return `${label} — (no names)`;
  }

  if (names.length === 1) {
    return `${label} - ${names[0]}`;
  }

  return `${label} - ${names[0]} Family: ${names.join(", ")}`;
}
