"use client";

import { useEffect, useRef, useState } from "react";
import { geocodeAddress } from "@/app/lib/geocode";
import { exportElementToPdf } from "@/app/lib/pdf";
import { prepareMapForPrint } from "@/app/lib/mapPrint";
import {
  ACTIVE_PLAN_STORAGE_KEY,
  createEmptyPlan,
  generatePlanId,
  LEGACY_STORAGE_KEY,
  normalizePlanData,
  parsePlanJson,
  persistPlans,
  PLANS_STORAGE_KEY,
  type WorkspaceSection,
} from "@/app/lib/plans";
import type {
  GeocodeResult,
  MeetingPoint,
  Person,
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
  const [openSections, setOpenSections] = useState<
    Record<WorkspaceSection, boolean>
  >({
    "plan-details": true,
    people: true,
    "meeting-points": true,
  });

  const skipNextSave = useRef(true);
  const importInputRef = useRef<HTMLInputElement>(null);
  const generatedPlanRef = useRef<HTMLElement>(null);

  function loadPlanIntoEditor(plan: SavedPlan) {
    setPlanName(plan.planName);
    setPlanNotes(plan.planNotes);
    setCreatedAt(plan.createdAt);
    setUpdatedAt(plan.updatedAt);
    setPeople(plan.people);
    setMeetingPoints(plan.meetingPoints);
  }

  function resetPersonForm() {
    setName("");
    setAddress("");
    setPhone("");
    setRole("");
    setSelectedLocation(null);
    setPendingGeocode(null);
    setSearchMessage("");
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
      address: pendingGeocode?.compactAddress ?? address.trim(),
      phone: phone.trim(),
      role: role.trim(),
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    };

    setPeople([...people, newPerson]);
    resetPersonForm();
    invalidateGeneratedPlan();
  }

  function updatePerson(updatedPerson: Person) {
    setPeople(
      people.map((person) =>
        person.id === updatedPerson.id ? updatedPerson : person
      )
    );
    setEditingPersonId(null);
    invalidateGeneratedPlan();
  }

  function removePerson(id: number) {
    setPeople(people.filter((person) => person.id !== id));
    if (editingPersonId === id) {
      setEditingPersonId(null);
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
    setMeetingPoints(meetingPoints.filter((point) => point.id !== id));
    invalidateGeneratedPlan();
  }

  function clearAllPeople() {
    const confirmClear = confirm(
      "Are you sure you want to remove all saved people and markers?"
    );

    if (!confirmClear) return;

    setPeople([]);
    invalidateGeneratedPlan();
  }

  function clearAllMeetingPoints() {
    const confirmClear = confirm(
      "Are you sure you want to remove all meeting points?"
    );

    if (!confirmClear) return;

    setMeetingPoints([]);
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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("generated-plan")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
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

  async function exportPdf() {
    if (!generatedPlanRef.current) return;

    try {
      setIsExportingPdf(true);
      await prepareForPrintOutput();
      const safeName = planName.trim() || "contingency-plan";
      await exportElementToPdf(
        generatedPlanRef.current,
        `${safeName.toLowerCase().replace(/\s+/g, "-")}.pdf`
      );
    } catch (error) {
      console.error(error);
      alert("Could not export PDF. Please try again.");
    } finally {
      document.documentElement.classList.remove("preparing-print");
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

  function toggleSection(section: WorkspaceSection) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function scrollToSection(sectionId: string) {
    if (
      sectionId === "plan-details" ||
      sectionId === "people" ||
      sectionId === "meeting-points"
    ) {
      setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    }

    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handlePersonAddressChange(value: string) {
    setAddress(value);
    setSelectedLocation(null);
    setPendingGeocode(null);
    setSearchMessage("");
  }

  function handleMeetingPointAddressChange(value: string) {
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
    name,
    role,
    phone,
    address,
    people,
    selectedLocation,
    pendingGeocode,
    isSearching,
    searchMessage,
    meetingPointName,
    meetingPointAddress,
    meetingPointNotes,
    meetingPoints,
    selectedMeetingLocation,
    pendingMeetingGeocode,
    isSearchingMeeting,
    meetingSearchMessage,
    showGeneratedPlan,
    editingPersonId,
    isExportingPdf,
    openSections,
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
    setName,
    setRole,
    setPhone,
    handlePersonAddressChange,
    setMeetingPointName,
    handleMeetingPointAddressChange,
    setMeetingPointNotes,
    setEditingPersonId,
    switchToPlan,
    createNewPlan,
    deleteActivePlan,
    scrollToSection,
    generatePlan,
    printPlan,
    exportPdf,
    exportPlan,
    importPlan,
    toggleSection,
    confirmAddress,
    confirmMeetingAddress,
    addPerson,
    updatePerson,
    removePerson,
    clearAllPeople,
    addMeetingPoint,
    removeMeetingPoint,
    clearAllMeetingPoints,
    resetActivePlan,
  };
}
