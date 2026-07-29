"use client";

import AppHeader from "@/app/components/AppHeader";
import GeneratedPlanSection from "@/app/components/plan/GeneratedPlanSection";
import PlanWorkspace from "@/app/components/plan/PlanWorkspace";
import { useContingencyPlan } from "@/app/hooks/useContingencyPlan";
import { formatPlanDate } from "@/app/lib/plans";

export default function Home() {
  const {
    plans,
    activePlanId,
    planName,
    planNotes,
    createdAt,
    updatedAt,
    address,
    label,
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
    canGeneratePlan,
    generatePlanHint,
    setPlanName,
    setPlanNotes,
    setLabel,
    setNamesText,
    handlePersonAddressChange,
    setMeetingPointName,
    handleMeetingPointAddressChange,
    setMeetingPointNotes,
    setEditingPersonId,
    setBasemap,
    switchToPlan,
    createNewPlan,
    deleteActivePlan,
    generatePlan,
    closeGeneratedPlan,
    printPlan,
    exportPdf,
    exportPlan,
    importPlan,
    confirmAddress,
    confirmMeetingAddress,
    addHousehold,
    updatePerson,
    removePerson,
    clearAllPeople,
    addMeetingPoint,
    removeMeetingPoint,
    clearAllMeetingPoints,
    resetActivePlan,
  } = useContingencyPlan();

  return (
    <main className="min-h-screen bg-gray-100 print:bg-white">
      <AppHeader
        plans={plans}
        activePlanId={activePlanId}
        onSwitchPlan={switchToPlan}
        onCreatePlan={createNewPlan}
        onDeletePlan={deleteActivePlan}
        canDeletePlan={plans.length > 1}
        onGenerate={generatePlan}
        canGenerate={canGeneratePlan}
        formatDate={formatPlanDate}
      />

      <div className="print:hidden">
        <PlanWorkspace
          planName={planName}
          planNotes={planNotes}
          createdAt={createdAt}
          updatedAt={updatedAt}
          setPlanName={setPlanName}
          setPlanNotes={setPlanNotes}
          exportPlan={exportPlan}
          importInputRef={importInputRef}
          importPlan={importPlan}
          resetActivePlan={resetActivePlan}
          people={people}
          meetingPoints={meetingPoints}
          editingPersonId={editingPersonId}
          generatePlanHint={generatePlanHint}
          canGeneratePlan={canGeneratePlan}
          label={label}
          namesText={namesText}
          address={address}
          searchMessage={searchMessage}
          isSearching={isSearching}
          pendingGeocode={pendingGeocode}
          selectedLocation={selectedLocation}
          setLabel={setLabel}
          setNamesText={setNamesText}
          handlePersonAddressChange={handlePersonAddressChange}
          confirmAddress={confirmAddress}
          addHousehold={addHousehold}
          clearAllPeople={clearAllPeople}
          setEditingPersonId={setEditingPersonId}
          updatePerson={updatePerson}
          removePerson={removePerson}
          meetingPointName={meetingPointName}
          meetingPointAddress={meetingPointAddress}
          meetingPointNotes={meetingPointNotes}
          meetingSearchMessage={meetingSearchMessage}
          isSearchingMeeting={isSearchingMeeting}
          pendingMeetingGeocode={pendingMeetingGeocode}
          selectedMeetingLocation={selectedMeetingLocation}
          setMeetingPointName={setMeetingPointName}
          handleMeetingPointAddressChange={handleMeetingPointAddressChange}
          setMeetingPointNotes={setMeetingPointNotes}
          confirmMeetingAddress={confirmMeetingAddress}
          addMeetingPoint={addMeetingPoint}
          clearAllMeetingPoints={clearAllMeetingPoints}
          removeMeetingPoint={removeMeetingPoint}
          basemap={basemap}
          setBasemap={setBasemap}
        />
      </div>

      {showGeneratedPlan && (
        <GeneratedPlanSection
          ref={generatedPlanRef}
          planName={planName}
          people={people}
          meetingPoints={meetingPoints}
          isExportingPdf={isExportingPdf}
          onClose={closeGeneratedPlan}
          onExportPdf={exportPdf}
          onPrintPlan={printPlan}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />
      )}
    </main>
  );
}
