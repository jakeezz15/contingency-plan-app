"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import PersonCard from "@/app/components/PersonCard";
import { geocodeAddress } from "@/app/lib/geocode";
import { findNearestMeetingPoint, formatDistanceKm } from "@/app/lib/geo";
import { exportElementToPdf } from "@/app/lib/pdf";
import type {
  GeocodeResult,
  MeetingPoint,
  Person,
  SavedPlan,
  SelectedLocation,
} from "@/app/types";

const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
});

const LEGACY_STORAGE_KEY = "contingency-plan-people";
const PLANS_STORAGE_KEY = "contingency-plan-plans";
const ACTIVE_PLAN_STORAGE_KEY = "contingency-plan-active-id";

const ROLE_OPTIONS = [
  "Team Lead",
  "Backup Contact",
  "Family",
  "Staff",
  "Other",
];

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generatePlanId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyPlanData(): Omit<SavedPlan, "id"> {
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

function createEmptyPlan(): SavedPlan {
  return { id: generatePlanId(), ...createEmptyPlanData() };
}

function normalizePlanData(parsed: unknown): Omit<SavedPlan, "id"> {
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

function parsePlanJson(raw: string): Omit<SavedPlan, "id"> {
  return normalizePlanData(JSON.parse(raw));
}

function persistPlans(plans: SavedPlan[], activeId: string) {
  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, activeId);
}

export default function Home() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState("");

  const [planName, setPlanName] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation>(null);
  const [pendingGeocode, setPendingGeocode] = useState<GeocodeResult | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const [meetingPointName, setMeetingPointName] = useState("");
  const [meetingPointAddress, setMeetingPointAddress] = useState("");
  const [meetingPointNotes, setMeetingPointNotes] = useState("");
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([]);
  const [selectedMeetingLocation, setSelectedMeetingLocation] =
    useState<SelectedLocation>(null);
  const [pendingMeetingGeocode, setPendingMeetingGeocode] =
    useState<GeocodeResult | null>(null);
  const [isSearchingMeeting, setIsSearchingMeeting] = useState(false);
  const [meetingSearchMessage, setMeetingSearchMessage] = useState("");

  const [showGeneratedPlan, setShowGeneratedPlan] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const skipNextSave = useRef(true);
  const importInputRef = useRef<HTMLInputElement>(null);
  const generatedPlanRef = useRef<HTMLDivElement>(null);

  function loadPlanIntoEditor(plan: SavedPlan) {
    setPlanName(plan.planName);
    setPlanNotes(plan.planNotes);
    setCreatedAt(plan.createdAt);
    setUpdatedAt(plan.updatedAt);
    setPeople(plan.people);
    setMeetingPoints(plan.meetingPoints);
  }

  function resetTransientState() {
    setEditingPersonId(null);
    setShowGeneratedPlan(false);
    setName("");
    setAddress("");
    setPhone("");
    setRole("");
    setSelectedLocation(null);
    setPendingGeocode(null);
    setSearchMessage("");
    setMeetingPointName("");
    setMeetingPointAddress("");
    setMeetingPointNotes("");
    setSelectedMeetingLocation(null);
    setPendingMeetingGeocode(null);
    setMeetingSearchMessage("");
  }

  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);

      let loadedPlans: SavedPlan[] = [];

      if (storedPlans) {
        const parsedPlans = JSON.parse(storedPlans) as unknown[];
        loadedPlans = parsedPlans.map((rawPlan) => {
          const data = rawPlan as Partial<SavedPlan>;
          return {
            id: data.id ?? generatePlanId(),
            ...normalizePlanData(data),
          };
        });
      } else {
        const legacyPlan = localStorage.getItem(LEGACY_STORAGE_KEY);

        if (legacyPlan) {
          loadedPlans = [
            { id: generatePlanId(), ...parsePlanJson(legacyPlan) },
          ];
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }

      if (loadedPlans.length === 0) {
        loadedPlans = [createEmptyPlan()];
      }

      const activeId =
        loadedPlans.find((plan) => plan.id === storedActiveId)?.id ??
        loadedPlans[0].id;
      const activePlan = loadedPlans.find((plan) => plan.id === activeId)!;

      // One-time hydration of client-only localStorage data on mount. This
      // must run in an effect (not a lazy useState initializer) so the
      // server-rendered markup matches the client's first render before
      // swapping in the persisted plan, avoiding a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlans(loadedPlans);
      setActivePlanId(activeId);
      loadPlanIntoEditor(activePlan);
      persistPlans(loadedPlans, activeId);
    } catch (error) {
      console.error("Failed to load saved plans:", error);
      const emptyPlan = createEmptyPlan();
      setPlans([emptyPlan]);
      setActivePlanId(emptyPlan.id);
      loadPlanIntoEditor(emptyPlan);
    } finally {
      setHasLoadedSavedData(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedData) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const now = new Date().toISOString();

    setPlans((prevPlans) => {
      const updatedPlans = prevPlans.map((plan) =>
        plan.id === activePlanId
          ? {
              ...plan,
              planName,
              planNotes,
              people,
              meetingPoints,
              createdAt: plan.createdAt || now,
              updatedAt: now,
            }
          : plan
      );

      persistPlans(updatedPlans, activePlanId);
      return updatedPlans;
    });

    setUpdatedAt(now);
  }, [planName, planNotes, people, meetingPoints, hasLoadedSavedData, activePlanId]);

  async function findAddressLocation(addressText: string) {
    try {
      setIsSearching(true);
      setSearchMessage("Searching address...");

      const result = await geocodeAddress(addressText);
      setPendingGeocode(result);
      setSearchMessage("Confirm the address below before adding this person.");
    } catch (error) {
      setPendingGeocode(null);
      setSelectedLocation(null);
      setSearchMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while searching the address."
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function findMeetingPointLocation(addressText: string) {
    try {
      setIsSearchingMeeting(true);
      setMeetingSearchMessage("Searching address...");

      const result = await geocodeAddress(addressText);
      setPendingMeetingGeocode(result);
      setMeetingSearchMessage(
        "Confirm the address below before adding this meeting point."
      );
    } catch (error) {
      setPendingMeetingGeocode(null);
      setSelectedMeetingLocation(null);
      setMeetingSearchMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while searching the address."
      );
    } finally {
      setIsSearchingMeeting(false);
    }
  }

  function confirmAddress() {
    if (!pendingGeocode) return;

    setSelectedLocation({
      lat: pendingGeocode.lat,
      lng: pendingGeocode.lng,
    });
    setSearchMessage("Address confirmed. You can add this person now.");
  }

  function confirmMeetingAddress() {
    if (!pendingMeetingGeocode) return;

    setSelectedMeetingLocation({
      lat: pendingMeetingGeocode.lat,
      lng: pendingMeetingGeocode.lng,
    });
    setMeetingSearchMessage(
      "Address confirmed. You can add this meeting point now."
    );
  }

  useEffect(() => {
    if (address.trim().length < 5) return;

    const delaySearch = setTimeout(() => {
      findAddressLocation(address);
    }, 1000);

    return () => clearTimeout(delaySearch);
  }, [address]);

  useEffect(() => {
    if (meetingPointAddress.trim().length < 5) return;

    const delaySearch = setTimeout(() => {
      findMeetingPointLocation(meetingPointAddress);
    }, 1000);

    return () => clearTimeout(delaySearch);
  }, [meetingPointAddress]);

  function addPerson() {
    if (!name.trim() || !address.trim()) {
      alert("Please enter both name and address.");
      return;
    }

    if (!selectedLocation) {
      alert("Please confirm the address on the map before adding this person.");
      return;
    }

    const newPerson: Person = {
      id: Date.now(),
      name: name.trim(),
      address: pendingGeocode?.displayName ?? address.trim(),
      phone: phone.trim(),
      role: role.trim(),
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    };

    setPeople([...people, newPerson]);
    setName("");
    setAddress("");
    setPhone("");
    setRole("");
    setSelectedLocation(null);
    setPendingGeocode(null);
    setSearchMessage("");
    setShowGeneratedPlan(false);
  }

  function updatePerson(updatedPerson: Person) {
    setPeople(
      people.map((person) =>
        person.id === updatedPerson.id ? updatedPerson : person
      )
    );
    setEditingPersonId(null);
    setShowGeneratedPlan(false);
  }

  function removePerson(id: number) {
    setPeople(people.filter((person) => person.id !== id));
    if (editingPersonId === id) {
      setEditingPersonId(null);
    }
    setShowGeneratedPlan(false);
  }

  function addMeetingPoint() {
    if (!meetingPointName.trim() || !meetingPointAddress.trim()) {
      alert("Please enter both a name and address for the meeting point.");
      return;
    }

    if (!selectedMeetingLocation) {
      alert(
        "Please confirm the address on the map before adding this meeting point."
      );
      return;
    }

    const newMeetingPoint: MeetingPoint = {
      id: Date.now(),
      name: meetingPointName.trim(),
      address: pendingMeetingGeocode?.displayName ?? meetingPointAddress.trim(),
      notes: meetingPointNotes.trim(),
      lat: selectedMeetingLocation.lat,
      lng: selectedMeetingLocation.lng,
    };

    setMeetingPoints([...meetingPoints, newMeetingPoint]);
    setMeetingPointName("");
    setMeetingPointAddress("");
    setMeetingPointNotes("");
    setSelectedMeetingLocation(null);
    setPendingMeetingGeocode(null);
    setMeetingSearchMessage("");
    setShowGeneratedPlan(false);
  }

  function removeMeetingPoint(id: number) {
    setMeetingPoints(meetingPoints.filter((point) => point.id !== id));
    setShowGeneratedPlan(false);
  }

  function clearAllPeople() {
    const confirmClear = confirm(
      "Are you sure you want to remove all saved people and markers?"
    );

    if (!confirmClear) return;

    setPeople([]);
    setShowGeneratedPlan(false);
  }

  function clearAllMeetingPoints() {
    const confirmClear = confirm(
      "Are you sure you want to remove all meeting points?"
    );

    if (!confirmClear) return;

    setMeetingPoints([]);
    setShowGeneratedPlan(false);
  }

  function resetActivePlan() {
    const confirmClear = confirm(
      "Are you sure you want to clear this plan's details, people, and meeting points?"
    );

    if (!confirmClear) return;

    const now = new Date().toISOString();
    const clearedPlan: SavedPlan = {
      id: activePlanId,
      planName: "",
      planNotes: "",
      createdAt,
      updatedAt: now,
      people: [],
      meetingPoints: [],
    };

    const updatedPlans = plans.map((plan) =>
      plan.id === activePlanId ? clearedPlan : plan
    );

    setPlans(updatedPlans);
    persistPlans(updatedPlans, activePlanId);

    skipNextSave.current = true;
    loadPlanIntoEditor(clearedPlan);
    setShowGeneratedPlan(false);
  }

  function switchToPlan(id: string) {
    if (id === activePlanId) return;

    const targetPlan = plans.find((plan) => plan.id === id);
    if (!targetPlan) return;

    skipNextSave.current = true;
    setActivePlanId(id);
    loadPlanIntoEditor(targetPlan);
    resetTransientState();
    localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, id);
  }

  function createNewPlan() {
    const newPlan = createEmptyPlan();
    const updatedPlans = [...plans, newPlan];

    setPlans(updatedPlans);
    persistPlans(updatedPlans, newPlan.id);

    skipNextSave.current = true;
    setActivePlanId(newPlan.id);
    loadPlanIntoEditor(newPlan);
    resetTransientState();
  }

  function deleteActivePlan() {
    if (plans.length <= 1) {
      alert("You need at least one plan. Add another plan before deleting this one.");
      return;
    }

    const confirmDelete = confirm(
      `Delete "${displayPlanName}"? This cannot be undone.`
    );

    if (!confirmDelete) return;

    const remainingPlans = plans.filter((plan) => plan.id !== activePlanId);
    const nextPlan = remainingPlans[0];

    setPlans(remainingPlans);
    persistPlans(remainingPlans, nextPlan.id);

    skipNextSave.current = true;
    setActivePlanId(nextPlan.id);
    loadPlanIntoEditor(nextPlan);
    resetTransientState();
  }

  function generatePlan() {
    if (!planName.trim()) {
      alert("Please enter a plan name before generating.");
      return;
    }

    if (people.length === 0) {
      alert("Please add at least one person first.");
      return;
    }

    setShowGeneratedPlan(true);

    setTimeout(() => {
      document.getElementById("generated-plan")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }

  function printPlan() {
    window.print();
  }

  async function exportPdf() {
    if (!generatedPlanRef.current) return;

    try {
      setIsExportingPdf(true);
      const safeName = planName.trim() || "contingency-plan";
      await exportElementToPdf(
        generatedPlanRef.current,
        `${safeName.toLowerCase().replace(/\s+/g, "-")}.pdf`
      );
    } catch (error) {
      console.error(error);
      alert("Could not export PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  function exportPlan() {
    const plan: SavedPlan = {
      id: activePlanId,
      planName,
      planNotes,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      people,
      meetingPoints,
    };

    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = planName.trim() || "contingency-plan";

    link.href = url;
    link.download = `${safeName.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importPlan(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const importedData = parsePlanJson(String(reader.result));
        const newPlan: SavedPlan = { id: generatePlanId(), ...importedData };
        const updatedPlans = [...plans, newPlan];

        setPlans(updatedPlans);
        persistPlans(updatedPlans, newPlan.id);

        skipNextSave.current = true;
        setActivePlanId(newPlan.id);
        loadPlanIntoEditor(newPlan);
        resetTransientState();
      } catch (error) {
        console.error(error);
        alert("Could not import plan. Please choose a valid JSON backup file.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  const displayPlanName = planName.trim() || "Untitled Contingency Plan";

  return (
    <main className="min-h-screen bg-gray-100 p-6 print:bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="print:hidden">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Contingency Plan Map Generator
          </h1>

          <p className="mb-6 text-gray-600">
            Set up your plan details, add people and meeting points, and
            generate a printable map reference saved in your browser.
          </p>
        </div>

        <section className="mb-6 rounded-xl bg-white p-4 shadow print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Plan:
              </label>
              <select
                className="rounded-lg border border-gray-300 p-2 text-sm text-gray-900"
                value={activePlanId}
                onChange={(e) => switchToPlan(e.target.value)}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName.trim() || "Untitled Plan"}
                    {plan.updatedAt
                      ? ` — ${formatDate(plan.updatedAt)}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createNewPlan}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                + New Plan
              </button>

              <button
                onClick={deleteActivePlan}
                disabled={plans.length <= 1}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-6 shadow print:hidden">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Plan Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Plan Name
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                type="text"
                placeholder="Example: Helsinki Team Plan"
                value={planName}
                onChange={(e) => {
                  setPlanName(e.target.value);
                  setShowGeneratedPlan(false);
                }}
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-800">Created:</span>{" "}
                {createdAt ? formatDate(createdAt) : "—"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-800">Last updated:</span>{" "}
                {updatedAt ? formatDate(updatedAt) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Plan Notes / Instructions
            </label>
            <textarea
              className="min-h-24 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              placeholder="Example: In an emergency, contact the team lead first and meet at the office rally point."
              value={planNotes}
              onChange={(e) => {
                setPlanNotes(e.target.value);
                setShowGeneratedPlan(false);
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={exportPlan}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Export JSON
            </button>

            <button
              onClick={() => importInputRef.current?.click()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Import JSON
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={importPlan}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3 print:hidden">
          <div className="space-y-6">
            <section className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Add Person
              </h2>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  type="text"
                  placeholder="Example: Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="">Select a role (optional)</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  type="tel"
                  placeholder="Example: +358 40 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  type="text"
                  placeholder="Example: Ruukkupolku 14, Vantaa, Finland"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSelectedLocation(null);
                    setPendingGeocode(null);
                    setSearchMessage("");
                  }}
                />
              </div>

              {searchMessage && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {isSearching ? "🔎 " : "📍 "}
                  {searchMessage}
                </div>
              )}

              {pendingGeocode && !selectedLocation && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Did you mean this address?</p>
                  <p className="mt-1">{pendingGeocode.displayName}</p>
                  <button
                    onClick={confirmAddress}
                    className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                  >
                    Use This Address
                  </button>
                </div>
              )}

              {selectedLocation && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  Address confirmed.
                  <br />
                  Lat: {selectedLocation.lat.toFixed(5)}
                  <br />
                  Lng: {selectedLocation.lng.toFixed(5)}
                </div>
              )}

              <button
                onClick={addPerson}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Add Person Marker
              </button>

              <p className="mt-3 text-sm text-gray-500">
                Use complete address, city, and country for better results.
              </p>
            </section>

            <section className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-1 text-xl font-semibold text-gray-900">
                Add Meeting Point
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Rally points people should go to in an emergency.
              </p>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  type="text"
                  placeholder="Example: Main Office Rally Point"
                  value={meetingPointName}
                  onChange={(e) => setMeetingPointName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  type="text"
                  placeholder="Example: Mannerheimintie 1, Helsinki, Finland"
                  value={meetingPointAddress}
                  onChange={(e) => {
                    setMeetingPointAddress(e.target.value);
                    setSelectedMeetingLocation(null);
                    setPendingMeetingGeocode(null);
                    setMeetingSearchMessage("");
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  className="min-h-16 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  placeholder="Example: Wait at the main entrance."
                  value={meetingPointNotes}
                  onChange={(e) => setMeetingPointNotes(e.target.value)}
                />
              </div>

              {meetingSearchMessage && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {isSearchingMeeting ? "🔎 " : "📍 "}
                  {meetingSearchMessage}
                </div>
              )}

              {pendingMeetingGeocode && !selectedMeetingLocation && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Did you mean this address?</p>
                  <p className="mt-1">{pendingMeetingGeocode.displayName}</p>
                  <button
                    onClick={confirmMeetingAddress}
                    className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                  >
                    Use This Address
                  </button>
                </div>
              )}

              {selectedMeetingLocation && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  Address confirmed.
                  <br />
                  Lat: {selectedMeetingLocation.lat.toFixed(5)}
                  <br />
                  Lng: {selectedMeetingLocation.lng.toFixed(5)}
                </div>
              )}

              <button
                onClick={addMeetingPoint}
                className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
              >
                Add Meeting Point Marker
              </button>
            </section>
          </div>

          <section className="rounded-xl bg-white p-6 shadow lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Map Preview
              </h2>

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
                  Person
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
                  Meeting point
                </span>
              </div>
            </div>

            <MapPicker
              people={people}
              meetingPoints={meetingPoints}
              selectedLocation={selectedLocation}
              selectedMeetingLocation={selectedMeetingLocation}
            />
          </section>
        </div>

        <section className="mt-6 rounded-xl bg-white p-6 shadow print:hidden">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                People List
              </h2>
              <p className="text-sm text-gray-500">
                Saved people: {people.length}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={generatePlan}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                Generate Contingency Plan Map
              </button>

              <button
                onClick={clearAllPeople}
                className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
              >
                Clear People
              </button>

              <button
                onClick={resetActivePlan}
                className="rounded-lg border border-red-300 px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
              >
                Reset Plan
              </button>
            </div>
          </div>

          {people.length === 0 ? (
            <p className="text-gray-500">No people added yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  meetingPoints={meetingPoints}
                  isEditing={editingPersonId === person.id}
                  onEdit={() => setEditingPersonId(person.id)}
                  onCancelEdit={() => setEditingPersonId(null)}
                  onSave={updatePerson}
                  onRemove={() => removePerson(person.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow print:hidden">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Meeting Points
              </h2>
              <p className="text-sm text-gray-500">
                Saved meeting points: {meetingPoints.length}
              </p>
            </div>

            {meetingPoints.length > 0 && (
              <button
                onClick={clearAllMeetingPoints}
                className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
              >
                Clear Meeting Points
              </button>
            )}
          </div>

          {meetingPoints.length === 0 ? (
            <p className="text-gray-500">No meeting points added yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {meetingPoints.map((point) => (
                <div
                  key={point.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        🚩 {point.name}
                      </p>
                      <p className="text-sm text-gray-600">{point.address}</p>
                      {point.notes && (
                        <p className="mt-1 text-sm text-gray-500">
                          {point.notes}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeMeetingPoint(point.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {showGeneratedPlan && (
          <section
            id="generated-plan"
            ref={generatedPlanRef}
            className="mt-6 rounded-xl bg-white p-6 shadow print:mt-0 print:shadow-none"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between print:block">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {displayPlanName}
                </h2>

                <p className="text-gray-600">
                  Total marked addresses: {people.length}
                  {meetingPoints.length > 0 &&
                    ` · Meeting points: ${meetingPoints.length}`}
                </p>

                <div className="mt-2 text-sm text-gray-500">
                  <p>Created: {createdAt ? formatDate(createdAt) : "—"}</p>
                  <p>
                    Last updated: {updatedAt ? formatDate(updatedAt) : "—"}
                  </p>
                </div>

                {planNotes.trim() && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="mb-1 font-semibold text-gray-900">
                      Plan Notes
                    </p>
                    <p className="whitespace-pre-wrap">{planNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row print:hidden">
                <button
                  onClick={exportPdf}
                  disabled={isExportingPdf}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
                </button>

                <button
                  onClick={printPlan}
                  className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-black"
                >
                  Print Plan
                </button>
              </div>
            </div>

            <MapPicker
              people={people}
              meetingPoints={meetingPoints}
              selectedLocation={null}
              large
            />

            <div className="mt-6 print:break-inside-avoid">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                People & Contact List
              </h3>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b p-3">#</th>
                      <th className="border-b p-3">Name</th>
                      <th className="border-b p-3">Role</th>
                      <th className="border-b p-3">Phone</th>
                      <th className="border-b p-3">Address</th>
                      <th className="border-b p-3">Coordinates</th>
                      {meetingPoints.length > 0 && (
                        <th className="border-b p-3">Nearest Meeting Point</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {people.map((person, index) => {
                      const nearest = findNearestMeetingPoint(
                        person,
                        meetingPoints
                      );

                      return (
                        <tr
                          key={person.id}
                          className="print:break-inside-avoid"
                        >
                          <td className="border-b p-3">{index + 1}</td>
                          <td className="border-b p-3 font-medium">
                            {person.name}
                          </td>
                          <td className="border-b p-3">
                            {person.role || "—"}
                          </td>
                          <td className="border-b p-3">
                            {person.phone || "—"}
                          </td>
                          <td className="border-b p-3">{person.address}</td>
                          <td className="border-b p-3 text-gray-500">
                            {person.lat.toFixed(5)}, {person.lng.toFixed(5)}
                          </td>
                          {meetingPoints.length > 0 && (
                            <td className="border-b p-3">
                              {nearest
                                ? `🚩 ${nearest.point.name} (${formatDistanceKm(
                                    nearest.distanceKm
                                  )})`
                                : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {meetingPoints.length > 0 && (
              <div className="mt-6 print:break-inside-avoid">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Meeting Points
                </h3>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border-b p-3">#</th>
                        <th className="border-b p-3">Name</th>
                        <th className="border-b p-3">Address</th>
                        <th className="border-b p-3">Notes</th>
                        <th className="border-b p-3">Coordinates</th>
                      </tr>
                    </thead>

                    <tbody>
                      {meetingPoints.map((point, index) => (
                        <tr key={point.id} className="print:break-inside-avoid">
                          <td className="border-b p-3">{index + 1}</td>
                          <td className="border-b p-3 font-medium">
                            🚩 {point.name}
                          </td>
                          <td className="border-b p-3">{point.address}</td>
                          <td className="border-b p-3">{point.notes || "—"}</td>
                          <td className="border-b p-3 text-gray-500">
                            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
