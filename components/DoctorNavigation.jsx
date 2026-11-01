'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { displayName } from '@/lib/formatters';
import {
  CalendarCheck2,
  CircleDollarSign,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  Pill,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

const doctorMenu = [
  {
    key: 'dashboard',
    label: 'Home',
    href: '/doctor/dashboard',
    icon: Home,
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    href: '/doctor/prescriptions',
    icon: FileText,
  },
  {
    key: 'medicines',
    label: 'My Medicine',
    href: '/doctor/medicines',
    icon: Pill,
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/doctor/profile',
    icon: UserRound,
  },
];

function parseStoredJson(key) {
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


function formatDoctorName(name) {
  const value = String(name || 'Doctor').trim();

  if (/^dr\.?\s/i.test(value)) {
    return value;
  }

  return `Dr. ${value}`;
}

function isRouteActive(pathname, href) {
  if (href === '/doctor/dashboard') {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function DoctorSidebar({
  open = false,
  onClose,
  doctorName = '',
  doctorSubtitle = '',
  doctorEmail = '',
  appointmentsBadge = 0,
  onLogout,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const [storedDoctor, setStoredDoctor] = useState(null);
  const [storedMember, setStoredMember] = useState(null);

  useEffect(() => {
    setStoredDoctor(
      parseStoredJson('healthcare_doctor')
    );

    setStoredMember(
      parseStoredJson('healthcare_member')
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [open, onClose]);

  const resolvedName = displayName(
    doctorName ||
      storedDoctor ||
      storedMember,
    'Doctor'
  );

  const resolvedSubtitle =
    doctorSubtitle ||
    storedDoctor?.specialization ||
    'Medical Professional';

  const resolvedEmail =
    doctorEmail ||
    storedDoctor?.email ||
    storedMember?.email ||
    '';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    logout('/login');
  };

  const sharedProps = {
    pathname,
    doctorName: resolvedName,
    doctorSubtitle: resolvedSubtitle,
    doctorEmail: resolvedEmail,
    appointmentsBadge,
    onLogout: handleLogout,
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-50
          hidden
          w-[270px]
          flex-col
          border-r
          border-white/10
          bg-[#07111b]
          text-white
          lg:flex
        "
      >
        <SidebarBody {...sharedProps} />
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close doctor navigation"
            onClick={onClose}
            className="
              fixed
              inset-0
              z-[90]
              bg-black/55
              lg:hidden
            "
          />

          <aside
            className="
              fixed
              inset-y-0
              left-0
              z-[100]
              flex
              w-[285px]
              max-w-[88vw]
              flex-col
              border-r
              border-white/10
              bg-[#07111b]
              text-white
              shadow-2xl
              lg:hidden
            "
          >
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="
                absolute
                right-4
                top-5
                z-20
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/10
                text-white
                transition
                hover:bg-white/15
              "
            >
              <X size={18} />
            </button>

            <SidebarBody
              {...sharedProps}
              onNavigate={onClose}
              mobile
            />
          </aside>
        </>
      )}
    </>
  );
}

function SidebarBody({
  pathname,
  doctorName,
  doctorSubtitle,
  doctorEmail,
  appointmentsBadge,
  onLogout,
  onNavigate,
  mobile = false,
}) {
  const initial = String(
    doctorName || 'D'
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <div
        className="
          flex
          h-[82px]
          shrink-0
          items-center
          border-b
          border-white/10
          px-5
        "
      >
        <Link
          href="/doctor/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-teal-500
              text-white
              shadow-lg
              shadow-teal-500/20
            "
          >
            <HeartPulse size={23} />
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-[15px]
                font-bold
                text-white
              "
            >
              HealthCare Home
            </p>

            <p
              className="
                mt-0.5
                text-[11px]
                font-medium
                text-slate-400
              "
            >
              Doctor Portal
            </p>
          </div>
        </Link>
      </div>

      <div
        className="
          shrink-0
          border-b
          border-white/10
          px-5
          py-5
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-teal-500
              to-cyan-500
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-teal-500/15
            "
          >
            {initial}
          </div>

          <div className="min-w-0 pr-8">
            <p
              className="
                truncate
                text-sm
                font-bold
                text-white
              "
            >
              {formatDoctorName(doctorName)}
            </p>

            <p
              className="
                mt-1
                truncate
                text-xs
                text-slate-400
              "
            >
              {doctorSubtitle}
            </p>

            {doctorEmail && (
              <p
                className="
                  mt-0.5
                  truncate
                  text-[10px]
                  text-slate-500
                "
              >
                {doctorEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav
        className="
          flex-1
          overflow-y-auto
          px-4
          py-5
        "
        aria-label="Doctor navigation"
      >
        <p
          className="
            mb-3
            px-3
            text-[10px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-slate-500
          "
          style={{ color: '#64748b' }}
        >
          Main Menu
        </p>

        <div className="space-y-1.5">
          {doctorMenu.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              active={isRouteActive(
                pathname,
                item.href
              )}
              badge={
                item.key === 'appointments'
                  ? appointmentsBadge
                  : 0
              }
              onClick={onNavigate}
            />
          ))}
        </div>
      </nav>

      <div
        className="
          shrink-0
          border-t
          border-white/10
          p-4
        "
      >
        <button
          type="button"
          onClick={onLogout}
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            border
            border-transparent
            px-4
            py-3
            text-sm
            font-semibold
            transition
            hover:border-red-400/10
            hover:bg-red-500/10
          "
          style={{ color: '#fca5a5' }}
        >
          <LogOut
            size={19}
            style={{ color: '#fca5a5' }}
          />
          Logout
        </button>
      </div>
    </>
  );
}

function SidebarItem({
  item,
  active,
  badge = 0,
  onClick,
}) {
  const Icon = item.icon;

  const textColor = active
    ? '#5eead4'
    : '#cbd5e1';

  const iconColor = active
    ? '#5eead4'
    : '#94a3b8';

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={
        active ? 'page' : undefined
      }
      className="
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        border
        px-4
        py-3
        text-sm
        font-semibold
        outline-none
        transition-all
        duration-200
        hover:bg-white/10
        focus-visible:ring-2
        focus-visible:ring-teal-400/70
      "
      style={{
        color: textColor,
        backgroundColor: active
          ? 'rgba(20, 184, 166, 0.16)'
          : 'transparent',
        borderColor: active
          ? 'rgba(94, 234, 212, 0.20)'
          : 'transparent',
      }}
    >
      <Icon
        size={19}
        strokeWidth={active ? 2.4 : 2}
        style={{ color: iconColor }}
      />

      <span
        className="min-w-0 flex-1 truncate"
        style={{ color: textColor }}
      >
        {item.label}
      </span>

      {Number(badge) > 0 && (
        <span
          className="
            flex
            min-w-5
            items-center
            justify-center
            rounded-full
            bg-teal-500
            px-1.5
            py-0.5
            text-[10px]
            font-bold
            text-white
          "
          style={{ color: '#ffffff' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function DoctorMobileNav({
  appointmentsBadge = 0,
}) {
  const pathname = usePathname();

  const items = useMemo(
    () => [
      {
        label: 'Home',
        href: '/doctor/dashboard',
        icon: Home,
      },
      {
        label: 'Prescriptions',
        href: '/doctor/prescriptions',
        icon: FileText,
      },
      {
        label: 'My Medicine',
        href: '/doctor/medicines',
        icon: Pill,
      },
      {
        label: 'Profile',
        href: '/doctor/profile',
        icon: UserRound,
      },
    ],
    []
  );

  return (
    <nav
      className="
        fixed
        inset-x-0
        bottom-0
        z-40
        border-t
        border-slate-200
        bg-white/95
        px-2
        pb-[max(8px,env(safe-area-inset-bottom))]
        pt-2
        backdrop-blur-xl
        lg:hidden
      "
      aria-label="Doctor mobile navigation"
    >
      <div
        className="
          mx-auto
          grid
          max-w-[520px]
          grid-cols-4
        "
      >
        {items.map((item) => {
          const active = isRouteActive(
            pathname,
            item.href
          );

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                active ? 'page' : undefined
              }
              className="
                relative
                flex
                flex-col
                items-center
                justify-center
                gap-1
                rounded-xl
                py-2
                text-[10px]
                font-semibold
                transition
              "
              style={{
                color: active
                  ? '#0d9488'
                  : '#64748b',
              }}
            >
              <div className="relative">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 2}
                />

                {Number(item.badge) > 0 && (
                  <span
                    className="
                      absolute
                      -right-2
                      -top-2
                      flex
                      h-4
                      min-w-4
                      items-center
                      justify-center
                      rounded-full
                      bg-red-500
                      px-1
                      text-[8px]
                      font-bold
                      text-white
                    "
                    style={{ color: '#ffffff' }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
