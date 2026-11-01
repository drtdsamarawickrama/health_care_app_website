'use client';

import { useState } from 'react';
import {
  Info,
  Loader2,
  UserPlus,
  X,
} from 'lucide-react';
import { addFamilyMember } from '@/lib/api';

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

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export default function AddFamilyMemberModal({
  open,
  onClose,
  memberId,
  onAdded,
}) {
  const [relationship, setRelationship] =
    useState('Child');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] =
    useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] =
    useState('');
  const [nicNo, setNicNo] = useState('');
  const [homeAddress, setHomeAddress] =
    useState('');
  const [
    emergencyContact,
    setEmergencyContact,
  ] = useState('');
  const [
    existingDiseases,
    setExistingDiseases,
  ] = useState('');
  const [allergies, setAllergies] =
    useState('');
  const [
    currentMedications,
    setCurrentMedications,
  ] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  const isChild = relationship === 'Child';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!relationship) {
      setError('Please select a relationship.');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!dateOfBirth) {
      setError('Please select date of birth.');
      return;
    }

    if (!gender) {
      setError('Please select gender.');
      return;
    }

    if (!homeAddress.trim()) {
      setError('Home address is required.');
      return;
    }

    if (!emergencyContact.trim()) {
      setError(
        'Emergency contact number is required.'
      );
      return;
    }

    if (!isChild && nicNo.trim()) {
      const cleanedNic = nicNo
        .trim()
        .toUpperCase();
      const validOld = /^[0-9]{9}[VX]$/.test(
        cleanedNic
      );
      const validNew = /^[0-9]{12}$/.test(
        cleanedNic
      );
      if (!validOld && !validNew) {
        setError(
          'Invalid Sri Lankan NIC format (e.g. 983651435V or 200018501033).'
        );
        return;
      }
    }

    setSaving(true);

    try {
      const result = await addFamilyMember({
        managedByMemberId: memberId,
        relationshipToUser: relationship,
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        bloodGroup,
        homeAddress: homeAddress.trim(),
        emergencyContact:
          emergencyContact.trim(),
        existingDiseases:
          existingDiseases.trim(),
        allergies: allergies.trim(),
        currentMedications:
          currentMedications.trim(),
        nicNo: isChild ? '' : nicNo.trim(),
      });

      if (!result?.success) {
        setError(
          result?.message ||
            'Failed to add family member.'
        );
        return;
      }

      const newPatientId = Number(
        result.patient_id || 0
      );

      setFullName('');
      setDateOfBirth('');
      setBloodGroup('');
      setNicNo('');
      setExistingDiseases('');
      setAllergies('');
      setCurrentMedications('');

      if (onAdded) {
        await onAdded(newPatientId);
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
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
              Family Profile
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Add Family Member
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a family member or child patient profile under your account. No separate login is needed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Relationship *
              </label>
              <select
                value={relationship}
                onChange={(e) =>
                  setRelationship(e.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

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
                placeholder="Enter full name"
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
                  setDateOfBirth(e.target.value)
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
                <option value="Male">Male</option>
                <option value="Female">
                  Female
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Blood Group (Optional)
              </label>
              <select
                value={bloodGroup}
                onChange={(e) =>
                  setBloodGroup(e.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
              >
                <option value="">
                  Select Blood Group
                </option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {isChild
                  ? 'Parent / Guardian Contact *'
                  : 'Emergency Contact *'}
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
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {!isChild && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                NIC Number (Optional)
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

          {isChild && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-800">
              <Info
                size={16}
                className="mt-0.5 shrink-0 text-teal-600"
              />
              <span>
                Child profiles do not require an NIC number, email, personal phone number, or separate login credentials.
              </span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Home Address *
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

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Medical Information (Optional)
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Existing Diseases
                </label>
                <input
                  type="text"
                  value={existingDiseases}
                  onChange={(e) =>
                    setExistingDiseases(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Asthma, Diabetes"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) =>
                    setAllergies(e.target.value)
                  }
                  placeholder="e.g. Penicillin, Peanuts"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Current Medications
                </label>
                <input
                  type="text"
                  value={currentMedications}
                  onChange={(e) =>
                    setCurrentMedications(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Inhaler, Vitamins"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
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
                  Save Family Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

