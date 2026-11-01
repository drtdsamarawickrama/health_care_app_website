'use client';

import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import AddFamilyMemberModal from '@/components/AddFamilyMemberModal';
import PrescriptionDetailsModal, {
  getPrescriptionItems,
  getPrescriptionStatus,
} from '@/components/PrescriptionDetailsModal';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Menu,
  RefreshCw,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  getPatientInvoices,
  getPrescriptions,
} from '@/lib/api';
import { FeatureFlags } from '@/lib/featureFlags';
import {
  displayName,
  formatDoctorName,
} from '@/lib/formatters';

function extractArray(result, keys) {
  if (Array.isArray(result)) return result;
  if (!result) return [];
  for (const key of keys) {
    if (Array.isArray(result[key])) return result[key];
  }
  return [];
}

function isPrescriptionActive(pres) {
  return getPrescriptionStatus(pres) === 'Active';
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const {
    patients,
    selectedPatientId,
    selectedPatient,
    selectPatient,
    reloadPatients,
    isSelfProfileComplete,
    loading: profileLoading,
  } = usePatientProfile();

  const [memberId, setMemberId] = useState(null);
  const [member, setMember] = useState(null);

  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [emergencyBanner, setEmergencyBanner] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const storedMemberId = localStorage.getItem('healthcare_member_id');
    const storedUserType = localStorage.getItem('healthcare_user_type');
    const storedMember = localStorage.getItem('healthcare_member');

    const parsedMemberId = Number(storedMemberId);
    const parsedUserType = Number(storedUserType);

    if (!parsedMemberId || parsedMemberId <= 0 || parsedUserType !== 1) {
      router.replace('/login');
      return;
    }

    if (storedMember) {
      try {
        setMember(JSON.parse(storedMember));
      } catch {
        setMember(null);
      }
    }

    setMemberId(parsedMemberId);
  }, [router]);

  const loadDashboard = useCallback(
    async (refresh = false) => {
      if (!memberId || !selectedPatientId) {
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const [prescriptionResult, invoiceResult] = await Promise.all([
          getPrescriptions(selectedPatientId),
          getPatientInvoices(selectedPatientId).catch(() => ({
            invoices: [],
          })),
        ]);

        setPrescriptions(
          extractArray(prescriptionResult, ['prescriptions', 'data'])
        );
        setInvoices(extractArray(invoiceResult, ['invoices', 'data']));
      } catch (err) {
        setError(err?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [memberId, selectedPatientId]
  );

  useEffect(() => {
    if (memberId && selectedPatientId) {
      loadDashboard();
    } else if (memberId && !profileLoading && !selectedPatientId) {
      setLoading(false);
    }
  }, [memberId, selectedPatientId, profileLoading, loadDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('healthcare_member');
    localStorage.removeItem('healthcare_member_id');
    localStorage.removeItem('healthcare_user_type');
    localStorage.removeItem('healthcare_selected_patient_id');
    localStorage.removeItem('healthcare_session_token');
    router.replace('/login');
  };

  const activePrescriptions = useMemo(
    () => prescriptions.filter(isPrescriptionActive),
    [prescriptions]
  );

  const pendingInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          String(inv?.status || inv?.payment_status || 'Pending').toLowerCase() ===
          'pending'
      ),
    [invoices]
  );

  const patientName = displayName(selectedPatient || member, 'Patient');

  if (!memberId || profileLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <Loader2 size={30} className="animate-spin text-teal-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">
              Loading your dashboard
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Fetching your healthcare data...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8]">
      <PatientSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        patientName={patientName}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Top App Bar (Matches Flutter Patient Dashboard AppBar) */}
        <header className="sticky top-0 z-40 h-[72px] border-b border-teal-900/10 bg-gradient-to-r from-teal-800 to-teal-500 text-white shadow-md">
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
                Patient Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3.5 text-xs font-bold text-white transition hover:bg-white/25"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? 'animate-spin' : ''}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          {/* Incomplete Self Profile Notice */}
          {!isSelfProfileComplete && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold">
                    Complete Your Medical Profile
                  </p>
                  <p className="text-xs text-amber-800">
                    Add your personal and medical history so doctors can issue
                    accurate prescriptions.
                  </p>
                </div>
              </div>
              <Link
                href="/patient/complete-profile"
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
              >
                Complete Profile Now
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {emergencyBanner && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-900">
              <span>{emergencyBanner}</span>
              <button
                type="button"
                onClick={() => setEmergencyBanner('')}
                className="text-xs font-bold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Greeting (Matches Flutter PatientDashboard) */}
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Hello, {patientName}!
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Find verified medical care at your doorstep
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
            {/* Left Column: Patient & Family Profiles + Active Prescriptions */}
            <div className="space-y-6">
              {/* Patient & Family Profiles Card (Matches _buildPatientProfilesCard in patient_dashboard.dart) */}
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <UsersRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Patient &amp; Family Profiles
                    </h3>
                    <p className="text-xs text-slate-500">
                      Switch between your profile and family members
                    </p>
                  </div>
                </div>

                {patients.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">
                    No patient profiles found.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {patients.map((pat) => {
                      const patId = Number(pat?.id ?? pat?.patient_id ?? 0);
                      const isCurrent = patId === Number(selectedPatientId);
                      const rel = String(
                        pat?.relationship_to_user || pat?.relationship || 'Self'
                      ).trim();
                      const label = `${displayName(pat, 'Patient')} (${rel})`;

                      return (
                        <button
                          key={patId}
                          type="button"
                          onClick={() => selectPatient(patId)}
                          className={`rounded-full border px-3.5 py-2 text-xs transition ${
                            isCurrent
                              ? 'border-teal-300 bg-teal-50 font-bold text-teal-800'
                              : 'border-slate-200 bg-slate-100 font-medium text-slate-700 hover:bg-slate-200/70'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setAddFamilyOpen(true)}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white text-xs font-extrabold text-teal-700 transition hover:bg-teal-50"
                >
                  <UserPlus size={16} />
                  Add Family Member
                </button>
              </section>

              {/* Active Prescriptions Section (Matches patient_dashboard.dart lines 3920-4059) */}
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Active Prescriptions
                  </h3>
                  <Link
                    href="/patient/prescriptions"
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    See All
                  </Link>
                </div>

                {activePrescriptions.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-xs font-medium text-slate-500">
                      No active prescriptions based on date.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {activePrescriptions.map((pres, idx) => {
                      const rawId = String(
                        pres?.id ?? pres?.prescription_id ?? ''
                      ).trim();
                      const rxId = rawId.toUpperCase().startsWith('PRE-')
                        ? rawId
                        : `PRE-${rawId}`;
                      const items = getPrescriptionItems(pres);
                      const medicine =
                        pres?.medicine ||
                        (items.length > 0 ? items[0]?.drug_name : '') ||
                        'Medicine';
                      const doctor = formatDoctorName(
                        pres?.provider_name || pres?.doctor || 'Doctor'
                      );

                      return (
                        <button
                          key={rawId || idx}
                          type="button"
                          onClick={() => setSelectedPrescription(pres)}
                          className="flex w-full items-center justify-between gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-300 hover:shadow-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-900">
                                {medicine}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                Ref: {rxId} • Prescribed by {doctor}
                              </p>
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            className="shrink-0 text-slate-400"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Feature-Flagged Pending Payments Card */}
              {FeatureFlags.showPendingPayments && (
                <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Pending Payments
                    </h3>
                    {pendingInvoices.length > 0 && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        {pendingInvoices.length} Bill(s)
                      </span>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Emergency Card + Quick Navigation + Selected Patient Summary */}
            <div className="space-y-6">
              {/* Need Urgent Help? Emergency Card (Matches patient_dashboard.dart lines 4202-4260) */}
              <section className="rounded-[22px] bg-gradient-to-br from-red-800 to-red-500 p-5 text-white shadow-lg shadow-red-500/20 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      Need Urgent Help?
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-white/90">
                      Tap the emergency button to call the nearest provider
                      immediately.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEmergencyBanner(
                        'Emergency alert triggered! Connecting with nearest on-duty medical provider.'
                      )
                    }
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-red-800 shadow-md transition hover:scale-105"
                    aria-label="Trigger Emergency"
                  >
                    <AlertTriangle size={26} />
                  </button>
                </div>
              </section>

              {/* Quick Navigation (Matches the 4 Flutter Patient tabs) */}
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-extrabold text-slate-900">
                  Quick Access
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Link
                    href="/patient/prescriptions"
                    className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <FileText size={20} className="text-teal-600" />
                    <span className="mt-2 text-xs font-bold text-slate-800">
                      Prescriptions
                    </span>
                  </Link>

                  <Link
                    href="/patient/payments"
                    className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <CreditCard size={20} className="text-teal-600" />
                    <span className="mt-2 text-xs font-bold text-slate-800">
                      Payments
                    </span>
                  </Link>

                  <Link
                    href="/patient/profile"
                    className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <UserRound size={20} className="text-teal-600" />
                    <span className="mt-2 text-xs font-bold text-slate-800">
                      Profile
                    </span>
                  </Link>
                </div>
              </section>

              {/* Active Patient Profile Summary */}
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-lg font-extrabold text-white">
                    {String(patientName || 'P')
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-900">
                      {patientName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedPatient?.relationship_to_user || 'Self'} Profile
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-slate-500">Phone</span>
                    <span className="font-bold text-slate-800">
                      {selectedPatient?.emergency_contact ||
                        selectedPatient?.phone ||
                        member?.phone ||
                        'Not specified'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-slate-500">NIC</span>
                    <span className="font-bold text-slate-800">
                      {selectedPatient?.nic_no ||
                        selectedPatient?.nic ||
                        member?.nic ||
                        'Not specified'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-slate-500">
                      Blood Group
                    </span>
                    <span className="font-bold text-slate-800">
                      {selectedPatient?.blood_group || 'Not specified'}
                    </span>
                  </div>
                </div>

                <Link
                  href="/patient/profile"
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200"
                >
                  View Medical Profile &amp; Documents
                  <ArrowRight size={15} />
                </Link>
              </section>
            </div>
          </div>
        </div>

        <PatientMobileNav />
      </div>

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        open={addFamilyOpen}
        onClose={() => setAddFamilyOpen(false)}
        onAdded={async (newId) => {
          await reloadPatients();
          if (newId > 0) selectPatient(newId);
        }}
      />

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
