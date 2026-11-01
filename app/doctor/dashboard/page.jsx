'use client';

import DoctorSidebar, {
  DoctorMobileNav,
} from '@/components/DoctorNavigation';
import CreatePrescriptionModal from '@/components/CreatePrescriptionModal';
import PrescriptionDetailsModal from '@/components/PrescriptionDetailsModal';
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
  BriefcaseMedical,
  CalendarDays,
  ChevronRight,
  Clock3,
  FilePlus2,
  FileText,
  Hourglass,
  Loader2,
  Lock,
  Menu,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import {
  checkDoctorProfile,
  getProviderPrescriptions,
} from '@/lib/api';
import { displayName } from '@/lib/formatters';

function extractArray(result, keys) {
  if (Array.isArray(result)) return result;
  if (!result) return [];
  for (const key of keys) {
    if (Array.isArray(result[key])) return result[key];
  }
  return [];
}

function getDateLabel(pres) {
  const raw = String(pres?.created_at || pres?.date || '').trim();
  if (!raw) return 'Recently added';
  return raw.split(' ')[0];
}

function getMedicineCountLabel(pres) {
  const rawItems = pres?.items;
  const explicitCount = Number(
    pres?.medicine_count ?? pres?.item_count ?? 0
  );
  const count =
    explicitCount > 0
      ? explicitCount
      : Array.isArray(rawItems)
      ? rawItems.length
      : 0;

  if (count === 1) return '1 medicine';
  if (count > 1) return `${count} medicines`;

  const med = String(pres?.medicine || '').trim();
  if (med && med.toLowerCase() !== 'null') return med;
  return 'Prescription saved';
}

