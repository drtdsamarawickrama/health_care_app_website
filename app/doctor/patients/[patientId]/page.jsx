'use client';

import DoctorSidebar, {
  DoctorMobileNav,
} from '@/components/DoctorNavigation';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';
import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  Download,
  FileText,
  HeartPulse,
  Home,
  IdCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Pill,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import {
  getAllPatients,
  getPatientAppointments,
  getPrescriptions,
} from '@/lib/api';
import MedicalDocumentsSection from '@/components/MedicalDocumentsSection';
import { downloadPrescriptionPdf } from '@/lib/pdfGenerator';

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const patientId =
    Number(params?.patientId);

  const [memberId, setMemberId] =
    useState(null);

  const [patient, setPatient] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [prescriptions, setPrescriptions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // =========================================================
  // SESSION
  // =========================================================

  useEffect(() => {
    const storedMemberId =
      localStorage.getItem(
        'healthcare_member_id'
      );

    const storedUserType =
      localStorage.getItem(
        'healthcare_user_type'
      );

    const parsedMemberId =
      Number(storedMemberId);

    const parsedUserType =
      Number(storedUserType);

    if (
      !parsedMemberId ||
      parsedMemberId <= 0 ||
      parsedUserType !== 2
    ) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedMemberId);
  }, [router]);

  // =========================================================
  // LOAD PATIENT DETAILS
  // =========================================================

  useEffect(() => {
    if (
      !memberId ||
      !patientId ||
      patientId <= 0
    ) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [
          patientsResult,
          appointmentsResult,
          prescriptionsResult,
        ] = await Promise.all([
          getAllPatients(
            memberId,
            { role: 'Doctor' }
          ),

          getPatientAppointments(
            patientId
          ),

          getPrescriptions(
            patientId
          ),
        ]);

        // -----------------------------------------------
        // PATIENT
        // -----------------------------------------------

        let patientList = [];

        if (
          Array.isArray(
            patientsResult
          )
        ) {
          patientList =
            patientsResult;
        } else if (
          Array.isArray(
            patientsResult?.patients
          )
        ) {
          patientList =
            patientsResult.patients;
        } else if (
          Array.isArray(
            patientsResult?.data
          )
        ) {
          patientList =
            patientsResult.data;
        }

        const selectedPatient =
          patientList.find(
            (item) =>
              String(
                item?.id ||
                item?.patient_id
              ) ===
              String(patientId)
          );

        if (!selectedPatient) {
          setError(
            'Patient record not found.'
          );
        }

        setPatient(
          selectedPatient || null
        );

        // -----------------------------------------------
        // APPOINTMENTS
        // -----------------------------------------------

        setAppointments(
          extractArray(
            appointmentsResult,
            [
              'appointments',
              'data',
            ]
          )
        );

        // -----------------------------------------------
        // PRESCRIPTIONS
        // -----------------------------------------------

        setPrescriptions(
          extractArray(
            prescriptionsResult,
            [
              'prescriptions',
              'data',
            ]
          )
        );

      } catch (err) {
        setError(
          err?.message ||
            'Unable to load patient details.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    memberId,
    patientId,
  ]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      'healthcare_member'
    );

    localStorage.removeItem(
      'healthcare_member_id'
    );

    localStorage.removeItem(
      'healthcare_user_type'
    );

    router.replace('/login');
  };

  // =========================================================
  // PATIENT VALUES
  // =========================================================

  const patientName =
    useMemo(
      () =>
        patient?.full_name ||
        patient?.name ||
        `Patient #${patientId}`,
      [
        patient,
        patientId,
      ]
    );

  const patientInitial =
    String(
      patientName || 'P'
    )
      .trim()
      .charAt(0)
      .toUpperCase();

  // =========================================================
  // LOADING
  // =========================================================

  if (
    !memberId ||
    loading
  ) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#f4f7f8]
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >
          <Loader2
            size={32}
            className="
              animate-spin
              text-teal-600
            "
          />

          <p
            className="
              text-sm
              text-slate-500
            "
          >
            Loading patient details...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#f4f7f8]
      "
    >
      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div
        className="
          min-h-screen
          lg:pl-[270px]
        "
      >
        {/* Header */}

        <header
          className="
            sticky
            top-0
            z-40
            h-[74px]
            border-b
            border-slate-200
            bg-white/95
            backdrop-blur-xl
          "
        >
          <div
            className="
              flex
              h-full
              items-center
              justify-between
              px-4
              sm:px-6
              lg:px-8
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  lg:hidden
                "
              >
                <Menu size={20} />
              </button>

              <div>
                <p
                  className="
                    font-bold
                    text-slate-900
                  "
                >
                  Patient Details
                </p>

                <p
                  className="
                    hidden
                    text-xs
                    text-slate-500
                    sm:block
                  "
                >
                  Patient profile, appointments and prescriptions
                </p>
              </div>
            </div>

            <Link
              href="/doctor/patients"
              className="
                flex
                h-10
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-xs
                font-bold
                text-slate-600
                transition
                hover:bg-slate-50
              "
            >
              <ArrowLeft size={16} />

              <span className="hidden sm:inline">
                Back to Patients
              </span>
            </Link>
          </div>
        </header>

        {/* Content */}

        <div
          className="
            mx-auto
            w-full
            max-w-[1450px]
            px-4
            pb-28
            pt-6
            sm:px-6
            lg:px-8
            lg:pb-10
          "
        >
          {error && (
            <div
              className="
                mb-5
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          {/* =================================================
              PATIENT HERO
          ================================================== */}

          <section
            className="
              relative
              overflow-hidden
              rounded-[28px]
              bg-[#07111b]
              px-5
              py-7
              text-white
              sm:px-7
              lg:px-8
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-72
                w-72
                rounded-full
                bg-teal-400/10
                blur-[90px]
              "
            />

            <div
              className="
                relative
                z-10
                flex
                flex-col
                gap-6
                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <div
                  className="
                    flex
                    h-20
                    w-20
                    shrink-0
                    items-center
                    justify-center
                    rounded-[24px]
                    bg-gradient-to-br
                    from-teal-500
                    to-cyan-500
                    text-3xl
                    font-bold
                    text-white
                  "
                >
                  {patientInitial}
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-teal-300
                    "
                  >
                    Patient Profile
                  </p>

                  <h1
                    className="
                      mt-2
                      text-2xl
                      font-bold
                      sm:text-3xl
                    "
                  >
                    {patientName}
                  </h1>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-400
                    "
                  >
                    Patient ID #{patientId}
                  </p>
                </div>
              </div>

              <Link
                href={`/doctor/prescriptions?patientId=${patientId}`}
                className="
                  flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-teal-500
                  px-5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-teal-600
                "
              >
                <FileText size={18} />

                Create Prescription
              </Link>
            </div>
          </section>

          {/* =================================================
              PATIENT INFO
          ================================================== */}

          <section
            className="
              mt-6
              rounded-[24px]
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-teal-50
                  text-teal-600
                "
              >
                <UserRound size={21} />
              </div>

              <div>
                <h2
                  className="
                    font-bold
                    text-slate-900
                  "
                >
                  Personal Information
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Patient account details
                </p>
              </div>
            </div>

            <div
              className="
                mt-6
                grid
                gap-4
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              <InfoCard
                icon={IdCard}
                label="NIC Number"
                value={patient?.nic_no || patient?.nic}
              />

              <InfoCard
                icon={Phone}
                label="Phone Number"
                value={
                  patient?.phone ||
                  patient?.phone_number ||
                  patient?.emergency_contact
                }
              />

              <InfoCard
                icon={Mail}
                label="Email"
                value={patient?.email}
              />

              <InfoCard
                icon={MapPin}
                label="Address"
                value={
                  patient?.address ||
                  patient?.home_address
                }
              />

              <InfoCard
                icon={CalendarDays}
                label="Date of Birth"
                value={
                  patient?.date_of_birth
                }
              />

              <InfoCard
                icon={UserRound}
                label="Gender"
                value={patient?.gender}
              />

              <InfoCard
                icon={HeartPulse}
                label="Blood Group"
                value={patient?.blood_group}
              />

              <InfoCard
                icon={Stethoscope}
                label="Allergies"
                value={patient?.allergies}
              />

              <InfoCard
                icon={FileText}
                label="Existing Conditions"
                value={patient?.existing_diseases}
              />

              <InfoCard
                icon={Pill}
                label="Current Medications"
                value={patient?.current_medications}
              />
            </div>
          </section>

          {/* Medical Documents */}
          <div className="mt-6">
            <MedicalDocumentsSection
              patientId={patientId}
              patientName={patientName}
            />
          </div>

          {/* =================================================
              HISTORY GRID
          ================================================== */}

          <div
            className="
              mt-6
              grid
              gap-6
              xl:grid-cols-2
            "
          >
            {/* Appointments */}

            <section
              className="
                overflow-hidden
                rounded-[24px]
                border
                border-slate-200
                bg-white
                shadow-sm
              "
            >
              <SectionHeader
                icon={CalendarCheck2}
                title="Appointment History"
                count={appointments.length}
              />

              {appointments.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck2}
                  title="No appointments"
                  description="No appointment history is available for this patient."
                />
              ) : (
                <div
                  className="
                    divide-y
                    divide-slate-100
                  "
                >
                  {appointments.map(
                    (
                      appointment,
                      index
                    ) => (
                      <AppointmentHistoryCard
                        key={
                          appointment?.id ||
                          index
                        }
                        appointment={
                          appointment
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* Prescriptions */}

            <section
              className="
                overflow-hidden
                rounded-[24px]
                border
                border-slate-200
                bg-white
                shadow-sm
              "
            >
              <SectionHeader
                icon={Pill}
                title="Prescription History"
                count={prescriptions.length}
              />

              {prescriptions.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No prescriptions"
                  description="No prescription history is available for this patient."
                />
              ) : (
                <div
                  className="
                    divide-y
                    divide-slate-100
                  "
                >
                  {prescriptions.map(
                    (
                      prescription,
                      index
                    ) => (
                      <PrescriptionHistoryCard
                        key={
                          prescription?.id ||
                          index
                        }
                        prescription={
                          prescription
                        }
                        patientName={patientName}
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ===================================================
            MOBILE NAV
        ==================================================== */}

        <DoctorMobileNav />
      </div>
    </main>
  );
}

// ===========================================================
// HELPERS
// ===========================================================

function extractArray(
  result,
  keys
) {
  if (Array.isArray(result)) {
    return result;
  }

  if (!result) {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(result[key])) {
      return result[key];
    }
  }

  return [];
}

// ===========================================================
// SIDEBAR
// ===========================================================



// ===========================================================
// MOBILE NAV
// ===========================================================



// ===========================================================
// INFO CARD
// ===========================================================

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        rounded-2xl
        bg-slate-50
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white
          text-teal-600
          shadow-sm
        "
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-xs
            font-semibold
            text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            break-words
            text-sm
            font-bold
            text-slate-800
          "
        >
          {value || 'Not specified'}
        </p>
      </div>
    </div>
  );
}

// ===========================================================
// SECTION HEADER
// ===========================================================

function SectionHeader({
  icon: Icon,
  title,
  count,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        border-b
        border-slate-100
        px-5
        py-5
        sm:px-6
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-teal-50
            text-teal-600
          "
        >
          <Icon size={19} />
        </div>

        <h2
          className="
            font-bold
            text-slate-900
          "
        >
          {title}
        </h2>
      </div>

      <span
        className="
          rounded-full
          bg-slate-100
          px-3
          py-1
          text-xs
          font-bold
          text-slate-600
        "
      >
        {count}
      </span>
    </div>
  );
}

// ===========================================================
// APPOINTMENT HISTORY
// ===========================================================

function AppointmentHistoryCard({
  appointment,
}) {
  const status =
    appointment?.status ||
    'Pending';

  return (
    <article
      className="
        px-5
        py-5
        sm:px-6
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              font-bold
              text-slate-900
            "
          >
            {appointment?.service_type ||
              'Doctor Consultation'}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            Appointment #{appointment?.id || '-'}
          </p>
        </div>

        <StatusBadge
          status={status}
        />
      </div>

      <div
        className="
          mt-4
          grid
          gap-3
          sm:grid-cols-2
        "
      >
        <HistoryInfo
          label="Preferred Time"
          value={
            appointment?.preferred_time
          }
        />

        <HistoryInfo
          label="Urgency"
          value={
            appointment?.urgency_level
          }
        />
      </div>

      {appointment?.disease_description && (
        <div
          className="
            mt-3
            rounded-2xl
            bg-slate-50
            p-4
          "
        >
          <p
            className="
              text-xs
              font-semibold
              text-slate-400
            "
          >
            Description
          </p>

          <p
            className="
              mt-1
              text-sm
              leading-6
              text-slate-600
            "
          >
            {appointment.disease_description}
          </p>
        </div>
      )}
    </article>
  );
}

// ===========================================================
// PRESCRIPTION HISTORY
// ===========================================================

function PrescriptionHistoryCard({
  prescription,
  patientName,
}) {
  return (
    <article
      className="
        px-5
        py-5
        sm:px-6
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-teal-50
            text-teal-600
          "
        >
          <Pill size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className="
                  font-bold
                  text-slate-900
                "
              >
                {prescription?.medicine ||
                  'Medication'}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                {prescription?.created_at ||
                  prescription?.date ||
                  ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                downloadPrescriptionPdf(prescription, {
                  patientName,
                })
              }
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download size={13} />
              PDF
            </button>
          </div>

          <div
            className="
              mt-4
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <HistoryInfo
              label="Instruction"
              value={
                prescription?.instruction
              }
            />

            <HistoryInfo
              label="Duration"
              value={
                prescription?.duration
              }
            />
          </div>

          {prescription?.notes && (
            <div
              className="
                mt-3
                rounded-2xl
                bg-slate-50
                p-4
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                Notes
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                {prescription.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function HistoryInfo({
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-xl
        bg-slate-50
        p-3
      "
    >
      <p
        className="
          text-[11px]
          font-semibold
          text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xs
          font-bold
          text-slate-700
        "
      >
        {value || 'Not specified'}
      </p>
    </div>
  );
}

// ===========================================================
// STATUS
// ===========================================================

function StatusBadge({
  status,
}) {
  const normalized =
    String(status)
      .toLowerCase();

  let style =
    'bg-slate-100 text-slate-600';

  if (
    normalized === 'completed'
  ) {
    style =
      'bg-emerald-100 text-emerald-700';
  } else if (
    [
      'accepted',
      'arrived',
      'on the way',
      'in progress',
    ].includes(normalized)
  ) {
    style =
      'bg-teal-100 text-teal-700';
  } else if (
    [
      'pending',
      'requested',
    ].includes(normalized)
  ) {
    style =
      'bg-amber-100 text-amber-700';
  } else if (
    [
      'cancelled',
      'rejected',
    ].includes(normalized)
  ) {
    style =
      'bg-red-100 text-red-600';
  }

  return (
    <span
      className={`
        rounded-full
        px-2.5
        py-1
        text-[10px]
        font-bold
        ${style}
      `}
    >
      {status}
    </span>
  );
}

// ===========================================================
// EMPTY
// ===========================================================

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      className="
        flex
        min-h-[260px]
        flex-col
        items-center
        justify-center
        px-6
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-slate-100
          text-slate-400
        "
      >
        <Icon size={25} />
      </div>

      <p
        className="
          mt-4
          font-bold
          text-slate-700
        "
      >
        {title}
      </p>

      <p
        className="
          mt-2
          max-w-[300px]
          text-sm
          leading-6
          text-slate-400
        "
      >
        {description}
      </p>
    </div>
  );
}

