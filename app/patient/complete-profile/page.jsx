'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Droplets,
  FileText,
  HeartPulse,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import { useAuth } from '@/components/AuthContext';
import MedicalDocumentsSection from '@/components/MedicalDocumentsSection';
import { registerPatient } from '@/lib/api';

const RELATIONSHIPS = ['Self', 'Child', 'Parent', 'Spouse', 'Sibling', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientCompleteProfilePage() {
  const router = useRouter();
  const { member, memberId, updateMember } = useAuth();
  const {
    selectedPatient,
    selectedPatientId,
    reloadPatients,
    selectPatient,
  } = usePatientProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(0);

  const [relationship, setRelationship] = useState('Self');
  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');

  const [bloodGroup, setBloodGroup] = useState('A+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [diseases, setDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const selfSource = selectedPatient || member || {};
    if (selfSource.full_name && !fullName) {
      setFullName(selfSource.full_name);
    }
    if ((selfSource.nic || member?.nic) && !nic) {
      setNic(String(selfSource.nic || member?.nic || '').toUpperCase());
    }
    if ((selfSource.email || member?.email) && !email) {
      setEmail(selfSource.email || member?.email || '');
    }
    if ((selfSource.phone || member?.phone) && !phone) {
      setPhone(selfSource.phone || member?.phone || '');
    }
    if ((selfSource.home_address || member?.address) && !address) {
      setAddress(selfSource.home_address || member?.address || '');
    }
    if (selfSource.date_of_birth && !dob) {
      setDob(selfSource.date_of_birth);
    }
    if (selfSource.gender && GENDERS.includes(selfSource.gender)) {
      setGender(selfSource.gender);
    }
    if (selfSource.blood_group && BLOOD_GROUPS.includes(selfSource.blood_group)) {
      setBloodGroup(selfSource.blood_group);
    }
    if (selfSource.emergency_contact && !emergencyContact) {
      setEmergencyContact(selfSource.emergency_contact);
    }
    if (selfSource.existing_diseases && !diseases) {
      setDiseases(selfSource.existing_diseases);
    }
    if (selfSource.allergies && !allergies) {
      setAllergies(selfSource.allergies);
    }
    if (selfSource.current_medications && !medications) {
      setMedications(selfSource.current_medications);
    }
  }, [selectedPatient, member]);

  const isChild = relationship === 'Child';

  const validateStep0 = () => {
    if (!fullName.trim()) {
      setError('Full name is required.');
      return false;
    }
    if (!isChild) {
      const cleanedNic = nic.trim().toUpperCase();
      if (!cleanedNic) {
        setError('NIC number is required for adult profiles.');
        return false;
      }
      if (!/^([0-9]{9}[VX]|[0-9]{12})$/.test(cleanedNic)) {
        setError('Invalid NIC format (use 9 digits + V/X or 12 digits).');
        return false;
      }
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setError('Please enter a valid mobile number (at least 9 digits).');
      return false;
    }
    if (!address.trim()) {
      setError('Home address is required.');
      return false;
    }
    if (!dob) {
      setError('Please select your date of birth.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep1 = () => {
    if (!emergencyContact.trim() || emergencyContact.trim().length < 9) {
      setError('Emergency contact number is required (at least 9 digits).');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handlePrev = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!validateStep0() || !validateStep1()) {
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    if (!memberId) {
      setError('Member session not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const response = await registerPatient({
        memberId,
        managedByMemberId: memberId,
        relationshipToUser: relationship,
        fullName: fullName.trim(),
        nic: isChild ? null : nic.trim().toUpperCase(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        dob,
        gender,
        bloodGroup,
        emergencyContact: emergencyContact.trim(),
        diseases: diseases.trim() || 'None',
        allergies: allergies.trim() || 'None',
        medications: medications.trim() || 'None',
      });

      if (!response?.success) {
        setError(response?.message || 'Failed to save patient registration.');
        return;
      }

      const createdPatientId = Number(response?.patient_id || selectedPatientId || 0);
      if (relationship === 'Self') {
        updateMember({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          patient_id: createdPatientId || member?.patient_id,
        });
      }

      await reloadPatients();
      if (createdPatientId > 0) {
        selectPatient(createdPatientId);
      }

      setSuccess(response?.message || 'Patient profile registered successfully!');
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 900);
    } catch (err) {
      setError(err?.message || 'Unable to complete patient registration.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { index: 0, title: 'Personal Info', subtitle: 'Identity & contact details' },
    { index: 1, title: 'Medical Info', subtitle: 'Blood group & clinical notes' },
    { index: 2, title: 'Documents & Confirm', subtitle: 'Medical records & consent' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-900">
      <PatientSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen pb-24 lg:pl-[270px] lg:pb-12">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
                  Patient Onboarding
                </p>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Patient Registration & Medical Setup
                </h1>
              </div>
            </div>

            <Link
              href="/patient/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Stepper Header */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {steps.map((item) => {
              const active = step === item.index;
              const completed = step > item.index;
              return (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => {
                    if (item.index < step) setStep(item.index);
                  }}
                  className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-600/15'
                      : completed
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : completed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {completed ? <CheckCircle2 size={18} /> : item.index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{item.title}</p>
                    <p
                      className={`truncate text-xs ${
                        active ? 'text-teal-100' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
          >
            {step === 0 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 1: Personal Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Complete your personal details so doctors can identify and reach you for home visits.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Relationship to User
                    </label>
                    <div className="relative">
                      <Users
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500"
                      >
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserRound
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name"
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {!isChild && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                        NIC Number *
                      </label>
                      <div className="relative">
                        <IdCard
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={nic}
                          onChange={(e) => setNic(e.target.value.toUpperCase())}
                          placeholder="9 digits + V/X or 12 digits"
                          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm uppercase text-slate-900 outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Home Address *
                    </label>
                    <div className="relative">
                      <MapPin
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
                      />
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street address, city, landmarks for home visit"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {GENDERS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`h-11 rounded-xl border text-sm font-bold transition ${
                            gender === g
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 2: Medical Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Share your baseline medical history so visiting clinicians can prepare safe care.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Blood Group
                    </label>
                    <div className="relative">
                      <Droplets
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500"
                      />
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Emergency Contact Number *
                    </label>
                    <div className="relative">
                      <Phone
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Emergency phone number"
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Existing Diseases (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={diseases}
                      onChange={(e) => setDiseases(e.target.value)}
                      placeholder="e.g., Diabetes, Hypertension, Asthma"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Allergies (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g., Penicillin, Peanuts, Latex"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Current Medications (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="List any regular medications and dosages"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 3: Medical Documents & Confirmation
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your profile summary, optionally upload medical documents, and confirm registration.
                  </p>
                </div>

                {selectedPatientId > 0 ? (
                  <MedicalDocumentsSection
                    patientId={selectedPatientId}
                    title="Upload Past Medical Records (Optional)"
                  />
                ) : (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-900">
                    <p className="font-bold">Medical Document Uploads</p>
                    <p className="mt-1 text-xs text-teal-700">
                      Once you click <strong>Complete Registration</strong> below, your patient record is created and you can upload PDF/JPG/PNG medical documents anytime from your <strong>My Profile</strong> page.
                    </p>
                  </div>
                )}

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">
                    I confirm that the personal and medical information provided above is accurate and I agree to the{' '}
                    <strong className="text-slate-900">Terms & Conditions</strong> and{' '}
                    <strong className="text-slate-900">Privacy Policy</strong>.
                  </span>
                </label>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
              ) : (
                <div />
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving Registration...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </main>

        <PatientMobileNav />
      </div>
    </div>
  );
}

