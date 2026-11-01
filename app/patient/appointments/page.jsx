'use client';

import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Plus,
  RefreshCw,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';

import {
  acceptBid,
  completeAppointment,
  getAppointmentBids,
  getPatientAppointments,
  markAppointmentArrived,
} from '@/lib/api';

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const {
    selectedPatientId,
    selectedPatient,
    loading: profileLoading,
  } = usePatientProfile();

  const [memberId, setMemberId] = useState(null);

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  const [acceptingBidId, setAcceptingBidId] = useState(null);

  // =========================================================
  // SESSION
  // =========================================================

  useEffect(() => {
    const storedMemberId =
      localStorage.getItem('healthcare_member_id');

    const storedUserType =
      localStorage.getItem('healthcare_user_type');

    const parsedMemberId =
      Number(storedMemberId);

    const parsedUserType =
      Number(storedUserType);

    if (
      !parsedMemberId ||
      parsedMemberId <= 0 ||
      parsedUserType !== 1
    ) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedMemberId);
  }, [router]);

  // =========================================================
  // LOAD APPOINTMENTS
  // =========================================================

  const loadAppointments = async (
    refresh = false
  ) => {
    if (!memberId || !selectedPatientId) {
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const result =
        await getPatientAppointments(
          selectedPatientId
        );

      if (Array.isArray(result)) {
        setAppointments(result);
      } else if (
        Array.isArray(result?.appointments)
      ) {
        setAppointments(
          result.appointments
        );
      } else if (
        Array.isArray(result?.data)
      ) {
        setAppointments(
          result.data
        );
      } else if (
        result?.success === false
      ) {
        setError(
          result?.message ||
            'Unable to load appointments.'
        );

        setAppointments([]);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load appointments.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (memberId && selectedPatientId) {
      setSelectedAppointment(null);
      setBids([]);
      loadAppointments();
    }
  }, [memberId, selectedPatientId]);

  // =========================================================
  // LOAD BIDS
  // =========================================================

  const openAppointment = async (
    appointment
  ) => {
    setSelectedAppointment(
      appointment
    );

    setBids([]);
    setError('');
    setSuccess('');
    setLoadingBids(true);

    try {
      const appointmentId =
        Number(
          appointment?.id ||
          appointment?.appointment_id
        );

      const result =
        await getAppointmentBids(
          appointmentId
        );

      if (Array.isArray(result)) {
        setBids(result);
      } else if (
        Array.isArray(result?.bids)
      ) {
        setBids(
          result.bids
        );
      } else if (
        Array.isArray(result?.data)
      ) {
        setBids(
          result.data
        );
      } else {
        setBids([]);
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load provider offers.'
      );
    } finally {
      setLoadingBids(false);
    }
  };

  // =========================================================
  // ACCEPT BID
  // =========================================================

  const handleAcceptBid =
    async (bid) => {
      if (!selectedAppointment) {
        return;
      }

      const appointmentId =
        Number(
          selectedAppointment?.id ||
          selectedAppointment?.appointment_id
        );

      const bidId =
        Number(
          bid?.id ||
          bid?.bid_id
        );

      // Only pass providerUserId if bid comes from legacy users table (no provider_member_id)
      const legacyProviderUserId =
        !bid?.provider_member_id && bid?.provider_user_id
          ? Number(bid.provider_user_id)
          : undefined;

      if (
        !appointmentId ||
        !bidId
      ) {
        setError(
          'Invalid provider offer information.'
        );
        return;
      }

      setAcceptingBidId(
        bidId
      );

      setError('');
      setSuccess('');

      try {
        const result =
          await acceptBid({
            appointmentId,
            bidId,
            providerUserId: legacyProviderUserId,
          });

        if (!result?.success) {
          setError(
            result?.message ||
              'Unable to accept this offer.'
          );
          return;
        }

        setSuccess(
          result?.message ||
            'Provider offer accepted successfully.'
        );

        await loadAppointments(true);

        setBids((current) =>
          current.map((item) => ({
            ...item,
            accepted:
              Number(
                item?.id ||
                item?.bid_id
              ) === bidId,
          }))
        );
      } catch (err) {
        setError(
          err?.message ||
            'Something went wrong while accepting the offer.'
        );
      } finally {
        setAcceptingBidId(
          null
        );
      }
    };

  const handleMarkArrived = async (appointment) => {
    const appointmentId = Number(
      appointment?.id || appointment?.appointment_id || 0
    );
    if (!appointmentId || !selectedPatientId) return;

    setError('');
    setSuccess('');

    try {
      const res = await markAppointmentArrived({
        appointmentId,
        patientId: selectedPatientId,
      });

      if (!res?.success) {
        setError(res?.message || 'Unable to confirm provider arrival.');
        return;
      }

      setSuccess('Provider arrival confirmed! Consultation can now start.');
      await loadAppointments(true);
    } catch (err) {
      setError(err?.message || 'Failed to update arrival status.');
    }
  };

  const handleCompleteVisit = async (appointment) => {
    const appointmentId = Number(
      appointment?.id || appointment?.appointment_id || 0
    );
    if (!appointmentId || !selectedPatientId) return;

    setError('');
    setSuccess('');

    try {
      const res = await completeAppointment({
        appointmentId,
        patientId: selectedPatientId,
        completedByRole: 'Patient',
      });

      if (!res?.success) {
        setError(res?.message || 'Unable to mark visit completed.');
        return;
      }

      setSuccess('Appointment marked as Completed!');
      await loadAppointments(true);
    } catch (err) {
      setError(err?.message || 'Failed to complete appointment.');
    }
  };

  // =========================================================
  // COUNTS
  // =========================================================

  const pendingCount =
    useMemo(
      () =>
        appointments.filter(
          (item) => {
            const status =
              String(
                item?.status || ''
              ).toLowerCase();

            return [
              'pending',
              'requested',
            ].includes(status);
          }
        ).length,
      [appointments]
    );

  const activeCount =
    useMemo(
      () =>
        appointments.filter(
          (item) => {
            const status =
              String(
                item?.status || ''
              ).toLowerCase();

            return [
              'accepted',
              'on the way',
              'arrived',
              'in progress',
            ].includes(status);
          }
        ).length,
      [appointments]
    );

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

    localStorage.removeItem(
      'healthcare_selected_patient_id'
    );

    router.replace('/login');
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (
    !memberId ||
    profileLoading ||
    !selectedPatientId ||
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

          <p className="text-sm text-slate-500">
            Loading appointments...
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
      <PatientSidebar
        open={sidebarOpen}
        patientName={
          selectedPatient?.full_name ||
          selectedPatient?.name ||
          ''
        }
        onClose={() => setSidebarOpen(false)}
        appointmentsBadge={appointments.length}
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
                  Appointments
                </p>

                <p
                  className="
                    hidden
                    text-xs
                    text-slate-500
                    sm:block
                  "
                >
                  Requests, provider offers and accepted care
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                loadAppointments(true)
              }
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
              "
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>
        </header>

        {/* Content */}

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
          {/* Hero */}

          <section
            className="
              rounded-[28px]
              bg-[#07111b]
              px-5
              py-7
              text-white
              sm:px-7
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-teal-300
                  "
                >
                  Healthcare Requests
                </p>

                <h1
                  className="
                    mt-2
                    text-2xl
                    font-bold
                    sm:text-3xl
                  "
                >
                  My Appointments
                </h1>

                <p
                  className="
                    mt-2
                    max-w-2xl
                    text-sm
                    text-slate-400
                  "
                >
                  Track requests, review provider offers and manage accepted care.
                </p>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <MiniStat
                  label="Pending"
                  value={pendingCount}
                />

                <MiniStat
                  label="Active"
                  value={activeCount}
                />
              </div>
            </div>
          </section>

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

          {success && (
            <div
              className="
                mt-5
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50
                px-4
                py-3
                text-sm
                text-emerald-700
              "
            >
              <CheckCircle2 size={18} />

              {success}
            </div>
          )}

          {/* Appointment list */}

          <section
            className="
              mt-6
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {appointments.length === 0 ? (
              <div
                className="
                  md:col-span-2
                  xl:col-span-3
                "
              >
                <EmptyState />
              </div>
            ) : (
              appointments.map(
                (
                  appointment,
                  index
                ) => (
                  <AppointmentCard
                    key={
                      appointment?.id ||
                      appointment?.appointment_id ||
                      index
                    }
                    appointment={
                      appointment
                    }
                    onOpen={() =>
                      openAppointment(
                        appointment
                      )
                    }
                    onMarkArrived={() =>
                      handleMarkArrived(appointment)
                    }
                    onCompleteVisit={() =>
                      handleCompleteVisit(appointment)
                    }
                  />
                )
              )
            )}
          </section>
        </div>

        {/* Mobile bottom nav */}

        <PatientMobileNav appointmentsBadge={appointments.length} />
      </div>

      {/* =====================================================
          OFFERS MODAL
      ====================================================== */}

      {selectedAppointment && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-end
            justify-center
            bg-black/45
            backdrop-blur-sm
            sm:items-center
            sm:p-5
          "
        >
          <div
            className="
              max-h-[92vh]
              w-full
              max-w-[650px]
              overflow-y-auto
              rounded-t-[28px]
              bg-white
              p-5
              shadow-2xl
              sm:rounded-[28px]
              sm:p-7
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
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-teal-600
                  "
                >
                  Provider Offers
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    text-slate-900
                  "
                >
                  {selectedAppointment?.service_type ||
                    'Healthcare Request'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAppointment(
                    null
                  )
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                  text-slate-600
                "
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="
                mt-5
                rounded-2xl
                bg-slate-50
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <span
                  className="
                    text-sm
                    font-semibold
                    text-slate-600
                  "
                >
                  Appointment #{selectedAppointment?.id || '-'}
                </span>

                <StatusBadge
                  status={
                    selectedAppointment?.status ||
                    'Pending'
                  }
                />
              </div>
            </div>

            {loadingBids ? (
              <div
                className="
                  flex
                  min-h-[260px]
                  items-center
                  justify-center
                "
              >
                <Loader2
                  size={28}
                  className="
                    animate-spin
                    text-teal-600
                  "
                />
              </div>
            ) : bids.length === 0 ? (
              <div
                className="
                  flex
                  min-h-[260px]
                  flex-col
                  items-center
                  justify-center
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
                  <Stethoscope size={25} />
                </div>

                <p
                  className="
                    mt-4
                    font-bold
                    text-slate-700
                  "
                >
                  No provider offers yet
                </p>

                <p
                  className="
                    mt-2
                    max-w-[320px]
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  Provider offers will appear here after healthcare professionals respond.
                </p>
              </div>
            ) : (
              <div
                className="
                  mt-5
                  space-y-3
                "
              >
                {bids.map(
                  (
                    bid,
                    index
                  ) => (
                    <BidCard
                      key={
                        bid?.id ||
                        index
                      }
                      bid={bid}
                      loading={
                        Number(
                          acceptingBidId
                        ) ===
                        Number(
                          bid?.id ||
                          bid?.bid_id
                        )
                      }
                      onAccept={() =>
                        handleAcceptBid(
                          bid
                        )
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ===========================================================
// APPOINTMENT CARD
// ===========================================================

function AppointmentCard({
  appointment,
  onOpen,
  onMarkArrived,
  onCompleteVisit,
}) {
  const status =
    appointment?.status ||
    'Pending';
  const appointmentId =
    appointment?.id || appointment?.appointment_id;
  const preferredTime =
    appointment?.preferred_time ||
    [appointment?.appointment_date, appointment?.appointment_time]
      .filter(Boolean)
      .join(' ');
  const isEnRoute = ['Accepted', 'On The Way'].includes(status);
  const isInVisit = ['Arrived', 'Consultation Started'].includes(status);

  return (
    <article
      className="
        rounded-[24px]
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:border-teal-200
        hover:shadow-md
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
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
          <Stethoscope size={21} />
        </div>

        <StatusBadge
          status={status}
        />
      </div>

      <h2
        className="
          mt-5
          font-bold
          text-slate-900
        "
      >
        {appointment?.service_type ||
          'Healthcare Service'}
      </h2>

      <p
        className="
          mt-1
          text-sm
          text-slate-500
        "
      >
        {appointment?.disease_description ||
          'No description provided'}
      </p>

      <div
        className="
          mt-5
          space-y-3
          rounded-2xl
          bg-slate-50
          p-4
        "
      >
        <InfoLine
          label="Urgency"
          value={
            appointment?.urgency_level
          }
        />

        <InfoLine
          label="Preferred Time"
          value={
            preferredTime
          }
        />

        {appointment?.provider_name && (
          <InfoLine
            label="Assigned Doctor"
            value={appointment.provider_name}
          />
        )}

        <InfoLine
          label="Appointment ID"
          value={`#${appointmentId || '-'}`}
        />
      </div>

      <div className="mt-5 space-y-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="
            flex
            h-11
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-teal-600
            text-sm
            font-bold
            text-white
            transition
            hover:bg-teal-700
          "
        >
          View Provider Offers
          <ChevronRight size={16} />
        </button>

        {(isEnRoute || isInVisit) && (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/patient/tracking?appointmentId=${appointmentId}`}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-teal-800 transition hover:bg-teal-100"
            >
              <Navigation size={14} />
              Track Live
            </Link>

            {isEnRoute && (
              <button
                type="button"
                onClick={onMarkArrived}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-xs font-bold text-white transition hover:bg-amber-600"
              >
                <MapPin size={14} />
                Confirm Arrived
              </button>
            )}

            {isInVisit && (
              <button
                type="button"
                onClick={onCompleteVisit}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={14} />
                Complete Visit
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ===========================================================
// BID CARD
// ===========================================================

function BidCard({
  bid,
  loading,
  onAccept,
}) {
  const providerName =
    bid?.provider_name ||
    bid?.doctor_name ||
    `Provider #${
      bid?.provider_user_id ||
      bid?.provider_id ||
      '-'
    }`;

  const fee =
    bid?.proposed_fee ??
    bid?.amount ??
    '-';

  return (
    <article
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
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
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-teal-50
            text-teal-600
          "
        >
          <Stethoscope size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              font-bold
              text-slate-900
            "
          >
            {providerName}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            Healthcare Provider
          </p>
        </div>

        <div className="text-right">
          <p
            className="
              text-xs
              text-slate-400
            "
          >
            Fee
          </p>

          <p
            className="
              mt-1
              font-bold
              text-teal-700
            "
          >
            Rs. {fee}
          </p>
        </div>
      </div>

      {bid?.estimated_arrival_time && (
        <div
          className="
            mt-4
            flex
            items-center
            gap-2
            rounded-xl
            bg-slate-50
            p-3
            text-xs
            text-slate-600
          "
        >
          <Clock3 size={15} />

          Estimated arrival:
          {' '}
          <strong>
            {bid.estimated_arrival_time}
          </strong>
        </div>
      )}

      {(bid?.provider_note ||
        bid?.message) && (
        <div
          className="
            mt-3
            rounded-xl
            bg-slate-50
            p-3
          "
        >
          <p
            className="
              text-xs
              leading-5
              text-slate-600
            "
          >
            {bid?.provider_note ||
              bid?.message}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onAccept}
        disabled={loading}
        className="
          mt-4
          flex
          h-11
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-teal-600
          text-sm
          font-bold
          text-white
          transition
          hover:bg-teal-700
          disabled:opacity-60
        "
      >
        {loading ? (
          <>
            <Loader2
              size={17}
              className="animate-spin"
            />

            Accepting...
          </>
        ) : (
          <>
            <CheckCircle2 size={17} />

            Accept Offer
          </>
        )}
      </button>
    </article>
  );
}

// ===========================================================
// HELPERS
// ===========================================================

function InfoLine({
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
      "
    >
      <span
        className="
          text-xs
          text-slate-400
        "
      >
        {label}
      </span>

      <span
        className="
          max-w-[60%]
          text-right
          text-xs
          font-bold
          text-slate-700
        "
      >
        {value || 'Not specified'}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  const value =
    String(status)
      .toLowerCase();

  let style =
    'bg-slate-100 text-slate-600';

  if (
    value === 'completed'
  ) {
    style =
      'bg-emerald-100 text-emerald-700';
  } else if (
    [
      'accepted',
      'on the way',
      'arrived',
      'in progress',
    ].includes(value)
  ) {
    style =
      'bg-teal-100 text-teal-700';
  } else if (
    [
      'pending',
      'requested',
    ].includes(value)
  ) {
    style =
      'bg-amber-100 text-amber-700';
  } else if (
    [
      'cancelled',
      'rejected',
    ].includes(value)
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

function MiniStat({
  label,
  value,
}) {
  return (
    <div
      className="
        min-w-[110px]
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-4
      "
    >
      <p
        className="
          text-2xl
          font-bold
          text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-xs
          text-slate-400
        "
      >
        {label}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="
        flex
        min-h-[320px]
        flex-col
        items-center
        justify-center
        rounded-[24px]
        border
        border-slate-200
        bg-white
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
        <CalendarCheck2
          size={28}
        />
      </div>

      <p
        className="
          mt-5
          font-bold
          text-slate-800
        "
      >
        No appointments yet
      </p>

      <p
        className="
          mt-2
          max-w-[320px]
          text-sm
          leading-6
          text-slate-400
        "
      >
        Create a healthcare request to begin receiving provider offers.
      </p>

      <Link
        href="/patient/request-care"
        className="
          mt-5
          flex
          h-11
          items-center
          gap-2
          rounded-xl
          bg-teal-600
          px-5
          text-sm
          font-bold
          text-white
        "
      >
        <Plus size={17} />
        Request Care
      </Link>
    </div>
  );
}



