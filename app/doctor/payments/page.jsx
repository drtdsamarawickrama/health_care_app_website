'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoctorSidebar, { DoctorMobileNav } from '@/components/DoctorNavigation';
import {
  Banknote,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Loader2,
  Menu,
  Receipt,
  RefreshCw,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import {
  checkDoctorProfile,
  createInvoice,
  getProviderAppointments,
  getProviderPrescriptions,
} from '@/lib/api';
import { formatLkr } from '@/lib/formatters';
import { downloadReceiptPdf } from '@/lib/pdfGenerator';

export default function DoctorPaymentsPage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'completed' | 'pending'

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [creatingInvoiceId, setCreatingInvoiceId] = useState(null);

  useEffect(() => {
    const storedMemberId = localStorage.getItem('healthcare_member_id');
    const storedUserType = localStorage.getItem('healthcare_user_type');

    const parsedId = Number(storedMemberId);
    const parsedType = Number(storedUserType);

    if (!parsedId || parsedId <= 0 || parsedType !== 2) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedId);
  }, [router]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!memberId) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const [docRes, apptRes, presRes] = await Promise.all([
          checkDoctorProfile(memberId),
          getProviderAppointments(memberId),
          getProviderPrescriptions(memberId, { role: 'Doctor' }),
        ]);

        if (docRes?.doctor) {
          setDoctor(docRes.doctor);
        }

        const apptList = Array.isArray(apptRes?.appointments)
          ? apptRes.appointments
          : Array.isArray(apptRes)
          ? apptRes
          : [];

        const presList = Array.isArray(presRes?.prescriptions)
          ? presRes.prescriptions
          : Array.isArray(presRes)
          ? presRes
          : [];

        setAppointments(apptList);
        setPrescriptions(presList);
      } catch (err) {
        setError(err?.message || 'Unable to load earnings & payment records.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [memberId]
  );

  useEffect(() => {
    if (memberId) {
      loadData();
    }
  }, [memberId, loadData]);

  // Build unified transaction records from provider appointments & prescriptions
  const transactions = useMemo(() => {
    const items = [];

    appointments.forEach((appt) => {
      const status = String(appt?.status || 'Pending');
      const normalized = status.toLowerCase();
      if (normalized === 'cancelled' || normalized === 'rejected') return;

      const isCompleted = normalized === 'completed';
      const amount =
        Number(appt?.proposed_fee || appt?.bid_fee || appt?.amount || 0) ||
        2500;

      items.push({
        id: `APT-${appt.id}`,
        appointment_id: appt.id,
        patient_id: appt.patient_id,
        patient_name:
          appt.patient_name ||
          appt.full_name ||
          `Patient #${appt.patient_id || '-'}`,
        service_type: appt.service_type || 'Doctor Consultation',
        amount,
        status: isCompleted ? 'Completed' : 'Pending Visit',
        isCompleted,
        date:
          appt.preferred_time ||
          appt.created_at ||
          new Date().toISOString().slice(0, 10),
        rawAppointment: appt,
      });
    });

    prescriptions.forEach((pres) => {
      const fee = Number(pres?.consultation_fee || 0);
      if (fee <= 0) return;

      items.push({
        id: `RX-${pres.id}`,
        prescription_id: pres.id,
        patient_id: pres.patient_id,
        patient_name:
          pres.patient_name || `Patient #${pres.patient_id || '-'}`,
        service_type: `Prescription Consultation (${pres.medicine || 'Rx'})`,
        amount: fee,
        status: 'Completed',
        isCompleted: true,
        date: pres.created_at || pres.date || '',
        rawPrescription: pres,
      });
    });

    return items;
  }, [appointments, prescriptions]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'completed') {
      return transactions.filter((t) => t.isCompleted);
    }
    if (activeTab === 'pending') {
      return transactions.filter((t) => !t.isCompleted);
    }
    return transactions;
  }, [transactions, activeTab]);

  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.isCompleted);
    const pending = transactions.filter((t) => !t.isCompleted);

    const totalEarned = completed.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = pending.reduce((sum, t) => sum + t.amount, 0);
    const avgPerVisit =
      completed.length > 0 ? totalEarned / completed.length : 0;

    return {
      totalEarned,
      pendingAmount,
      completedCount: completed.length,
      pendingCount: pending.length,
      avgPerVisit,
    };
  }, [transactions]);

  const handleGenerateInvoice = async (tx) => {
    if (!tx?.appointment_id || !memberId) return;
    setError('');
    setSuccess('');
    setCreatingInvoiceId(tx.id);

    try {
      const res = await createInvoice({
        appointmentId: tx.appointment_id,
        providerMemberId: memberId,
      });

      if (!res?.success) {
        setError(res?.message || 'Unable to generate invoice.');
        return;
      }

      setSuccess(
        res?.message ||
          `Invoice #${res?.invoice?.id || ''} verified for Appointment #${tx.appointment_id}.`
      );
    } catch (err) {
      setError(err?.message || 'Unable to generate invoice.');
    } finally {
      setCreatingInvoiceId(null);
    }
  };

  const doctorName = doctor?.full_name || 'Doctor';

  if (!memberId || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">
            Loading doctor earnings & payments...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8]">
      <DoctorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        doctorName={doctorName}
        doctorSubtitle={doctor?.specialization || 'Medical Professional'}
      />

      <div className="min-h-screen lg:pl-[270px]">
        {/* Header */}
        <header className="sticky top-0 z-40 h-[74px] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="font-bold text-slate-900">
                  Payments & Earnings
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Track your consultation fees, completed visits, and invoices
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {/* Hero Summary */}
          <section className="relative overflow-hidden rounded-[28px] bg-[#07111b] px-6 py-7 text-white sm:px-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-400/15 blur-[80px]" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
                  Financial Overview
                </p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {formatLkr(stats.totalEarned)}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Total earnings from {stats.completedCount} completed
                  consultations & prescriptions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Completed Visits</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {stats.completedCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Avg. per Visit</p>
                  <p className="mt-1 text-xl font-bold text-teal-300">
                    {formatLkr(stats.avgPerVisit)}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-1">
                  <p className="text-xs text-slate-400">Active / Pending</p>
                  <p className="mt-1 text-xl font-bold text-amber-300">
                    {formatLkr(stats.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1.5">
            {[
              { id: 'all', label: `All (${transactions.length})` },
              {
                id: 'completed',
                label: `Completed (${stats.completedCount})`,
              },
              { id: 'pending', label: `Pending (${stats.pendingCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            {filteredTransactions.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <CircleDollarSign size={26} />
                </div>
                <p className="mt-4 font-bold text-slate-800">
                  No payment records found
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Completed consultations and accepted appointment offers will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          tx.isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <Banknote size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {tx.patient_name}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              tx.isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {tx.service_type}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Ref #{tx.id} • {tx.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                      <p className="text-base font-extrabold text-slate-900">
                        {formatLkr(tx.amount)}
                      </p>

                      <div className="flex items-center gap-2">
                        {tx.appointment_id && tx.isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleGenerateInvoice(tx)}
                            disabled={creatingInvoiceId === tx.id}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-800 hover:bg-teal-100 disabled:opacity-60"
                          >
                            {creatingInvoiceId === tx.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Receipt size={13} />
                            )}
                            Verify Invoice
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(tx)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DoctorMobileNav />
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  Statement Record
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                  Reference #{selectedTransaction.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">
                  {selectedTransaction.patient_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">
                  {selectedTransaction.service_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">
                  {selectedTransaction.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-teal-700">
                  {selectedTransaction.status}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="font-bold text-slate-700">Amount:</span>
                <span className="font-extrabold text-slate-900">
                  {formatLkr(selectedTransaction.amount)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadReceiptPdf(
                    {
                      id: selectedTransaction.id,
                      appointment_id: selectedTransaction.appointment_id,
                      service_type: selectedTransaction.service_type,
                      provider_name: `Dr. ${doctorName}`,
                      provider_role: 'Doctor',
                      amount: selectedTransaction.amount,
                      status: selectedTransaction.isCompleted
                        ? 'Paid'
                        : 'Pending',
                      payment_method: 'Consultation Statement',
                      paid_at: selectedTransaction.date,
                    },
                    { patientName: selectedTransaction.patient_name }
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
              >
                <Download size={14} />
                Download Statement PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