export default function DoctorDashboardPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [profileStatus, setProfileStatus] = useState('Approved');
  const [canAccessFullSystem, setCanAccessFullSystem] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');

  const [isOnline, setIsOnline] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [createRxOpen, setCreateRxOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const storedMemberId = localStorage.getItem('healthcare_member_id');
    const storedUserType = localStorage.getItem('healthcare_user_type');

    const parsedMemberId = Number(storedMemberId);
    const parsedUserType = Number(storedUserType);

    if (!parsedMemberId || parsedMemberId <= 0 || parsedUserType !== 2) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedMemberId);
  }, [router]);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!memberId) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [profileRes, rxRes] = await Promise.all([
          checkDoctorProfile(memberId),
          getProviderPrescriptions(memberId, { role: 'Doctor' }),
        ]);

        if (
          profileRes?.success !== true ||
          profileRes?.has_profile !== true
        ) {
          router.replace('/doctor/register-profile');
          return;
        }

        const docObj = profileRes.doctor || null;
        setDoctor(docObj);

        const statusStr = String(
          profileRes?.profile_status || docObj?.status || 'Pending'
        ).trim();
        setProfileStatus(statusStr);
        setCanAccessFullSystem(
          profileRes?.can_access_full_system === true ||
            statusStr.toLowerCase() === 'approved'
        );
        setAccessMessage(String(profileRes?.message || '').trim());

        const rawList = extractArray(rxRes, ['prescriptions', 'data']);
        const sorted = [...rawList].sort((a, b) => {
          const da = new Date(a?.created_at || a?.date || 0).getTime();
          const db = new Date(b?.created_at || b?.date || 0).getTime();
          return (db || 0) - (da || 0);
        });
        setPrescriptions(sorted);
      } catch {
        // Keep existing state on transient error
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [memberId, router]
  );

  useEffect(() => {
    if (memberId) {
      loadDashboard();
    }
  }, [memberId, loadDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('healthcare_member');
    localStorage.removeItem('healthcare_member_id');
    localStorage.removeItem('healthcare_user_type');
    localStorage.removeItem('healthcare_doctor');
    localStorage.removeItem('healthcare_session_token');
    router.replace('/login');
  };

  const doctorName = displayName(doctor, 'Doctor');
  const doctorSpeciality =
    doctor?.speciality_name ||
    doctor?.specialization ||
    'General Practitioner';

  const recentPrescriptions = useMemo(
    () => prescriptions.slice(0, 3),
    [prescriptions]
  );

  if (!memberId || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f2f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <Loader2 size={28} className="animate-spin text-emerald-700" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Loading Doctor Dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f7fb]">
      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        doctorName={doctorName}
        doctorEmail={doctor?.email || 'Doctor Account'}
        doctorSubtitle={doctorSpeciality}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 h-[72px] border-b border-emerald-900/10 bg-gradient-to-r from-emerald-900 to-emerald-600 text-white shadow-md">
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
                {canAccessFullSystem
                  ? 'Doctor Dashboard'
                  : 'Doctor Verification'}
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
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          {!canAccessFullSystem ? (
            /* Pending / Rejected Doctor Verification Screen (matches home_screen.dart _buildPendingDoctorDashboard) */
            <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
              <div
                className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
                  profileStatus.toLowerCase() === 'rejected'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {profileStatus.toLowerCase() === 'rejected' ? (
                  <ShieldAlert size={46} />
                ) : (
                  <Hourglass size={46} />
                )}
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-900">
                {profileStatus.toLowerCase() === 'rejected'
                    ? 'Registration Requires Attention'
                    : 'Verification Pending'}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {profileStatus.toLowerCase() === 'rejected'
                  ? 'Your doctor registration has not been approved. Review the administrator message and submit the required corrections.'
                  : 'Your professional registration has been submitted successfully and is waiting for administrator verification.'}
              </p>

              <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left">
                <div className="flex items-center gap-3 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-sm font-bold text-slate-900">
                      {profileStatus || 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <BriefcaseMedical size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Speciality</p>
                    <p className="text-sm font-bold text-slate-900">
                      {doctorSpeciality}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">System Access</p>
                    <p className="text-sm font-bold text-slate-900">
                      Dashboard Only
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-left text-xs leading-5 text-blue-900">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-blue-700" />
                <span>
                  {accessMessage ||
                    'The administrator is reviewing your professional details and uploaded documents.'}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-sm font-extrabold text-white transition hover:bg-emerald-800"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? 'animate-spin' : ''}
                  />
                  Check Approval Status
                </button>

                <Link
                  href="/doctor/register-profile"
                  className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                >
                  Update Credentials
                </Link>
              </div>
            </div>
          ) : (
            /* Approved Doctor Dashboard (Matches Screenshot 1 & doctor_dashboard.dart) */
            <div className="space-y-6">
              {/* 1. Welcome Banner + Duty Switch (Responsive 2-column on desktop, stacked on mobile) */}
              <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
                {/* Welcome Banner Card */}
                <section className="flex items-center justify-between gap-4 rounded-[26px] border border-[#e5edf5] bg-white px-6 py-6 shadow-sm">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#5d7698]">
                      DOCTOR DASHBOARD
                    </p>

                    <p className="mt-4 text-xl font-medium text-[#142b49] sm:text-2xl">
                      Welcome back,
                    </p>
                    <h2 className="mt-0.5 text-2xl font-black tracking-tight text-[#102747] sm:text-3xl">
                      {doctorName}!
                    </h2>

                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                          isOnline
                            ? 'bg-[#e2f8ee] text-[#13864a]'
                            : 'bg-[#f0f3f7] text-[#66768a]'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOnline ? 'bg-[#159653]' : 'bg-[#8794a4]'
                          }`}
                        />
                        {isOnline
                          ? 'Online & Available'
                          : 'Offline / Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#e6f4fc] text-[#1976d2]">
                    <BriefcaseMedical size={38} />
                  </div>
                </section>

                {/* Duty Switch Card */}
                <section className="flex items-center justify-between gap-4 rounded-[24px] border border-[#e5edf5] bg-white px-6 py-5 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6f1ff] text-[#1769d2]">
                      <Clock3 size={26} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#142b49]">
                        Duty Switch
                      </h3>
                      <p className="mt-0.5 text-xs text-[#6e83a0]">
                        Manage your availability
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOnline}
                    onClick={() => setIsOnline((prev) => !prev)}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      isOnline ? 'bg-[#15803d]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                        isOnline ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </section>
              </div>

              {/* 2. Quick Actions (2 Cards ONLY: Create Prescription & My Medicine) */}
              <section>
                <h2 className="text-xl font-extrabold tracking-tight text-[#132b49]">
                  Quick Actions
                </h2>

                <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Create Prescription Card */}
                  <button
                    type="button"
                    onClick={() => setCreateRxOpen(true)}
                    className="group flex min-h-[168px] flex-col justify-between rounded-[22px] border border-[#cdefe1] bg-[#e8f8f1] p-5 text-left transition hover:shadow-md"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c9f0e1] text-[#11864b]">
                        <FilePlus2 size={28} />
                      </div>
                      <ArrowRight
                        size={22}
                        className="text-[#11864b] transition-transform group-hover:translate-x-1"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-base font-extrabold text-[#132b49]">
                        Create Prescription
                      </p>
                      <p className="mt-1 text-xs text-[#5e7391]">
                        Create a new patient prescription
                      </p>
                    </div>
                  </button>

                  {/* My Medicine Card */}
                  <Link
                    href="/doctor/medicines"
                    className="group flex min-h-[168px] flex-col justify-between rounded-[22px] border border-[#d5e5ff] bg-[#edf4ff] p-5 text-left transition hover:shadow-md"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d5e5ff] text-[#1769d2]">
                        <Pill size={28} />
                      </div>
                      <ArrowRight
                        size={22}
                        className="text-[#1769d2] transition-transform group-hover:translate-x-1"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-base font-extrabold text-[#132b49]">
                        My Medicine
                      </p>
                      <p className="mt-1 text-xs text-[#5e7391]">
                        Manage your medicine list
                      </p>
                    </div>
                  </Link>
                </div>
              </section>

              {/* 3. Recent Prescriptions Card (Matches Screenshot 1) */}
              <section className="rounded-[24px] border border-[#e5edf5] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-[#132b49] sm:text-xl">
                      Recent Prescriptions
                    </h2>
                    <p className="mt-0.5 text-xs text-[#6e83a0]">
                      Latest prescriptions from your records
                    </p>
                  </div>

                  <Link
                    href="/doctor/prescriptions"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1769d2] hover:underline"
                  >
                    View All
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {recentPrescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf4ff] text-[#3679c9]">
                      <FileText size={26} />
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-[#132b49]">
                      No prescriptions yet
                    </p>
                    <p className="mt-1 text-xs text-[#6e83a0]">
                      New prescriptions you create will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-[#e7eef5]">
                    {recentPrescriptions.map((pres, index) => {
                      const patName = displayName(
                        {
                          full_name: pres.patient_name,
                          patient_id: pres.patient_id,
                        },
                        'Patient'
                      );
                      const avatarStyles = [
                        'bg-[#e9e6ff] text-[#7765c6]',
                        'bg-[#ddf7f2] text-[#159d91]',
                        'bg-[#ffe5ea] text-[#d65374]',
                      ];
                      const avatarClass =
                        avatarStyles[index % avatarStyles.length];

                      return (
                        <button
                          key={pres.id || pres.prescription_id || index}
                          type="button"
                          onClick={() => setSelectedPrescription(pres)}
                          className="flex w-full items-center justify-between gap-3.5 py-4 text-left transition hover:bg-slate-50/70"
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div
                              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full ${avatarClass}`}
                            >
                              <UserRound size={26} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-[#142b49] sm:text-base">
                                {patName}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#607895]">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays size={13} />
                                  {getDateLabel(pres)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Pill size={13} />
                                  {getMedicineCountLabel(pres)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight
                            size={20}
                            className="shrink-0 text-[#7890ae]"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <DoctorMobileNav />
      </div>

      {/* Create Prescription (Rx) Modal (Matches Screenshot 5) */}
      <CreatePrescriptionModal
        open={createRxOpen}
        onClose={() => setCreateRxOpen(false)}
        memberId={memberId}
        doctorName={doctorName}
        onSuccess={() => loadDashboard(true)}
      />

      {/* Prescription Details Modal */}
      <PrescriptionDetailsModal
        open={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
        viewerRole="doctor"
        defaultDoctorName={doctorName}
        defaultSpecialty={doctorSpeciality}
      />
    </main>
  );
}
