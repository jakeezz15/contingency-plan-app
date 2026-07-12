"use client";

import MapPreviewPanel from "@/app/components/plan/MapPreviewPanel";
import MeetingPointsSection from "@/app/components/plan/MeetingPointsSection";
import PeopleSection from "@/app/components/plan/PeopleSection";
import PlanDetailsSection from "@/app/components/plan/PlanDetailsSection";
import WorkspaceSplit from "@/app/components/WorkspaceSplit";
import type { GeocodeResult, MeetingPoint, Person, SelectedLocation } from "@/app/types";
import type { WorkspaceSection } from "@/app/lib/plans";

type PlanWorkspaceProps = {
  openSections: Record<WorkspaceSection, boolean>;
  toggleSection: (section: WorkspaceSection) => void;
  planName: string;
  planNotes: string;
  createdAt: string;
  updatedAt: string;
  setPlanName: (value: string) => void;
  setPlanNotes: (value: string) => void;
  exportPlan: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  importPlan: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetActivePlan: () => void;
  people: Person[];
  meetingPoints: MeetingPoint[];
  editingPersonId: number | null;
  generatePlanHint: string;
  canGeneratePlan: boolean;
  name: string;
  role: string;
  phone: string;
  address: string;
  searchMessage: string;
  isSearching: boolean;
  pendingGeocode: GeocodeResult | null;
  selectedLocation: SelectedLocation;
  setName: (value: string) => void;
  setRole: (value: string) => void;
  setPhone: (value: string) => void;
  handlePersonAddressChange: (value: string) => void;
  confirmAddress: () => void;
  addPerson: () => void;
  clearAllPeople: () => void;
  setEditingPersonId: (id: number | null) => void;
  updatePerson: (person: Person) => void;
  removePerson: (id: number) => void;
  meetingPointName: string;
  meetingPointAddress: string;
  meetingPointNotes: string;
  meetingSearchMessage: string;
  isSearchingMeeting: boolean;
  pendingMeetingGeocode: GeocodeResult | null;
  selectedMeetingLocation: SelectedLocation;
  setMeetingPointName: (value: string) => void;
  handleMeetingPointAddressChange: (value: string) => void;
  setMeetingPointNotes: (value: string) => void;
  confirmMeetingAddress: () => void;
  addMeetingPoint: () => void;
  clearAllMeetingPoints: () => void;
  removeMeetingPoint: (id: number) => void;
};

export default function PlanWorkspace({
  openSections,
  toggleSection,
  planName,
  planNotes,
  createdAt,
  updatedAt,
  setPlanName,
  setPlanNotes,
  exportPlan,
  importInputRef,
  importPlan,
  resetActivePlan,
  people,
  meetingPoints,
  editingPersonId,
  generatePlanHint,
  canGeneratePlan,
  name,
  role,
  phone,
  address,
  searchMessage,
  isSearching,
  pendingGeocode,
  selectedLocation,
  setName,
  setRole,
  setPhone,
  handlePersonAddressChange,
  confirmAddress,
  addPerson,
  clearAllPeople,
  setEditingPersonId,
  updatePerson,
  removePerson,
  meetingPointName,
  meetingPointAddress,
  meetingPointNotes,
  meetingSearchMessage,
  isSearchingMeeting,
  pendingMeetingGeocode,
  selectedMeetingLocation,
  setMeetingPointName,
  handleMeetingPointAddressChange,
  setMeetingPointNotes,
  confirmMeetingAddress,
  addMeetingPoint,
  clearAllMeetingPoints,
  removeMeetingPoint,
}: PlanWorkspaceProps) {
  return (
    <WorkspaceSplit
      workspace={
        <div className="space-y-4 container mx-auto">
          <PlanDetailsSection
            isOpen={openSections["plan-details"]}
            onToggle={() => toggleSection("plan-details")}
            planName={planName}
            planNotes={planNotes}
            createdAt={createdAt}
            updatedAt={updatedAt}
            onPlanNameChange={setPlanName}
            onPlanNotesChange={setPlanNotes}
            onExport={exportPlan}
            onImportClick={() => importInputRef.current?.click()}
            onImport={importPlan}
            onReset={resetActivePlan}
            importInputRef={importInputRef}
          />

          <PeopleSection
            isOpen={openSections.people}
            onToggle={() => toggleSection("people")}
            people={people}
            meetingPoints={meetingPoints}
            editingPersonId={editingPersonId}
            generatePlanHint={generatePlanHint}
            canGeneratePlan={canGeneratePlan}
            name={name}
            role={role}
            phone={phone}
            address={address}
            searchMessage={searchMessage}
            isSearching={isSearching}
            pendingGeocode={pendingGeocode}
            selectedLocation={selectedLocation}
            onNameChange={setName}
            onRoleChange={setRole}
            onPhoneChange={setPhone}
            onAddressChange={handlePersonAddressChange}
            onConfirmAddress={confirmAddress}
            onAddPerson={addPerson}
            onClearAll={clearAllPeople}
            onEditPerson={setEditingPersonId}
            onCancelEditPerson={() => setEditingPersonId(null)}
            onSavePerson={updatePerson}
            onRemovePerson={removePerson}
          />

          <MeetingPointsSection
            isOpen={openSections["meeting-points"]}
            onToggle={() => toggleSection("meeting-points")}
            meetingPoints={meetingPoints}
            meetingPointName={meetingPointName}
            meetingPointAddress={meetingPointAddress}
            meetingPointNotes={meetingPointNotes}
            meetingSearchMessage={meetingSearchMessage}
            isSearchingMeeting={isSearchingMeeting}
            pendingMeetingGeocode={pendingMeetingGeocode}
            selectedMeetingLocation={selectedMeetingLocation}
            onNameChange={setMeetingPointName}
            onAddressChange={handleMeetingPointAddressChange}
            onNotesChange={setMeetingPointNotes}
            onConfirmAddress={confirmMeetingAddress}
            onAddMeetingPoint={addMeetingPoint}
            onClearAll={clearAllMeetingPoints}
            onRemoveMeetingPoint={removeMeetingPoint}
          />
        </div>
      }
      map={
        <MapPreviewPanel
          people={people}
          meetingPoints={meetingPoints}
          selectedLocation={selectedLocation}
          selectedMeetingLocation={selectedMeetingLocation}
        />
      }
    />
  );
}
