import type { MeetingPoint, Person, SavedPlan } from "@/app/types";

export const LEGACY_STORAGE_KEY = "contingency-plan-people";
export const PLANS_STORAGE_KEY = "contingency-plan-plans";
export const ACTIVE_PLAN_STORAGE_KEY = "contingency-plan-active-id";

export type WorkspaceSection = "plan-details" | "people" | "meeting-points";

export function formatPlanDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function generatePlanId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyPlanData(): Omit<SavedPlan, "id"> {
  const now = new Date().toISOString();

  return {
    planName: "",
    planNotes: "",
    createdAt: now,
    updatedAt: now,
    people: [],
    meetingPoints: [],
  };
}

export function createEmptyPlan(): SavedPlan {
  return { id: generatePlanId(), ...createEmptyPlanData() };
}

export function normalizePlanData(parsed: unknown): Omit<SavedPlan, "id"> {
  if (Array.isArray(parsed)) {
    return {
      ...createEmptyPlanData(),
      people: parsed.map((person: Person) => ({
        ...person,
        phone: person.phone ?? "",
        role: person.role ?? "",
      })),
    };
  }

  const data = parsed as Partial<SavedPlan>;

  return {
    planName: data.planName ?? "",
    planNotes: data.planNotes ?? "",
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    people: (data.people ?? []).map((person: Person) => ({
      ...person,
      phone: person.phone ?? "",
      role: person.role ?? "",
    })),
    meetingPoints: (data.meetingPoints ?? []).map((point: MeetingPoint) => ({
      ...point,
      notes: point.notes ?? "",
    })),
  };
}

export function parsePlanJson(raw: string): Omit<SavedPlan, "id"> {
  return normalizePlanData(JSON.parse(raw));
}

export function persistPlans(plans: SavedPlan[], activeId: string) {
  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, activeId);
}
