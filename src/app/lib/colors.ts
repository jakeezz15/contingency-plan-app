/** Shared palette for people pins and route lines. */
export const PLAN_COLOR_OPTIONS = [
  { value: "#2563eb", label: "Blue" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#ca8a04", label: "Gold" },
  { value: "#16a34a", label: "Green" },
  { value: "#0891b2", label: "Teal" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#db2777", label: "Pink" },
  { value: "#57534e", label: "Stone" },
] as const;

export const DEFAULT_PERSON_COLOR = "#2563eb";
export const DEFAULT_ROUTE_COLOR = "#dc2626";

export function isPlanColor(value: string): boolean {
  return PLAN_COLOR_OPTIONS.some((option) => option.value === value);
}

export function normalizePlanColor(
  value: unknown,
  fallback: string = DEFAULT_PERSON_COLOR
): string {
  if (typeof value === "string" && isPlanColor(value)) return value;
  return fallback;
}

/** Pick the next unused palette color, cycling if all are used. */
export function suggestNextPlanColor(existingColors: string[]): string {
  const used = new Set(existingColors);
  const unused = PLAN_COLOR_OPTIONS.find(
    (option) => !used.has(option.value)
  );
  if (unused) return unused.value;
  return PLAN_COLOR_OPTIONS[
    existingColors.length % PLAN_COLOR_OPTIONS.length
  ].value;
}
