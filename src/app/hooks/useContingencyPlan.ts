"use client";

import { useEffect, useRef, useState } from "react";
import { geocodeAddress, formatMapPinLabel, reverseGeocode } from "@/app/lib/geocode";
import { exportElementToPdf } from "@/app/lib/pdf";
import { prepareMapForPrint } from "@/app/lib/mapPrint";
import { DEFAULT_BASEMAP, type BasemapId } from "@/app/lib/basemaps";
import {
  buildHouseholdMembers,
  emptyKeyPersonDraft,
  splitHouseholdMembers,
  suggestNextPersonLabel,
  type KeyPersonDraft,
} from "@/app/lib/roles";
import {
  DEFAULT_PERSON_COLOR,
  normalizePlanColor,
  suggestNextPlanColor,
} from "@/app/lib/colors";
import {
  ACTIVE_PLAN_STORAGE_KEY,
  createEmptyPlan,
  generatePlanId,
  LEGACY_STORAGE_KEY,
  normalizePlanData,
  parsePlanJson,
  persistPlans,
  PLANS_STORAGE_KEY,
} from "@/app/lib/plans";
import { prunePlannedRoutes } from "@/app/lib/routing";
import type {
  GeocodeResult,
  MeetingPoint,
  Person,
  PlannedRoute,
  RouteEndpointRef,
  SavedPlan,
  SelectedLocation,
} from "@/app/types";

