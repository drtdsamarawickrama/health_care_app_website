'use client';

import PatientSidebar, {
  PatientMobileNav,
} from '@/components/PatientNavigation';
import { usePatientProfile } from '@/components/PatientProfileContext';
import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  CalendarCheck2,
  Clock3,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Plus,
  Send,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';

import {
  createAppointment,
} from '@/lib/api';

export default function PatientRequestCarePage() {
  const router = useRouter();
  const {
    selectedPatientId,
    selectedPatient,
    loading: profileLoading,
  } = usePatientProfile();

  const [memberId, setMemberId] = useState(null);

  const [serviceType, setServiceType] = useState('Doctor Consultation');
  const [diseaseDescription, setDiseaseDescription] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('Normal');
  const [preferredTime, setPreferredTime] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    if (!selectedPatient) return;
    if (selectedPatient.home_address && !deliveryAddress) {
      setDeliveryAddress(selectedPatient.home_address);
    }
    if (
      (selectedPatient.emergency_contact || selectedPatient.phone) &&
      !emergencyContact
    ) {
      setEmergencyContact(
        selectedPatient.emergency_contact || selectedPatient.phone
      );
    }
  }, [selectedPatient]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      parsedUserType !== 1
    ) {
      router.replace('/login');
      return;
    }

    setMemberId(parsedMemberId);
  }, [router]);

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!serviceType) {
      setError('Please select a service type.');
      return;
    }

    if (!diseaseDescription.trim()) {
      setError('Please enter the disease or care description.');
      return;
    }

    if (!symptoms.trim()) {
      setError('Please enter symptoms.');
      return;
    }

    if (!urgencyLevel) {
      setError('Please select urgency level.');
      return;
    }

    if (!preferredTime) {
      setError('Please select preferred date and time.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter the service address.');
      return;
    }

    if (!emergencyContact.trim()) {
      setError('Please enter an emergency contact number.');
      return;
    }

    setSubmitting(true);

    try {
      const result =
        await createAppointment({
          memberId,
          patientId: selectedPatientId,
          serviceType,
          diseaseDescription:
            diseaseDescription.trim(),
          symptoms:
            symptoms.trim(),
          urgencyLevel,
          preferredTime,
          deliveryAddress:
            deliveryAddress.trim(),
          latitude:
            latitude === ''
              ? null
              : Number(latitude),
          longitude:
            longitude === ''
              ? null
              : Number(longitude),
          emergencyContact:
            emergencyContact.trim(),
        });

      if (!result?.success) {
        setError(
          result?.message ||
            'Unable to create healthcare request.'
        );
        return;
      }

      setSuccess(
        result?.message ||
          'Healthcare request created successfully.'
      );

      setTimeout(() => {
        router.replace(
          '/patient/appointments'
        );
      }, 1000);
    } catch (err) {
      setError(
        err?.message ||
          'Something went wrong while creating the request.'
      );
    } finally {
      setSubmitting(false);
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

    localStorage.removeItem(
      'healthcare_selected_patient_id'
    );

    router.replace('/login');
  };

  if (
    !memberId ||
    profileLoading ||
    !selectedPatientId
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
        <Loader2
          size={32}
          className="
            animate-spin
            text-teal-600
          "
        />
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
        onLogout={handleLogout}
      />

      {/* MAIN */}
      <div
        className="
          min-h-screen
          lg:pl-[270px]
        "
      >
        {/* HEADER */}
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
              px-4
              sm:px-6
              lg:px-8
            "
          >
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="
                mr-3
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
                Request Care
              </p>

              <p
                className="
                  hidden
                  text-xs
                  text-slate-500
                  sm:block
                "
              >
                Create a new healthcare service request
              </p>
            </div>
          </div>
        </header>

        <div
          className="
            mx-auto
            w-full
            max-w-[1300px]
            px-4
            pb-28
            pt-6
            sm:px-6
            lg:px-8
            lg:pb-10
          "
        >
          {/* HERO */}
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
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-teal-300
              "
            >
              Healthcare Request
            </p>

            <h1
              className="
                mt-2
                text-2xl
                font-bold
                sm:text-3xl
              "
            >
              Request Healthcare at Home
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
              Enter your healthcare needs and preferred time.
              Available healthcare providers can review your request
              and submit an offer.
            </p>
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
              {success}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="
              mt-6
              rounded-[26px]
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-7
              lg:p-8
            "
          >
            <div
              className="
                grid
                gap-5
                lg:grid-cols-2
              "
            >
              {/* SERVICE TYPE */}
              <SelectField
                label="Service Type"
                value={serviceType}
                onChange={setServiceType}
                options={[
                  'Doctor Consultation',
                  'Nurse Care',
                  'Injection Service',
                  'Elderly Care',
                  'Wound Dressing',
                  'Physiotherapy',
                ]}
              />

              {/* URGENCY */}
              <SelectField
                label="Urgency Level"
                value={urgencyLevel}
                onChange={setUrgencyLevel}
                options={[
                  'Normal',
                  'Urgent',
                  'Emergency',
                ]}
              />

              {/* DESCRIPTION */}
              <div className="lg:col-span-2">
                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                    text-slate-700
                  "
                >
                  Disease / Care Description
                </label>

                <textarea
                  rows={4}
                  value={diseaseDescription}
                  onChange={(e) =>
                    setDiseaseDescription(
                      e.target.value
                    )
                  }
                  placeholder="Describe the condition or care required..."
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-4
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

              {/* SYMPTOMS */}
              <div className="lg:col-span-2">
                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                    text-slate-700
                  "
                >
                  Symptoms
                </label>

                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) =>
                    setSymptoms(
                      e.target.value
                    )
                  }
                  placeholder="Fever, headache, breathing difficulty..."
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-4
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

              {/* PREFERRED TIME */}
              <Field
                label="Preferred Date & Time"
                icon={Clock3}
                type="datetime-local"
                value={preferredTime}
                onChange={setPreferredTime}
              />

              {/* EMERGENCY CONTACT */}
              <Field
                label="Emergency Contact"
                icon={Phone}
                type="tel"
                value={emergencyContact}
                onChange={setEmergencyContact}
                placeholder="0771234567"
              />

              {/* ADDRESS */}
              <div className="lg:col-span-2">
                <Field
                  label="Service Address"
                  icon={MapPin}
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  placeholder="Enter the address where care is required"
                />
              </div>

              {/* LAT */}
              <Field
                label="Latitude"
                icon={MapPin}
                type="number"
                value={latitude}
                onChange={setLatitude}
                placeholder="Optional"
              />

              {/* LONG */}
              <Field
                label="Longitude"
                icon={MapPin}
                type="number"
                value={longitude}
                onChange={setLongitude}
                placeholder="Optional"
              />
            </div>

            {/* EMERGENCY NOTICE */}
            {urgencyLevel === 'Emergency' && (
              <div
                className="
                  mt-6
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-sm
                  leading-6
                  text-red-700
                "
              >
                <AlertTriangle
                  size={20}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />

                <span>
                  For a life-threatening emergency, contact your local
                  emergency service immediately. This platform request
                  should not delay emergency medical assistance.
                </span>
              </div>
            )}

            <div
              className="
                mt-7
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
                sm:justify-end
              "
            >
              <Link
                href="/patient/dashboard"
                className="
                  flex
                  h-12
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-6
                  text-sm
                  font-bold
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="
                  flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-teal-600
                  px-7
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  shadow-teal-600/20
                  transition
                  hover:bg-teal-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* MOBILE NAV */}
        <PatientMobileNav />
      </div>
    </main>
  );
}

// ===========================================================
// FIELD
// ===========================================================

function Field({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder = '',
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-slate-700
        "
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          size={18}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          step={
            type === 'number'
              ? 'any'
              : undefined
          }
          className="
            h-[54px]
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
            focus:border-teal-500
            focus:ring-4
            focus:ring-teal-500/10
          "
        />
      </div>
    </div>
  );
}

// ===========================================================
// SELECT
// ===========================================================

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-slate-700
        "
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="
          h-[54px]
          w-full
          rounded-2xl
          border
          border-slate-300
          bg-white
          px-4
          text-sm
          text-slate-800
          outline-none
          transition
          focus:border-teal-500
          focus:ring-4
          focus:ring-teal-500/10
        "
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// ===========================================================
// SIDEBAR
// ===========================================================



// ===========================================================
// MOBILE NAV
// ===========================================================

