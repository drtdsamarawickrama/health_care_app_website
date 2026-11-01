'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Menu,
  Pill,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import PrescriptionDetailsModal, {
  getPrescriptionItems,
  getPrescriptionStatus,
} from '@/components/PrescriptionDetailsModal';
import { getPrescriptions } from '@/lib/api';
import { displayName, formatDoctorName } from '@/lib/formatters';

function getPrimaryMedicine(pres) {
  const items = getPrescriptionItems(pres);
  if (items.length > 0 && items[0]?.drug_name) {
    return items[0].drug_name;
  }
  const med = String(pres?.medicine || '').trim();
  return med || 'Medicine';
}

function getPrescriptionId(pres) {
  const raw = String(pres?.id ?? pres?.prescription_id ?? '').trim();
  if (!raw) return 'PRE-';
  return raw.toUpperCase().startsWith('PRE-') ? raw : `PRE-${raw}`;
}

function getDoctorLabel(pres) {
  const role = String(pres?.provider_role || 'Doctor').trim();
  const raw =
    pres?.provider_name || pres?.doctor || pres?.doctor_name || 'Doctor';
  if (role.toLowerCase() === 'nurse') {
    return String(raw).trim() || 'Nurse';
  }
  return formatDoctorName(raw);
}

function getSpecialtyLabel(pres) {
  if (pres?.specialty) return String(pres.specialty).trim();
  const role = String(pres?.provider_role || '').trim();
  return role === 'Nurse'
    ? 'Registered General Nurse'
    : 'General Practitioner';
}

