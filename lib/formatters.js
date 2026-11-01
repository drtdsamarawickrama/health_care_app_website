// lib/formatters.js
// Shared formatting, fallback-safe display name, status badge metadata, and upload URL helpers.

import { API_BASE_URL } from '@/lib/api';

function isMeaningfulString(value) {
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return false;
  }

  const lowered = trimmed.toLowerCase();

  return (
    lowered !== 'null' &&
    lowered !== 'undefined' &&
    lowered !== 'n/a' &&
    lowered !== 'none'
  );
}

export function cleanText(value, fallback = '') {
  return isMeaningfulString(value)
    ? String(value).trim()
    : fallback;
}

/**
 * Safely resolves a human-readable display name for any patient, doctor, or member record.
 * Never returns "null", "undefined", or an empty string.
 */
export function displayName(
  entity,
  fallback = 'User'
) {
  if (!entity) {
    return fallback;
  }

  if (typeof entity === 'string') {
    return cleanText(entity, fallback);
  }

  const nameCandidates = [
    entity.full_name,
    entity.name,
    entity.patient_name,
    entity.provider_name,
    entity.doctor_name,
  ];

  for (const candidate of nameCandidates) {
    if (isMeaningfulString(candidate)) {
      return String(candidate).trim();
    }
  }

  const patientId = Number(
    entity.patient_id ??
      (entity.relationship_to_user !== undefined ||
      entity.managed_by_member_id !== undefined
        ? entity.id
        : 0)
  );

  if (patientId > 0) {
    return `Patient #${patientId}`;
  }

  const doctorId = Number(
    entity.doctor_id ??
      (entity.medical_reg_no !== undefined ||
      entity.speciality_id !== undefined
        ? entity.id
        : 0)
  );

  if (doctorId > 0) {
    return `Doctor #${doctorId}`;
  }

  const genericId = Number(
    entity.id ?? entity.member_id ?? 0
  );

  if (genericId > 0) {
    const prefix =
      fallback && fallback !== 'User'
        ? fallback
        : Number(entity.user_type) === 2
        ? 'Doctor'
        : Number(entity.user_type) === 1
        ? 'Patient'
        : 'Member';
    return `${prefix} #${genericId}`;
  }

  const nicCandidates = [
    entity.nic_no,
    entity.nic,
  ];

  for (const nic of nicCandidates) {
    if (isMeaningfulString(nic)) {
      return String(nic).trim();
    }
  }

  const phoneCandidates = [
    entity.phone_number,
    entity.phone,
  ];

  for (const phone of phoneCandidates) {
    if (isMeaningfulString(phone)) {
      return String(phone).trim();
    }
  }

  return fallback;
}

export function formatPatientName(
  patient,
  fallback = 'Patient'
) {
  return displayName(patient, fallback);
}

export function formatDoctorName(
  doctorOrName,
  fallback = 'Doctor'
) {
  const raw = displayName(
    doctorOrName,
    fallback
  );

  if (/^dr\.?\s/i.test(raw)) {
    return raw;
  }

  return `Dr. ${raw}`;
}

export function formatCurrency(
  amount,
  { showDecimals = true, prefix = 'LKR ' } = {}
) {
  const num = Number(amount);

  if (!Number.isFinite(num)) {
    return `${prefix}0${
      showDecimals ? '.00' : ''
    }`;
  }

  return `${prefix}${num.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: showDecimals
        ? 2
        : 0,
      maximumFractionDigits: showDecimals
        ? 2
        : 0,
    }
  )}`;
}

export const formatLkr = formatCurrency;

