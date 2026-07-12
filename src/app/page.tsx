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
    setPlanName,
    setPlanNotes,
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
        onNavigate={scrollToSection}
        onGenerate={generatePlan}
        canGenerate={canGeneratePlan}
        showOutputNav={showGeneratedPlan}
        formatDate={formatPlanDate}
      />

      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="print:hidden">
          <PlanWorkspace
            openSections={openSections}
            toggleSection={toggleSection}
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
            name={name}
            role={role}
            phone={phone}
            address={address}
            searchMessage={searchMessage}
            isSearching={isSearching}
            pendingGeocode={pendingGeocode}
            selectedLocation={selectedLocation}
            setName={setName}
            setRole={setRole}
            setPhone={setPhone}
            handlePersonAddressChange={handlePersonAddressChange}
            confirmAddress={confirmAddress}
            addPerson={addPerson}
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
          />
        </div>

        {showGeneratedPlan && (
          <GeneratedPlanSection
            ref={generatedPlanRef}
            displayPlanName={displayPlanName}
            planNotes={planNotes}
            createdAt={createdAt}
            updatedAt={updatedAt}
            people={people}
            meetingPoints={meetingPoints}
            isExportingPdf={isExportingPdf}
            onExportPdf={exportPdf}
            onPrintPlan={printPlan}
          />
        )}
      </div>
    </main>
  );
}
