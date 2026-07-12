export type Person = {
  id: number;
  name: string;
  address: string;
  phone: string;
  role: string;
  lat: number;
  lng: number;
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
