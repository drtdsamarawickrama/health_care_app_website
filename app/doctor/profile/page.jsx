'use client';

import DoctorSidebar, {
  DoctorMobileNav,
} from '@/components/DoctorNavigation';
import {
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BriefcaseMedical,
  Building2,
  Edit3,
  ExternalLink,
  GraduationCap,
  IdCard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  checkDoctorProfile,
  resolveUploadUrl,
} from '@/lib/api';
import { displayName } from '@/lib/formatters';

export default function DoctorProfilePage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedMemberId = localStorage.getItem('healthcare_member_id');
    const storedUserType = localStorage.getItem('healthcare_user_type');

    const parsedMemberId = Number(storedMemberId);
    const parsedUserType = Number(storedUserType);

    if (!parsedMemberId || parsedMemberId <= 0 || parsedUserType !== 2) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedMemberId);
  }, [router]);

  useEffect(() => {
    if (!memberId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await checkDoctorProfile(memberId);
        if (res?.success !== true || res?.has_profile !== true) {
          router.replace('/doctor/register-profile');
          return;
        }
        setDoctor(res.doctor || null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [memberId, router]);

  const handleLogout = () => {
    localStorage.removeItem('healthcare_member');
    localStorage.removeItem('healthcare_member_id');
    localStorage.removeItem('healthcare_user_type');
    localStorage.removeItem('healthcare_doctor');
    localStorage.removeItem('healthcare_session_token');
    router.replace('/login');
  };

  if (!memberId || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <Loader2 size={28} className="animate-spin text-emerald-700" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Loading Professional Profile...
          </p>
        </div>
      </main>
    );
  }

  const doctorName = displayName(doctor, 'Doctor');
  const specialization =
    doctor?.speciality_name ||
    doctor?.specialization ||
    'General Practitioner';
  const slmcNo = doctor?.medical_reg_no || 'Not specified';
  const qualifications = doctor?.qualification || 'Not specified';
  const hospitalAffiliation =
    doctor?.hospital_affiliation || 'Not specified';
  const experienceYears =
    doctor?.experience_years !== undefined &&
    doctor?.experience_years !== null &&
    String(doctor.experience_years).trim() !== ''
      ? `${doctor.experience_years} Years (Active Practice)`
      : 'Not specified';

  const rawStatus = String(doctor?.status || 'Approved').trim();
  const isApproved =
    rawStatus.toLowerCase() === 'approved' ||
    rawStatus.toLowerCase() === 'verified';
  const isRejected = rawStatus.toLowerCase() === 'rejected';

  const docBadgeLabel = isApproved
    ? 'VERIFIED'
    : isRejected
    ? 'REJECTED'
    : 'PENDING';

  const credentialDocuments = [
    {
      title: 'Medical Degree Certificate',
      file: doctor?.degree_certificate || 'verified_degree.pdf',
      status: docBadgeLabel,
    },
    {
      title: 'SLMC Practicing License',
      file: doctor?.license_certificate || 'verified_license.pdf',
      status: docBadgeLabel,
    },
    ...(doctor?.identity_document
      ? [
          {
            title: 'Identity Verification Document',
            file: doctor.identity_document,
            status: docBadgeLabel,
          },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        doctorName={doctorName}
        doctorEmail={doctor?.email || 'Doctor Account'}
        doctorSubtitle={specialization}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Top App Bar (Matches Screenshot 4) */}
        <header className="sticky top-0 z-40 h-[72px] border-b border-emerald-900/10 bg-gradient-to-r from-emerald-900 to-emerald-600 text-white shadow-md">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                Professional Profile
              </h1>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3.5 text-xs font-bold text-white transition hover:bg-white/25"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto w-full max-w-[1000px] space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          {/* 1. Doctor Banner Card (Matches Screenshot 4) */}
          <section className="flex flex-col justify-between gap-4 rounded-[24px] border border-blue-100 bg-[#edf5fd] p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1976d2] text-white shadow-md">
                <BriefcaseMedical size={38} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                  {doctorName}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-slate-600">
                  {specialization}
                </p>

                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                      isApproved
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : isRejected
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    {isApproved
                      ? 'Verified Practitioner'
                      : isRejected
                      ? 'Verification Rejected'
                      : 'Verification Pending'}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/doctor/register-profile"
              className="inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-xl bg-white px-4 text-xs font-extrabold text-[#1976d2] shadow-sm transition hover:bg-blue-50 sm:self-center"
            >
              <Edit3 size={14} />
              Update Profile
            </Link>
          </section>

          {/* 2. Professional Credentials & Contact Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Professional Credentials (Matches Screenshot 4) */}
            <section>
              <h3 className="mb-3 text-base font-extrabold text-slate-900 sm:text-lg">
                Professional Credentials
              </h3>

              <div className="divide-y divide-slate-100 rounded-[22px] border border-slate-200 bg-white px-5 py-2 shadow-sm">
                <CredentialRow
                  icon={IdCard}
                  label="SLMC Reg Number"
                  value={slmcNo}
                />
                <CredentialRow
                  icon={GraduationCap}
                  label="Qualifications"
                  value={qualifications}
                />
                <CredentialRow
                  icon={Building2}
                  label="Hospital Affiliation"
                  value={hospitalAffiliation}
                />
                <CredentialRow
                  icon={BriefcaseMedical}
                  label="Experience"
                  value={experienceYears}
                />
              </div>
            </section>

            {/* Contact & Identity */}
            <section>
              <h3 className="mb-3 text-base font-extrabold text-slate-900 sm:text-lg">
                Contact &amp; Personal Details
              </h3>

              <div className="divide-y divide-slate-100 rounded-[22px] border border-slate-200 bg-white px-5 py-2 shadow-sm">
                <CredentialRow
                  icon={Mail}
                  label="Email Address"
                  value={doctor?.email || 'Not specified'}
                />
                <CredentialRow
                  icon={Phone}
                  label="Mobile Number"
                  value={
                    doctor?.phone_number || doctor?.phone || 'Not specified'
                  }
                />
                <CredentialRow
                  icon={IdCard}
                  label="NIC Number"
                  value={doctor?.nic_no || doctor?.nic || 'Not specified'}
                />
                <CredentialRow
                  icon={MapPin}
                  label="Home / Practice Address"
                  value={doctor?.home_address || 'Not specified'}
                />
              </div>
            </section>
          </div>

          {/* 3. Document Verification Status (Matches Screenshot 4) */}
          <section>
            <h3 className="mb-3 text-base font-extrabold text-slate-900 sm:text-lg">
              Document Verification Status
            </h3>

            <div className="space-y-3">
              {credentialDocuments.map((doc) => {
                const fileUrl = doc.file
                  ? resolveUploadUrl(doc.file, 'uploads/doctors/')
                  : '';

                return (
                  <div
                    key={doc.title}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900">
                        {doc.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {doc.file}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1976d2] hover:underline"
                        >
                          <ExternalLink size={13} />
                          View
                        </a>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                          doc.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : doc.status === 'REJECTED'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <DoctorMobileNav />
      </div>
    </main>
  );
}

function CredentialRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1976d2]">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-extrabold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
