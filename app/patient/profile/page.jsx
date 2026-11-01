'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import { useAuth } from '@/components/AuthContext';
import AddFamilyMemberModal from '@/components/AddFamilyMemberModal';
import MedicalDocumentsSection from '@/components/MedicalDocumentsSection';
import {
  getPrescriptions,
  registerPatient,
} from '@/lib/api';
import {
  displayName,
  formatDate,
  formatDoctorName,
} from '@/lib/formatters';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Droplets,
  Edit3,
  FileText,
  HeartPulse,
  IdCard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Pill,
  Save,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function PatientProfilePage() {
  const router = useRouter();
  const { member, memberId, logout, updateMember } = useAuth();
  const {
    patients,
    selectedPatientId,
    selectedPatient,
    selectPatient,
    reloadPatients,
    loading: profileLoading,
  } = usePatientProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Editable Medical & Personal Fields
  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [existingDiseases, setExistingDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const p = selectedPatient || {};
    setFullName(p.full_name || p.name || member?.full_name || '');
    setNic(p.nic || member?.nic || '');
    setEmail(p.email || member?.email || '');
    setPhone(p.phone || member?.phone || '');
    setHomeAddress(p.home_address || member?.address || '');
    setDob(p.date_of_birth || '');
    setGender(GENDERS.includes(p.gender) ? p.gender : 'Male');
    setBloodGroup(
      BLOOD_GROUPS.includes(p.blood_group) ? p.blood_group : 'O+'
    );
    setEmergencyContact(p.emergency_contact || p.phone || member?.phone || '');
    setExistingDiseases(p.existing_diseases || 'None');
    setAllergies(p.allergies || 'None');
    setCurrentMedications(p.current_medications || 'None');
    setSaveError('');
  }, [selectedPatient, member]);

  useEffect(() => {
    if (!selectedPatientId) return;
    getPrescriptions(selectedPatientId)
      .then((res) => {
        const list = Array.isArray(res?.prescriptions)
          ? res.prescriptions
          : Array.isArray(res)
          ? res
          : [];
        setPrescriptions(list);
      })
      .catch(() => setPrescriptions([]));
  }, [selectedPatientId]);

  const patientName = useMemo(
    () => displayName(selectedPatient || member, 'Patient'),
    [selectedPatient, member]
  );

  const patientInitial = String(patientName)
    .trim()
    .charAt(0)
    .toUpperCase();

  const relationship =
    selectedPatient?.relationship_to_user ||
    selectedPatient?.relationship ||
    'Self';

  const handleSaveMedicalProfile = async (event) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!fullName.trim()) {
      setSaveError('Full name is required.');
      return;
    }
    if (!phone.trim()) {
      setSaveError('Phone number is required.');
      return;
    }
    if (!homeAddress.trim()) {
      setSaveError('Home address is required.');
      return;
    }

    setSaving(true);
    try {
      const isSelf = relationship.toLowerCase() === 'self';
      const isChild = relationship.toLowerCase() === 'child';

      const res = await registerPatient({
        memberId: isSelf ? memberId : null,
        managedByMemberId: memberId,
        relationshipToUser: relationship,
        fullName: fullName.trim(),
        nic: isChild ? null : (nic.trim().toUpperCase() || member?.nic),
        email: email.trim() || member?.email || 'patient@healthcare.local',
        phone: phone.trim(),
        address: homeAddress.trim(),
        dob: dob || '1990-01-01',
        gender,
        bloodGroup,
        emergencyContact: emergencyContact.trim() || phone.trim(),
        diseases: existingDiseases.trim() || 'None',
        allergies: allergies.trim() || 'None',
        medications: currentMedications.trim() || 'None',
      });

      if (!res?.success) {
        setSaveError(res?.message || 'Unable to update medical profile.');
        return;
      }

      if (isSelf) {
        updateMember({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: homeAddress.trim(),
        });
      }

      await reloadPatients();
      setEditMode(false);
      setSaveSuccess('Medical & personal profile saved successfully!');
    } catch (err) {
      setSaveError(err?.message || 'Failed to save medical profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!memberId || profileLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8]">
      <PatientSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        patientName={patientName}
        patientEmail={selectedPatient?.email || member?.email || ''}
        onLogout={() => logout('/login')}
      />

      <div className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-40 h-[74px] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="font-bold text-slate-900">
                  Medical Profile & Documents
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Manage personal details, family members, clinical history & medical documents
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddFamilyOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
              >
                <UserPlus size={15} />
                Add Family Member
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1300px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {/* PROFILE HERO */}
          <section className="relative overflow-hidden rounded-[28px] bg-[#07111b] px-5 py-7 text-white sm:px-7 sm:py-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/10 blur-[90px]" />

            <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-teal-500 to-cyan-500 text-3xl font-bold text-white">
                  {patientInitial}
                </div>

                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-300">
                    <ShieldCheck size={14} />
                    {relationship} Profile
                  </span>

                  <h1 className="mt-2.5 text-2xl font-bold sm:text-3xl">
                    {patientName}
                  </h1>

                  <p className="mt-1 text-sm text-slate-400">
                    Patient ID #{selectedPatientId || '-'} • Blood Group:{' '}
                    <strong className="text-rose-300">
                      {selectedPatient?.blood_group || bloodGroup}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditMode((prev) => !prev)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-500 px-4 text-xs font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600"
                >
                  <Edit3 size={15} />
                  {editMode ? 'Cancel Editing' : 'Edit Medical Profile'}
                </button>
                <Link
                  href="/patient/complete-profile"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  Full Setup Wizard
                </Link>
              </div>
            </div>
          </section>

          {/* FAMILY PROFILES SWITCHER CARD */}
          <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <UsersRound size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Family & Dependent Profiles ({patients.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Switch active patient profile to view or manage their appointments, prescriptions, and documents
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAddFamilyOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                <UserPlus size={15} />
                + Add Family Member
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((p) => {
                const pid = Number(p?.id ?? p?.patient_id ?? 0);
                const active = pid === Number(selectedPatientId);
                const pName = displayName(p, 'Patient');
                const pRel =
                  p?.relationship_to_user || p?.relationship || 'Patient';

                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => selectPatient(pid)}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/15'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {pName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {pRel} • Blood: {p?.blood_group || 'N/A'}
                      </p>
                    </div>
                    {active && (
                      <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {saveError && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <CheckCircle2 size={17} />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* EDITABLE PERSONAL & MEDICAL PROFILE */}
          <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <HeartPulse size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Personal & Medical Record
                  </h2>
                  <p className="text-xs text-slate-500">
                    Clinical baseline shared with doctors during home visits
                  </p>
                </div>
              </div>

              {!editMode && (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 size={14} />
                  Edit Details
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleSaveMedicalProfile} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Home Address *
                    </label>
                    <input
                      type="text"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Existing Medical Conditions / Diseases
                    </label>
                    <textarea
                      rows={2}
                      value={existingDiseases}
                      onChange={(e) => setExistingDiseases(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Known Allergies
                    </label>
                    <textarea
                      rows={2}
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Current Regular Medications
                    </label>
                    <textarea
                      rows={2}
                      value={currentMedications}
                      onChange={(e) => setCurrentMedications(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        Save Profile Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ProfileCard
                    icon={UserRound}
                    label="Full Name"
                    value={patientName}
                  />
                  <ProfileCard
                    icon={Phone}
                    label="Phone Number"
                    value={selectedPatient?.phone || member?.phone}
                  />
                  <ProfileCard
                    icon={IdCard}
                    label="NIC Number"
                    value={selectedPatient?.nic || member?.nic}
                  />
                  <ProfileCard
                    icon={Mail}
                    label="Email Address"
                    value={selectedPatient?.email || member?.email}
                  />
                  <ProfileCard
                    icon={Calendar}
                    label="Date of Birth & Gender"
                    value={`${formatDate(selectedPatient?.date_of_birth)} • ${
                      selectedPatient?.gender || 'Not specified'
                    }`}
                  />
                  <ProfileCard
                    icon={Droplets}
                    label="Blood Group & Emergency Contact"
                    value={`Blood ${
                      selectedPatient?.blood_group || 'O+'
                    } • SOS: ${
                      selectedPatient?.emergency_contact ||
                      selectedPatient?.phone ||
                      'Not set'
                    }`}
                  />
                  <div className="md:col-span-2 lg:col-span-3">
                    <ProfileCard
                      icon={MapPin}
                      label="Home Visit Address"
                      value={
                        selectedPatient?.home_address || member?.address
                      }
                    />
                  </div>
                </div>

                {/* Clinical History Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Existing Conditions
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">
                      {selectedPatient?.existing_diseases || 'None reported'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                      Known Allergies
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">
                      {selectedPatient?.allergies || 'None reported'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      Current Medications
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">
                      {selectedPatient?.current_medications || 'None reported'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ACTIVE PRESCRIPTIONS SUMMARY */}
          <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Pill size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Recent Prescriptions ({prescriptions.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Medications prescribed by your visiting healthcare providers
                  </p>
                </div>
              </div>

              <Link
                href="/patient/prescriptions"
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-slate-50"
              >
                View All & Print PDF
              </Link>
            </div>

            {prescriptions.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No prescriptions recorded for this patient profile yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {prescriptions.slice(0, 4).map((rx, idx) => (
                  <div
                    key={rx?.id || rx?.prescription_id || idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {rx?.diagnosis || rx?.medicine || 'Prescription'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDoctorName(
                        rx?.provider_name || rx?.doctor_name,
                        rx?.provider_member_id
                      )}{' '}
                      • {formatDate(rx?.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* MEDICAL DOCUMENTS SECTION */}
          <div className="mt-6">
            <MedicalDocumentsSection
              patientId={selectedPatientId}
              title={`Medical Documents for ${patientName}`}
            />
          </div>

          {/* LOGOUT CARD */}
          <section className="mt-6 rounded-[24px] border border-red-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Sign Out</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  End the current patient session on this browser.
                </p>
              </div>

              <button
                type="button"
                onClick={() => logout('/login')}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-50 px-5 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </section>
        </div>

        <PatientMobileNav />
      </div>

      <AddFamilyMemberModal
        open={addFamilyOpen}
        onClose={() => setAddFamilyOpen(false)}
        onAdded={async (newId) => {
          await reloadPatients();
          if (newId > 0) selectPatient(newId);
        }}
      />
    </main>
  );
}

function ProfileCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-slate-800">
          {value || 'Not specified'}
        </p>
      </div>
    </div>
  );
}
