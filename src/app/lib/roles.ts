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

export type KeyPersonDraft = {
  name: string;
  status: string;
};

export function emptyKeyPersonDraft(): KeyPersonDraft {
  return { name: "", status: "" };
}

export function splitHouseholdMembers(members: { name: string; status?: string; phone?: string }[]) {
  const keyPeople: KeyPersonDraft[] = [];
  const otherNames: string[] = [];

  for (const member of members) {
    const name = member.name.trim();
    if (!name) continue;

    const status = member.status?.trim() ?? "";
    if (status) {
      keyPeople.push({ name, status });
    } else {
      otherNames.push(name);
    }
  }

  return {
    keyPeople: keyPeople.length > 0 ? keyPeople : [emptyKeyPersonDraft()],
    otherNamesText: otherNames.join("\n"),
  };
}

export function buildHouseholdMembers(
  keyPeople: KeyPersonDraft[],
  otherNamesText: string,
  previousPhones?: Map<string, string>
): { name: string; phone: string; status: string }[] {
  const phoneFor = (name: string) =>
    previousPhones?.get(name.trim().toLowerCase()) ?? "";

  const keyed = keyPeople
    .map((person) => ({
      name: person.name.trim(),
      status: person.status.trim(),
      phone: phoneFor(person.name),
    }))
    .filter((person) => person.name && person.status);

  const others = parseNamesText(otherNamesText).map((name) => ({
    name,
    status: "",
    phone: phoneFor(name),
  }));

  return [...keyed, ...others];
}

/**
 * Plain-text legend line (kept for non-React uses).
 * Prefer <PersonLegendLine /> in the UI so status can be styled.
 */
export function formatPersonLegendEntry(person: {
  label: string;
  members: { name: string; status?: string }[];
}): string {
  const label = person.label.trim() || "•";
  const parts = person.members
    .map((member) => {
      const name = member.name.trim();
      const status = member.status?.trim() ?? "";
      if (!name) return "";
      return status ? `${name} (${status})` : name;
    })
    .filter(Boolean);

  if (parts.length === 0) {
    return `${label} — (no names)`;
  }

  if (parts.length === 1) {
    return `${label} - ${parts[0]}`;
  }

  const titleSource =
    person.members.find((member) => member.status?.trim())?.name.trim() ||
    person.members.find((member) => member.name.trim())?.name.trim() ||
    "Group";

  return `${label} - ${titleSource} Family: ${parts.join(", ")}`;
}
