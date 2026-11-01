'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getPatients } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

const PatientProfileContext = createContext(null);

const SELECTED_PATIENT_KEY =
  'healthcare_selected_patient_id';

function extractPatients(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.patients)) {
    return result.patients;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
}

function patientIdOf(patient) {
  return Number(
    patient?.id ?? patient?.patient_id ?? 0
  );
}

function isSelfPatient(patient, memberId) {
  const relationship = String(
    patient?.relationship_to_user ??
      patient?.relationship ??
      ''
  )
    .trim()
    .toLowerCase();

  const patientMemberId = Number(
    patient?.member_id ?? 0
  );

  return (
    relationship === 'self' ||
    (memberId > 0 &&
      patientMemberId === Number(memberId))
  );
}

function chooseDefaultPatient(
  patients,
  memberId
) {
  if (!patients.length) {
    return null;
  }

  if (typeof window !== 'undefined') {
    const storedId = Number(
      localStorage.getItem(
        SELECTED_PATIENT_KEY
      )
    );

    if (
      storedId > 0 &&
      patients.some(
        (patient) =>
          patientIdOf(patient) === storedId
      )
    ) {
      return storedId;
    }
  }

  const selfPatient =
    patients.find((patient) =>
      isSelfPatient(patient, memberId)
    ) ?? patients[0];

  return patientIdOf(selfPatient);
}

export function PatientProfileProvider({
  children,
}) {
  const {
    hydrated,
    member: authMember,
    memberId: authMemberId,
    userType: authUserType,
  } = useAuth();

  const [patients, setPatients] = useState([]);
  const [
    selectedPatientId,
    setSelectedPatientId,
  ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const resolvedMemberId = useMemo(() => {
    if (authMemberId && authMemberId > 0) {
      return authMemberId;
    }

    if (typeof window !== 'undefined') {
      const stored = Number(
        localStorage.getItem(
          'healthcare_member_id'
        )
      );
      if (stored > 0) {
        return stored;
      }
    }

    return null;
  }, [authMemberId]);

  const resolvedMember = useMemo(() => {
    if (authMember) {
      return authMember;
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(
          'healthcare_member'
        );
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    return null;
  }, [authMember]);

  const loadProfiles = useCallback(
    async (targetMemberId, preferredPatientId = null) => {
      if (!targetMemberId) {
        setLoading(false);
        return [];
      }

      setLoading(true);
      setError('');

      try {
        const result = await getPatients(
          targetMemberId
        );

        if (result?.success === false) {
          setPatients([]);
          setSelectedPatientId(null);
          setError(
            result?.message ||
              'Unable to load patient profiles.'
          );
          return [];
        }

        const list = extractPatients(result);

        setPatients(list);

        let nextSelectedId = null;

        if (
          preferredPatientId &&
          list.some(
            (p) =>
              patientIdOf(p) ===
              Number(preferredPatientId)
          )
        ) {
          nextSelectedId = Number(
            preferredPatientId
          );
        } else {
          nextSelectedId =
            chooseDefaultPatient(
              list,
              targetMemberId
            );
        }

        setSelectedPatientId(nextSelectedId);

        if (typeof window !== 'undefined') {
          if (nextSelectedId) {
            localStorage.setItem(
              SELECTED_PATIENT_KEY,
              String(nextSelectedId)
            );
          } else {
            localStorage.removeItem(
              SELECTED_PATIENT_KEY
            );
          }
        }

        return list;
      } catch (err) {
        setPatients([]);
        setSelectedPatientId(null);
        setError(
          err?.message ||
            'Unable to load patient profiles.'
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const effectiveUserType =
      authUserType ||
      Number(
        typeof window !== 'undefined'
          ? localStorage.getItem(
              'healthcare_user_type'
            )
          : 0
      );

    if (
      !resolvedMemberId ||
      resolvedMemberId <= 0 ||
      effectiveUserType !== 1
    ) {
      setLoading(false);
      return;
    }

    loadProfiles(resolvedMemberId);
  }, [
    hydrated,
    resolvedMemberId,
    authUserType,
    loadProfiles,
  ]);

  const selfPatient = useMemo(() => {
    return (
      patients.find((patient) =>
        isSelfPatient(
          patient,
          resolvedMemberId
        )
      ) ?? null
    );
  }, [patients, resolvedMemberId]);

  const isSelfProfileComplete = useMemo(() => {
    if (!selfPatient) {
      return false;
    }

    const name = String(
      selfPatient.full_name ??
        selfPatient.name ??
        ''
    ).trim();

    return (
      Boolean(name) &&
      name.toLowerCase() !== 'null'
    );
  }, [selfPatient]);

  const selectedPatient = useMemo(() => {
    return (
      patients.find(
        (patient) =>
          patientIdOf(patient) ===
          Number(selectedPatientId)
      ) ??
      selfPatient ??
      patients[0] ??
      null
    );
  }, [
    patients,
    selectedPatientId,
    selfPatient,
  ]);

  const selectPatient = useCallback(
    (patientId) => {
      const nextId = Number(patientId);

      if (
        nextId <= 0 ||
        !patients.some(
          (patient) =>
            patientIdOf(patient) === nextId
        )
      ) {
        return;
      }

      setSelectedPatientId(nextId);

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          SELECTED_PATIENT_KEY,
          String(nextId)
        );
      }
    },
    [patients]
  );

  const refreshProfiles = useCallback(
    async (preferredPatientId = null) => {
      if (resolvedMemberId) {
        return loadProfiles(
          resolvedMemberId,
          preferredPatientId
        );
      }
      return [];
    },
    [loadProfiles, resolvedMemberId]
  );

  const value = useMemo(
    () => ({
      memberId: resolvedMemberId,
      member: resolvedMember,
      patients,
      selfPatient,
      isSelfProfileComplete,
      selectedPatientId,
      selectedPatient,
      loading,
      error,
      selectPatient,
      refreshProfiles,
    }),
    [
      resolvedMemberId,
      resolvedMember,
      patients,
      selfPatient,
      isSelfProfileComplete,
      selectedPatientId,
      selectedPatient,
      loading,
      error,
      selectPatient,
      refreshProfiles,
    ]
  );

  return (
    <PatientProfileContext.Provider
      value={value}
    >
      {children}
    </PatientProfileContext.Provider>
  );
}

export function usePatientProfile() {
  const context = useContext(
    PatientProfileContext
  );

  if (!context) {
    throw new Error(
      'usePatientProfile must be used inside PatientProfileProvider.'
    );
  }

  return context;
}
