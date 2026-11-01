'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  checkDoctorProfile,
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from '@/lib/api';

const AuthContext = createContext(null);

const MEMBER_KEY = 'healthcare_member';
const MEMBER_ID_KEY = 'healthcare_member_id';
const USER_TYPE_KEY = 'healthcare_user_type';
const DOCTOR_KEY = 'healthcare_doctor';
const SELECTED_PATIENT_KEY =
  'healthcare_selected_patient_id';

function readJson(key) {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const router = useRouter();

  const [hydrated, setHydrated] =
    useState(false);
  const [member, setMember] = useState(null);
  const [memberId, setMemberId] =
    useState(null);
  const [userType, setUserType] =
    useState(null);
  const [sessionToken, setSessionTokenState] =
    useState('');
  const [doctorProfile, setDoctorProfile] =
    useState(null);
  const [doctorCheck, setDoctorCheck] =
    useState(null);
  const [checkingDoctor, setCheckingDoctor] =
    useState(false);

  const syncFromStorage = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedMember = readJson(MEMBER_KEY);
    const storedDoctor = readJson(DOCTOR_KEY);
    const rawMemberId = Number(
      localStorage.getItem(MEMBER_ID_KEY) ||
        storedMember?.id ||
        0
    );
    const rawUserType = Number(
      localStorage.getItem(USER_TYPE_KEY) ||
        storedMember?.user_type ||
        0
    );
    const storedToken = getSessionToken();

    setMember(storedMember);
    setMemberId(
      rawMemberId > 0 ? rawMemberId : null
    );
    setUserType(
      rawUserType > 0 ? rawUserType : null
    );
    setSessionTokenState(storedToken);
    setDoctorProfile(storedDoctor);
    setHydrated(true);
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleStorage = () => {
      syncFromStorage();
    };

    window.addEventListener(
      'storage',
      handleStorage
    );
    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, [syncFromStorage]);

  const saveAuthSession = useCallback(
    ({
      member: nextMember,
      memberId: explicitMemberId,
      userType: explicitUserType,
      sessionToken: nextToken,
      doctor: nextDoctor = null,
    }) => {
      const resolvedMemberId = Number(
        explicitMemberId ??
          nextMember?.id ??
          0
      );
      const resolvedUserType = Number(
        explicitUserType ??
          nextMember?.user_type ??
          0
      );

      if (typeof window !== 'undefined') {
        if (nextMember) {
          localStorage.setItem(
            MEMBER_KEY,
            JSON.stringify(nextMember)
          );
        }

        if (resolvedMemberId > 0) {
          localStorage.setItem(
            MEMBER_ID_KEY,
            String(resolvedMemberId)
          );
        }

        if (resolvedUserType > 0) {
          localStorage.setItem(
            USER_TYPE_KEY,
            String(resolvedUserType)
          );
        }

        if (nextToken !== undefined) {
          setSessionToken(nextToken);
        }

        if (nextDoctor) {
          localStorage.setItem(
            DOCTOR_KEY,
            JSON.stringify(nextDoctor)
          );
        }
      }

      if (nextMember !== undefined) {
        setMember(nextMember);
      }

      if (resolvedMemberId > 0) {
        setMemberId(resolvedMemberId);
      }

      if (resolvedUserType > 0) {
        setUserType(resolvedUserType);
      }

      if (nextToken !== undefined) {
        setSessionTokenState(
          String(nextToken || '').trim()
        );
      }

      if (nextDoctor) {
        setDoctorProfile(nextDoctor);
      }
    },
    []
  );

  const updateMember = useCallback(
    (updates) => {
      setMember((prev) => {
        const next = {
          ...(prev || {}),
          ...(typeof updates === 'function'
            ? updates(prev || {})
            : updates),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            MEMBER_KEY,
            JSON.stringify(next)
          );
        }

        return next;
      });
    },
    []
  );

  const updateDoctorProfile = useCallback(
    (nextDoctor) => {
      setDoctorProfile(nextDoctor);

      if (typeof window !== 'undefined') {
        if (nextDoctor) {
          localStorage.setItem(
            DOCTOR_KEY,
            JSON.stringify(nextDoctor)
          );
        } else {
          localStorage.removeItem(DOCTOR_KEY);
        }
      }
    },
    []
  );

  const refreshDoctorStatus = useCallback(
    async (overrideMemberId = null) => {
      const targetId = Number(
        overrideMemberId ?? memberId ?? 0
      );

      if (!targetId || targetId <= 0) {
        return null;
      }

      setCheckingDoctor(true);

      try {
        const result =
          await checkDoctorProfile(targetId);

        setDoctorCheck(result);

        if (result?.doctor) {
          updateDoctorProfile(result.doctor);
        }

        return result;
      } finally {
        setCheckingDoctor(false);
      }
    },
    [memberId, updateDoctorProfile]
  );

  const logout = useCallback(
    (redirectTo = '/login') => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MEMBER_KEY);
        localStorage.removeItem(MEMBER_ID_KEY);
        localStorage.removeItem(USER_TYPE_KEY);
        localStorage.removeItem(DOCTOR_KEY);
        localStorage.removeItem(
          SELECTED_PATIENT_KEY
        );
        clearSessionToken();
      }

      setMember(null);
      setMemberId(null);
      setUserType(null);
      setSessionTokenState('');
      setDoctorProfile(null);
      setDoctorCheck(null);

      if (redirectTo) {
        router.replace(redirectTo);
      }
    },
    [router]
  );

  const value = useMemo(
    () => ({
      hydrated,
      member,
      memberId,
      userType,
      sessionToken,
      doctorProfile,
      doctorCheck,
      checkingDoctor,
      isAuthenticated:
        Boolean(memberId && memberId > 0) &&
        (userType === 1 || userType === 2),
      isPatient: userType === 1,
      isDoctor: userType === 2,
      saveAuthSession,
      updateMember,
      updateDoctorProfile,
      refreshDoctorStatus,
      syncFromStorage,
      logout,
    }),
    [
      hydrated,
      member,
      memberId,
      userType,
      sessionToken,
      doctorProfile,
      doctorCheck,
      checkingDoctor,
      saveAuthSession,
      updateMember,
      updateDoctorProfile,
      refreshDoctorStatus,
      syncFromStorage,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.'
    );
  }

  return context;
}