function getDateLabel(pres) {
  const raw = String(pres?.created_at || pres?.date || '').trim();
  return raw ? raw.split(' ')[0] : 'Just now';
}

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const {
    patients,
    selectedPatientId,
    selectedPatient,
    selectPatient,
    loading: profileLoading,
  } = usePatientProfile();

  const [memberId, setMemberId] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const storedMemberId = localStorage.getItem('healthcare_member_id');
    const storedUserType = localStorage.getItem('healthcare_user_type');
    const parsedMemberId = Number(storedMemberId);
    const parsedUserType = Number(storedUserType);

    if (!parsedMemberId || parsedMemberId <= 0 || parsedUserType !== 1) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedMemberId);
  }, [router]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!memberId || !selectedPatientId) {
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const result = await getPrescriptions(selectedPatientId);

        if (Array.isArray(result)) {
          setPrescriptions(result);
        } else if (Array.isArray(result?.prescriptions)) {
          setPrescriptions(result.prescriptions);
        } else if (Array.isArray(result?.data)) {
          setPrescriptions(result.data);
        } else if (result?.success === false) {
          setError(result?.message || 'Unable to load prescriptions.');
          setPrescriptions([]);
        } else {
          setPrescriptions([]);
        }
      } catch (err) {
        setError(err?.message || 'Unable to load prescriptions.');
        setPrescriptions([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [memberId, selectedPatientId]
  );

  useEffect(() => {
    if (memberId && selectedPatientId) {
      loadData(false);
    } else if (memberId && !profileLoading && !selectedPatientId) {
      setLoading(false);
    }
  }, [memberId, selectedPatientId, profileLoading, loadData]);

  const counts = useMemo(() => {
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    for (const pres of prescriptions) {
      const st = getPrescriptionStatus(pres);
      if (st === 'Active') active++;
      else if (st === 'Completed') completed++;
      else if (st === 'Cancelled') cancelled++;
    }
    return {
      all: prescriptions.length,
      Active: active,
      Completed: completed,
      Cancelled: cancelled,
    };
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return prescriptions.filter((pres) => {
      const status = getPrescriptionStatus(pres);
      if (selectedFilter !== 'All' && status !== selectedFilter) {
        return false;
      }

      if (!q) return true;

      const doctor = getDoctorLabel(pres).toLowerCase();
      const id = getPrescriptionId(pres).toLowerCase();
      const legacyMedicine = String(pres?.medicine || '').toLowerCase();
      const items = getPrescriptionItems(pres);
      const itemMatches = items.some((item) => {
        const drugName = String(item?.drug_name || '').toLowerCase();
        const genericName = String(item?.generic_name || '').toLowerCase();
        return drugName.includes(q) || genericName.includes(q);
      });

      return (
        doctor.includes(q) ||
        id.includes(q) ||
        legacyMedicine.includes(q) ||
        itemMatches
      );
    });
  }, [prescriptions, selectedFilter, searchQuery]);

  if (!memberId || profileLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 size={32} className="animate-spin text-[#0f766e]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <PatientSidebar
        open={sidebarOpen}
        patientName={displayName(selectedPatient, 'Patient')}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Top App Bar (Matches Screenshot 2 Prescriptions AppBar) */}
        <header className="sticky top-0 z-40 h-[72px] border-b border-teal-900/10 bg-gradient-to-r from-[#0f766e] to-[#059669] text-white shadow-md">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                Prescriptions
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {patients.length > 1 && (
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => selectPatient(Number(e.target.value))}
                  className="h-9 rounded-xl border border-white/20 bg-white/15 px-3 text-xs font-bold text-white outline-none"
                >
                  {patients.map((p) => {
                    const id = Number(p?.id ?? p?.patient_id ?? 0);
                    return (
                      <option key={id} value={id} className="text-slate-900">
                        {displayName(p, 'Patient')} (
                        {p?.relationship_to_user || 'Profile'})
                      </option>
                    );
                  })}
                </select>
              )}

              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white transition hover:bg-white/25"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? 'animate-spin' : ''}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[920px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12">
          {/* Search Input (Matches Screenshot 2) */}
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prescriptions..."
              className="h-12 w-full rounded-[16px] border border-[#e2e8f0] bg-white pl-11 pr-11 text-sm text-[#0f172a] outline-none transition focus:border-[#0f766e]"
            />
            <SlidersHorizontal
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#0f766e]"
            />
          </div>

          {/* Filter Chips Row (Matches Screenshot 2: All | Active N | Completed N | Cancelled N) */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {['All', 'Active', 'Completed', 'Cancelled'].map((label) => {
              const selected = selectedFilter === label;
              const chipText =
                label === 'All' ? 'All' : `${label} ${counts[label] ?? 0}`;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedFilter(label)}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    selected
                      ? 'bg-[#0f766e] text-white shadow-sm'
                      : 'bg-[#f1f5f9] text-[#475569] hover:bg-slate-200/70'
                  }`}
                >
                  {chipText}
                </button>
              );
            })}
          </div>

          {/* Count & Sort Row (Matches Screenshot 2: "14 prescriptions" | "Latest first v") */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-bold text-[#64748b]">
              {filteredPrescriptions.length}{' '}
              {filteredPrescriptions.length === 1
                ? 'prescription'
                : 'prescriptions'}
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#64748b]">
              <span>Latest first</span>
              <ChevronDown size={15} />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Prescriptions List (Matches Screenshot 2 cards) */}
          <section className="mt-3.5 space-y-3">
            {filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[18px] border border-[#e2e8f0] bg-white p-10 text-center">
                <FileText size={38} className="text-[#94a3b8]" />
                <p className="mt-2.5 text-sm font-bold text-[#64748b]">
                  No prescriptions found.
                </p>
              </div>
            ) : (
              filteredPrescriptions.map((pres, index) => {
                const items = getPrescriptionItems(pres);
                const medicineCount = items.length;
                const primaryMed = getPrimaryMedicine(pres);
                const doctor = getDoctorLabel(pres);
                const specialty = getSpecialtyLabel(pres);
                const date = getDateLabel(pres);
                const rxId = getPrescriptionId(pres);
                const status = getPrescriptionStatus(pres);

                const statusStyles =
                  status === 'Completed'
                    ? 'bg-[#eff6ff] text-[#2563eb]'
                    : status === 'Cancelled'
                    ? 'bg-[#fef2f2] text-[#dc2626]'
                    : 'bg-[#ecfdf5] text-[#059669]';

                return (
                  <button
                    key={pres?.id || pres?.prescription_id || index}
                    type="button"
                    onClick={() => setSelectedPrescription(pres)}
                    className="flex w-full items-start justify-between gap-3.5 rounded-[18px] border border-[#e4eaf0] bg-white p-3.5 text-left shadow-[0_5px_14px_rgba(0,0,0,0.025)] transition hover:border-[#0f766e]/40 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#e6f7f3] text-[#0f766e]">
                        <FileText size={24} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[15px] font-black text-[#0f172a]">
                            {primaryMed}
                          </p>
                          <span className="shrink-0 text-[11px] font-medium text-[#64748b]">
                            {date}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-bold text-[#334155]">
                          {doctor}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#64748b]">
                          {specialty}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-[#64748b]">
                          <span className="inline-flex items-center gap-1 font-bold text-[#475569]">
                            <FileText size={13} className="text-[#64748b]" />
                            {rxId}
                          </span>

                          <span className="h-3 w-px bg-[#e2e8f0]" />

                          <span className="inline-flex items-center gap-1">
                            <Pill size={13} className="text-[#64748b]" />
                            {medicineCount}{' '}
                            {medicineCount === 1 ? 'medicine' : 'medicines'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-between self-stretch pt-5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${statusStyles}`}
                      >
                        {status}
                      </span>
                      <ChevronRight size={15} className="mt-2 text-[#94a3b8]" />
                    </div>
                  </button>
                );
              })
            )}
          </section>
        </div>

        <PatientMobileNav />
      </div>

      {/* Prescription Details Modal (Patient View — Consultation Fee Hidden!) */}
      <PrescriptionDetailsModal
        open={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
        patientProfile={selectedPatient}
        viewerRole="patient"
      />
    </main>
  );
}