export function formatDate(
  value,
  fallback = 'Not specified'
) {
  if (!isMeaningfulString(value)) {
    return fallback;
  }

  const str = String(value).trim();
  const parsed = new Date(
    str.includes('T')
      ? str
      : str.replace(' ', 'T')
  );

  if (Number.isNaN(parsed.getTime())) {
    return str;
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(
  value,
  fallback = 'Not specified'
) {
  if (!isMeaningfulString(value)) {
    return fallback;
  }

  const str = String(value).trim();
  const parsed = new Date(
    str.includes('T')
      ? str
      : str.replace(' ', 'T')
  );

  if (Number.isNaN(parsed.getTime())) {
    return str;
  }

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function resolveUploadUrl(
  filePath,
  defaultSubdir = 'uploads/doctors/'
) {
  if (!isMeaningfulString(filePath)) {
    return '';
  }

  const raw = String(filePath)
    .trim()
    .replace(/\\/g, '/');

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const baseRoot = String(API_BASE_URL || '')
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  const cleaned = raw.replace(/^\/+/, '');

  if (cleaned.startsWith('uploads/')) {
    return `${baseRoot}/${cleaned}`;
  }

  const prefix = String(defaultSubdir || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return prefix
    ? `${baseRoot}/${prefix}/${cleaned}`
    : `${baseRoot}/${cleaned}`;
}

export const APPOINTMENT_TIMELINE_STEPS = [
  'Requested',
  'Accepted',
  'On The Way',
  'Arrived',
  'Consultation Started',
  'Completed',
];

export function getAppointmentStatusMeta(
  status
) {
  const raw = cleanText(status, 'Requested');
  const normalized = raw.toLowerCase();

  switch (normalized) {
    case 'requested':
    case 'pending':
      return {
        label: raw,
        badgeClass:
          'bg-amber-50 text-amber-700 border-amber-200',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        dotClass: 'bg-amber-500',
        dot: 'bg-amber-500',
        stepIndex: 0,
      };
    case 'accepted':
    case 'confirmed':
      return {
        label: raw,
        badgeClass:
          'bg-blue-50 text-blue-700 border-blue-200',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        dotClass: 'bg-blue-500',
        dot: 'bg-blue-500',
        stepIndex: 1,
      };
    case 'on the way':
      return {
        label: 'On The Way',
        badgeClass:
          'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        badgeBorder: 'border-indigo-200',
        dotClass: 'bg-indigo-500',
        dot: 'bg-indigo-500',
        stepIndex: 2,
      };
    case 'arrived':
      return {
        label: 'Arrived',
        badgeClass:
          'bg-purple-50 text-purple-700 border-purple-200',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
        dotClass: 'bg-purple-500',
        dot: 'bg-purple-500',
        stepIndex: 3,
      };
    case 'consultation started':
      return {
        label: 'Consultation Started',
        badgeClass:
          'bg-teal-50 text-teal-700 border-teal-200',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        badgeBorder: 'border-teal-200',
        dotClass: 'bg-teal-500',
        dot: 'bg-teal-500',
        stepIndex: 4,
      };
    case 'completed':
      return {
        label: 'Completed',
        badgeClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        dotClass: 'bg-emerald-500',
        dot: 'bg-emerald-500',
        stepIndex: 5,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass:
          'bg-rose-50 text-rose-700 border-rose-200',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
        dotClass: 'bg-rose-500',
        dot: 'bg-rose-500',
        stepIndex: -1,
      };
    default:
      return {
        label: raw,
        badgeClass:
          'bg-slate-100 text-slate-700 border-slate-200',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-200',
        dotClass: 'bg-slate-500',
        dot: 'bg-slate-500',
        stepIndex: 0,
      };
  }
}

export function getUrgencyMeta(urgency) {
  const raw = cleanText(urgency, 'Normal');
  const normalized = raw.toLowerCase();

  if (normalized === 'emergency') {
    return {
      label: 'Emergency',
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
    };
  }

  if (normalized === 'urgent') {
    return {
      label: 'Urgent',
      badgeClass:
        'bg-amber-50 text-amber-700 border-amber-200',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
    };
  }

  return {
    label: 'Normal',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  };
}

export function getBidStatusMeta(status) {
  const raw = cleanText(status, 'Submitted');
  const normalized = raw.toLowerCase();

  if (normalized === 'accepted') {
    return {
      label: 'Accepted',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
    };
  }

  if (
    normalized === 'rejected' ||
    normalized === 'withdrawn'
  ) {
    return {
      label: raw,
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
    };
  }

  return {
    label: raw,
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  };
}

export function getInvoiceStatusMeta(status) {
  const raw = cleanText(status, 'Pending');
  const normalized = raw.toLowerCase();

  if (normalized === 'paid') {
    return {
      label: 'Paid',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      dot: 'bg-emerald-500',
    };
  }

  if (
    normalized === 'cancelled' ||
    normalized === 'refunded'
  ) {
    return {
      label: raw,
      badgeClass:
        'bg-slate-100 text-slate-600 border-slate-200',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      badgeBorder: 'border-slate-200',
      dot: 'bg-slate-400',
    };
  }

  return {
    label: 'Pending',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dot: 'bg-amber-500',
  };
}

export function getDoctorStatusMeta(status) {
  const raw = cleanText(status, 'Pending');
  const normalized = raw.toLowerCase();

  if (normalized === 'approved') {
    return {
      label: 'Approved',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (normalized === 'rejected') {
    return {
      label: 'Rejected',
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (normalized === 'correction required') {
    return {
      label: 'Correction Required',
      badgeClass:
        'bg-orange-50 text-orange-700 border-orange-200',
    };
  }

  return {
    label: raw,
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200',
  };
}
