'use client';

import { useState } from 'react';
import {
  Calendar,
  CreditCard,
  Download,
  FileText,
  IdCard,
  Phone,
  Pill,
  PlusSquare,
  Repeat,
  Share2,
  UserRound,
  X,
} from 'lucide-react';
import { downloadPrescriptionPdf } from '@/lib/pdfGenerator';
import { displayName, formatDoctorName } from '@/lib/formatters';

export function getPrescriptionItems(pres) {
  if (!pres) return [];
  const rawItems = pres.items;
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.filter(Boolean).map((item) => ({
      ...item,
      drug_name:
        String(
          item?.drug_name || item?.medicine_name || item?.medicine || 'Medicine'
        ).trim() || 'Medicine',
      generic_name: String(item?.generic_name || '').trim(),
      dosage: String(item?.dosage ?? '').trim(),
      frequency: String(item?.frequency ?? '').trim(),
      duration: String(item?.duration ?? '').trim(),
      instruction: String(
        item?.instruction ?? item?.instructions ?? ''
      ).trim(),
    }));
  }

  const fallbackMed = String(pres.medicine || '').trim();
  if (fallbackMed) {
    return [
      {
        drug_name: fallbackMed,
        generic_name: '',
        dosage: String(pres.dosage || '').trim(),
        frequency: String(pres.frequency || '').trim(),
        instruction: String(pres.instruction || '').trim(),
        duration: String(pres.duration || '').trim(),
      },
    ];
  }
  return [];
}

function durationDaysFromText(raw) {
  const str = String(raw || '').toLowerCase();
  const match = str.match(/\d+/);
  if (!match) return 7;
  const num = parseInt(match[0], 10);
  if (!num || num <= 0) return 7;
  if (str.includes('week')) return num * 7;
  if (str.includes('month')) return num * 30;
  return num;
}

export function getCourseDurationDays(pres) {
  const items = getPrescriptionItems(pres);
  if (items.length === 0) {
    return durationDaysFromText(pres?.duration || '');
  }
  let maxDays = 1;
  for (const item of items) {
    const d = durationDaysFromText(item?.duration || '');
    if (d > maxDays) maxDays = d;
  }
  return maxDays;
}

export function getPrescriptionStatus(pres) {
  const explicit = String(pres?.status || '').trim();
  if (explicit) {
    const lower = explicit.toLowerCase();
    if (lower.includes('cancel')) return 'Cancelled';
    if (lower === 'active') return 'Active';
    if (lower === 'completed') return 'Completed';
  }

  const rawDate = String(pres?.created_at || pres?.date || '').trim();
  if (!rawDate) return 'Active';

  const datePart = rawDate.split(' ')[0];
  const createdAt = new Date(datePart);
  if (Number.isNaN(createdAt.getTime())) return 'Active';

  const days = getCourseDurationDays(pres);
  const endDate = new Date(createdAt.getTime() + (days + 1) * 86400000);
  return new Date() < endDate ? 'Active' : 'Completed';
}

