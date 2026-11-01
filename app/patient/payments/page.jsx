'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Lock,
  Menu,
  Printer,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import {
  getPatientInvoices,
  markInvoicePaid,
} from '@/lib/api';
import {
  displayName,
  formatCurrency,
  formatDateTime,
  formatDoctorName,
  getInvoiceStatusMeta,
} from '@/lib/formatters';
import { downloadReceiptPdf } from '@/lib/pdfGenerator';

export default function PatientPaymentsPage() {
  const {
    patients,
    selectedPatientId,
    selectedPatient,
    selectPatient,
    loading: profileLoading,
  } = usePatientProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // Checkout Modal State
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Receipt Modal State
  const [receiptModalInvoice, setReceiptModalInvoice] = useState(null);

  const loadInvoices = useCallback(
    async ({ silent = false } = {}) => {
      if (!selectedPatientId) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const res = await getPatientInvoices(selectedPatientId);
        const list = Array.isArray(res?.invoices) ? res.invoices : [];
        setInvoices(list);
      } catch (err) {
        setError(err?.message || 'Unable to load invoices.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPatientId]
  );

  useEffect(() => {
    if (profileLoading) return;
    loadInvoices();
  }, [profileLoading, loadInvoices]);

  const pendingInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          String(inv?.payment_status || 'Pending').toLowerCase() === 'pending'
      ),
    [invoices]
  );

  const historyInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          String(inv?.payment_status || 'Pending').toLowerCase() !== 'pending'
      ),
    [invoices]
  );

  const totalPendingAmount = useMemo(
    () =>
      pendingInvoices.reduce(
        (sum, inv) => sum + Number(inv?.total_amount || 0),
        0
      ),
    [pendingInvoices]
  );

  const totalPaidAmount = useMemo(
    () =>
      historyInvoices
        .filter(
          (inv) =>
            String(inv?.payment_status || '').toLowerCase() === 'paid'
        )
        .reduce((sum, inv) => sum + Number(inv?.total_amount || 0), 0),
    [historyInvoices]
  );

  const openCheckout = (invoice) => {
    setCheckoutInvoice(invoice);
    setPaymentMethod('Card');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setPayError('');
  };

  const handleConfirmPayment = async (event) => {
    event.preventDefault();
    if (!checkoutInvoice || !selectedPatientId) return;

    setPayError('');

    if (paymentMethod === 'Card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 12) {
        setPayError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry.trim()) {
        setPayError('Please enter card expiry (MM/YY).');
        return;
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        setPayError('Please enter a valid 3-digit CVV.');
        return;
      }
    }

    setPaying(true);
    try {
      const invoiceId = Number(
        checkoutInvoice?.invoice_id || checkoutInvoice?.id || 0
      );
      const res = await markInvoicePaid({
        invoiceId,
        patientId: selectedPatientId,
        paymentMethod,
      });

      if (!res?.success) {
        setPayError(res?.message || 'Payment could not be completed.');
        return;
      }

      const paidInvoice = {
        ...checkoutInvoice,
        payment_status: 'Paid',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
      };

      setCheckoutInvoice(null);
      setReceiptModalInvoice(paidInvoice);
      setBanner(
        `Invoice #${invoiceId} paid via ${paymentMethod} (${formatCurrency(
          checkoutInvoice?.total_amount
        )}).`
      );
      setActiveTab('history');
      await loadInvoices({ silent: true });
    } catch (err) {
      setPayError(err?.message || 'Failed to process payment.');
    } finally {
      setPaying(false);
    }
  };

  const handlePrintReceipt = (invoice) => {
    downloadReceiptPdf({
      invoice,
      patientName: displayName(selectedPatient, 'Patient'),
    });
  };

  const visibleInvoices =
    activeTab === 'pending' ? pendingInvoices : historyInvoices;

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-900">
      <PatientSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        patientName={displayName(selectedPatient, 'Patient')}
      />

      <div className="min-h-screen pb-24 lg:pl-[270px] lg:pb-12">
        {/* Top Header */}
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
                  Billing & Invoices
                </p>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Payments & Receipts
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {patients.length > 1 && (
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => selectPatient(Number(e.target.value))}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
                >
                  {patients.map((p) => {
                    const id = Number(p?.id ?? p?.patient_id ?? 0);
                    return (
                      <option key={id} value={id}>
                        {displayName(p, 'Patient')} ({p?.relationship_to_user || 'Profile'})
                      </option>
                    );
                  })}
                </select>
              )}

              <button
                type="button"
                onClick={() => loadInvoices({ silent: true })}
                disabled={refreshing || loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? 'animate-spin text-teal-600' : ''}
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Summary Banner */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Pending Balance
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                  <Clock3 size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {formatCurrency(totalPendingAmount)}
              </p>
              <p className="mt-1 text-xs font-medium text-amber-800">
                {pendingInvoices.length} unpaid invoice{pendingInvoices.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Total Paid
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {formatCurrency(totalPaidAmount)}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-800">
                {historyInvoices.length} completed transaction{historyInvoices.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Patient Profile
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <UserRound size={20} />
                </div>
              </div>
              <p className="mt-3 truncate text-lg font-bold text-slate-900">
                {displayName(selectedPatient, 'Patient')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedPatient?.relationship_to_user || 'Self'} • Instant PDF Receipts
              </p>
            </div>
          </div>

          {banner && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
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

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition sm:flex-initial ${
                activeTab === 'pending'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock3 size={16} />
              Pending Bills
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                  activeTab === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingInvoices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition sm:flex-initial ${
                activeTab === 'history'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Receipt size={16} />
              Payment History
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                  activeTab === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {historyInvoices.length}
              </span>
            </button>
          </div>

          {/* Invoices List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-slate-500">
              <Loader2 size={28} className="animate-spin text-teal-600" />
              <p className="mt-3 text-sm font-medium">Loading invoices...</p>
            </div>
          ) : visibleInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <Wallet size={28} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {activeTab === 'pending'
                  ? 'No Pending Bills'
                  : 'No Payment History Yet'}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {activeTab === 'pending'
                  ? 'You are all caught up! When a doctor generates an invoice after a consultation, it will appear here.'
                  : 'Completed invoice payments and downloadable receipts will appear in this tab.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleInvoices.map((inv) => {
                const invoiceId = inv?.invoice_id || inv?.id;
                const statusMeta = getInvoiceStatusMeta(inv?.payment_status);
                const isPending =
                  String(inv?.payment_status || 'Pending').toLowerCase() ===
                  'pending';
                const doctorName = formatDoctorName(
                  inv?.provider_name || inv?.doctor_name,
                  inv?.provider_member_id || inv?.appointment_id
                );

                return (
                  <div
                    key={invoiceId}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                              isPending
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <Receipt size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                INV-{invoiceId}
                              </span>
                              {inv?.appointment_id && (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                  APT #{inv.appointment_id}
                                </span>
                              )}
                            </div>
                            <h3 className="mt-0.5 text-base font-bold text-slate-900">
                              {inv?.service_type || 'Home Medical Consultation'}
                            </h3>
                            <p className="text-xs font-medium text-slate-500">
                              Provider: {doctorName}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                          />
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Service Consultation Fee</span>
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(inv?.service_fee || inv?.total_amount)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                          <span>Home Visit Travel Fee</span>
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(inv?.travel_fee || 0)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Amount
                          </span>
                          <span className="text-lg font-extrabold text-teal-700">
                            {formatCurrency(inv?.total_amount)}
                          </span>
                        </div>
                      </div>

                      {inv?.notes && (
                        <p className="mt-3 text-xs text-slate-500">
                          <strong className="text-slate-700">Notes:</strong>{' '}
                          {inv.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="text-xs text-slate-500">
                        {isPending ? (
                          <span>
                            Issued:{' '}
                            {formatDateTime(
                              inv?.created_at ||
                                `${inv?.appointment_date || ''} ${inv?.appointment_time || ''}`
                            )}
                          </span>
                        ) : (
                          <span>
                            Paid via{' '}
                            <strong className="text-slate-700">
                              {inv?.payment_method || 'Card'}
                            </strong>{' '}
                            • {formatDateTime(inv?.paid_at || inv?.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => openCheckout(inv)}
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700"
                          >
                            <CreditCard size={15} />
                            Pay Now
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setReceiptModalInvoice(inv)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              <FileText size={14} />
                              View Receipt
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(inv)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
                            >
                              <Printer size={14} />
                              PDF
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <PatientMobileNav />
      </div>

      {/* Checkout Modal */}
      {checkoutInvoice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  Invoice Checkout
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  Service Payment (INV-#{checkoutInvoice?.invoice_id || checkoutInvoice?.id})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutInvoice(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6">
              <div className="rounded-2xl bg-slate-900 p-5 text-white">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{checkoutInvoice?.service_type || 'Home Consultation'}</span>
                  <span>
                    {formatDoctorName(
                      checkoutInvoice?.provider_name,
                      checkoutInvoice?.provider_member_id
                    )}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-wider text-teal-300">
                  Total Amount Payable
                </p>
                <p className="mt-1 text-3xl font-extrabold">
                  {formatCurrency(checkoutInvoice?.total_amount)}
                </p>
              </div>

              {payError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                  <AlertCircle size={15} />
                  <span>{payError}</span>
                </div>
              )}

              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      paymentMethod === 'Card'
                        ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/15'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={20} className="text-teal-600" />
                    <div>
                      <p className="text-xs font-bold">Credit / Debit Card</p>
                      <p className="text-[11px] text-slate-500">Visa, Mastercard</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      paymentMethod === 'Cash'
                        ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/15'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote size={20} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold">Cash Handover</p>
                      <p className="text-[11px] text-slate-500">Pay Doctor Directly</p>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'Card' ? (
                <div className="mt-5 space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• 8891"
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">
                        Expiry Date (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="08/28"
                        className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
                  <p className="font-bold">Cash Handover Confirmation</p>
                  <p className="mt-1 text-emerald-700">
                    Confirming Cash Payment records that you have handed over{' '}
                    <strong>{formatCurrency(checkoutInvoice?.total_amount)}</strong> directly to the visiting healthcare provider.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCheckoutInvoice(null)}
                  className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Confirm & Pay {formatCurrency(checkoutInvoice?.total_amount)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {receiptModalInvoice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 px-6 py-6 text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <ShieldCheck size={30} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-teal-100">
                Official Payment Receipt
              </p>
              <h3 className="mt-1 text-2xl font-extrabold">
                {formatCurrency(receiptModalInvoice?.total_amount)}
              </h3>
              <p className="mt-1 text-xs text-teal-100">
                Receipt #INV-{receiptModalInvoice?.invoice_id || receiptModalInvoice?.id} • Paid via{' '}
                {receiptModalInvoice?.payment_method || 'Card'}
              </p>
            </div>

            <div className="space-y-3 p-6 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Patient</span>
                <span className="font-bold text-slate-900">
                  {displayName(selectedPatient, 'Patient')}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Provider</span>
                <span className="font-bold text-slate-900">
                  {formatDoctorName(
                    receiptModalInvoice?.provider_name,
                    receiptModalInvoice?.provider_member_id
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-slate-900">
                  {receiptModalInvoice?.service_type || 'Home Consultation'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Service Fee</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(
                    receiptModalInvoice?.service_fee ||
                      receiptModalInvoice?.total_amount
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Travel Fee</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(receiptModalInvoice?.travel_fee || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Paid Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(
                    receiptModalInvoice?.paid_at ||
                      receiptModalInvoice?.created_at
                  )}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(receiptModalInvoice)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  <Download size={15} />
                  Download / Print PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalInvoice(null)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