export function useContingencyPlan() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState("");

  const [planName, setPlanName] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("1");
  const [labelColor, setLabelColor] = useState(DEFAULT_PERSON_COLOR);
  const [keyPeople, setKeyPeople] = useState<KeyPersonDraft[]>([
    emptyKeyPersonDraft(),
  ]);
  const [namesText, setNamesText] = useState("");
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
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
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
  const [basemap, setBasemap] = useState<BasemapId>(DEFAULT_BASEMAP);

  const skipNextSave = useRef(true);
  const skipNextPersonGeocode = useRef(false);
  const skipNextMeetingGeocode = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const generatedPlanRef = useRef<HTMLDivElement>(null);

  function nextLabelColor(currentPeople: Person[]) {
    return suggestNextPlanColor(currentPeople.map((person) => person.color));
  }

  function loadPlanIntoEditor(plan: SavedPlan) {
    setPlanName(plan.planName);
    setPlanNotes(plan.planNotes);
    setCreatedAt(plan.createdAt);
    setUpdatedAt(plan.updatedAt);
    setPeople(plan.people);
    setMeetingPoints(plan.meetingPoints);
    setRoutes(plan.routes ?? []);
    setLabel(suggestNextPersonLabel(plan.people.map((person) => person.label)));
    setLabelColor(nextLabelColor(plan.people));
    setKeyPeople([emptyKeyPersonDraft()]);
    setNamesText("");
  }

  function resetPersonForm(currentPeople: Person[] = people) {
    setEditingPersonId(null);
    setAddress("");
    setLabel(suggestNextPersonLabel(currentPeople.map((person) => person.label)));
    setLabelColor(nextLabelColor(currentPeople));
    setKeyPeople([emptyKeyPersonDraft()]);
    setNamesText("");
    setSelectedLocation(null);
    setPendingGeocode(null);
    setSearchMessage("");
  }

  function startEditPerson(id: number) {
    const person = people.find((entry) => entry.id === id);
    if (!person) return;

    const split = splitHouseholdMembers(person.members);

    setEditingPersonId(id);
    setLabel(person.label);
    setLabelColor(normalizePlanColor(person.color, DEFAULT_PERSON_COLOR));
    setAddress(person.address);
    setKeyPeople(split.keyPeople);
    setNamesText(split.otherNamesText);
    setSelectedLocation({ lat: person.lat, lng: person.lng });
    setPendingGeocode({
      displayName: person.address,
      compactAddress: person.address,
      lat: person.lat,
      lng: person.lng,
    });
    setSearchMessage("");

    requestAnimationFrame(() => {
      document.getElementById("people-form")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  function cancelEditPerson() {
    resetPersonForm();
  }

  function resetMeetingPointForm() {
    setMeetingPointName("");
    setMeetingPointAddress("");
    setMeetingPointNotes("");
    setSelectedMeetingLocation(null);
    setPendingMeetingGeocode(null);
    setMeetingSearchMessage("");
  }

  function resetTransientState() {
    setEditingPersonId(null);
    setShowGeneratedPlan(false);
    resetPersonForm();
    resetMeetingPointForm();
  }

  function invalidateGeneratedPlan() {
    setShowGeneratedPlan(false);
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
              routes,
              createdAt: plan.createdAt || now,
              updatedAt: now,
            }
          : plan
      );

      persistPlans(updatedPlans, activePlanId);
      return updatedPlans;
    });

    setUpdatedAt(now);
  }, [planName, planNotes, people, meetingPoints, routes, hasLoadedSavedData, activePlanId]);

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

  async function pinLocationOnMap(
    lat: number,
    lng: number,
    target: "person" | "meeting"
  ) {
    const fallbackLabel = formatMapPinLabel(lat, lng);

    if (target === "person") {
      skipNextPersonGeocode.current = true;
      setIsSearching(true);
      setSearchMessage("Looking up map pin…");
      setSelectedLocation({ lat, lng });
      setPendingGeocode({
        displayName: fallbackLabel,
        compactAddress: fallbackLabel,
        lat,
        lng,
      });
      setAddress(fallbackLabel);

      try {
        const result = await reverseGeocode(lat, lng);
        skipNextPersonGeocode.current = true;
        setPendingGeocode(result);
        setAddress(result.compactAddress);
        setSearchMessage("Map pin set. You can add this person now.");
      } catch {
        setSearchMessage("Map pin set (approximate location).");
      } finally {
        setIsSearching(false);
      }
      return;
    }

    skipNextMeetingGeocode.current = true;
    setIsSearchingMeeting(true);
    setMeetingSearchMessage("Looking up map pin…");
    setSelectedMeetingLocation({ lat, lng });
    setPendingMeetingGeocode({
      displayName: fallbackLabel,
      compactAddress: fallbackLabel,
      lat,
      lng,
    });
    setMeetingPointAddress(fallbackLabel);

    try {
      const result = await reverseGeocode(lat, lng);
      skipNextMeetingGeocode.current = true;
      setPendingMeetingGeocode(result);
      setMeetingPointAddress(result.compactAddress);
      setMeetingSearchMessage(
        "Map pin set. You can add this meeting point now."
      );
    } catch {
      setMeetingSearchMessage("Map pin set (approximate location).");
    } finally {
      setIsSearchingMeeting(false);
    }
  }

  useEffect(() => {
    if (skipNextPersonGeocode.current) {
      skipNextPersonGeocode.current = false;
      return;
    }

    if (address.trim().length < 5) return;

    const delaySearch = setTimeout(() => {
      findAddressLocation(address);
    }, 1000);

    return () => clearTimeout(delaySearch);
  }, [address]);

  useEffect(() => {
    if (skipNextMeetingGeocode.current) {
      skipNextMeetingGeocode.current = false;
      return;
    }

    if (meetingPointAddress.trim().length < 5) return;

    const delaySearch = setTimeout(() => {
      findMeetingPointLocation(meetingPointAddress);
    }, 1000);

    return () => clearTimeout(delaySearch);
  }, [meetingPointAddress]);

  function addHousehold() {
    if (!address.trim()) {
      alert("Please enter an address.");
      return;
    }

    if (!label.trim()) {
      alert("Please enter a map label (for example a number).");
      return;
    }

    if (!selectedLocation) {
      alert("Please confirm the address on the map before adding.");
      return;
    }

    const editingPerson =
      editingPersonId === null
        ? null
        : people.find((person) => person.id === editingPersonId) ?? null;

    const previousPhones = editingPerson
      ? new Map(
          editingPerson.members.map((member) => [
            member.name.trim().toLowerCase(),
            member.phone,
          ])
        )
      : undefined;

    const members = buildHouseholdMembers(keyPeople, namesText, previousPhones);

    if (members.length === 0) {
      alert(
        "Add at least one person with a status, or list other people by name."
      );
      return;
    }

    if (editingPerson) {
      const nextPeople = people.map((person) =>
        person.id === editingPerson.id
          ? {
              ...person,
              label: label.trim(),
              color: normalizePlanColor(labelColor, DEFAULT_PERSON_COLOR),
              address: pendingGeocode?.compactAddress ?? address.trim(),
              lat: selectedLocation.lat,
              lng: selectedLocation.lng,
              members,
            }
          : person
      );
      setPeople(nextPeople);
      resetPersonForm(nextPeople);
      invalidateGeneratedPlan();
      return;
    }

    const newPerson: Person = {
      id: Date.now(),
      label: label.trim(),
      color: normalizePlanColor(labelColor, DEFAULT_PERSON_COLOR),
      address: pendingGeocode?.compactAddress ?? address.trim(),
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      members,
    };

    const nextPeople = [...people, newPerson];
    setPeople(nextPeople);
    resetPersonForm(nextPeople);
    invalidateGeneratedPlan();
  }

  function updatePerson(updatedPerson: Person) {
    const nextPeople = people.map((person) =>
      person.id === updatedPerson.id ? updatedPerson : person
    );
    setPeople(nextPeople);
    if (editingPersonId === updatedPerson.id) {
      resetPersonForm(nextPeople);
    }
    invalidateGeneratedPlan();
  }

  function removePerson(id: number) {
    const nextPeople = people.filter((person) => person.id !== id);
    setPeople(nextPeople);
    setRoutes((current) =>
      prunePlannedRoutes(current, nextPeople, meetingPoints)
    );
    if (editingPersonId === id) {
      resetPersonForm(nextPeople);
    }
    invalidateGeneratedPlan();
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
      address: pendingMeetingGeocode?.compactAddress ?? meetingPointAddress.trim(),
      notes: meetingPointNotes.trim(),
      lat: selectedMeetingLocation.lat,
      lng: selectedMeetingLocation.lng,
    };

    setMeetingPoints([...meetingPoints, newMeetingPoint]);
    resetMeetingPointForm();
    invalidateGeneratedPlan();
  }

  function removeMeetingPoint(id: number) {
    const nextMeetingPoints = meetingPoints.filter((point) => point.id !== id);
    setMeetingPoints(nextMeetingPoints);
    setRoutes((current) =>
      prunePlannedRoutes(current, people, nextMeetingPoints)
    );
    invalidateGeneratedPlan();
  }

  function addRoute(
    from: RouteEndpointRef,
    to: RouteEndpointRef,
    color: string
  ) {
    const duplicate = routes.some(
      (route) =>
        route.from.kind === from.kind &&
        route.from.id === from.id &&
        route.to.kind === to.kind &&
        route.to.id === to.id
    );
    if (duplicate) {
      alert("That route is already on the plan.");
      return;
    }

    setRoutes([
      ...routes,
      {
        id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from,
        to,
        color,
      },
    ]);
    invalidateGeneratedPlan();
  }

  function updateRouteColor(id: string, color: string) {
    setRoutes(
      routes.map((route) => (route.id === id ? { ...route, color } : route))
    );
    invalidateGeneratedPlan();
  }

  function removeRoute(id: string) {
    setRoutes(routes.filter((route) => route.id !== id));
    invalidateGeneratedPlan();
  }

  function clearAllRoutes() {
    const confirmClear = confirm(
      "Are you sure you want to remove all saved routes?"
    );
    if (!confirmClear) return;
    setRoutes([]);
    invalidateGeneratedPlan();
  }

  function clearAllPeople() {
    const confirmClear = confirm(
      "Are you sure you want to remove all saved people and markers?"
    );

    if (!confirmClear) return;

    setPeople([]);
    setRoutes((current) => prunePlannedRoutes(current, [], meetingPoints));
    resetPersonForm([]);
    invalidateGeneratedPlan();
  }

  function clearAllMeetingPoints() {
    const confirmClear = confirm(
      "Are you sure you want to remove all meeting points?"
    );

    if (!confirmClear) return;

    setMeetingPoints([]);
    setRoutes((current) => prunePlannedRoutes(current, people, []));
    invalidateGeneratedPlan();
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
      routes: [],
    };

    const updatedPlans = plans.map((plan) =>
      plan.id === activePlanId ? clearedPlan : plan
    );

    setPlans(updatedPlans);
    persistPlans(updatedPlans, activePlanId);

    skipNextSave.current = true;
    loadPlanIntoEditor(clearedPlan);
    invalidateGeneratedPlan();
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

  useEffect(() => {
    function clearPrintPreparation() {
      document.documentElement.classList.remove("preparing-print");
    }

    window.addEventListener("afterprint", clearPrintPreparation);
    return () => window.removeEventListener("afterprint", clearPrintPreparation);
  }, []);

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
  }

  async function prepareForPrintOutput() {
    document.documentElement.classList.add("preparing-print");
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    await prepareMapForPrint();
  }

  async function printPlan() {
    try {
      await prepareForPrintOutput();
      window.print();
    } finally {
      window.setTimeout(() => {
        document.documentElement.classList.remove("preparing-print");
      }, 0);
    }
  }

  async function exportPdf(orientation: "portrait" | "landscape" = "landscape") {
    if (!generatedPlanRef.current) return;

    try {
      setIsExportingPdf(true);

      const safeName = planName.trim() || "contingency-plan";
      await exportElementToPdf(
        generatedPlanRef.current,
        `${safeName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        orientation,
        {
          people,
          meetingPoints,
          routes,
          basemap,
        }
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
      routes,
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

  function handlePersonAddressChange(value: string) {
    skipNextPersonGeocode.current = false;
    setAddress(value);
    setSelectedLocation(null);
    setPendingGeocode(null);
    setSearchMessage("");
  }

  function handleMeetingPointAddressChange(value: string) {
    skipNextMeetingGeocode.current = false;
    setMeetingPointAddress(value);
    setSelectedMeetingLocation(null);
    setPendingMeetingGeocode(null);
    setMeetingSearchMessage("");
  }

  const displayPlanName = planName.trim() || "Untitled Contingency Plan";
  const canGeneratePlan = planName.trim().length > 0 && people.length > 0;
  const generatePlanHint =
    !planName.trim() && people.length === 0
      ? "Add a plan name and at least one person to generate."
      : !planName.trim()
        ? "Add a plan name in Plan Details above."
        : people.length === 0
          ? "Add at least one person with a confirmed address."
          : "";

  return {
    plans,
    activePlanId,
    planName,
    planNotes,
    createdAt,
    updatedAt,
    address,
    label,
    labelColor,
    keyPeople,
    namesText,
    people,
    selectedLocation,
    pendingGeocode,
    isSearching,
    searchMessage,
    meetingPointName,
    meetingPointAddress,
    meetingPointNotes,
    meetingPoints,
    routes,
    selectedMeetingLocation,
    pendingMeetingGeocode,
    isSearchingMeeting,
    meetingSearchMessage,
    showGeneratedPlan,
    editingPersonId,
    isExportingPdf,
    basemap,
    importInputRef,
    generatedPlanRef,
    displayPlanName,
    canGeneratePlan,
    generatePlanHint,
    setPlanName: (value: string) => {
      setPlanName(value);
      invalidateGeneratedPlan();
    },
    setPlanNotes: (value: string) => {
      setPlanNotes(value);
      invalidateGeneratedPlan();
    },
    handlePersonAddressChange,
    setLabel,
    setLabelColor,
    setKeyPeople,
    setNamesText,
    setMeetingPointName,
    handleMeetingPointAddressChange,
    setMeetingPointNotes,
    setBasemap,
    switchToPlan,
    createNewPlan,
    deleteActivePlan,
    generatePlan,
    closeGeneratedPlan: () => setShowGeneratedPlan(false),
    printPlan,
    exportPdf,
    exportPlan,
    importPlan,
    confirmAddress,
    confirmMeetingAddress,
    pinLocationOnMap,
    addHousehold,
    startEditPerson,
    cancelEditPerson,
    updatePerson,
    removePerson,
    clearAllPeople,
    addMeetingPoint,
    removeMeetingPoint,
    clearAllMeetingPoints,
    addRoute,
    updateRouteColor,
    removeRoute,
    clearAllRoutes,
    resetActivePlan,
  };
}
