'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseMedical,
  CalendarDays,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Hospital,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
} from 'lucide-react';

import {
  checkDoctorProfile,
  getDoctorSpecialities,
  registerDoctorProfile,
  resolveUploadUrl,
} from '@/lib/api';

const steps = [
  {
    id: 0,
    title: 'Personal',
    description: 'Personal Information',
  },
  {
    id: 1,
    title: 'Professional',
    description: 'Professional Qualifications',
  },
  {
    id: 2,
    title: 'Documents',
    description: 'Credential Verification',
  },
];

export default function DoctorRegisterProfilePage() {
  const router = useRouter();

  // ============================================================
  // MAIN STATE
  // ============================================================

  const [currentStep, setCurrentStep] = useState(0);
  const [memberId, setMemberId] = useState(null);

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Existing profile status (if already registered)
  const [existingProfile, setExistingProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Specialities from get_doctor_specialities.php
  const [specialities, setSpecialities] = useState([]);
  const [loadingSpecialities, setLoadingSpecialities] = useState(true);
  const [specialitiesError, setSpecialitiesError] = useState('');

  // ============================================================
  // PERSONAL
  // ============================================================

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  // ============================================================
  // PROFESSIONAL
  // ============================================================

  const [medicalRegNo, setMedicalRegNo] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');
  const [qualification, setQualification] = useState('');
  const [university, setUniversity] = useState('');
  const [specialityId, setSpecialityId] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');

  // ============================================================
  // DOCUMENTS (Real File objects for multipart/form-data)
  // ============================================================

  const [degreeFile, setDegreeFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [identityFile, setIdentityFile] = useState(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ============================================================
  // LOAD SPECIALITIES + CHECK EXISTING PROFILE
  // ============================================================

  const loadSpecialities = async () => {
    setLoadingSpecialities(true);
    setSpecialitiesError('');
    try {
      const res = await getDoctorSpecialities();
      if (res?.success && Array.isArray(res.specialities)) {
        setSpecialities(res.specialities);
      } else {
        setSpecialitiesError(res?.message || 'Unable to load doctor specialities.');
      }
    } catch (err) {
      setSpecialitiesError(err?.message || 'Unable to load doctor specialities.');
    } finally {
      setLoadingSpecialities(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      const storedMemberId = localStorage.getItem('healthcare_member_id');
      const storedUserType = localStorage.getItem('healthcare_user_type');

      const parsedId = Number(storedMemberId);
      const parsedUserType = Number(storedUserType);

      if (!parsedId || parsedId <= 0 || parsedUserType !== 2) {
        router.replace('/login');
        return;
      }

      setMemberId(parsedId);

      // Pre-fill from localStorage member if available
      try {
        const storedMember = JSON.parse(localStorage.getItem('healthcare_member') || 'null');
        if (storedMember?.phone) setPhoneNumber(storedMember.phone);
        if (storedMember?.full_name) setFullName(storedMember.full_name);
        if (storedMember?.email) setEmail(storedMember.email);
      } catch {
        // ignore JSON parse error
      }

      await loadSpecialities();

      // Check if doctor already has a profile
      try {
        const checkRes = await checkDoctorProfile(parsedId);
        if (checkRes?.has_profile && checkRes?.doctor) {
          const doc = checkRes.doctor;
          setExistingProfile(doc);
          setProfileStatus(checkRes.profile_status || doc.status || 'Pending');
          setStatusMessage(checkRes.message || '');

          if (doc.full_name) setFullName(doc.full_name);
          if (doc.email) setEmail(doc.email);
          if (doc.phone_number) setPhoneNumber(doc.phone_number);
          if (doc.clinic_address) setClinicAddress(doc.clinic_address);
          if (doc.date_of_birth) setDateOfBirth(String(doc.date_of_birth).slice(0, 10));
          if (doc.gender) setGender(doc.gender);
          if (doc.medical_reg_no) setMedicalRegNo(doc.medical_reg_no);
          if (doc.medical_council) setMedicalCouncil(doc.medical_council);
          if (doc.qualification) setQualification(doc.qualification);
          if (doc.university) setUniversity(doc.university);
          if (doc.speciality_id) setSpecialityId(String(doc.speciality_id));
          if (doc.experience_years !== undefined && doc.experience_years !== null) {
            setExperienceYears(String(doc.experience_years));
          }
          if (doc.hospital_affiliation) setHospitalAffiliation(doc.hospital_affiliation);
        }
      } catch {
        // New doctor profile
      } finally {
        setLoadingPage(false);
      }
    };

    initPage();
  }, [router]);

  // ============================================================
  // STEP PROGRESS
  // ============================================================

  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep]);

  // ============================================================
  // MESSAGE HELPERS
  // ============================================================

  const showError = (message) => {
    setSuccess('');
    setError(message);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // ============================================================
  // PERSONAL VALIDATION
  // ============================================================

  const validatePersonal = () => {
    if (!fullName.trim()) {
      showError('Please enter your full name.');
      return false;
    }

    if (!email.trim()) {
      showError('Please enter your email address.');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      showError('Please enter a valid email address.');
      return false;
    }

    if (!phoneNumber.trim()) {
      showError('Please enter your contact number.');
      return false;
    }

    if (!/^[0-9+]{9,15}$/.test(phoneNumber.trim())) {
      showError('Please enter a valid contact number.');
      return false;
    }

    if (!clinicAddress.trim()) {
      showError('Please enter your clinic or home address.');
      return false;
    }

    if (!dateOfBirth) {
      showError('Please select your date of birth.');
      return false;
    }

    if (!gender) {
      showError('Please select your gender.');
      return false;
    }

    return true;
  };

  // ============================================================
  // PROFESSIONAL VALIDATION
  // ============================================================

  const validateProfessional = () => {
    if (!medicalRegNo.trim()) {
      showError('Please enter your medical registration number.');
      return false;
    }

    if (!medicalCouncil.trim()) {
      showError('Please enter your medical council.');
      return false;
    }

    if (!qualification.trim()) {
      showError('Please enter your qualification.');
      return false;
    }

    if (!university.trim()) {
      showError('Please enter your university.');
      return false;
    }

    if (!specialityId || Number(specialityId) <= 0) {
      showError('Please select your specialization from the list.');
      return false;
    }

    if (experienceYears === '') {
      showError('Please enter your years of experience.');
      return false;
    }

    const parsedExperience = Number(experienceYears);
    if (Number.isNaN(parsedExperience) || parsedExperience < 0) {
      showError('Please enter valid experience years.');
      return false;
    }

    return true;
  };

  // ============================================================
  // DOCUMENT VALIDATION
  // ============================================================

  const validateFile = (file, label) => {
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExts.includes(ext)) {
      showError(`${label}: Only PDF, JPG, JPEG, and PNG files are allowed.`);
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError(`${label}: File size must not exceed 5 MB.`);
      return false;
    }
    return true;
  };

  const validateDocuments = () => {
    if (!degreeFile) {
      showError('Please upload your Medical Degree Certificate (PDF/JPG/PNG, max 5MB).');
      return false;
    }
    if (!validateFile(degreeFile, 'Medical Degree Certificate')) {
      return false;
    }

    if (!licenseFile) {
      showError('Please upload your Medical Licensing / Registration Certificate (PDF/JPG/PNG, max 5MB).');
      return false;
    }
    if (!validateFile(licenseFile, 'Medical Licensing Certificate')) {
      return false;
    }

    if (identityFile && !validateFile(identityFile, 'Identity Document')) {
      return false;
    }

    if (!agreedToTerms) {
      showError('Please agree to the verification consent.');
      return false;
    }

    return true;
  };

  // ============================================================
  // NEXT & BACK
  // ============================================================

  const handleNext = () => {
    clearMessages();

    if (currentStep === 0) {
      if (!validatePersonal()) return;
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 1) {
      if (!validateProfessional()) return;
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    clearMessages();

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    router.back();
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    clearMessages();

    if (!memberId || memberId <= 0) {
      showError('Member session not found. Please login again.');
      return;
    }

    if (!validatePersonal()) {
      setCurrentStep(0);
      return;
    }

    if (!validateProfessional()) {
      setCurrentStep(1);
      return;
    }

    if (!validateDocuments()) {
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const selectedSpec = specialities.find(
        (s) => String(s.id) === String(specialityId)
      );

      const result = await registerDoctorProfile({
        memberId,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        clinicAddress: clinicAddress.trim(),
        dateOfBirth,
        gender,
        medicalRegNo: medicalRegNo.trim(),
        medicalCouncil: medicalCouncil.trim(),
        qualification: qualification.trim(),
        university: university.trim(),
        specialityId: Number(specialityId),
        specialization: selectedSpec?.speciality_name || '',
        experienceYears: Number(experienceYears),
        hospitalAffiliation: hospitalAffiliation.trim(),
        degreeCertificate: degreeFile,
        licenseCertificate: licenseFile,
        identityDocument: identityFile,
      });

      if (!result?.success) {
        showError(result?.message || 'Doctor registration failed.');
        return;
      }

      if (result.doctor_id) {
        localStorage.setItem('healthcare_doctor_id', String(result.doctor_id));
      }

      setSuccess(
        result.message ||
          'Doctor registration submitted successfully. Your credentials are now pending verification.'
      );

      setTimeout(() => {
        router.replace('/doctor/dashboard');
      }, 1200);
    } catch (err) {
      showError(
        err?.message ||
          'Something went wrong while submitting your registration.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingPage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafb]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={34} className="animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">
            Loading doctor registration...
          </p>
        </div>
      </main>
    );
  }

  const normalizedStatus = (profileStatus || '').toLowerCase();

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f5f8f9]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 sm:text-base">
                Where Is My Doctor
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Doctor Credential Registration
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {existingProfile && (
              <Link
                href="/doctor/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            )}
            <div
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                normalizedStatus === 'approved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : normalizedStatus === 'rejected' ||
                    normalizedStatus === 'correction required'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {profileStatus || 'Pending Setup'}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto w-full max-w-[1300px] px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
        {/* Existing Profile Status Banner */}
        {existingProfile && (
          <div
            className={`mb-7 rounded-2xl border p-5 ${
              normalizedStatus === 'approved'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                : normalizedStatus === 'rejected' ||
                  normalizedStatus === 'correction required'
                ? 'border-red-200 bg-red-50/80 text-red-900'
                : 'border-amber-200 bg-amber-50/80 text-amber-900'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold">
                    Current Verification Status: {profileStatus}
                  </p>
                  <p className="mt-1 text-xs leading-5 opacity-90">
                    {statusMessage ||
                      'You can update your profile details and re-upload your verification documents below.'}
                  </p>
                </div>
              </div>
              <Link
                href="/doctor/dashboard"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Go to Doctor Dashboard
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Heading */}
        <div className="mb-7 sm:mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            Professional Verification
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl lg:text-4xl">
            {existingProfile
              ? 'Update & Resubmit Doctor Credentials'
              : 'Complete your Doctor Profile'}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Complete your personal details, select your medical speciality, and
            upload your official SLMC / degree verification documents.
          </p>
        </div>

        {/* PROGRESS MOBILE */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                STEP {currentStep + 1} OF 3
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {steps[currentStep].description}
              </p>
            </div>
            <span className="text-sm font-bold text-teal-600">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[310px_1fr]">
          {/* DESKTOP STEPS */}
          <aside className="hidden self-start rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-[98px] lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Registration Steps
            </p>

            <div className="mt-6 space-y-3">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isComplete = currentStep > step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                      isActive
                        ? 'border-teal-200 bg-teal-50'
                        : isComplete
                        ? 'border-emerald-100 bg-emerald-50/70'
                        : 'border-transparent bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : isComplete
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-400'
                      }`}
                    >
                      {isComplete ? <Check size={19} /> : step.id + 1}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isActive
                            ? 'text-teal-800'
                            : isComplete
                            ? 'text-emerald-800'
                            : 'text-slate-700'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 rounded-2xl bg-[#07111b] p-5 text-white">
              <ShieldCheck size={24} className="text-teal-400" />
              <p className="mt-4 text-sm font-bold">Secure Verification</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Your professional credentials and uploaded certificates will be
                reviewed by the administrator before account activation.
              </p>
            </div>
          </aside>

          {/* FORM CARD */}
          <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_15px_45px_rgba(15,23,42,0.06)]">
            {/* Card header */}
            <div className="border-b border-slate-100 px-5 py-6 sm:px-8 lg:px-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  {currentStep === 0 && <UserRound size={24} />}
                  {currentStep === 1 && <Stethoscope size={24} />}
                  {currentStep === 2 && <FileCheck2 size={24} />}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
                    Step {currentStep + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                    {steps[currentStep].description}
                  </h2>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {(error || success) && (
              <div className="px-5 pt-6 sm:px-8 lg:px-10">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    <CheckCircle2 size={20} className="shrink-0" />
                    <span>{success}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP CONTENT */}
            <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
              {/* STEP 1 PERSONAL */}
              {currentStep === 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Full Name *"
                    icon={UserRound}
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Dr. A. B. Perera"
                  />

                  <Field
                    label="Email Address *"
                    icon={Mail}
                    value={email}
                    onChange={setEmail}
                    placeholder="doctor@example.com"
                    type="email"
                  />

                  <Field
                    label="Contact Number *"
                    icon={Phone}
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    placeholder="0771234567"
                    type="tel"
                  />

                  <Field
                    label="Clinic / Home Address *"
                    icon={MapPin}
                    value={clinicAddress}
                    onChange={setClinicAddress}
                    placeholder="Enter clinic or home address"
                  />

                  <Field
                    label="Date of Birth *"
                    icon={CalendarDays}
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                    type="date"
                  />

                  <SelectField
                    label="Gender *"
                    icon={UserRound}
                    value={gender}
                    onChange={setGender}
                    options={[
                      { label: 'Select Gender', value: '' },
                      { label: 'Male', value: 'Male' },
                      { label: 'Female', value: 'Female' },
                      { label: 'Other', value: 'Other' },
                    ]}
                  />
                </div>
              )}

              {/* STEP 2 PROFESSIONAL */}
              {currentStep === 1 && (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Medical Registration No *"
                    icon={IdCard}
                    value={medicalRegNo}
                    onChange={setMedicalRegNo}
                    placeholder="SLMC / Medical Reg No"
                  />

                  <Field
                    label="Medical Council *"
                    icon={BadgeCheck}
                    value={medicalCouncil}
                    onChange={setMedicalCouncil}
                    placeholder="Sri Lanka Medical Council"
                  />

                  <Field
                    label="Qualification *"
                    icon={GraduationCap}
                    value={qualification}
                    onChange={setQualification}
                    placeholder="MBBS, MD..."
                  />

                  <Field
                    label="University *"
                    icon={GraduationCap}
                    value={university}
                    onChange={setUniversity}
                    placeholder="University of Colombo"
                  />

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">
                        Specialization *
                      </label>
                      {specialitiesError && (
                        <button
                          type="button"
                          onClick={loadSpecialities}
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
                        >
                          <RefreshCw size={12} />
                          Retry
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Stethoscope
                        size={19}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        value={specialityId}
                        onChange={(e) => setSpecialityId(e.target.value)}
                        disabled={loadingSpecialities}
                        className="h-[56px] w-full appearance-none rounded-2xl border border-slate-300 bg-white pl-12 pr-10 text-[15px] text-slate-800 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
                      >
                        <option value="">
                          {loadingSpecialities
                            ? 'Loading specialities...'
                            : 'Select Specialization'}
                        </option>
                        {specialities.map((spec) => (
                          <option key={spec.id} value={String(spec.id)}>
                            {spec.speciality_name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        ▼
                      </span>
                    </div>
                    {specialitiesError && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {specialitiesError}
                      </p>
                    )}
                  </div>

                  <Field
                    label="Experience Years *"
                    icon={BriefcaseMedical}
                    value={experienceYears}
                    onChange={setExperienceYears}
                    placeholder="5"
                    type="number"
                  />

                  <div className="md:col-span-2">
                    <Field
                      label="Current Hospital Affiliation"
                      icon={Hospital}
                      value={hospitalAffiliation}
                      onChange={setHospitalAffiliation}
                      placeholder="Optional (e.g., National Hospital of Sri Lanka)"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 DOCUMENTS */}
              {currentStep === 2 && (
                <div>
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    Upload your official credential documents (PDF, JPG, JPEG,
                    or PNG, maximum 5 MB per file) for administrative
                    verification.
                  </p>

                  <div className="mt-6 grid gap-4">
                    <FileUploadCard
                      title="Medical Degree Certificate"
                      required
                      file={degreeFile}
                      existingPath={existingProfile?.degree_certificate}
                      onSelectFile={setDegreeFile}
                    />

                    <FileUploadCard
                      title="Medical Licensing / Registration Certificate"
                      required
                      file={licenseFile}
                      existingPath={existingProfile?.license_certificate}
                      onSelectFile={setLicenseFile}
                    />

                    <FileUploadCard
                      title="Identity Document (NIC / Passport)"
                      required={false}
                      file={identityFile}
                      existingPath={existingProfile?.identity_document}
                      onSelectFile={setIdentityFile}
                    />
                  </div>

                  {/* Consent */}
                  <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 accent-teal-600"
                    />
                    <span className="text-sm leading-6 text-slate-600">
                      I consent to allow the platform administration to verify
                      my licensing status directly with the Medical Council and
                      hospital administration.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5 hover:bg-teal-700"
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      {existingProfile
                        ? 'Update & Resubmit for Verification'
                        : 'Submit for Verification'}
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// FIELD COMPONENT
// ============================================================

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={type === 'number' ? '0' : undefined}
          className="h-[56px] w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-[15px] text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        />
      </div>
    </div>
  );
}

// ============================================================
// SELECT COMPONENT
// ============================================================

function SelectField({ label, icon: Icon, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
        />

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[56px] w-full appearance-none rounded-2xl border border-slate-300 bg-white pl-12 pr-10 text-[15px] text-slate-800 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          ▼
        </span>
      </div>
    </div>
  );
}

// ============================================================
// REAL FILE UPLOAD CARD
// ============================================================

function FileUploadCard({
  title,
  required = false,
  file,
  existingPath,
  onSelectFile,
}) {
  const inputRef = useRef(null);
  const uploaded = Boolean(file);
  const existingUrl = existingPath
    ? resolveUploadUrl(existingPath, 'uploads/doctors/')
    : '';

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
        uploaded
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            uploaded
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {uploaded ? <FileCheck2 size={21} /> : <Upload size={21} />}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {title}
            {required ? (
              <span className="ml-1 text-red-500">*</span>
            ) : (
              <span className="ml-2 text-xs font-normal text-slate-400">
                (Optional)
              </span>
            )}
          </p>

          <p
            className={`mt-1 truncate text-xs ${
              uploaded ? 'font-medium text-emerald-700' : 'text-slate-400'
            }`}
          >
            {uploaded
              ? `${file.name} (${formatSize(file.size)})`
              : 'PDF, JPG, JPEG, or PNG — Max 5 MB'}
          </p>

          {existingUrl && !uploaded && (
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
            >
              View previously uploaded file
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const chosen = e.target.files?.[0] || null;
            if (chosen) {
              onSelectFile(chosen);
            }
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
            uploaded
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
          }`}
        >
          {uploaded ? (
            <>
              <Check size={16} />
              Change File
            </>
          ) : (
            <>
              <Upload size={16} />
              Choose File
            </>
          )}
        </button>
      </div>
    </div>
  );
}
