export type HouseholdMember = {
  name: string;
  phone: string;
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

export type SavedPlan = {
  id: string;
  planName: string;
  planNotes: string;
  createdAt: string;
  updatedAt: string;
  people: Person[];
  meetingPoints: MeetingPoint[];
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
