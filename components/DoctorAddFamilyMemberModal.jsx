'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Info,
  Loader2,
  Search,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { doctorAddFamilyMember } from '@/lib/api';

const RELATIONSHIPS = [
  'Child',
  'Mother',
  'Father',
  'Grandmother',
  'Grandfather',
  'Spouse',
  'Brother',
  'Sister',
  'Other',
];

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

export default function DoctorAddFamilyMemberModal({
  open,
  onClose,
  doctorMemberId,
  patients = [],
  initialPatient = null,
  onFamilyMemberCreated,
}) {
  const [guardianSearch, setGuardianSearch] =
    useState('');
  const [
    selectedGuardianMemberId,
    setSelectedGuardianMemberId,
  ] = useState('');
  const [relationship, setRelationship] =
    useState('Child');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] =
    useState('');
  const [gender, setGender] = useState('Male');
  const [nicNo, setNicNo] = useState('');
  const [
    emergencyContact,
    setEmergencyContact,
  ] = useState('');
  const [homeAddress, setHomeAddress] =
    useState('');
  const [guardianConsent, setGuardianConsent] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Eligible guardians: patient rows with member_id > 0 and relationship_to_user === 'Self'
  const eligibleGuardians = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const p of patients) {
      if (!p || typeof p !== 'object') continue;
      const mId = Number(p.member_id || 0);
      const rel = String(
        p.relationship_to_user || 'Self'
      ).trim();
      if (
        mId > 0 &&
        rel === 'Self' &&
        !seen.has(mId)
      ) {
        seen.add(mId);
        list.push(p);
      }
    }
    return list;
  }, [patients]);

  const filteredGuardians = useMemo(() => {
    const q = guardianSearch
      .trim()
      .toLowerCase();
    if (!q) return eligibleGuardians;
    return eligibleGuardians.filter((g) => {
      const name = String(
        g.full_name || g.name || ''
      ).toLowerCase();
      const nic = String(
        g.nic_no || g.nic || ''
      ).toLowerCase();
      const phone = String(
        g.emergency_contact || g.phone || ''
      ).toLowerCase();
      return (
        name.includes(q) ||
        nic.includes(q) ||
        phone.includes(q)
      );
    });
  }, [eligibleGuardians, guardianSearch]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setGuardianSearch('');
    setRelationship('Child');
    setFullName('');
    setDateOfBirth('');
    setGender('Male');
    setNicNo('');
    setGuardianConsent(false);

    // Pre-select guardian if initialPatient is an eligible guardian or dependent of one
    let defaultGuardianId = 0;
    if (initialPatient) {
      const initMemberId = Number(
        initialPatient.member_id || 0
      );
      const initManagedBy = Number(
        initialPatient.managed_by_member_id || 0
      );
      const initRel = String(
        initialPatient.relationship_to_user ||
          'Self'
      ).trim();
      if (initMemberId > 0 && initRel === 'Self') {
        defaultGuardianId = initMemberId;
      } else if (initManagedBy > 0) {
        defaultGuardianId = initManagedBy;
      }
    }

    const matchedGuardian =
      eligibleGuardians.find(
        (g) =>
          Number(g.member_id) ===
          defaultGuardianId
      ) || null;

    if (matchedGuardian) {
      setSelectedGuardianMemberId(
        String(matchedGuardian.member_id)
      );
      setEmergencyContact(
        String(
          matchedGuardian.emergency_contact ||
            matchedGuardian.phone ||
            ''
        ).trim()
      );
      setHomeAddress(
        String(
          matchedGuardian.home_address ||
            matchedGuardian.address ||
            ''
        ).trim()
      );
    } else {
      setSelectedGuardianMemberId('');
      setEmergencyContact('');
      setHomeAddress('');
    }
  }, [open, initialPatient, eligibleGuardians]);

  const age = useMemo(
    () => calculateExactAge(dateOfBirth),
    [dateOfBirth]
  );

  const isUnder18 =
    age !== null && age >= 0 && age < 18;

  if (!open) {
    return null;
  }

  const handleGuardianChange = (val) => {
    setSelectedGuardianMemberId(val);
    const guardian = eligibleGuardians.find(
      (g) =>
        Number(g.member_id) === Number(val)
    );
    if (guardian) {
      if (!emergencyContact.trim()) {
        setEmergencyContact(
          String(
            guardian.emergency_contact ||
              guardian.phone ||
              ''
          ).trim()
        );
      }
      if (!homeAddress.trim()) {
        setHomeAddress(
          String(
            guardian.home_address ||
              guardian.address ||
              ''
          ).trim()
        );
      }
    }
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

    const guardianMemberId = Number(
      selectedGuardianMemberId || 0
    );
    if (guardianMemberId <= 0) {
      setError(
        'Please select a parent / guardian account.'
      );
      return;
    }

    if (
      !RELATIONSHIPS.includes(relationship)
    ) {
      setError(
        'Please select a valid relationship.'
      );
      return;
    }

    const cleanName = fullName.trim();
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

    const cleanNic = nicNo
      .trim()
      .toUpperCase();
    if (!isUnder18) {
      if (!cleanNic) {
        setError(
          'NIC is required for family members 18 or older.'
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

    if (!guardianConsent) {
      setError(
        'Please confirm parent/guardian consent.'
      );
      return;
    }

    setSaving(true);
    try {
      const cleanContact =
        emergencyContact.trim();
      const cleanAddress = homeAddress.trim();

      const result = await doctorAddFamilyMember(
        {
          doctorMemberId,
          guardianMemberId,
          relationship,
          fullName: cleanName,
          dateOfBirth,
          gender,
          nicNo: isUnder18 ? '' : cleanNic,
          homeAddress: cleanAddress,
          emergencyContact: cleanContact,
          guardianConsent: true,
        }
      );

      if (!result?.success) {
        setError(
          result?.message ||
            'Failed to add family member.'
        );
        return;
      }

      const selectedGuardian =
        eligibleGuardians.find(
          (g) =>
            Number(g.member_id) ===
            guardianMemberId
        );
      const guardianName = String(
        result.guardian_name ||
          selectedGuardian?.full_name ||
          selectedGuardian?.name ||
          ''
      ).trim();

      const newDependent = {
        id: Number(result.patient_id),
        patient_id: Number(result.patient_id),
        member_id: null,
        managed_by_member_id: Number(
          result.guardian_member_id ||
            guardianMemberId
        ),
        relationship_to_user:
          result.relationship_to_user ||
          relationship,
        guardian_name: guardianName,
        full_name: cleanName,
        nic_no: isUnder18 ? '' : cleanNic,
        date_of_birth: dateOfBirth,
        gender,
        phone: cleanContact,
        emergency_contact: cleanContact,
        home_address: cleanAddress,
      };

      if (onFamilyMemberCreated) {
        await onFamilyMemberCreated({
          ...result,
          patient: newDependent,
        });
      }

      onClose?.();
    } catch (err) {
      setError(
        err?.message ||
          'Failed to add family member.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <UsersRound size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                Doctor Portal
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900">
                Add Family Member
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Link a child or dependent patient profile under an existing parent/guardian account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        {eligibleGuardians.length === 0 ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
              No registered patient accounts available to link a family member. Please ensure the parent or guardian has a registered patient account first.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
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

            {/* Step 1: Parent / Guardian Account */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Parent / Guardian Account *
              </label>

              {eligibleGuardians.length > 5 && (
                <div className="relative mb-2">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={guardianSearch}
                    onChange={(e) =>
                      setGuardianSearch(
                        e.target.value
                      )
                    }
                    placeholder="Filter guardian by name, NIC, or phone..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <select
                value={selectedGuardianMemberId}
                onChange={(e) =>
                  handleGuardianChange(
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="">
                  Select Parent / Guardian Account
                </option>
                {filteredGuardians.map((g) => {
                  const mId = Number(g.member_id);
                  const gName =
                    g.full_name ||
                    g.name ||
                    'Patient';
                  const gPhone =
                    g.emergency_contact ||
                    g.phone ||
                    '';
                  const gNic =
                    g.nic_no || g.nic || '';
                  return (
                    <option
                      key={mId}
                      value={String(mId)}
                    >
                      {gName}
                      {gPhone
                        ? ` (${gPhone})`
                        : ''}
                      {gNic ? ` • ${gNic}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Step 2: Relationship */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Relationship to Guardian *
                </label>
                <select
                  value={relationship}
                  onChange={(e) =>
                    setRelationship(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Dependent Details */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Enter dependent full name"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
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
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
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
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
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
                <div className="sm:col-span-2 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
                  <Info
                    size={16}
                    className="shrink-0 text-emerald-600"
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
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm uppercase text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Emergency / Guardian Contact (Optional)
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) =>
                    setEmergencyContact(
                      e.target.value
                    )
                  }
                  placeholder="0771234567"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
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
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>

            {/* Step 4: Guardian Consent */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-slate-800">
              <input
                type="checkbox"
                checked={guardianConsent}
                onChange={(e) =>
                  setGuardianConsent(
                    e.target.checked
                  )
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="font-semibold leading-5">
                I confirm that the parent/guardian has consented to creating this dependent profile.
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00796B] px-6 text-xs font-bold text-white shadow-md hover:bg-[#00695C] disabled:opacity-60"
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
                    Save & Select
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

