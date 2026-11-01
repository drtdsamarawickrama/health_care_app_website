'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { PatientProfileProvider } from '@/components/PatientProfileContext';

export default function PatientLayout({
  children,
}) {
  const router = useRouter();
  const { hydrated, memberId, userType } =
    useAuth();

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!memberId || memberId <= 0) {
      router.replace('/login');
      return;
    }

    if (userType === 2) {
      router.replace('/doctor/dashboard');
    } else if (userType !== 1) {
      router.replace('/login');
    }
  }, [hydrated, memberId, userType, router]);

  return (
    <PatientProfileProvider>
      {children}
    </PatientProfileProvider>
  );
}
