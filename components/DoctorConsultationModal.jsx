'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Pill,
  Play,
  Plus,
  Receipt,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  addDoctorDrug,
  completeAppointment,
  createInvoice,
  createPrescription,
  getDoctorDrugs,
  startConsultation,
} from '@/lib/api';
import { formatLkr } from '@/lib/formatters';
import { downloadPrescriptionPdf } from '@/lib/pdfGenerator';

export default function DoctorConsultationModal({
  isOpen,
  onClose,
  appointment,
  doctorMemberId,
  doctorName,
  onUpdated,
}) {
  const [currentStatus, setCurrentStatus] = useState(
    appointment?.status || 'Accepted'
  );
  const [startingConsultation, setStartingConsultation] = useState(false);

  // Clinical Assessment
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isDictating, setIsDictating] = useState(false);

  // Doctor Drugs Catalog
  const [drugs, setDrugs] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [drugSearch, setDrugSearch] = useState('');

  // Quick Add New Drug
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [newDrugName, setNewDrugName] = useState('');
  const [newGenericName, setNewGenericName] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState('');
  const [addingDrug, setAddingDrug] = useState(false);

  // Prescription Item Builder
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  const [frequency, setFrequency] = useState('Twice daily (BD)');
  const [instruction, setInstruction] = useState('After meals');
  const [duration, setDuration] = useState('5 Days');
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // Billing & Settlement
  const [consultationFee, setConsultationFee] = useState('');
  const [settlementMode, setSettlementMode] = useState('invoice'); // 'invoice' | 'cash'

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedSummary, setCompletedSummary] = useState(null);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    setCurrentStatus(appointment.status || 'Accepted');
    setClinicalNotes('');
    setPrescriptionItems([]);
    setError('');
    setCompletedSummary(null);
    setConsultationFee(
      String(
        appointment.proposed_fee ||
          appointment.bid_fee ||
          appointment.amount ||
          2500
      )
    );
  }, [isOpen, appointment]);

  useEffect(() => {
    if (!isOpen || !doctorMemberId) return;

    const loadCatalog = async () => {
      setLoadingDrugs(true);
      try {
        const res = await getDoctorDrugs({
          providerMemberId: doctorMemberId,
        });
        setDrugs(Array.isArray(res?.drugs) ? res.drugs : []);
      } catch {
        setDrugs([]);
      } finally {
        setLoadingDrugs(false);
      }
    };

    loadCatalog();
  }, [isOpen, doctorMemberId]);

  const filteredDrugs = useMemo(() => {
    const q = drugSearch.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) =>
        String(d.drug_name || '')
          .toLowerCase()
          .includes(q) ||
        String(d.generic_name || '')
          .toLowerCase()
          .includes(q)
    );
  }, [drugs, drugSearch]);

  const medicinesTotal = useMemo(() => {
    return prescriptionItems.reduce(
      (sum, item) => sum + (Number(item.unit_price) || 0),
      0
    );
  }, [prescriptionItems]);

  if (!isOpen || !appointment) return null;

  const appointmentId = Number(appointment.id || appointment.appointment_id);
  const patientId = Number(appointment.patient_id);
  const patientName =
    appointment.patient_name ||
    appointment.full_name ||
    `Patient #${patientId || '-'}`;

  const handleSimulateDictation = () => {
    if (isDictating) {
      setIsDictating(false);
      return;
    }
    setIsDictating(true);
    setTimeout(() => {
      const sampleText =
        'Patient examined at home. Vitals stable (BP 120/80 mmHg, Pulse 76 bpm, Temp 37.4°C, SpO2 98%). Chest clear on auscultation. Advised adequate rest, oral hydration, and prescribed symptomatic treatment.';
      setClinicalNotes((prev) =>
        prev.trim() ? `${prev.trim()} ${sampleText}` : sampleText
      );
      setIsDictating(false);
    }, 1200);
  };

  const handleStartConsultation = async () => {
    setError('');
    setStartingConsultation(true);
    try {
      const res = await startConsultation({
        appointmentId,
        providerMemberId: doctorMemberId,
      });

      if (!res?.success) {
        setError(
          res?.message ||
            'Could not start consultation. Make sure the patient has confirmed arrival.'
        );
        return;
      }

      setCurrentStatus('Consultation Started');
      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Unable to start consultation.');
    } finally {
      setStartingConsultation(false);
    }
  };

  const handleQuickAddDrug = async () => {
    if (!newDrugName.trim() || !newGenericName.trim()) {
      setError('Both brand/medicine name and generic name are required.');
      return;
    }
    setAddingDrug(true);
    setError('');
    try {
      const res = await addDoctorDrug({
        providerMemberId: doctorMemberId,
        drugName: newDrugName.trim(),
        genericName: newGenericName.trim(),
        unitPrice: Number(newUnitPrice) || 0,
      });

      if (!res?.success) {
        setError(res?.message || 'Failed to add medicine.');
        return;
      }

      const refreshed = await getDoctorDrugs({
        providerMemberId: doctorMemberId,
      });
      const updatedList = Array.isArray(refreshed?.drugs)
        ? refreshed.drugs
        : [];
      setDrugs(updatedList);

      const added = updatedList.find(
        (d) =>
          String(d.drug_name || '').toLowerCase() ===
          newDrugName.trim().toLowerCase()
      );
      if (added) {
        setSelectedDrugId(String(added.drug_id || added.id));
      }

      setNewDrugName('');
      setNewGenericName('');
      setNewUnitPrice('');
      setShowAddDrug(false);
    } catch (err) {
      setError(err?.message || 'Unable to add medicine.');
    } finally {
      setAddingDrug(false);
    }
  };

  const handleAddPrescriptionItem = () => {
    setError('');
    const chosenDrug = drugs.find(
      (d) => String(d.drug_id || d.id) === String(selectedDrugId)
    );
    if (!chosenDrug) {
      setError('Please select a medicine from your catalog first.');
      return;
    }

    const drugId = Number(chosenDrug.drug_id || chosenDrug.id);
    if (prescriptionItems.some((item) => item.drug_id === drugId)) {
      setError('This medicine is already in the prescription list.');
      return;
    }

    setPrescriptionItems((prev) => [
      ...prev,
      {
        drug_id: drugId,
        drug_name: chosenDrug.drug_name,
        generic_name: chosenDrug.generic_name,
        unit_price: Number(chosenDrug.unit_price) || 0,
        dosage: dosage.trim() || '1 Tablet',
        frequency: frequency.trim() || 'Twice daily',
        instruction: instruction.trim() || 'After meals',
        duration: duration.trim() || '5 Days',
      },
    ]);
    setSelectedDrugId('');
  };

  const handleRemoveItem = (drugId) => {
    setPrescriptionItems((prev) =>
      prev.filter((item) => item.drug_id !== drugId)
    );
  };

  const handleCompleteVisit = async () => {
    setError('');
    setSubmitting(true);

    try {
      let createdPrescription = null;

      // 1. If medicines were added, issue digital prescription via create_prescription.php
      if (prescriptionItems.length > 0 && patientId > 0) {
        const summaryMedicine = prescriptionItems
          .map((i) => `${i.drug_name} (${i.dosage})`)
          .join(', ');
        const summaryInstruction = prescriptionItems
          .map(
            (i) => `${i.drug_name}: ${i.dosage}, ${i.frequency}, ${i.instruction}`
          )
          .join(' | ');
        const summaryDuration = prescriptionItems
          .map((i) => `${i.drug_name}: ${i.duration}`)
          .join(' | ');

        const presRes = await createPrescription({
          patientId,
          providerMemberId: doctorMemberId,
          providerName: doctorName || 'Doctor',
          providerRole: 'Doctor',
          medicine: summaryMedicine,
          instruction: summaryInstruction,
          duration: summaryDuration,
          notes: clinicalNotes.trim(),
          consultationFee: Number(consultationFee) || 0,
          items: prescriptionItems,
        });

        if (!presRes?.success) {
          setError(
            presRes?.message || 'Failed to create prescription for this visit.'
          );
          setSubmitting(false);
          return;
        }

        createdPrescription = {
          id: presRes.prescription_id || Date.now(),
          medicine: summaryMedicine,
          instruction: summaryInstruction,
          duration: summaryDuration,
          notes: clinicalNotes.trim(),
          consultation_fee: Number(consultationFee) || 0,
          provider_name: doctorName || 'Doctor',
          provider_role: 'Doctor',
          created_at: new Date().toISOString().slice(0, 10),
          items: prescriptionItems,
        };
      }

      // 2. Complete the appointment via complete_appointment.php
      const compRes = await completeAppointment({
        appointmentId,
        role: 'Doctor',
        providerMemberId: doctorMemberId,
      });

      if (!compRes?.success && !String(compRes?.message || '').toLowerCase().includes('already completed')) {
        setError(compRes?.message || 'Failed to mark appointment as completed.');
        setSubmitting(false);
        return;
      }

      // 3. Generate the invoice via create_invoice.php
      const invRes = await createInvoice({
        appointmentId,
        providerMemberId: doctorMemberId,
      });

      setCurrentStatus('Completed');
      setCompletedSummary({
        prescription: createdPrescription,
        invoice: invRes?.invoice || null,
        invoiceMessage:
          invRes?.message || 'Visit completed and invoice generated.',
        settlementMode,
      });

      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Unable to complete consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedStatus = String(currentStatus || '').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Doctor Consultation Workspace
                </h2>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Appointment #{appointmentId} • {patientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {completedSummary ? (
          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-600"
                  size={22}
                />
                <div>
                  <h3 className="text-base font-bold">
                    Consultation Completed Successfully
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    {completedSummary.invoiceMessage}
                  </p>
                </div>
              </div>
            </div>

            {completedSummary.invoice && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Receipt size={18} className="text-teal-600" />
                    <span className="text-sm font-bold">
                      Invoice #{completedSummary.invoice.id}
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {completedSummary.invoice.status || 'Pending'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3 text-sm">
                  <span className="text-slate-500">Billed Visit Fee:</span>
                  <span className="font-extrabold text-slate-900">
                    {formatLkr(completedSummary.invoice.amount)}
                  </span>
                </div>
              </div>
            )}

            {completedSummary.prescription && (
              <div className="flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
                <div>
                  <p className="text-sm font-bold text-teal-900">
                    Digital Prescription Issued (
                    {completedSummary.prescription.items?.length || 1} items)
                  </p>
                  <p className="text-xs text-teal-700">
                    {completedSummary.prescription.medicine}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadPrescriptionPdf(completedSummary.prescription, {
                      patientName,
                      doctorName,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
                >
                  <Download size={14} />
                  Download PDF
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Close Workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Patient Summary Banner */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 font-bold text-white">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {patientName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appointment.service_type || 'Doctor Consultation'} •{' '}
                      {appointment.preferred_time || 'Scheduled Visit'}
                    </p>
                  </div>
                </div>

                {normalizedStatus === 'arrived' && (
                  <button
                    type="button"
                    onClick={handleStartConsultation}
                    disabled={startingConsultation}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
                  >
                    {startingConsultation ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    Start Consultation
                  </button>
                )}
              </div>

              {(appointment.symptoms ||
                appointment.disease_description ||
                appointment.delivery_address) && (
                <div className="mt-3 grid gap-2 border-t border-slate-200/70 pt-3 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-slate-400">
                      Chief Complaint:{' '}
                    </span>
                    {appointment.symptoms ||
                      appointment.disease_description ||
                      'General checkup'}
                  </div>
                  {appointment.delivery_address && (
                    <div className="flex items-start gap-1">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>{appointment.delivery_address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 1: Clinical Notes + Voice Dictation */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    1. Clinical Assessment & Notes
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateDictation}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    isDictating
                      ? 'animate-pulse bg-red-100 text-red-700'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  {isDictating ? (
                    <>
                      <MicOff size={14} />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic size={14} />
                      Voice Dictation
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Record clinical examination findings, vitals (BP, Pulse, Temp), diagnosis, and follow-up advice..."
                className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal-500"
              />
            </div>

            {/* Step 2: Digital Prescription Builder */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill size={18} className="text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    2. E-Prescription Builder (Optional)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDrug((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
                >
                  <Plus size={14} />
                  {showAddDrug ? 'Hide New Medicine' : 'New Medicine to Catalog'}
                </button>
              </div>

              {/* Quick Add New Medicine to Doctor Catalog */}
              {showAddDrug && (
                <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                  <p className="text-xs font-bold text-teal-900">
                    Add Medicine to Your Personal Catalog
                  </p>
                  <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={newDrugName}
                      onChange={(e) => setNewDrugName(e.target.value)}
                      placeholder="Brand Name (e.g. Panadol)"
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={newGenericName}
                      onChange={(e) => setNewGenericName(e.target.value)}
                      placeholder="Generic (e.g. Paracetamol)"
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={newUnitPrice}
                        onChange={(e) => setNewUnitPrice(e.target.value)}
                        placeholder="Price (LKR)"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddDrug}
                        disabled={addingDrug}
                        className="shrink-0 rounded-lg bg-teal-600 px-3 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-60"
                      >
                        {addingDrug ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Select Medicine from Catalog */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Select Medicine from Your Catalog
                  </label>
                  <select
                    value={selectedDrugId}
                    onChange={(e) => setSelectedDrugId(e.target.value)}
                    disabled={loadingDrugs}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500"
                  >
                    <option value="">
                      {loadingDrugs
                        ? 'Loading medicines...'
                        : `-- Choose Medicine (${filteredDrugs.length} available) --`}
                    </option>
                    {filteredDrugs.map((drug) => (
                      <option
                        key={drug.drug_id || drug.id}
                        value={String(drug.drug_id || drug.id)}
                      >
                        {drug.drug_name} ({drug.generic_name}) —{' '}
                        {formatLkr(drug.unit_price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 500mg / 1 Tablet"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-teal-500"
                  >
                    <option value="Once daily (OD)">Once daily (OD)</option>
                    <option value="Twice daily (BD)">Twice daily (BD)</option>
                    <option value="Three times daily (TDS)">
                      Three times daily (TDS)
                    </option>
                    <option value="Every 6 hours (QDS)">
                      Every 6 hours (QDS)
                    </option>
                    <option value="At night (ON)">At night (ON)</option>
                    <option value="When required (SOS)">
                      When required (SOS)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Instruction
                  </label>
                  <select
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-teal-500"
                  >
                    <option value="After meals">After meals</option>
                    <option value="Before meals">Before meals</option>
                    <option value="With water">With water</option>
                    <option value="Before sleep">Before sleep</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 5 Days"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPrescriptionItem}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Added Items List */}
              {prescriptionItems.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>
                      Prescribed Medications ({prescriptionItems.length})
                    </span>
                    <span>Est. Meds: {formatLkr(medicinesTotal)}</span>
                  </div>

                  {prescriptionItems.map((item) => (
                    <div
                      key={item.drug_id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.drug_name}{' '}
                          <span className="font-normal text-slate-500">
                            ({item.generic_name})
                          </span>
                        </p>
                        <p className="mt-0.5 text-slate-600">
                          {item.dosage} • {item.frequency} • {item.instruction}{' '}
                          • {item.duration}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.drug_id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Billing & Settlement */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  3. Visit Billing & Invoice Generation
                </h3>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Consultation Fee (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 outline-none focus:border-teal-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Invoice amount uses the accepted bid fee for this appointment.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Payment Settlement Mode
                  </label>
                  <select
                    value={settlementMode}
                    onChange={(e) => setSettlementMode(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500"
                  >
                    <option value="invoice">
                      Issue Digital Invoice (Patient Pays via App/Web)
                    </option>
                    <option value="cash">
                      Collect Cash & Issue Digital Invoice
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCompleteVisit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Completing Visit & Issuing Invoice...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Complete Consultation & Issue Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

