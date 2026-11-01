'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Clock3,
  Compass,
  HeartPulse,
  Home,
  Loader2,
  MapPin,
  Menu,
  Navigation,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import {
  completeAppointment,
  getPatientAppointments,
  markAppointmentArrived,
} from '@/lib/api';
import {
  APPOINTMENT_TIMELINE_STEPS,
  displayName,
  formatCurrency,
  formatDate,
  formatDoctorName,
  getAppointmentStatusMeta,
} from '@/lib/formatters';

function PatientTrackingContent() {
  const searchParams = useSearchParams();
  const requestedAppointmentId = Number(
    searchParams.get('appointmentId') || 0
  );

  const {
    patients,
    selectedPatientId,
    selectedPatient,
    selectPatient,
    loading: profileLoading,
  } = usePatientProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [activeId, setActiveId] = useState(requestedAppointmentId);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // Simulated GPS Telemetry (matching tracking_screen.dart)
  const [etaMinutes, setEtaMinutes] = useState(14);
  const [distanceKm, setDistanceKm] = useState(3.2);
  const [progressPct, setProgressPct] = useState(38);
  const [callBanner, setCallBanner] = useState('');

  const loadAppointments = useCallback(
    async ({ silent = false } = {}) => {
      if (!selectedPatientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }
      setError('');

      try {
        const res = await getPatientAppointments(selectedPatientId);
        const list = Array.isArray(res?.appointments)
          ? res.appointments
          : [];
        setAppointments(list);

        if (requestedAppointmentId > 0) {
          setActiveId(requestedAppointmentId);
        } else if (list.length > 0) {
          const ongoing = list.find((item) =>
            [
              'Accepted',
              'On The Way',
              'Arrived',
              'Consultation Started',
              'Requested',
            ].includes(item?.status)
          );
          setActiveId(
            Number(
              ongoing?.appointment_id ||
                ongoing?.id ||
                list[0]?.appointment_id ||
                list[0]?.id ||
                0
            )
          );
        }
      } catch (err) {
        setError(err?.message || 'Unable to load tracking details.');
      } finally {
        setLoading(false);
      }
    },
    [selectedPatientId, requestedAppointmentId]
  );

  useEffect(() => {
    if (profileLoading) return;
    loadAppointments();
  }, [profileLoading, loadAppointments]);

  const activeAppointment = useMemo(() => {
    if (!appointments.length) return null;
    return (
      appointments.find(
        (item) =>
          Number(item?.appointment_id || item?.id) === Number(activeId)
      ) || appointments[0]
    );
  }, [appointments, activeId]);

  // Adjust simulated telemetry based on appointment status
  useEffect(() => {
    const status = String(activeAppointment?.status || '');
    if (status === 'Requested') {
      setEtaMinutes(25);
      setDistanceKm(5.4);
      setProgressPct(15);
    } else if (status === 'Accepted' || status === 'On The Way') {
      setEtaMinutes(12);
      setDistanceKm(2.8);
      setProgressPct(55);
    } else if (status === 'Arrived') {
      setEtaMinutes(0);
      setDistanceKm(0.0);
      setProgressPct(85);
    } else if (status === 'Consultation Started') {
      setEtaMinutes(0);
      setDistanceKm(0.0);
      setProgressPct(92);
    } else if (status === 'Completed') {
      setEtaMinutes(0);
      setDistanceKm(0.0);
      setProgressPct(100);
    }
  }, [activeAppointment?.status, activeAppointment?.appointment_id]);

  // Gentle telemetry tick when provider is en route
  useEffect(() => {
    const status = String(activeAppointment?.status || '');
    if (status !== 'Accepted' && status !== 'On The Way') return;

    const timer = setInterval(() => {
      setEtaMinutes((prev) => (prev > 2 ? prev - 1 : prev));
      setDistanceKm((prev) =>
        prev > 0.4 ? Number((prev - 0.2).toFixed(1)) : prev
      );
      setProgressPct((prev) => (prev < 78 ? prev + 3 : prev));
    }, 4500);

    return () => clearInterval(timer);
  }, [activeAppointment?.status]);

  const handleMarkArrived = async () => {
    const appointmentId = Number(
      activeAppointment?.appointment_id || activeAppointment?.id || 0
    );
    if (!appointmentId || !selectedPatientId) return;

    setActionLoading(true);
    setError('');
    setBanner('');

    try {
      const res = await markAppointmentArrived({
        appointmentId,
        patientId: selectedPatientId,
      });

      if (!res?.success) {
        setError(res?.message || 'Could not confirm provider arrival.');
        return;
      }

      setBanner(
        'Provider arrival confirmed! The doctor can now begin the consultation.'
      );
      await loadAppointments({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to update arrival status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteVisit = async () => {
    const appointmentId = Number(
      activeAppointment?.appointment_id || activeAppointment?.id || 0
    );
    if (!appointmentId || !selectedPatientId) return;

    setActionLoading(true);
    setError('');
    setBanner('');

    try {
      const res = await completeAppointment({
        appointmentId,
        patientId: selectedPatientId,
        completedByRole: 'Patient',
      });

      if (!res?.success) {
        setError(res?.message || 'Could not mark visit completed.');
        return;
      }

      setBanner('Home visit marked as Completed. Thank you!');
      await loadAppointments({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to complete visit.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusMeta = getAppointmentStatusMeta(activeAppointment?.status);
  const providerName = formatDoctorName(
    activeAppointment?.provider_name || activeAppointment?.doctor_name,
    activeAppointment?.provider_member_id || activeAppointment?.provider_id
  );
  const currentStepIndex = statusMeta.stepIndex;

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-900">
      <PatientSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        patientName={displayName(selectedPatient, 'Patient')}
      />

      <div className="min-h-screen pb-24 lg:pl-[270px] lg:pb-12">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
                  Real-Time Home Visit Dispatch
                </p>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Live Provider Tracking
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {appointments.length > 1 && (
                <select
                  value={activeId || ''}
                  onChange={(e) => setActiveId(Number(e.target.value))}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
                >
                  {appointments.map((apt) => {
                    const id = Number(apt?.appointment_id || apt?.id || 0);
                    return (
                      <option key={id} value={id}>
                        APT #{id} • {apt?.service_type} ({apt?.status})
                      </option>
                    );
                  })}
                </select>
              )}

              <button
                type="button"
                onClick={() => loadAppointments({ silent: true })}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={14} />
                Refresh Status
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          {banner && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>{banner}</span>
              </div>
              <button
                type="button"
                onClick={() => setBanner('')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {callBanner && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-bold text-teal-900">
              <span>{callBanner}</span>
              <button
                type="button"
                onClick={() => setCallBanner('')}
                className="text-teal-700 underline"
              >
                Close
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-slate-500">
              <Loader2 size={28} className="animate-spin text-teal-600" />
              <p className="mt-3 text-sm font-medium">
                Connecting to dispatch tracker...
              </p>
            </div>
          ) : !activeAppointment ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <Navigation size={28} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No Active Visit to Track
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Book a home healthcare visit to track your assigned doctor in real time.
              </p>
              <Link
                href="/patient/request-care"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                Request Home Visit
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Simulated Interactive Map Canvas */}
              <div className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#0b1929] p-6 text-white shadow-lg sm:p-8">
                  {/* Subtle Map Grid Background */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'radial-gradient(#2dd4bf 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
                      backgroundSize: '28px 28px, 56px 56px, 56px 56px',
                    }}
                  />

                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1.5 text-xs font-bold text-teal-300">
                      <span className="h-2 w-2 animate-ping rounded-full bg-teal-400" />
                      GPS Telemetry Active • APT #
                      {activeAppointment?.appointment_id || activeAppointment?.id}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Estimated Arrival
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-teal-300">
                        {etaMinutes === 0 ? 'Arrived' : `${etaMinutes} mins`}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Distance Away
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-white">
                        {distanceKm.toFixed(1)} km
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Dispatch Vehicle
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-white">
                        Toyota Prius
                      </p>
                      <p className="text-[11px] font-semibold text-teal-300">
                        WP CAB-4582
                      </p>
                    </div>
                  </div>

                  {/* Animated Route Visualization */}
                  <div className="relative z-10 my-10 rounded-2xl border border-white/10 bg-slate-900/80 p-6">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Stethoscope size={15} className="text-teal-400" />
                        Medical Dispatch Hub
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Home size={15} className="text-emerald-400" />
                        Patient Home
                      </span>
                    </div>

                    <div className="relative mt-5 h-3 w-full rounded-full bg-slate-800">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
                        style={{ left: `calc(${progressPct}% - 18px)` }}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-teal-500 text-white shadow-lg shadow-teal-500/40">
                          <Car size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Destination:{' '}
                        <strong className="text-slate-200">
                          {activeAppointment?.delivery_address ||
                            selectedPatient?.home_address ||
                            'Patient Registered Address'}
                        </strong>
                      </span>
                      <span>{progressPct}% Complete</span>
                    </div>
                  </div>

                  {/* Lifecycle Stepper inside Map Card */}
                  <div className="relative z-10 border-t border-white/10 pt-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Visit Lifecycle Progress
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
                      {APPOINTMENT_TIMELINE_STEPS.map((stepName, idx) => {
                        const done = currentStepIndex >= idx;
                        const current = currentStepIndex === idx;
                        return (
                          <div
                            key={stepName}
                            className={`rounded-xl border p-2.5 text-center transition ${
                              current
                                ? 'border-teal-400 bg-teal-500/20 text-white'
                                : done
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-white/10 bg-white/5 text-slate-500'
                            }`}
                          >
                            <p className="text-[10px] font-extrabold uppercase">
                              Step {idx + 1}
                            </p>
                            <p className="mt-1 truncate text-[11px] font-bold">
                              {stepName}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Practitioner Card + Patient Action Controls */}
              <div className="space-y-6 lg:col-span-5">
                {/* Practitioner Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                    Assigned Healthcare Practitioner
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-lg font-extrabold text-white">
                      {providerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {providerName}
                      </h2>
                      <p className="text-xs font-medium text-slate-500">
                        {activeAppointment?.service_type ||
                          'Home Medical Consultation'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs font-bold text-amber-600">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>4.9 Verified Clinician</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs">
                    <div>
                      <span className="text-slate-400">Scheduled Date</span>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {formatDate(activeAppointment?.appointment_date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Time Slot</span>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {activeAppointment?.appointment_time || 'Immediate'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Agreed Fee</span>
                      <p className="mt-0.5 font-bold text-teal-700">
                        {activeAppointment?.accepted_bid_amount
                          ? formatCurrency(activeAppointment.accepted_bid_amount)
                          : 'Pending Bid'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Emergency Contact</span>
                      <p className="mt-0.5 font-bold text-slate-800">
                        {activeAppointment?.emergency_contact ||
                          selectedPatient?.emergency_contact ||
                          'On file'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCallBanner(
                          `Connecting audio call with ${providerName} (${
                            activeAppointment?.provider_phone ||
                            'Dispatch Hotline 1990'
                          })...`
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <PhoneCall size={15} className="text-teal-600" />
                      Call Practitioner
                    </button>
                  </div>
                </div>

                {/* Patient Action Verification Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900">
                    Visit Verification Actions
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Confirm when the doctor arrives at your home so consultation can begin, or mark the visit complete once treatment finishes.
                  </p>

                  <div className="mt-5 space-y-3">
                    {['Accepted', 'On The Way'].includes(
                      activeAppointment?.status
                    ) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleMarkArrived}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-60"
                      >
                        {actionLoading ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <MapPin size={17} />
                        )}
                        Confirm Provider Has Arrived
                      </button>
                    )}

                    {['Arrived', 'Consultation Started'].includes(
                      activeAppointment?.status
                    ) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleCompleteVisit}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actionLoading ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                        Confirm Treatment Complete
                      </button>
                    )}

                    {activeAppointment?.status === 'Requested' && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                        <p className="font-bold">Awaiting Provider Acceptance</p>
                        <p className="mt-1 text-amber-800">
                          Doctors can submit bids on your request. Review and accept a bid on the{' '}
                          <Link
                            href="/patient/appointments"
                            className="font-bold underline"
                          >
                            Appointments
                          </Link>{' '}
                          page to dispatch the doctor.
                        </p>
                      </div>
                    )}

                    {activeAppointment?.status === 'Completed' && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                        <p className="font-bold">Visit Completed</p>
                        <p className="mt-1 text-emerald-800">
                          This home consultation has been completed. View any issued prescriptions or settle pending invoices below.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Link
                            href="/patient/prescriptions"
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white"
                          >
                            View Prescriptions
                          </Link>
                          <Link
                            href="/patient/payments"
                            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-bold text-emerald-800"
                          >
                            Go to Payments
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <PatientMobileNav />
      </div>
    </div>
  );
}

export default function PatientTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-600">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      }
    >
      <PatientTrackingContent />
    </Suspense>
  );
}

