'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function DoctorLayout({
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

    if (userType === 1) {
      router.replace('/patient/dashboard');
    } else if (userType !== 2) {
      router.replace('/login');
    }
  }, [hydrated, memberId, userType, router]);

  return <>{children}</>;
}

