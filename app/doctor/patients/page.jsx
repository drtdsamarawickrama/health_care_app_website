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
import { useRouter } from 'next/navigation';

import {
  CalendarCheck2,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import {
  getAllPatients,
} from '@/lib/api';
import DoctorAddPatientModal from '@/components/DoctorAddPatientModal';

// ============================================================
// MENU
// ============================================================



// ============================================================
// PAGE
// ============================================================

export default function DoctorPatientsPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);
  const [member, setMember] = useState(null);

  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

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

    const storedMember =
      localStorage.getItem(
        'healthcare_member'
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

    if (storedMember) {
      try {
        setMember(
          JSON.parse(storedMember)
        );
      } catch {
        setMember(null);
      }
    }
  }, [router]);

  // =========================================================
  // LOAD PATIENTS
  // =========================================================

  useEffect(() => {
    if (!memberId) {
      return;
    }

    const loadPatients = async () => {
      setLoading(true);
      setError('');

      try {
        const result =
          await getAllPatients(
            memberId,
            { role: 'Doctor' }
          );

        if (Array.isArray(result)) {
          setPatients(result);
          return;
        }

        if (
          Array.isArray(
            result?.patients
          )
        ) {
          setPatients(
            result.patients
          );
          return;
        }

        if (
          Array.isArray(
            result?.data
          )
        ) {
          setPatients(
            result.data
          );
          return;
        }

        if (
          result?.success === false
        ) {
          setError(
            result?.message ||
              'Unable to load patients.'
          );

          setPatients([]);
          return;
        }

        setPatients([]);
      } catch (err) {
        setError(
          err?.message ||
            'Unable to load patients.'
        );

        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [memberId]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredPatients =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return patients;
      }

      return patients.filter(
        (patient) => {
          const values = [
            patient?.full_name,
            patient?.name,
            patient?.phone,
            patient?.phone_number,
            patient?.emergency_contact,
            patient?.nic,
            patient?.nic_no,
            patient?.email,
            patient?.address,
            patient?.home_address,
          ];

          return values.some(
            (value) =>
              String(value || '')
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      patients,
      search,
    ]);

  // =========================================================
  // DOCTOR DETAILS
  // =========================================================

  const doctorName =
    member?.full_name ||
    member?.name ||
    'Doctor';

  const doctorEmail =
    member?.email ||
    'Doctor Account';

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
          <div
            className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-teal-50
            "
          >
            <Loader2
              size={30}
              className="
                animate-spin
                text-teal-600
              "
            />
          </div>

          <p
            className="
              text-sm
              font-medium
              text-slate-500
            "
          >
            Loading patients...
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
        doctorName={doctorName}
        doctorEmail={doctorEmail}
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
        {/* ===================================================
            HEADER
        ==================================================== */}

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
                  bg-white
                  text-slate-700
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
                  Patients
                </p>

                <p
                  className="
                    hidden
                    text-xs
                    text-slate-500
                    sm:block
                  "
                >
                  View and manage patient information
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="
                  rounded-full
                  bg-teal-50
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  text-teal-700
                "
              >
                {patients.length} Patients
              </div>

              <button
                type="button"
                onClick={() => setAddPatientOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                <UserPlus size={15} />
                <span>Register Patient</span>
              </button>
            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <div
          className="
            mx-auto
            w-full
            max-w-[1500px]
            px-4
            pb-28
            pt-6
            sm:px-6
            lg:px-8
            lg:pb-10
          "
        >
          {/* =================================================
              HERO
          ================================================== */}

          <section
            className="
              relative
              overflow-hidden
              rounded-[26px]
              bg-[#07111b]
              px-5
              py-7
              text-white
              sm:px-7
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-16
                -top-20
                h-64
                w-64
                rounded-full
                bg-teal-400/10
                blur-[80px]
              "
            />

            <div className="relative z-10">
              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-teal-300
                "
              >
                Patient Management
              </p>

              <h1
                className="
                  mt-2
                  text-2xl
                  font-bold
                  sm:text-3xl
                "
              >
                Your Patients
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                Search patient records and access
                healthcare information from one place.
              </p>
            </div>
          </section>

          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="
                mt-5
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
              SEARCH
          ================================================== */}

          <section
            className="
              mt-6
              rounded-[22px]
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              sm:p-5
            "
          >
            <div
              className="
                relative
                max-w-xl
              "
            >
              <Search
                size={19}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, NIC, phone or email..."
                className="
                  h-[52px]
                  w-full
                  rounded-2xl
                  border
                  border-slate-300
                  bg-white
                  pl-12
                  pr-4
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-teal-500
                  focus:ring-4
                  focus:ring-teal-500/10
                "
              />
            </div>
          </section>

          {/* =================================================
              PATIENT TABLE
          ================================================== */}

          <section
            className="
              mt-6
              overflow-hidden
              rounded-[24px]
              border
              border-slate-200
              bg-white
              shadow-sm
            "
          >
            {/* ===============================================
                DESKTOP TABLE
            ================================================ */}

            <div
              className="
                hidden
                md:block
              "
            >
              <div
                className="
                  overflow-x-auto
                "
              >
                <div
                  className="
                    min-w-[1050px]
                  "
                >
                  {/* Table Header */}

                  <div
                    className="
                      grid
                      grid-cols-[60px_1.5fr_1fr_1fr_1.2fr_220px]
                      items-center
                      border-b
                      border-slate-200
                      bg-slate-50
                      px-5
                      py-4
                    "
                  >
                    <TableHeading>
                      #
                    </TableHeading>

                    <TableHeading>
                      Patient
                    </TableHeading>

                    <TableHeading>
                      NIC
                    </TableHeading>

                    <TableHeading>
                      Phone
                    </TableHeading>

                    <TableHeading>
                      Email
                    </TableHeading>

                    <TableHeading>
                      Actions
                    </TableHeading>
                  </div>

                  {/* Table Body */}

                  {filteredPatients.length === 0 ? (
                    <EmptyState
                      search={search}
                    />
                  ) : (
                    filteredPatients.map(
                      (
                        patient,
                        index
                      ) => (
                        <DesktopPatientRow
                          key={
                            patient?.id ||
                            patient?.patient_id ||
                            index
                          }
                          patient={patient}
                          index={index}
                        />
                      )
                    )
                  )}
                </div>
              </div>
            </div>

            {/* ===============================================
                MOBILE LIST
            ================================================ */}

            <div className="md:hidden">
              {filteredPatients.length === 0 ? (
                <EmptyState
                  search={search}
                />
              ) : (
                filteredPatients.map(
                  (
                    patient,
                    index
                  ) => (
                    <MobilePatientRow
                      key={
                        patient?.id ||
                        patient?.patient_id ||
                        index
                      }
                      patient={patient}
                      index={index}
                    />
                  )
                )
              )}
            </div>
          </section>
        </div>

        <DoctorMobileNav />

        <DoctorAddPatientModal
          isOpen={addPatientOpen}
          onClose={() => setAddPatientOpen(false)}
          doctorMemberId={memberId}
          onPatientCreated={(newPatient) => {
            setPatients((prev) => [newPatient, ...prev]);
          }}
        />
      </div>
    </main>
  );
}

// ============================================================
// SIDEBAR CONTENT
// ============================================================



// ============================================================
// SIDEBAR ITEM
// ============================================================



// ============================================================
// TABLE HEADING
// ============================================================

function TableHeading({
  children,
}) {
  return (
    <div
      className="
        text-xs
        font-bold
        uppercase
        tracking-[0.06em]
        text-slate-500
      "
    >
      {children}
    </div>
  );
}

// ============================================================
// DESKTOP PATIENT ROW
// ============================================================

function DesktopPatientRow({
  patient,
  index,
}) {
  const patientId =
    patient?.id ||
    patient?.patient_id;

  const name =
    patient?.full_name ||
    patient?.name ||
    `Patient #${patientId || '-'}`;

  const nic =
    patient?.nic_no ||
    patient?.nic ||
    'Not specified';

  const phone =
    patient?.phone ||
    patient?.phone_number ||
    patient?.emergency_contact ||
    'Not specified';

  const email =
    patient?.email ||
    'Not specified';

  const initial =
    String(name)
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
    <div
      className="
        grid
        grid-cols-[60px_1.5fr_1fr_1fr_1.2fr_220px]
        items-center
        border-b
        border-slate-100
        px-5
        py-4
        transition-colors
        last:border-b-0
        hover:bg-slate-50
      "
    >
      {/* Number */}

      <div
        className="
          text-sm
          font-semibold
          text-slate-400
        "
      >
        {index + 1}
      </div>

      {/* Patient */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
          pr-4
        "
      >
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            font-bold
            text-white
          "
        >
          {initial}
        </div>

        <div className="min-w-0">
          <p
            className="
              truncate
              text-sm
              font-bold
              text-slate-900
            "
          >
            {name}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            Patient ID #{patientId || '-'}
          </p>
        </div>
      </div>

      {/* NIC */}

      <div
        className="
          truncate
          pr-4
          text-sm
          text-slate-600
        "
        title={nic}
      >
        {nic}
      </div>

      {/* Phone */}

      <div
        className="
          truncate
          pr-4
          text-sm
          text-slate-600
        "
        title={phone}
      >
        {phone}
      </div>

      {/* Email */}

      <div
        className="
          truncate
          pr-4
          text-sm
          text-slate-600
        "
        title={email}
      >
        {email}
      </div>

      {/* Actions */}

      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <Link
          href={`/doctor/patients/${patientId || ''}`}
          className="
            flex
            h-9
            min-w-[70px]
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-white
            px-3
            text-xs
            font-bold
            text-slate-700
            transition
            hover:border-slate-300
            hover:bg-slate-100
          "
        >
          View
        </Link>

        <Link
          href={`/doctor/prescriptions?patientId=${patientId || ''}`}
          className="
            flex
            h-9
            items-center
            justify-center
            gap-1.5
            rounded-lg
            bg-teal-600
            px-3
            text-xs
            font-bold
            text-white
            transition
            hover:bg-teal-700
          "
        >
          <FileText size={14} />

          Prescription
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// MOBILE PATIENT ROW
// ============================================================

function MobilePatientRow({
  patient,
  index,
}) {
  const patientId =
    patient?.id ||
    patient?.patient_id;

  const name =
    patient?.full_name ||
    patient?.name ||
    `Patient #${patientId || '-'}`;

  const nic =
    patient?.nic_no ||
    patient?.nic ||
    'Not specified';

  const phone =
    patient?.phone ||
    patient?.phone_number ||
    patient?.emergency_contact ||
    'Not specified';

  const email =
    patient?.email ||
    'Not specified';

  const initial =
    String(name)
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
    <article
      className="
        border-b
        border-slate-100
        p-4
        last:border-b-0
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
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            font-bold
            text-white
          "
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              font-bold
              text-slate-900
            "
          >
            {name}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            #{index + 1}
            {' • '}
            Patient ID #{patientId || '-'}
          </p>

          <div
            className="
              mt-3
              rounded-xl
              bg-slate-50
              p-3
            "
          >
            <MobileInfo
              label="NIC"
              value={nic}
            />

            <MobileInfo
              label="Phone"
              value={phone}
            />

            <MobileInfo
              label="Email"
              value={email}
            />
          </div>
        </div>
      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2
        "
      >
        <Link
          href={`/doctor/patients/${patientId || ''}`}
          className="
            flex
            h-10
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            text-xs
            font-bold
            text-slate-700
            transition
            hover:bg-slate-50
          "
        >
          View Details
        </Link>

        <Link
          href={`/doctor/prescriptions?patientId=${patientId || ''}`}
          className="
            flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-teal-600
            text-xs
            font-bold
            text-white
            transition
            hover:bg-teal-700
          "
        >
          <FileText size={14} />

          Prescription
        </Link>
      </div>
    </article>
  );
}

// ============================================================
// MOBILE INFO
// ============================================================

function MobileInfo({
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
        py-1
      "
    >
      <span
        className="
          text-xs
          font-medium
          text-slate-400
        "
      >
        {label}
      </span>

      <span
        className="
          min-w-0
          max-w-[70%]
          truncate
          text-right
          text-xs
          font-semibold
          text-slate-600
        "
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  search,
}) {
  return (
    <div
      className="
        flex
        min-h-[280px]
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
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-slate-100
          text-slate-400
        "
      >
        <UsersRound size={28} />
      </div>

      <h3
        className="
          mt-5
          font-bold
          text-slate-800
        "
      >
        {search
          ? 'No matching patients'
          : 'No patients found'}
      </h3>

      <p
        className="
          mt-2
          max-w-[320px]
          text-sm
          leading-6
          text-slate-400
        "
      >
        {search
          ? 'Try another name, NIC, phone number or email.'
          : 'Patient records will appear here when they become available.'}
      </p>
    </div>
  );
}

// ============================================================
// MOBILE NAV
// ============================================================

