'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Pill,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  addDoctorDrug,
  createPrescription,
  getAllPatients,
  getDoctorDrugs,
  searchDrugs,
} from '@/lib/api';
import DoctorAddPatientModal from '@/components/DoctorAddPatientModal';
import { displayName } from '@/lib/formatters';

function extractArray(result, keys) {
  if (Array.isArray(result)) return result;
  if (!result) return [];
  for (const key of keys) {
    if (Array.isArray(result[key])) return result[key];
  }
  return [];
}

function isTrue(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const norm = String(value ?? '')
    .trim()
    .toLowerCase();
  return norm === 'true' || norm === '1' || norm === 'yes';
}

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} yrs` : '';
}

export default function CreatePrescriptionModal({
  open,
  onClose,
  memberId,
  doctorName = 'Doctor',
  onSuccess,
}) {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  const [doctorDrugs, setDoctorDrugs] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(false);

  const [drugQuery, setDrugQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);

  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instruction, setInstruction] = useState('');
  const [duration, setDuration] = useState('');
  const [medicineError, setMedicineError] = useState('');

  const [medicineList, setMedicineList] = useState([]);
  const [notes, setNotes] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  const [showNewMedDialog, setShowNewMedDialog] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [savingNewMed, setSavingNewMed] = useState(false);
  const [newMedError, setNewMedError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPatients = useCallback(async () => {
    if (!memberId) return;
    setLoadingPatients(true);
    try {
      const res = await getAllPatients(memberId);
      setPatients(extractArray(res, ['patients', 'data']));
    } catch {
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [memberId]);

  const loadDrugs = useCallback(async () => {
    if (!memberId) return;
    setLoadingDrugs(true);
    try {
      const res = await getDoctorDrugs({ providerMemberId: memberId });
      const list = extractArray(res, ['drugs', 'data']).sort((a, b) =>
        String(a?.drug_name || '')
          .toLowerCase()
          .localeCompare(String(b?.drug_name || '').toLowerCase())
      );
      setDoctorDrugs(list);
    } catch {
      setDoctorDrugs([]);
    } finally {
      setLoadingDrugs(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (open && memberId) {
      loadPatients();
      loadDrugs();
      setError('');
      setSuccessMsg('');
    }
  }, [open, memberId, loadPatients, loadDrugs]);

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return [];
    return patients
      .filter((p) => {
        const name = String(p?.full_name || p?.name || '').toLowerCase();
        const nic = String(p?.nic_no || p?.nic || '').toLowerCase();
        const phone = String(
          p?.emergency_contact || p?.phone || ''
        ).toLowerCase();
        return name.includes(q) || nic.includes(q) || phone.includes(q);
      })
      .slice(0, 8);
  }, [patients, patientQuery]);

  const filteredDrugs = useMemo(() => {
    const q = drugQuery.trim().toLowerCase();
    if (!q) return [];
    const usedIds = new Set(
      medicineList.map((m) => Number(m.drug_id)).filter(Boolean)
    );
    return doctorDrugs
      .filter((d) => {
        const id = Number(d?.drug_id ?? d?.id ?? 0);
        if (usedIds.has(id)) return false;
        const name = String(d?.drug_name || d?.name || '').toLowerCase();
        const gen = String(d?.generic_name || '').toLowerCase();
        return name.includes(q) || gen.includes(q);
      })
      .slice(0, 8);
  }, [doctorDrugs, drugQuery, medicineList]);

  if (!open) return null;

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setPatientQuery('');
    setError('');
  };

  const handleSelectDrug = (d) => {
    setSelectedDrug(d);
    setDrugQuery(String(d?.drug_name || d?.name || '').trim());
    setShowDrugSuggestions(false);
    setMedicineError('');
  };

  const handleAddDraftMedicine = () => {
    setMedicineError('');
    if (!selectedDrug) {
      setMedicineError('Select a medicine from My Medicines.');
      return;
    }
    if (!dosage.trim()) {
      setMedicineError('Enter dosage (e.g. 1 Tablet).');
      return;
    }
    if (!frequency.trim()) {
      setMedicineError('Enter frequency (e.g. 2 Times Daily).');
      return;
    }
    if (!instruction.trim()) {
      setMedicineError('Enter instructions (e.g. After Meals).');
      return;
    }
    if (!duration.trim()) {
      setMedicineError('Enter duration (e.g. 5 Days).');
      return;
    }

    const drugId = Number(selectedDrug?.drug_id ?? selectedDrug?.id ?? 0);
    setMedicineList((prev) => [
      ...prev,
      {
        drug_id: drugId,
        drug_name: String(
          selectedDrug?.drug_name || selectedDrug?.name || 'Medicine'
        ).trim(),
        generic_name: String(selectedDrug?.generic_name || '').trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        instruction: instruction.trim(),
        duration: duration.trim(),
      },
    ]);

    setSelectedDrug(null);
    setDrugQuery('');
    setDosage('');
    setFrequency('');
    setInstruction('');
    setDuration('');
    setShowDrugSuggestions(false);
  };

  const handleRemoveMedicine = (index) => {
    setMedicineList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveNewMedicine = async () => {
    const medName = newMedName.trim();
    const genName = newMedGeneric.trim();
    if (!medName) {
      setNewMedError('Medicine name is required.');
      return;
    }

    setSavingNewMed(true);
    setNewMedError('');
    try {
      const searchRes = await searchDrugs({
        providerMemberId: memberId,
        search: medName,
      });

      const globalDrugs = extractArray(searchRes, ['drugs', 'data']);
      const exact = globalDrugs.find(
        (d) =>
          String(d?.drug_name || d?.name || '')
            .trim()
            .toLowerCase() === medName.toLowerCase()
      );

      if (exact) {
        if (isTrue(exact.is_assigned)) {
          await loadDrugs();
          handleSelectDrug(exact);
          setShowNewMedDialog(false);
          setNewMedName('');
          setNewMedGeneric('');
          return;
        }

        const assignRes = await addDoctorDrug({
          providerMemberId: memberId,
          drugName: String(exact.drug_name || medName).trim(),
          genericName: String(exact.generic_name || medName).trim(),
          unitPrice: 0,
        });

        if (assignRes?.success !== true) {
          setNewMedError(
            assignRes?.message || 'Failed to add medicine to My Medicines.'
          );
          return;
        }

        await loadDrugs();
        handleSelectDrug(assignRes.drug || exact);
        setShowNewMedDialog(false);
        setNewMedName('');
        setNewMedGeneric('');
        return;
      }

      if (!genName) {
        setNewMedError('Generic name is required for a new medicine.');
        return;
      }

      const createRes = await addDoctorDrug({
        providerMemberId: memberId,
        drugName: medName,
        genericName: genName,
        unitPrice: 0,
      });

      if (createRes?.success !== true) {
        setNewMedError(createRes?.message || 'Failed to create medicine.');
        return;
      }

      await loadDrugs();
      if (createRes.drug) {
        handleSelectDrug(createRes.drug);
      }
      setShowNewMedDialog(false);
      setNewMedName('');
      setNewMedGeneric('');
    } catch (err) {
      setNewMedError(err?.message || 'Unable to save medicine.');
    } finally {
      setSavingNewMed(false);
    }
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const patId = Number(
      selectedPatient?.id ?? selectedPatient?.patient_id ?? 0
    );
    if (!patId) {
      setError('Please search and select a patient.');
      return;
    }

    if (medicineList.length === 0) {
      setError('Please add at least one medicine to the prescription.');
      return;
    }

    const fee = Number(consultationFee);
    if (!Number.isFinite(fee) || fee <= 0) {
      setError('Consultation fee must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const first = medicineList[0];
      const res = await createPrescription({
        patientId: patId,
        providerId: memberId,
        providerMemberId: memberId,
        providerName: doctorName,
        providerRole: 'Doctor',
        medicine: first.drug_name,
        instruction: first.instruction,
        duration: first.duration,
        notes: notes.trim(),
        consultationFee: fee,
        items: medicineList.map((item) => ({
          drug_id: item.drug_id,
          dosage: item.dosage,
          frequency: item.frequency,
          instruction: item.instruction,
          duration: item.duration,
        })),
      });

      if (!res?.success) {
        setError(res?.message || 'Failed to create prescription.');
        return;
      }

      setSuccessMsg('Prescription created successfully!');
      setMedicineList([]);
      setNotes('');
      setConsultationFee('');
      setSelectedPatient(null);
      await onSuccess?.(res);
      setTimeout(() => {
        onClose?.();
      }, 600);
    } catch (err) {
      setError(err?.message || 'Failed to create prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
        <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-[#f8fafc] shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              Create Prescription (Rx)
            </h2>
          </div>

          {/* Scrollable Form */}
          <form
            onSubmit={handleSubmitPrescription}
            className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6"
          >
            {error && (
              <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')}>
                  <X size={15} />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. Search Patient */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Search Patient
                </h3>
                <button
                  type="button"
                  onClick={() => setAddPatientOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 hover:underline"
                >
                  <UserPlus size={16} />
                  Add New Patient
                </button>
              </div>

              <div className="relative mt-2.5">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Search by Name, NIC, or Mobile Number"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
                />
                {patientQuery && (
                  <button
                    type="button"
                    onClick={() => setPatientQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {patientQuery.trim() !== '' && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2
                        size={18}
                        className="animate-spin text-emerald-600"
                      />
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500">
                      No matching patients found. Click{' '}
                      <button
                        type="button"
                        onClick={() => setAddPatientOpen(true)}
                        className="font-bold text-emerald-700 underline"
                      >
                        Add New Patient
                      </button>{' '}
                      to register one.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredPatients.map((pat) => {
                        const patName = displayName(pat, 'Patient');
                        const nic = pat.nic_no || pat.nic || 'No NIC';
                        const phone =
                          pat.emergency_contact || pat.phone || 'No Phone';
                        return (
                          <button
                            key={pat.id || pat.patient_id}
                            type="button"
                            onClick={() => handleSelectPatient(pat)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-emerald-50/60"
                          >
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">
                                {patName}
                              </p>
                              <p className="text-xs text-slate-500">
                                NIC: {nic} • {phone}
                              </p>
                            </div>
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              Select
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Patient Card */}
              {selectedPatient && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                    Selected Patient
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-sm font-black text-emerald-800">
                        {displayName(selectedPatient, 'P')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {displayName(selectedPatient, 'Patient')}
                        </p>
                        <p className="text-xs text-slate-600">
                          NIC:{' '}
                          {selectedPatient.nic_no ||
                            selectedPatient.nic ||
                            'N/A'}{' '}
                          |{' '}
                          {selectedPatient.emergency_contact ||
                            selectedPatient.phone ||
                            'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden text-xs font-semibold text-slate-600 sm:inline">
                        {[
                          selectedPatient.gender,
                          calcAge(selectedPatient.date_of_birth),
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
                        title="Clear selected patient"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Prescription Medicines */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">
                  Prescription Medicines
                </h3>
                {medicineList.length > 0 && (
                  <span className="text-xs font-bold text-emerald-700">
                    {medicineList.length} added
                  </span>
                )}
              </div>

              {medicineList.length === 0 ? (
                <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-7 text-center">
                  <Pill size={28} className="text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    No medicines added yet.
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Use the Add Medicine section below.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {medicineList.map((item, idx) => (
                    <div
                      key={`${item.drug_id}-${idx}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-700">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">
                              {item.drug_name}
                            </p>
                            {item.generic_name && (
                              <p className="text-xs text-slate-500">
                                Generic: {item.generic_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          title="Remove medicine"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
                        <div className="p-2.5">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Dosage
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-800">
                            {item.dosage}
                          </p>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Frequency
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-800">
                            {item.frequency}
                          </p>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Duration
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-800">
                            {item.duration}
                          </p>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Instructions
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-800">
                            {item.instruction}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Add Medicine Section (Matches Screenshot 5) */}
            <div className="rounded-2xl border border-[#bfe5d8] bg-[#f2fbf8] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">
                  Add Medicine
                </h3>
                {!loadingDrugs && (
                  <span className="text-xs font-extrabold text-emerald-700">
                    {doctorDrugs.length} in My Medicines
                  </span>
                )}
              </div>

              {medicineError && (
                <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                  {medicineError}
                </p>
              )}

              {/* Medicine Autocomplete */}
              <div className="relative mt-3">
                <Pill
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={drugQuery}
                  onFocus={() => setShowDrugSuggestions(true)}
                  onChange={(e) => {
                    setDrugQuery(e.target.value);
                    setSelectedDrug(null);
                    setShowDrugSuggestions(true);
                  }}
                  placeholder="Medicine (Search from My Medicines)"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
                {drugQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrugQuery('');
                      setSelectedDrug(null);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {showDrugSuggestions &&
                !selectedDrug &&
                drugQuery.trim() !== '' && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {filteredDrugs.length === 0 ? (
                      <div className="p-3.5">
                        <p className="text-xs text-slate-600">
                          No matching medicine in My Medicines.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMedName(drugQuery.trim());
                            setNewMedGeneric('');
                            setNewMedError('');
                            setShowNewMedDialog(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/40 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                        >
                          <Plus size={14} />
                          Add New Medicine
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredDrugs.map((drug) => (
                          <button
                            key={drug.drug_id || drug.id}
                            type="button"
                            onClick={() => handleSelectDrug(drug)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-emerald-50/70"
                          >
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">
                                {drug.drug_name || drug.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Generic: {drug.generic_name || '-'}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700">
                              Select
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* Row 1: Dosage & Frequency */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Dosage (e.g. 1 Tablet)"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Frequency (e.g. 2 Times Daily)"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </div>

              {/* Row 2: Instructions & Duration */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Instructions (e.g. After Meals)"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Duration (e.g. 5 Days)"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </div>

              {/* + Add New Medicine outline button */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewMedName(drugQuery.trim());
                    setNewMedGeneric('');
                    setNewMedError('');
                    setShowNewMedDialog(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Plus size={15} />
                  Add New Medicine
                </button>

                {selectedDrug && (
                  <span className="text-xs font-bold text-emerald-800">
                    Selected: {selectedDrug.drug_name || selectedDrug.name}
                  </span>
                )}
              </div>

              {/* + Add Medicine full-width green button */}
              <button
                type="button"
                onClick={handleAddDraftMedicine}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#058c66] text-sm font-extrabold text-white shadow-sm transition hover:bg-[#047857]"
              >
                <Plus size={18} />
                Add Medicine
              </button>
            </div>

            {/* 4. Description / Consultation Notes */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Description / Consultation Notes
              </h3>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add consultation notes, diagnosis, or additional instructions..."
                className="mt-2.5 w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
              />
            </div>

            {/* 5. Consultation Fee */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Consultation Fee
              </h3>
              <p className="text-xs text-slate-500">
                Doctor consultation charge only
              </p>
              <div className="relative mt-2.5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                  Rs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder="Enter consultation charge"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f9f76] to-[#058c66] py-3.5 text-sm font-black text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Adding Prescription...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Prescription
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Add New Medicine Sub-Modal */}
      {showNewMedDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Add Medicine to My Medicines
              </h3>
              <button
                type="button"
                onClick={() => setShowNewMedDialog(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Checks the shared medicine catalog first and assigns it to your
              list, or creates a new medicine if not found.
            </p>

            {newMedError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {newMedError}
              </p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Amoxicillin 250mg"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Generic Name (required if new)
                </label>
                <input
                  type="text"
                  value={newMedGeneric}
                  onChange={(e) => setNewMedGeneric(e.target.value)}
                  placeholder="e.g. Amoxicillin"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewMedDialog(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewMedicine}
                disabled={savingNewMed}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {savingNewMed && <Loader2 size={14} className="animate-spin" />}
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Add New Patient Modal */}
      <DoctorAddPatientModal
        open={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        doctorMemberId={memberId}
        onPatientCreated={async (created) => {
          await loadPatients();
          if (created?.patient) {
            setSelectedPatient(created.patient);
            setPatientQuery('');
          }
        }}
      />
    </>
  );
}

