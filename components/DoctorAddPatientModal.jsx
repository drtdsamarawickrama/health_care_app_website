'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Info,
  Loader2,
  UserPlus,
  X,
} from 'lucide-react';
import { doctorAddPatient } from '@/lib/api';

function calculateExactAge(dobString) {
  if (!dobString) return null;
  const parts = String(dobString)
    .trim()
    .split('-')
    .map(Number);
  if (
    parts.length !== 3 ||
    parts.some((n) => Number.isNaN(n))
  ) {
    return null;
  }
  const [year, month, day] = parts;
  const today = new Date();
  let age = today.getFullYear() - year;
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (
    currentMonth < month ||
    (currentMonth === month && currentDay < day)
  ) {
    age--;
  }
  return age;
}

export default function DoctorAddPatientModal({
  open,
  isOpen,
  onClose,
  doctorMemberId,
  onPatientCreated,
}) {
  const modalOpen = Boolean(open ?? isOpen);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] =
    useState('');
  const [gender, setGender] = useState('Male');
  const [nicNo, setNicNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] =
    useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] =
    useState(null);

  const age = useMemo(
    () => calculateExactAge(dateOfBirth),
    [dateOfBirth]
  );

  const isUnder18 =
    age !== null && age >= 0 && age < 18;

  if (!modalOpen) {
    return null;
  }

  const handleClose = () => {
    setCreatedInfo(null);
    setError('');
    onClose?.();
  };

  const handleDobChange = (value) => {
    setDateOfBirth(value);
    const nextAge = calculateExactAge(value);
    if (
      nextAge !== null &&
      nextAge >= 0 &&
      nextAge < 18
    ) {
      setNicNo('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanAddress = homeAddress.trim();
    const cleanNic = nicNo.trim().toUpperCase();

    if (!cleanName) {
      setError('Full name is required.');
      return;
    }

    if (!dateOfBirth) {
      setError('Please select date of birth.');
      return;
    }

    const todayStr = new Date()
      .toISOString()
      .split('T')[0];
    if (
      dateOfBirth > todayStr ||
      (age !== null && age < 0)
    ) {
      setError(
        'Date of birth cannot be in the future.'
      );
      return;
    }

    if (
      !['Male', 'Female', 'Other'].includes(
        gender
      )
    ) {
      setError('Please select a valid gender.');
      return;
    }

    if (!isUnder18) {
      if (!cleanNic) {
        setError(
          'NIC is required for patients 18 or older.'
        );
        return;
      }

      const validNic =
        /^([0-9]{9}[VX]|[0-9]{12})$/.test(
          cleanNic
        );
      if (!validNic) {
        setError(
          'Invalid NIC format (e.g. 983651435V or 200018501033).'
        );
        return;
      }
    }

    if (!cleanPhone) {
      setError('Mobile number is required.');
      return;
    }

    if (!/^[0-9]{9,15}$/.test(cleanPhone)) {
      setError(
        'Mobile number must be 9 to 15 digits.'
      );
      return;
    }

    if (
      cleanEmail &&
      !/^[^@]+@[^@]+\.[^@]+$/.test(cleanEmail)
    ) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    setSaving(true);

    try {
      const result = await doctorAddPatient({
        doctorMemberId,
        fullName: cleanName,
        dateOfBirth,
        gender,
        email: cleanEmail,
        phone: cleanPhone,
        homeAddress: cleanAddress,
        nicNo: isUnder18 ? '' : cleanNic,
        createMemberAccount: false,
      });

      if (!result?.success) {
        setError(
          result?.message ||
            'Failed to add patient.'
        );
        return;
      }

      const newPatient = {
        id: Number(result.patient_id),
        patient_id: Number(result.patient_id),
        member_id: result.member_id
          ? Number(result.member_id)
          : null,
        full_name: cleanName,
        nic_no: isUnder18 ? '' : cleanNic,
        date_of_birth: dateOfBirth,
        gender,
        email: cleanEmail,
        phone: cleanPhone,
        emergency_contact: cleanPhone,
        home_address: cleanAddress,
        relationship_to_user: 'Self',
      };

      setCreatedInfo({
        patient: newPatient,
        message:
          result.message ||
          'Patient added successfully',
      });

      setFullName('');
      setDateOfBirth('');
      setGender('Male');
      setNicNo('');
      setEmail('');
      setPhone('');
      setHomeAddress('');

      if (onPatientCreated) {
        await onPatientCreated({
          ...result,
          patient: newPatient,
        });
      }
    } catch (err) {
      setError(
        err?.message || 'Failed to add patient.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
              Doctor Portal
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Add New Patient
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Register a new patient record for prescriptions and clinical visits.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        {createdInfo ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2
                  size={18}
                  className="text-emerald-600"
                />
                <span>
                  {createdInfo.message}
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-800">
                Patient{' '}
                <strong>
                  {createdInfo.patient.full_name}
                </strong>{' '}
                (ID #{createdInfo.patient.patient_id}
                ) has been created and selected.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="h-11 rounded-xl bg-teal-600 px-6 text-xs font-bold text-white shadow-md hover:bg-teal-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Enter patient full name"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  max={
                    new Date()
                      .toISOString()
                      .split('T')[0]
                  }
                  value={dateOfBirth}
                  onChange={(e) =>
                    handleDobChange(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="Male">
                    Male
                  </option>
                  <option value="Female">
                    Female
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {isUnder18 ? (
                <div className="sm:col-span-2 flex items-center gap-2.5 rounded-2xl border border-teal-200 bg-teal-50/70 px-3.5 py-2.5 text-xs font-semibold text-teal-800">
                  <Info
                    size={16}
                    className="shrink-0 text-teal-600"
                  />
                  <span>
                    Under 18 ({age} yrs) — NIC is not required.
                  </span>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    NIC Number *
                  </label>
                  <input
                    type="text"
                    value={nicNo}
                    onChange={(e) =>
                      setNicNo(
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="983651435V or 200018501033"
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm uppercase text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="0771234567"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="patient@example.com"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Home Address (Optional)
              </label>
              <textarea
                rows={2}
                value={homeAddress}
                onChange={(e) =>
                  setHomeAddress(e.target.value)
                }
                placeholder="Enter residential address"
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-6 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Save Patient
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
