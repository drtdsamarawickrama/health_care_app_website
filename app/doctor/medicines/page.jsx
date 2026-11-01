'use client';

import DoctorSidebar, {
  DoctorMobileNav,
} from '@/components/DoctorNavigation';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  CheckCircle2,
  Loader2,
  Menu,
  Pill,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  addDoctorDrug,
  checkDoctorProfile,
  getDoctorDrugs,
  searchDrugs,
} from '@/lib/api';
import { displayName } from '@/lib/formatters';

function asBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const norm = String(value ?? '')
    .trim()
    .toLowerCase();
  return norm === 'true' || norm === '1' || norm === 'yes';
}

function extractDrugs(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.drugs)) return result.drugs;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function medicineId(drug) {
  return Number(drug?.drug_id ?? drug?.id ?? 0);
}

function medicineName(drug) {
  return String(drug?.drug_name ?? drug?.name ?? 'Medicine').trim();
}

function genericName(drug) {
  return String(drug?.generic_name ?? '').trim();
}

export default function DoctorMedicinesPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);
  const [doctor, setDoctor] = useState(null);

  const [myMedicines, setMyMedicines] = useState([]);
  const [catalogResults, setCatalogResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingDrugId, setAddingDrugId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDrugName, setNewDrugName] = useState('');
  const [newGenericName, setNewGenericName] = useState('');

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

  const loadMyMedicines = useCallback(async () => {
    if (!memberId) return;
    try {
      const res = await getDoctorDrugs({ providerMemberId: memberId });
      if (res?.success === true) {
        const list = extractDrugs(res)
          .map((d) => ({ ...d }))
          .sort((a, b) =>
            medicineName(a)
              .toLowerCase()
              .localeCompare(medicineName(b).toLowerCase())
          );
        setMyMedicines(list);
      } else {
        setMyMedicines([]);
      }
    } catch {
      setMyMedicines([]);
    }
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;

    const init = async () => {
      setLoading(true);
      try {
        const docRes = await checkDoctorProfile(memberId);
        if (docRes?.success !== true || docRes?.has_profile !== true) {
          router.replace('/doctor/register-profile');
          return;
        }
        setDoctor(docRes.doctor || null);
        await loadMyMedicines();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [memberId, router, loadMyMedicines]);

  // Debounced search against shared drugs catalog when searchQuery is non-empty
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || !memberId) {
      setCatalogResults([]);
      setSearchingCatalog(false);
      return;
    }

    setSearchingCatalog(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchDrugs({
          providerMemberId: memberId,
          search: q,
        });
        if (res?.success === true) {
          const list = extractDrugs(res).sort((a, b) =>
            medicineName(a)
              .toLowerCase()
              .localeCompare(medicineName(b).toLowerCase())
          );
          setCatalogResults(list);
        } else {
          setCatalogResults([]);
        }
      } catch {
        setCatalogResults([]);
      } finally {
        setSearchingCatalog(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, memberId]);

  const handleAssignCatalogDrug = async (drug) => {
    const id = medicineId(drug);
    if (asBool(drug?.is_assigned) || saving || id <= 0) return;

    const name = medicineName(drug);
    const gen = genericName(drug) || name;

    setSaving(true);
    setAddingDrugId(id);
    setError('');
    setSuccess('');

    try {
      const res = await addDoctorDrug({
        providerMemberId: memberId,
        drugName: name,
        genericName: gen,
        unitPrice: 0,
      });

      if (res?.success === true) {
        setSuccess(res.message || `${name} added to your list.`);
        await loadMyMedicines();
        const searchRes = await searchDrugs({
          providerMemberId: memberId,
          search: searchQuery.trim(),
        });
        setCatalogResults(extractDrugs(searchRes));
      } else {
        setError(res?.message || 'Could not add medicine to your list.');
      }
    } catch (err) {
      setError(err?.message || 'Could not add medicine.');
    } finally {
      setSaving(false);
      setAddingDrugId(null);
    }
  };

  const handleCreateNewMedicine = async (e) => {
    e.preventDefault();
    if (saving) return;

    const name = newDrugName.trim();
    const gen = newGenericName.trim();

    if (!name) {
      setError('Medicine name is required.');
      return;
    }
    if (!gen) {
      setError('Generic name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await addDoctorDrug({
        providerMemberId: memberId,
        drugName: name,
        genericName: gen,
        unitPrice: 0,
      });

      if (res?.success === true) {
        setSuccess(
          res.message || 'Medicine saved and added to your list.'
        );
        setAddModalOpen(false);
        setNewDrugName('');
        setNewGenericName('');
        await loadMyMedicines();
        if (searchQuery.trim()) {
          const searchRes = await searchDrugs({
            providerMemberId: memberId,
            search: searchQuery.trim(),
          });
          setCatalogResults(extractDrugs(searchRes));
        }
      } else {
        setError(res?.message || 'Could not save the medicine.');
      }
    } catch (err) {
      setError(err?.message || 'Could not save the medicine.');
    } finally {
      setSaving(false);
    }
  };

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

  const showCatalog = searchQuery.trim() !== '';

  if (!memberId || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <Loader2 size={28} className="animate-spin text-emerald-700" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Loading My Medicine...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7]">
      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        doctorName={doctorName}
        doctorEmail={doctor?.email || 'Doctor Account'}
        doctorSubtitle={doctorSpeciality}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Top App Bar (Matches Screenshot 3) */}
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
                My Medicine
              </h1>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto w-full max-w-[1000px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          {/* Header Banner Card (Matches Screenshot 3) */}
          <section className="flex items-center justify-between gap-4 rounded-[22px] border border-[#e2e8e5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#f0fdf4] text-[#166534]">
                <Pill size={26} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#15251b] sm:text-xl">
                  My Medicine
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {myMedicines.length}{' '}
                  {myMedicines.length === 1 ? 'medicine' : 'medicines'} in your
                  list
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewDrugName(searchQuery.trim());
                setNewGenericName('');
                setError('');
                setAddModalOpen(true);
              }}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#166534] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#14532d]"
            >
              <Plus size={16} />
              Add
            </button>
          </section>

          {error && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>
                <X size={15} />
              </button>
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                {success}
              </span>
              <button type="button" onClick={() => setSuccess('')}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* Unified Search Bar (Matches Screenshot 3) */}
          <div className="relative mt-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all medicines or generic names"
              className="h-12 w-full rounded-2xl border border-[#e2e8e5] bg-white pl-11 pr-10 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#166534] focus:ring-4 focus:ring-emerald-500/10"
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

          {/* Medicine List / Catalog Search Results */}
          {!showCatalog ? (
            /* Doctor's Assigned Medicines List (Matches Screenshot 3) */
            myMedicines.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-[#e2e8e5] bg-white p-10 text-center shadow-sm">
                <Pill size={36} className="text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Your medicine list is empty
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Search above or click + Add to add medicines to your list.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {myMedicines.map((drug, idx) => {
                  const id = medicineId(drug);
                  const name = medicineName(drug);
                  const gen = genericName(drug);

                  return (
                    <div
                      key={id || idx}
                      className="flex items-center gap-4 rounded-[18px] border border-[#e2e8e5] bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0fdf4] text-[#166534]">
                        <Pill size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#15251b] sm:text-base">
                          {name}
                        </p>
                        {gen && (
                          <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                            {gen}
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                          Medicine ID: {id}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Global Catalog Search Results */
            <div className="mt-4">
              {searchingCatalog ? (
                <div className="flex items-center justify-center rounded-2xl border border-[#e2e8e5] bg-white py-10">
                  <Loader2
                    size={24}
                    className="animate-spin text-[#166534]"
                  />
                </div>
              ) : catalogResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e2e8e5] bg-white p-8 text-center shadow-sm">
                  <Pill size={32} className="text-slate-400" />
                  <p className="mt-2.5 text-sm font-bold text-slate-800">
                    No matching medicine in the database
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add &ldquo;{searchQuery.trim()}&rdquo; as a new medicine to
                    your list.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDrugName(searchQuery.trim());
                      setNewGenericName('');
                      setError('');
                      setAddModalOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#166534] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#14532d]"
                  >
                    <Plus size={15} />
                    Add New Medicine
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {catalogResults.map((drug, idx) => {
                    const id = medicineId(drug);
                    const name = medicineName(drug);
                    const gen = genericName(drug);
                    const assigned = asBool(drug?.is_assigned);
                    const isAddingThis = addingDrugId === id;

                    return (
                      <div
                        key={id || idx}
                        className="flex items-center justify-between gap-4 rounded-[18px] border border-[#e2e8e5] bg-white p-4 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0fdf4] text-[#166534]">
                            <Pill size={23} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#15251b] sm:text-base">
                              {name}
                            </p>
                            {gen && (
                              <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                                {gen}
                              </p>
                            )}
                            <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                              Medicine ID: {id}
                            </p>
                          </div>
                        </div>

                        {assigned ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f0fdf4] px-3 py-1.5 text-xs font-bold text-[#166534]">
                            <Check size={14} />
                            In your list
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleAssignCatalogDrug(drug)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#166534] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#14532d] disabled:opacity-60"
                          >
                            {isAddingThis ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                            Add to list
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DoctorMobileNav />
      </div>

      {/* Add Medicine Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Add Medicine
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Add a medicine to the shared catalog and assign it to your list.
            </p>

            <form onSubmit={handleCreateNewMedicine} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDrugName}
                  onChange={(e) => setNewDrugName(e.target.value)}
                  placeholder="e.g. Amoxicillin 250mg"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-[#166534]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Generic Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGenericName}
                  onChange={(e) => setNewGenericName(e.target.value)}
                  placeholder="e.g. Amoxicillin"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-[#166534]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#166534] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#14532d] disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
