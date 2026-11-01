'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  IdCard,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { doctorAddPatient } from '@/lib/api';

export default function DoctorAddPatientModal({
  isOpen,
  onClose,
  doctorMemberId,
  onPatientCreated,
}) {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [nicNo, setNicNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculatedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }, [dateOfBirth]);

  const isChild = calculatedAge !== null && calculatedAge >= 0 && calculatedAge < 18;

  if (!isOpen) return null;

  const resetAndClose = () => {
    setFullName('');
    setDateOfBirth('');
    setGender('Male');
    setNicNo('');
    setEmail('');
    setPhone('');
    setHomeAddress('');
    setError('');
    setCreatedResult(null);
    setCopied(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!doctorMemberId || Number(doctorMemberId) <= 0) {
      setError('Doctor session not found. Please sign in again.');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }
    if (calculatedAge !== null && calculatedAge < 0) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    if (!isChild && !nicNo.trim()) {
      setError('NIC Number is required for adult patients (18+ years).');
      return;
    }
    if (nicNo.trim() && !/^([0-9]{9}[VXvx]|[0-9]{12})$/.test(nicNo.trim())) {
      setError('Invalid NIC format (use 9 digits + V/X or 12 digits).');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!homeAddress.trim()) {
      setError('Home address is required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await doctorAddPatient({
        doctorMemberId: Number(doctorMemberId),
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        nicNo: nicNo.trim().toUpperCase(),
        email: email.trim(),
        phone: phone.trim(),
        homeAddress: homeAddress.trim(),
      });

      if (!res?.success) {
        setError(res?.message || 'Failed to register patient.');
        return;
      }

      const newPatientObj = {
        id: res.patient_id,
        member_id: res.member_id,
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        gender,
        nic_no: nicNo.trim().toUpperCase() || null,
        email: email.trim(),
        phone: phone.trim(),
        emergency_contact: phone.trim(),
        home_address: homeAddress.trim(),
      };

      setCreatedResult({
        ...res,
        patient: newPatientObj,
      });

      onPatientCreated?.(newPatientObj, res);
    } catch (err) {
      setError(err?.message || 'Unable to register patient.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdResult) return;
    const text = [
      `Patient Name: ${createdResult.patient.full_name}`,
      `Phone: ${createdResult.patient.phone}`,
      `NIC: ${createdResult.patient.nic_no || 'N/A'}`,
      `Temporary Password: ${createdResult.temporary_password || 'N/A'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <UserPlus size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {createdResult ? 'Patient Registered' : 'Register New Patient'}
              </h2>
              <p className="text-xs text-slate-500">
                {createdResult
                  ? 'Patient medical record has been created in the system'
                  : 'Create a patient record (and login account if NIC is provided)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {createdResult ? (
          <div className="p-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                <div>
                  <p className="text-sm font-bold">{createdResult.message}</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Patient ID #{createdResult.patient_id} is now available for
                    prescriptions and consultations.
                  </p>
                </div>
              </div>
            </div>

            {createdResult.account_created && createdResult.temporary_password ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                <div className="flex items-center gap-2 text-amber-900">
                  <KeyRound size={18} className="text-amber-600" />
                  <p className="text-sm font-bold">
                    One-Time Patient Login Credentials
                  </p>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-amber-800">
                  Share these credentials with the patient so they can sign in
                  on the mobile app or website. The temporary password is shown
                  only once.
                </p>

                <div className="mt-4 space-y-2 rounded-xl bg-white p-4 text-xs border border-amber-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {createdResult.patient.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIC Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {createdResult.patient.nic_no}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <span className="text-slate-500">Temporary Password:</span>
                    <span className="font-mono text-sm font-extrabold text-teal-700">
                      {createdResult.temporary_password}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100/50"
                >
                  {copied ? (
                    <>
                      <Check size={15} className="text-emerald-600" />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copy Login Credentials
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                Child patient profile created without a standalone login account
                (no NIC provided).
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Full Name *
                </label>
                <div className="relative">
                  <UserRound
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Patient full name"
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Date of Birth *
                  {calculatedAge !== null && calculatedAge >= 0 && (
                    <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                      {calculatedAge} yrs ({isChild ? 'Child' : 'Adult'})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  NIC Number {isChild ? '(Optional for Child)' : '*'}
                </label>
                <div className="relative">
                  <IdCard
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={nicNo}
                    onChange={(e) => setNicNo(e.target.value.toUpperCase())}
                    placeholder={isChild ? 'Optional for < 18 yrs' : '991234567V or 200012345678'}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0771234567"
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Home Address *
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
                  />
                  <textarea
                    rows={2}
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="Enter residential address"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating Patient...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Create Patient
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