function calculateAgeText(dobRaw) {
  const str = String(dobRaw || '').trim();
  if (!str) return '';
  const dob = new Date(str.split(' ')[0]);
  if (Number.isNaN(dob.getTime())) return '';

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} yrs` : '';
}

export default function PrescriptionDetailsModal({
  open,
  onClose,
  prescription,
  patientProfile = null,
  viewerRole = 'patient',
  defaultDoctorName = 'Doctor',
  defaultSpecialty = 'General Practitioner',
}) {
  const [copiedToast, setCopiedToast] = useState(false);

  if (!open || !prescription) return null;

  const items = getPrescriptionItems(prescription);
  const rawId = String(
    prescription.id ?? prescription.prescription_id ?? ''
  ).trim();
  const prescriptionId = rawId.toUpperCase().startsWith('PRE-')
    ? rawId
    : `PRE-${rawId}`;

  const rawDate = String(
    prescription.created_at || prescription.date || ''
  ).trim();
  const dateLabel = rawDate ? rawDate.split(' ')[0] : 'Just now';

  const providerRole = String(prescription.provider_role || 'Doctor').trim();
  const rawDoctor =
    prescription.doctor ||
    prescription.provider_name ||
    prescription.doctor_name ||
    defaultDoctorName;

  const doctorName =
    providerRole.toLowerCase() === 'nurse'
      ? String(rawDoctor || 'Nurse').trim()
      : formatDoctorName(rawDoctor);

  const specialty =
    String(
      prescription.specialty ||
        prescription.speciality_name ||
        (providerRole === 'Nurse'
          ? 'Registered General Nurse'
          : defaultSpecialty)
    ).trim() || 'General Practitioner';

  const resolvedPatientName =
    String(
      prescription.patient_name ||
        patientProfile?.full_name ||
        patientProfile?.name ||
        ''
    ).trim() ||
    displayName(
      {
        full_name: prescription.patient_name || patientProfile?.full_name,
        patient_id: prescription.patient_id || patientProfile?.id,
      },
      'Patient'
    );

  const patientId = String(
    prescription.patient_id || patientProfile?.id || ''
  ).trim();

  const patientNic = String(
    prescription.patient_nic ||
      patientProfile?.nic_no ||
      patientProfile?.nic ||
      ''
  ).trim();

  const patientPhone = String(
    prescription.patient_phone ||
      patientProfile?.emergency_contact ||
      patientProfile?.phone ||
      ''
  ).trim();

  const patientGender = String(
    prescription.patient_gender || patientProfile?.gender || ''
  ).trim();

  const patientDob = String(
    prescription.patient_date_of_birth || patientProfile?.date_of_birth || ''
  ).trim();

  const patientAge = calculateAgeText(patientDob);

  const initials =
    resolvedPatientName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'P';

  const notes = String(prescription.notes || '').trim();
  const status = getPrescriptionStatus(prescription);

  const consultationFee =
    Number(prescription.consultation_fee || 0) || 0;
  const showConsultationFee =
    viewerRole === 'doctor' && consultationFee > 0;

  const statusStyles =
    status === 'Completed'
      ? 'bg-[#eff6ff] text-[#2563eb]'
      : status === 'Cancelled'
      ? 'bg-[#fef2f2] text-[#dc2626]'
      : 'bg-[#ecfdf5] text-[#059669]';

  const handleDownloadPdf = () => {
    downloadPrescriptionPdf(prescription, {
      full_name: resolvedPatientName,
      id: patientId,
      nic_no: patientNic,
      emergency_contact: patientPhone,
      gender: patientGender,
      date_of_birth: patientDob,
    });
  };

  const handleShareRx = async () => {
    const medSummary = items
      .map(
        (m, i) =>
          `${i + 1}. ${m.drug_name}${m.dosage ? ` (${m.dosage})` : ''}${
            m.frequency ? ` - ${m.frequency}` : ''
          }${m.duration ? ` for ${m.duration}` : ''}`
      )
      .join('\n');
    const shareText = `Prescription ${prescriptionId}\nDoctor: ${doctorName} (${specialty})\nPatient: ${resolvedPatientName}\nDate: ${dateLabel}\n\nMedicines:\n${medSummary}${
      notes && notes !== 'None' ? `\n\nNotes: ${notes}` : ''
    }`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Prescription ${prescriptionId}`,
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[26px] border border-[#e2e8f0] bg-[#f8fafc] shadow-2xl">
        {/* Top Bar (Matches Flutter Prescription Details Sheet Header) */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h2 className="text-[19px] font-black text-[#0f172a]">
              Prescription Details
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShareRx}
              title="Share Rx"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              title="Download PDF"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
            >
              <Download size={19} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {copiedToast && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-center text-xs font-bold text-emerald-800">
              Prescription details copied to clipboard!
            </div>
          )}

          {/* 1. Doctor Banner Card (Matches Screenshot 3 lines 913-1040) */}
          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#cbeadf] bg-gradient-to-r from-[#e8f8f4] to-[#f7fcfb] p-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-[#d7efe8] bg-white text-[#0f766e]">
                <PlusSquare size={26} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15.5px] font-black text-[#0f172a]">
                  {doctorName}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#64748b]">
                  {specialty}
                </p>
                <p className="mt-1.5 text-[11px] font-extrabold text-[#0f766e]">
                  {prescriptionId}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end">
              <span className="text-[11px] font-extrabold text-[#334155]">
                {dateLabel}
              </span>
              <span
                className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${statusStyles}`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* 2. Patient Information Card (Matches Screenshot 3 lines 1044-1396) */}
          <div className="overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white">
            <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-[#f1f7f6] px-4 py-2.5">
              <UserRound size={17} className="text-[#0f766e]" />
              <span className="text-[13px] font-black text-[#0f172a]">
                Patient Information
              </span>
            </div>

            {viewerRole === 'doctor' &&
            !patientAge &&
            !patientGender &&
            !patientNic &&
            !patientPhone ? (
              <div className="flex items-center gap-3.5 p-3.5">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#e6f7f3] text-sm font-black text-[#0f766e]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#64748b]">Name</p>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-[#0f172a]">
                    {resolvedPatientName}
                  </p>
                </div>
                <div className="h-9 w-px bg-[#e2e8f0]" />
                <div className="min-w-0 flex-1 pl-2">
                  <p className="text-[10px] font-bold text-[#64748b]">
                    Patient ID
                  </p>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-[#0f172a]">
                    {patientId || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5">
                <div className="flex items-center">
                  <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#e6f7f3] text-sm font-black text-[#0f766e]">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1 px-3">
                    <p className="text-[10px] font-bold text-[#64748b]">Name</p>
                    <p className="mt-0.5 truncate text-xs font-extrabold text-[#0f172a]">
                      {resolvedPatientName}
                    </p>
                  </div>

                  <div className="h-9 w-px bg-[#e2e8f0]" />

                  <div className="min-w-0 flex-1 px-3">
                    <p className="text-[10px] font-bold text-[#64748b]">Age</p>
                    <p className="mt-0.5 truncate text-xs font-extrabold text-[#0f172a]">
                      {patientAge || 'N/A'}
                    </p>
                  </div>

                  <div className="h-9 w-px bg-[#e2e8f0]" />

                  <div className="min-w-0 flex-1 pl-3">
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Gender
                    </p>
                    <p className="mt-0.5 truncate text-xs font-extrabold text-[#0f172a]">
                      {patientGender || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="my-3 h-px bg-[#e2e8f0]" />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                    <IdCard size={15} className="shrink-0 text-[#64748b]" />
                    <span className="truncate">
                      {patientNic
                        ? `NIC: ${patientNic}`
                        : 'NIC: Under 18 / No NIC'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                    <Phone size={15} className="shrink-0 text-[#64748b]" />
                    <span className="truncate">
                      {patientPhone ? `Mobile: ${patientPhone}` : 'Mobile: N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Prescribed Medicines (Matches Screenshots 1 & 3 lines 1400-1662) */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#e6f7f3] text-[#0f766e]">
                  <Pill size={17} />
                </div>
                <h3 className="text-base font-black text-[#0f172a]">
                  Prescribed Medicines
                </h3>
              </div>
              <span className="text-[11px] font-extrabold text-[#0f766e]">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-4 text-xs text-[#64748b]">
                No medicines listed.
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const drugName = item.drug_name || 'Medicine';
                  const genericName = item.generic_name || '';
                  const dosage = item.dosage || 'N/A';
                  const frequency = item.frequency || 'N/A';
                  const duration = item.duration || 'N/A';
                  const instruction = item.instruction || 'N/A';

                  return (
                    <div
                      key={idx}
                      className="rounded-[16px] border border-[#e2e8f0] bg-white p-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.018)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#e6f7f3] text-xs font-black text-[#0f766e]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-[#0f172a]">
                            {drugName}
                          </p>
                          {genericName && (
                            <p className="mt-0.5 truncate text-[11px] text-[#64748b]">
                              Generic: {genericName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 4-column metric bar (Dosage | Frequency | Duration | Instructions) */}
                      <div className="mt-3 grid grid-cols-2 gap-y-2.5 rounded-[12px] bg-[#f8fafc] px-1.5 py-2.5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[#e2e8f0]">
                        <div className="px-2">
                          <p className="flex items-center gap-1 text-[10px] font-bold text-[#64748b]">
                            <Pill size={13} className="shrink-0 text-[#0f766e]" />
                            <span className="truncate">Dosage</span>
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#0f172a]">
                            {dosage}
                          </p>
                        </div>

                        <div className="px-2">
                          <p className="flex items-center gap-1 text-[10px] font-bold text-[#64748b]">
                            <Repeat
                              size={13}
                              className="shrink-0 text-[#0f766e]"
                            />
                            <span className="truncate">Frequency</span>
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#0f172a]">
                            {frequency}
                          </p>
                        </div>

                        <div className="px-2">
                          <p className="flex items-center gap-1 text-[10px] font-bold text-[#64748b]">
                            <Calendar
                              size={13}
                              className="shrink-0 text-[#0f766e]"
                            />
                            <span className="truncate">Duration</span>
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#0f172a]">
                            {duration}
                          </p>
                        </div>

                        <div className="px-2">
                          <p className="flex items-center gap-1 text-[10px] font-bold text-[#64748b]">
                            <FileText
                              size={13}
                              className="shrink-0 text-[#0f766e]"
                            />
                            <span className="truncate">Instructions</span>
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#0f172a]">
                            {instruction}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Doctor's Notes (Matches Screenshot 1 lines 1664-1747) */}
          {notes && notes !== 'None' && (
            <div className="flex items-start gap-2.5 rounded-[15px] border border-[#d7e9fc] bg-[#f0f7ff] p-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white text-[#2563eb]">
                <FileText size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-black text-[#1e3a8a]">
                  Doctor&apos;s Notes
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#334155]">
                  {notes}
                </p>
              </div>
            </div>
          )}

          {/* 5. Consultation Fee — ONLY shown for Doctor view, HIDDEN for Patients! */}
          {showConsultationFee && (
            <div className="flex items-center justify-between rounded-[15px] border border-emerald-200 bg-emerald-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0f172a]">
                    Consultation Fee
                  </p>
                  <p className="text-[10.5px] text-[#64748b]">
                    Doctor consultation charge only
                  </p>
                </div>
              </div>
              <p className="text-base font-black text-emerald-800">
                Rs. {consultationFee.toFixed(2)}
              </p>
            </div>
          )}

          {/* 6. Bottom Action Buttons (Matches Screenshot 1: Share Rx + Download PDF) */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleShareRx}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#0f766e] bg-white text-xs font-extrabold text-[#0f766e] transition hover:bg-teal-50"
            >
              <Share2 size={16} />
              Share Rx
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#059669] text-xs font-extrabold text-white shadow-sm transition hover:bg-[#047857]"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
