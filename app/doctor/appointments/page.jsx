'use client';

import DoctorSidebar, {
  DoctorMobileNav,
} from '@/components/DoctorNavigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageSquareText,
  Play,
  Receipt,
  RefreshCw,
  Send,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import {
  createInvoice,
  getAvailableAppointments,
  getProviderAppointments,
  startConsultation,
  submitBid,
} from '@/lib/api';
import DoctorConsultationModal from '@/components/DoctorConsultationModal';

export default function DoctorAppointmentsPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);

  const [available, setAvailable] =
    useState([]);

  const [myAppointments, setMyAppointments] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState('available');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [bidAmount, setBidAmount] =
    useState('');

  const [bidMessage, setBidMessage] =
    useState('');

  const [bidEta, setBidEta] =
    useState('');

  const [submittingBid, setSubmittingBid] =
    useState(false);

  const [doctorName, setDoctorName] = useState('Doctor');
  const [consultationAppointment, setConsultationAppointment] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

    try {
      const storedMember = JSON.parse(
        localStorage.getItem('healthcare_member') || 'null'
      );
      if (storedMember?.full_name || storedMember?.name) {
        setDoctorName(storedMember.full_name || storedMember.name);
      }
    } catch {
      // ignore
    }
  }, [router]);

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadAppointments = useCallback(
    async (refresh = false) => {
      if (!memberId) {
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const [
          availableResult,
          providerResult,
        ] = await Promise.all([
          getAvailableAppointments({
            role: 'Doctor',
            userId: memberId,
          }),

          getProviderAppointments(
            memberId
          ),
        ]);

        setAvailable(
          extractArray(
            availableResult,
            [
              'appointments',
              'available_appointments',
              'data',
            ]
          )
        );

        setMyAppointments(
          extractArray(
            providerResult,
            [
              'appointments',
              'provider_appointments',
              'data',
            ]
          )
        );
      } catch (err) {
        setError(
          err?.message ||
            'Unable to load appointments.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [memberId]
  );

  useEffect(() => {
    if (memberId) {
      loadAppointments();
    }
  }, [
    memberId,
    loadAppointments,
  ]);

  // =========================================================
  // SUBMIT BID
  // =========================================================

  const handleSubmitBid =
    async () => {
      setError('');
      setSuccess('');

      if (!selectedAppointment) {
        return;
      }

      const appointmentId =
        Number(
          selectedAppointment.id ||
          selectedAppointment.appointment_id
        );

      const amount =
        Number(bidAmount);

      if (
        !appointmentId ||
        appointmentId <= 0
      ) {
        setError(
          'Invalid appointment ID.'
        );
        return;
      }

      if (
        !amount ||
        amount <= 0
      ) {
        setError(
          'Please enter a valid consultation fee.'
        );
        return;
      }

      if (!bidEta) {
        setError(
          'Please select an estimated arrival time.'
        );
        return;
      }

      setSubmittingBid(true);

      try {
        const result =
          await submitBid({
            appointmentId,
            providerUserId: memberId,
            proposedFee: amount,
            estimatedArrivalTime: bidEta,
            providerNote:
              bidMessage.trim(),
          });

        if (!result?.success) {
          setError(
            result?.message ||
              'Unable to submit bid.'
          );
          return;
        }

        setSuccess(
          result?.message ||
            'Offer submitted successfully.'
        );

        setSelectedAppointment(null);
        setBidAmount('');
        setBidMessage('');
        setBidEta('');

        await loadAppointments(true);

        setActiveTab('my');
      } catch (err) {
        setError(
          err?.message ||
            'Something went wrong while submitting the offer.'
        );
      } finally {
        setSubmittingBid(false);
      }
    };

  // =========================================================
  // START CONSULTATION & CREATE INVOICE
  // =========================================================

  const handleStartConsultation = async (appointment) => {
    const appointmentId = Number(appointment?.id || appointment?.appointment_id);
    if (!appointmentId || !memberId) return;

    setError('');
    setSuccess('');
    setActionLoadingId(`start-${appointmentId}`);

    try {
      const res = await startConsultation({
        appointmentId,
        providerMemberId: memberId,
      });

      if (!res?.success) {
        setError(
          res?.message ||
            'Unable to start consultation. Patient must mark arrival first.'
        );
        return;
      }

      setSuccess('Consultation started! Opening consultation workspace...');
      await loadAppointments(true);
      setConsultationAppointment({
        ...appointment,
        status: 'Consultation Started',
      });
    } catch (err) {
      setError(err?.message || 'Unable to start consultation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateInvoice = async (appointment) => {
    const appointmentId = Number(appointment?.id || appointment?.appointment_id);
    if (!appointmentId || !memberId) return;

    setError('');
    setSuccess('');
    setActionLoadingId(`invoice-${appointmentId}`);

    try {
      const res = await createInvoice({
        appointmentId,
        providerMemberId: memberId,
      });

      if (!res?.success) {
        setError(res?.message || 'Unable to create invoice.');
        return;
      }

      setSuccess(
        res?.message ||
          `Invoice #${res?.invoice?.id || ''} ready (${res?.invoice?.amount ? `LKR ${res.invoice.amount}` : ''}).`
      );
      await loadAppointments(true);
    } catch (err) {
      setError(err?.message || 'Unable to create invoice.');
    } finally {
      setActionLoadingId(null);
    }
  };

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
  // COUNTS
  // =========================================================

  const activeCount =
    useMemo(
      () =>
        myAppointments.filter(
          (item) => {
            const status =
              String(
                item?.status || ''
              ).toLowerCase();

            return ![
              'completed',
              'cancelled',
              'rejected',
            ].includes(status);
          }
        ).length,
      [myAppointments]
    );

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

      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        appointmentsBadge={available.length}
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
                  Manage patient requests and your cases
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

              <span
                className="
                  hidden
                  sm:inline
                "
              >
                Refresh
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}

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

          {/* Top */}

          <section
            className="
              rounded-[26px]
              bg-[#07111b]
              px-5
              py-6
              text-white
              sm:px-7
              sm:py-8
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
                  Doctor Appointments
                </p>

                <h1
                  className="
                    mt-2
                    text-2xl
                    font-bold
                    tracking-[-0.03em]
                    sm:text-3xl
                  "
                >
                  Patient Requests & Cases
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >
                  Review new requests and manage your accepted appointments.
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
                  label="Available"
                  value={available.length}
                />

                <MiniStat
                  label="Active"
                  value={activeCount}
                />
              </div>
            </div>
          </section>

          {/* Alerts */}

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

          {/* Tabs */}

          <div
            className="
              mt-6
              inline-flex
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-1.5
              sm:w-auto
            "
          >
            <TabButton
              active={
                activeTab ===
                'available'
              }
              onClick={() =>
                setActiveTab(
                  'available'
                )
              }
              label="Available Requests"
              count={available.length}
            />

            <TabButton
              active={
                activeTab === 'my'
              }
              onClick={() =>
                setActiveTab('my')
              }
              label="My Appointments"
              count={
                myAppointments.length
              }
            />
          </div>

          {/* ===============================================
              AVAILABLE
          ================================================ */}

          {activeTab ===
            'available' && (
            <section
              className="
                mt-5
                grid
                gap-4
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {available.length ===
              0 ? (
                <div
                  className="
                    md:col-span-2
                    xl:col-span-3
                  "
                >
                  <EmptyState
                    title="No available requests"
                    description="New patient requests will appear here when they become available."
                  />
                </div>
              ) : (
                available.map(
                  (
                    appointment,
                    index
                  ) => (
                    <AvailableCard
                      key={
                        appointment?.id ||
                        index
                      }
                      appointment={
                        appointment
                      }
                      onOffer={() => {
                        setError('');
                        setSuccess('');

                        setSelectedAppointment(
                          appointment
                        );

                        setBidAmount('');
                        setBidMessage('');
                        setBidEta('');
                      }}
                    />
                  )
                )
              )}
            </section>
          )}

          {/* ===============================================
              MY APPOINTMENTS
          ================================================ */}

          {activeTab === 'my' && (
            <section
              className="
                mt-5
                grid
                gap-4
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {myAppointments.length ===
              0 ? (
                <div
                  className="
                    md:col-span-2
                    xl:col-span-3
                  "
                >
                  <EmptyState
                    title="No appointments"
                    description="Appointments assigned to you will appear here."
                  />
                </div>
              ) : (
                myAppointments.map(
                  (
                    appointment,
                    index
                  ) => (
                    <MyAppointmentCard
                      key={
                        appointment?.id ||
                        index
                      }
                      appointment={
                        appointment
                      }
                      actionLoadingId={actionLoadingId}
                      onStartConsultation={() =>
                        handleStartConsultation(appointment)
                      }
                      onOpenConsultation={() =>
                        setConsultationAppointment(appointment)
                      }
                      onCreateInvoice={() =>
                        handleCreateInvoice(appointment)
                      }
                    />
                  )
                )
              )}
            </section>
          )}
        </div>

        {/* Mobile bottom navigation */}

        <DoctorMobileNav appointmentsBadge={available.length} />

        <DoctorConsultationModal
          isOpen={Boolean(consultationAppointment)}
          onClose={() => setConsultationAppointment(null)}
          appointment={consultationAppointment}
          doctorMemberId={memberId}
          doctorName={doctorName}
          onUpdated={() => loadAppointments(true)}
        />
      </div>

      {/* =====================================================
          BID MODAL
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
            p-0
            backdrop-blur-sm
            sm:items-center
            sm:p-5
          "
        >
          <div
            className="
              max-h-[92vh]
              w-full
              max-w-[520px]
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
                  Submit Offer
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    text-slate-900
                  "
                >
                  Doctor Consultation Fee
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
                mt-6
                rounded-2xl
                bg-slate-50
                p-4
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  text-slate-800
                "
              >
                {getPatientName(
                  selectedAppointment
                )}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                {getServiceType(
                  selectedAppointment
                )}
              </p>
            </div>

            {/* Price */}

            <div className="mt-6">
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                Consultation Fee
              </label>

              <div className="relative">
                <DollarSign
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
                  type="number"
                  min="1"
                  value={bidAmount}
                  onChange={(e) =>
                    setBidAmount(
                      e.target.value
                    )
                  }
                  placeholder="Enter amount"
                  className="
                    h-[56px]
                    w-full
                    rounded-2xl
                    border
                    border-slate-300
                    bg-white
                    pl-12
                    pr-4
                    text-slate-800
                    outline-none
                    transition
                    focus:border-teal-500
                    focus:ring-4
                    focus:ring-teal-500/10
                  "
                />
              </div>
            </div>

            {/* Estimated Arrival */}

            <div className="mt-5">
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                Estimated Arrival Time
              </label>

              <div className="relative">
                <Clock3
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
                  type="datetime-local"
                  value={bidEta}
                  onChange={(e) =>
                    setBidEta(
                      e.target.value
                    )
                  }
                  className="
                    h-[56px]
                    w-full
                    rounded-2xl
                    border
                    border-slate-300
                    bg-white
                    pl-12
                    pr-4
                    text-slate-800
                    outline-none
                    transition
                    focus:border-teal-500
                    focus:ring-4
                    focus:ring-teal-500/10
                  "
                />
              </div>
            </div>

            {/* Message */}

            <div className="mt-5">
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                Message
              </label>

              <div className="relative">
                <MessageSquareText
                  size={19}
                  className="
                    absolute
                    left-4
                    top-4
                    text-slate-400
                  "
                />

                <textarea
                  rows={4}
                  value={bidMessage}
                  onChange={(e) =>
                    setBidMessage(
                      e.target.value
                    )
                  }
                  placeholder="Optional message to the patient..."
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-slate-300
                    bg-white
                    py-4
                    pl-12
                    pr-4
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    focus:border-teal-500
                    focus:ring-4
                    focus:ring-teal-500/10
                  "
                />
              </div>
            </div>

            <div
              className="
                mt-6
                grid
                grid-cols-2
                gap-3
              "
            >
              <button
                type="button"
                disabled={submittingBid}
                onClick={() =>
                  setSelectedAppointment(
                    null
                  )
                }
                className="
                  h-12
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submittingBid}
                onClick={
                  handleSubmitBid
                }
                className="
                  flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-teal-600
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  shadow-teal-600/20
                  disabled:opacity-60
                "
              >
                {submittingBid ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Sending
                  </>
                ) : (
                  <>
                    <Send size={17} />

                    Submit Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ===========================================================
// AVAILABLE CARD
// ===========================================================

function AvailableCard({
  appointment,
  onOffer,
}) {
  return (
    <article
      className="
        flex
        flex-col
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

        <UrgencyBadge
          value={
            appointment?.urgency_level ||
            appointment?.urgency ||
            'Normal'
          }
        />
      </div>

      <h3
        className="
          mt-5
          font-bold
          text-slate-900
        "
      >
        {getPatientName(
          appointment
        )}
      </h3>

      <p
        className="
          mt-1
          text-sm
          font-semibold
          text-teal-600
        "
      >
        {getServiceType(
          appointment
        )}
      </p>

      <div
        className="
          mt-5
          space-y-3
        "
      >
        <InfoRow
          icon={MapPin}
          text={
            appointment?.delivery_address ||
            appointment?.address ||
            'Address not specified'
          }
        />

        <InfoRow
          icon={Clock3}
          text={
            appointment?.preferred_time ||
            appointment?.appointment_time ||
            'Time not specified'
          }
        />
      </div>

      {appointment?.notes && (
        <div
          className="
            mt-5
            rounded-xl
            bg-slate-50
            p-3
          "
        >
          <p
            className="
              text-xs
              leading-5
              text-slate-500
            "
          >
            {appointment.notes}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onOffer}
        className="
          mt-6
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
        <DollarSign size={17} />

        Submit Fee / Offer
      </button>
    </article>
  );
}

// ===========================================================
// MY APPOINTMENT
// ===========================================================

function MyAppointmentCard({
  appointment,
  actionLoadingId,
  onStartConsultation,
  onOpenConsultation,
  onCreateInvoice,
}) {
  const status =
    appointment?.status ||
    'Pending';
  const normalizedStatus = String(status).toLowerCase();
  const appointmentId = appointment?.id || appointment?.appointment_id;
  const isStarting = actionLoadingId === `start-${appointmentId}`;
  const isInvoicing = actionLoadingId === `invoice-${appointmentId}`;

  return (
    <article
      className="
        flex
        flex-col
        rounded-[24px]
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
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
          <CalendarCheck2
            size={21}
          />
        </div>

        <StatusBadge
          status={status}
        />
      </div>

      <h3
        className="
          mt-5
          font-bold
          text-slate-900
        "
      >
        {getPatientName(
          appointment
        )}
      </h3>

      <p
        className="
          mt-1
          text-sm
          text-slate-500
        "
      >
        {getServiceType(
          appointment
        )}
      </p>

      <div
        className="
          mt-5
          space-y-3
        "
      >
        <InfoRow
          icon={MapPin}
          text={
            appointment?.delivery_address ||
            appointment?.address ||
            'Address unavailable'
          }
        />

        <InfoRow
          icon={Clock3}
          text={
            appointment?.preferred_time ||
            appointment?.appointment_time ||
            'Time unavailable'
          }
        />
      </div>

      <div
        className="
          mt-5
          border-t
          border-slate-100
          pt-4
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <span
            className="
              text-xs
              text-slate-400
            "
          >
            Appointment
          </span>

          <span
            className="
              text-xs
              font-bold
              text-slate-700
            "
          >
            #{appointment?.id || '-'}
          </span>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          {normalizedStatus === 'arrived' && (
            <button
              type="button"
              onClick={onStartConsultation}
              disabled={isStarting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {isStarting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Play size={15} />
              )}
              Start Consultation
            </button>
          )}

          {['accepted', 'on the way', 'arrived', 'consultation started'].includes(
            normalizedStatus
          ) && (
            <button
              type="button"
              onClick={onOpenConsultation}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-teal-800 transition hover:bg-teal-100"
            >
              <Stethoscope size={15} />
              {normalizedStatus === 'consultation started'
                ? 'Open Consultation & Complete'
                : 'Consultation Workspace'}
            </button>
          )}

          {normalizedStatus === 'completed' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCreateInvoice}
                disabled={isInvoicing}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isInvoicing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Receipt size={14} />
                )}
                Invoice
              </button>

              {appointment?.patient_id && (
                <Link
                  href={`/doctor/patients/${appointment.patient_id}`}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <UserRound size={14} />
                  Patient File
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
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
    if (
      Array.isArray(
        result[key]
      )
    ) {
      return result[key];
    }
  }

  return [];
}

function getPatientName(
  appointment
) {
  return (
    appointment?.patient_name ||
    appointment?.full_name ||
    appointment?.name ||
    `Patient #${
      appointment?.patient_id ||
      '-'
    }`
  );
}

function getServiceType(
  appointment
) {
  return (
    appointment?.service_type ||
    appointment?.service ||
    'Doctor Consultation'
  );
}

// ===========================================================
// SMALL COMPONENTS
// ===========================================================



function TabButton({
  active,
  onClick,
  label,
  count,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        flex-1
        items-center
        justify-center
        gap-2
        rounded-xl
        px-4
        py-3
        text-xs
        font-bold
        transition
        sm:flex-none
        sm:text-sm
        ${
          active
            ? 'bg-teal-600 text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-50'
        }
      `}
    >
      {label}

      <span
        className={`
          rounded-full
          px-2
          py-0.5
          text-[10px]
          ${
            active
              ? 'bg-white/15 text-white'
              : 'bg-slate-100 text-slate-500'
          }
        `}
      >
        {count}
      </span>
    </button>
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

function InfoRow({
  icon: Icon,
  text,
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-2.5
        text-sm
        text-slate-500
      "
    >
      <Icon
        size={16}
        className="
          mt-0.5
          shrink-0
          text-slate-400
        "
      />

      <span
        className="
          line-clamp-2
        "
      >
        {text}
      </span>
    </div>
  );
}

function UrgencyBadge({
  value,
}) {
  const urgency =
    String(value)
      .toLowerCase();

  let style =
    'bg-emerald-50 text-emerald-600';

  if (urgency === 'urgent') {
    style =
      'bg-amber-50 text-amber-700';
  }

  if (
    urgency === 'emergency'
  ) {
    style =
      'bg-red-50 text-red-600';
  }

  return (
    <span
      className={`
        rounded-full
        px-2.5
        py-1
        text-[10px]
        font-bold
        uppercase
        ${style}
      `}
    >
      {value}
    </span>
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

function EmptyState({
  title,
  description,
}) {
  return (
    <div
      className="
        flex
        min-h-[300px]
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

      <h3
        className="
          mt-5
          font-bold
          text-slate-800
        "
      >
        {title}
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
        {description}
      </p>
    </div>
  );
}

