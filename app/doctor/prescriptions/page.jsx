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
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  FilePlus2,
  FileText,
  Loader2,
  Menu,
  Pill,
  RefreshCw,
  Search,
  X,
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

function getItemsFor(pres) {
  if (!pres) return [];
  if (Array.isArray(pres.items) && pres.items.length > 0) {
    return pres.items.filter(Boolean);
  }
  const med = String(pres.medicine || '').trim();
  if (med) {
    return [
      {
        drug_name: med,
        generic_name: '',
        dosage: '',
        frequency: '',
        instruction: String(pres.instruction || '').trim(),
        duration: String(pres.duration || '').trim(),
      },
    ];
  }
  return [];
}

function formatPrescriptionId(pres) {
  const raw = String(pres?.id ?? pres?.prescription_id ?? '').trim();
  if (raw.toUpperCase().startsWith('PRE-')) return raw;
  return `PRE-${raw}`;
}

function formatCreatedDate(pres) {
  const raw = String(pres?.created_at || pres?.date || '').trim();
  if (!raw) return 'Just now';
  return raw.split(' ')[0];
}

export default function DoctorPrescriptionsPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const loadHistory = useCallback(
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

        setDoctor(profileRes.doctor || null);

        const list = extractArray(rxRes, ['prescriptions', 'data']);
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a?.created_at || a?.date || 0).getTime();
          const db = new Date(b?.created_at || b?.date || 0).getTime();
          return (db || 0) - (da || 0);
        });
        setPrescriptions(sorted);
      } catch {
        setPrescriptions([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [memberId, router]
  );

  useEffect(() => {
    if (memberId) {
      loadHistory();
    }
  }, [memberId, loadHistory]);

  const handleLogout = () => {
    localStorage.removeItem('healthcare_member');
    localStorage.removeItem('healthcare_member_id');
    localStorage.removeItem('healthcare_user_type');
    localStorage.removeItem('healthcare_doctor');
    localStorage.removeItem('healthcare_session_token');
    router.replace('/login');
  };

  const filteredPrescriptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return prescriptions;

    return prescriptions.filter((pres) => {
      const patName = String(pres?.patient_name || '').toLowerCase();
      const med = String(pres?.medicine || '').toLowerCase();
      const id = formatPrescriptionId(pres).toLowerCase();
      const itemMatch = getItemsFor(pres).some((item) => {
        const dName = String(item?.drug_name || '').toLowerCase();
        const gName = String(item?.generic_name || '').toLowerCase();
        return dName.includes(q) || gName.includes(q);
      });

      return (
        patName.includes(q) ||
        med.includes(q) ||
        id.includes(q) ||
        itemMatch
      );
    });
  }, [prescriptions, searchQuery]);

  const doctorName = displayName(doctor, 'Doctor');
  const doctorSpeciality =
    doctor?.speciality_name ||
    doctor?.specialization ||
    'General Practitioner';

  if (!memberId || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <Loader2 size={28} className="animate-spin text-emerald-700" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Loading Prescription History...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        doctorName={doctorName}
        doctorEmail={doctor?.email || 'Doctor Account'}
        doctorSubtitle={doctorSpeciality}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Top App Bar (Matches Screenshot 2) */}
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
                Prescription History
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCreateRxOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-extrabold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <FilePlus2 size={15} />
                <span>Create Prescription</span>
              </button>

              <button
                type="button"
                onClick={() => loadHistory(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3 text-xs font-bold text-white transition hover:bg-white/25"
                title="Refresh"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto w-full max-w-[1000px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          <div>
            <h2 className="text-2xl font-black text-[#2e7d32]">
              Prescription History
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              View prescriptions you have issued to patients.
            </p>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, medicine or prescription ID..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2e7d32] focus:ring-4 focus:ring-emerald-500/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Count Label */}
            <p className="mt-3.5 text-xs font-bold text-slate-500">
              {filteredPrescriptions.length}{' '}
              {filteredPrescriptions.length === 1
                ? 'prescription'
                : 'prescriptions'}
            </p>
          </div>

          {/* Prescriptions List */}
          {filteredPrescriptions.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <FileText size={38} className="text-slate-400" />
              <p className="mt-3 text-sm font-bold text-slate-600">
                No prescriptions found.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredPrescriptions.map((pres, index) => {
                const items = getItemsFor(pres);
                const patientName = displayName(
                  {
                    full_name: pres.patient_name,
                    patient_id: pres.patient_id,
                  },
                  'Patient'
                );

                const primaryMedicine =
                  items.length > 0
                    ? String(items[0].drug_name || 'Medicine').trim()
                    : String(pres.medicine || 'Medicine').trim();

                const extraCount = items.length > 1 ? items.length - 1 : 0;
                const medicineTitle =
                  extraCount > 0
                    ? `${primaryMedicine} + ${extraCount} more`
                    : primaryMedicine;

                const date = formatCreatedDate(pres);
                const id = formatPrescriptionId(pres);

                return (
                  <button
                    key={pres.id || pres.prescription_id || index}
                    type="button"
                    onClick={() => setSelectedPrescription(pres)}
                    className="flex w-full items-center justify-between gap-3.5 rounded-[18px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf6ec] text-[#2e7d32]">
                        <FileText size={23} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 sm:text-base">
                          {patientName}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
                          {medicineTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <FileText size={13} />
                            {id}
                          </span>
                          <span className="h-3 w-px bg-slate-200" />
                          <span className="inline-flex items-center gap-1">
                            <Pill size={13} />
                            {items.length}{' '}
                            {items.length === 1 ? 'medicine' : 'medicines'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-between gap-4">
                      <span className="text-[11px] font-medium text-slate-500">
                        {date}
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DoctorMobileNav />
      </div>

      {/* Create Prescription (Rx) Modal */}
      <CreatePrescriptionModal
        open={createRxOpen}
        onClose={() => setCreateRxOpen(false)}
        memberId={memberId}
        doctorName={doctorName}
        onSuccess={() => loadHistory(true)}
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
