import type {
  HouseholdMember,
  MeetingPoint,
  Person,
  PlannedRoute,
  SavedPlan,
} from "@/app/types";
import { DEFAULT_PERSON_COLOR, normalizePlanColor } from "@/app/lib/colors";
import { normalizePlannedRoutes, prunePlannedRoutes } from "@/app/lib/routing";

export const LEGACY_STORAGE_KEY = "contingency-plan-people";
export const PLANS_STORAGE_KEY = "contingency-plan-plans";
export const ACTIVE_PLAN_STORAGE_KEY = "contingency-plan-active-id";

function normalizeMembers(person: Person): HouseholdMember[] {
  if (Array.isArray(person.members) && person.members.length > 0) {
    return person.members.map((member) => ({
      name: member.name?.trim() ?? "",
      phone: member.phone?.trim() ?? "",
      status: member.status?.trim() ?? "",
    }));
  }

  const legacyName = person.name?.trim() ?? "";
  if (legacyName) {
    return [
      {
        name: legacyName,
        phone: person.phone?.trim() ?? "",
        status: "",
      },
    ];
  }

  return [{ name: "", phone: "", status: "" }];
}

function normalizePerson(person: Person, index: number): Person {
  const label =
    person.label?.trim() ||
    (typeof person.role === "string" && /^\d+$/.test(person.role.trim())
      ? person.role.trim()
      : String(index + 1));

  const members = normalizeMembers(person).filter((member) => member.name);

  return {
    id: person.id,
    label,
    color: normalizePlanColor(person.color, DEFAULT_PERSON_COLOR),
    address: person.address ?? "",
    lat: person.lat,
    lng: person.lng,
    members:
      members.length > 0
        ? members
        : [{ name: "Unnamed", phone: "", status: "" }],
    role: person.role ?? "",
  };
}

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
    routes: [],
  };
}

export function createEmptyPlan(): SavedPlan {
  return { id: generatePlanId(), ...createEmptyPlanData() };
}

export function normalizePlanData(parsed: unknown): Omit<SavedPlan, "id"> {
  if (Array.isArray(parsed)) {
    return {
      ...createEmptyPlanData(),
      people: parsed.map((person: Person, index: number) =>
        normalizePerson(person, index)
      ),
      routes: [],
    };
  }

  const data = parsed as Partial<SavedPlan>;
  const people = (data.people ?? []).map((person: Person, index: number) =>
    normalizePerson(person, index)
  );
  const meetingPoints = (data.meetingPoints ?? []).map((point: MeetingPoint) => ({
    ...point,
    notes: point.notes ?? "",
  }));
  const routes = prunePlannedRoutes(
    normalizePlannedRoutes(data.routes),
    people,
    meetingPoints
  );

  return {
    planName: data.planName ?? "",
    planNotes: data.planNotes ?? "",
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    people,
    meetingPoints,
    routes,
  };
}

export function parsePlanJson(raw: string): Omit<SavedPlan, "id"> {
  return normalizePlanData(JSON.parse(raw));
}

export function persistPlans(plans: SavedPlan[], activeId: string) {
  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, activeId);
}
