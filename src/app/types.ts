export type HouseholdMember = {
  name: string;
  phone: string;
  /** Role at this pin, e.g. Team Leader / Medical. Empty = regular person. */
  status?: string;
};

export type Person = {
  id: number;
  /** Single map pin label for everyone at this address (e.g. "1"). */
  label: string;
  address: string;
  lat: number;
  lng: number;
  /** Names living at this labeled address. */
  members: HouseholdMember[];
  /** @deprecated Kept for older saved plans; no longer used in the UI. */
  role?: string;
  /** @deprecated Migrated into members[]. */
  name?: string;
  /** @deprecated Migrated into members[]. */
  phone?: string;
};

export type MeetingPoint = {
  id: number;
  name: string;
  notes: string;
  address: string;
  lat: number;
  lng: number;
};

/** A selectable route endpoint: people pin or meeting point. */
export type RouteEndpointRef =
  | { kind: "person"; id: number }
  | { kind: "meeting"; id: number };

/** User-defined route between two map endpoints. */
export type PlannedRoute = {
  id: string;
  from: RouteEndpointRef;
  to: RouteEndpointRef;
  /** Hex color used on the map / PDF, e.g. "#dc2626". */
  color: string;
};

export type SavedPlan = {
  id: string;
  planName: string;
  planNotes: string;
  createdAt: string;
  updatedAt: string;
  people: Person[];
  meetingPoints: MeetingPoint[];
  /** Custom routes the user chose to highlight on the map. */
  routes: PlannedRoute[];
};

export type SelectedLocation = {
  lat: number;
  lng: number;
} | null;

export type GeocodeResult = {
  displayName: string;
  compactAddress: string;
  lat: number;
  lng: number;
};
