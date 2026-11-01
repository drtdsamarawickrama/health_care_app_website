'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  IdCard,
  ShieldPlus,
} from 'lucide-react';

import {
  loginMember,
  checkDoctorProfile,
} from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { saveAuthSession, logout } =
    useAuth();

  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    if (!nic.trim()) {
      setError('Please enter your NIC number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const result = await loginMember({
        phone,
        nic,
        password,
      });

      if (!result?.success) {
        setError(
          result?.message || 'Login failed.'
        );

        return;
      }

      const member = result.member;

      if (!member) {
        setError(
          'Invalid login response. Member data not found.'
        );
        return;
      }

      const memberId = Number(member.id);
      const userType = Number(member.user_type);

      if (!memberId || memberId <= 0) {
        setError(
          'Invalid member ID received from server.'
        );
        return;
      }

      if (userType !== 1 && userType !== 2) {
        logout(null);
        setError(
          'This account has an unsupported user type.'
        );
        return;
      }

      saveAuthSession({
        member,
        memberId,
        userType,
        sessionToken:
          result.session_token || '',
      });

      if (userType === 1) {
        router.replace('/patient/dashboard');
        return;
      }

      if (userType === 2) {
        const doctorCheck =
          await checkDoctorProfile(memberId);

        if (doctorCheck?.doctor) {
          saveAuthSession({
            member,
            memberId,
            userType,
            sessionToken:
              result.session_token || '',
            doctor: doctorCheck.doctor,
          });
        }

        if (
          doctorCheck?.success === true &&
          doctorCheck?.has_profile === true
        ) {
          router.replace('/doctor/dashboard');
        } else {
          router.replace(
            '/doctor/register-profile'
          );
        }

        return;
      }
    } catch (err) {
      setError(
        err?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f8] lg:bg-[#07111b]">
      <div className="min-h-screen lg:flex">

        {/* ======================================================
            LEFT DESKTOP PANEL
        ======================================================= */}
        <section
          className="
            relative
            hidden
            w-[48%]
            overflow-hidden
            bg-[#07111b]
            lg:flex
            lg:flex-col
            lg:justify-between
            lg:px-12
            lg:py-12
            xl:px-16
          "
        >
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="
                absolute
                -left-24
                top-10
                h-80
                w-80
                rounded-full
                bg-teal-400/10
                blur-[110px]
              "
            />

            <div
              className="
                absolute
                bottom-0
                right-0
                h-96
                w-96
                rounded-full
                bg-cyan-400/10
                blur-[120px]
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)]
                bg-[size:60px_60px]
              "
            />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-[18px]
                  bg-teal-500
                  text-white
                  shadow-xl
                  shadow-teal-500/20
                "
              >
                <ShieldPlus size={26} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-[17px] font-bold text-white">
                  HealthCare Home
                </p>

                <p className="text-xs text-slate-400">
                  Your healthcare partner at home
                </p>
              </div>
            </Link>
          </div>

          {/* Main message */}
          <div className="relative z-10 max-w-[520px]">

            <span
              className="
                inline-flex
                rounded-full
                border
                border-teal-400/20
                bg-teal-400/10
                px-4
                py-2
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-teal-300
              "
            >
              Secure Healthcare Access
            </span>

            <h1
              className="
                mt-7
                text-5xl
                font-bold
                leading-[1.06]
                tracking-[-0.04em]
                text-white
                xl:text-[64px]
              "
            >
              Your healthcare,
              <span
                className="
                  mt-2
                  block
                  bg-gradient-to-r
                  from-teal-300
                  to-cyan-300
                  bg-clip-text
                  text-transparent
                "
              >
                wherever you are.
              </span>
            </h1>

            <p
              className="
                mt-7
                max-w-[460px]
                text-base
                leading-7
                text-slate-400
              "
            >
              Access your patient or doctor account
              using the same login details you use
              in the mobile application.
            </p>
          </div>

          {/* Bottom cards */}
          <div
            className="
              relative
              z-10
              grid
              grid-cols-3
              gap-3
            "
          >
            {[
              ['01', 'Secure'],
              ['02', 'Connected'],
              ['03', 'Simple'],
            ].map(([num, text]) => (
              <div
                key={num}
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.035]
                  p-4
                  backdrop-blur
                "
              >
                <p className="text-xs font-bold text-teal-400">
                  {num}
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================
            RIGHT LOGIN AREA
        ======================================================= */}
        <section
          className="
            flex
            min-h-screen
            flex-1
            items-center
            justify-center
            bg-[#f8fafb]
            px-4
            py-8
            sm:px-6
            lg:px-10
          "
        >
          <div
            className="
              w-full
              max-w-[520px]
            "
          >

            {/* ==================================================
                MOBILE LOGO
            =================================================== */}
            <div
              className="
                mb-10
                flex
                flex-col
                items-center
                text-center
                lg:hidden
              "
            >
              <div
                className="
                  flex
                  h-[84px]
                  w-[84px]
                  items-center
                  justify-center
                  rounded-full
                  bg-teal-100
                "
              >
                <div
                  className="
                    flex
                    h-[58px]
                    w-[58px]
                    items-center
                    justify-center
                    rounded-[20px]
                    bg-teal-600
                    text-white
                    shadow-lg
                    shadow-teal-600/20
                  "
                >
                  <ShieldPlus size={30} />
                </div>
              </div>

              <h1
                className="
                  mt-6
                  text-[32px]
                  font-bold
                  tracking-[-0.04em]
                  text-slate-900
                "
              >
                HealthCare Home
              </h1>

              <p
                className="
                  mt-2
                  text-[15px]
                  text-slate-500
                "
              >
                Your healthcare partner at home
              </p>
            </div>

            {/* ==================================================
                LOGIN CARD
            =================================================== */}
            <div
              className="
                rounded-[30px]
                bg-white
                p-5
                shadow-none
                sm:p-8
                lg:border
                lg:border-slate-200
                lg:p-10
                lg:shadow-[0_30px_80px_rgba(15,23,42,0.12)]
                xl:p-12
              "
            >

              {/* Header */}
              <div>
                <h2
                  className="
                    text-[28px]
                    font-bold
                    tracking-[-0.03em]
                    text-slate-900
                    sm:text-[30px]
                  "
                >
                  Welcome Back
                </h2>

                <p
                  className="
                    mt-2
                    text-[14px]
                    leading-6
                    text-slate-500
                    sm:text-[15px]
                  "
                >
                  Sign in using your phone number,
                  NIC number and password.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="
                    mt-6
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

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >

                {/* Phone */}
                <div>
                  <div className="relative">

                    <Phone
                      size={22}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-500
                      "
                    />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="Phone Number"
                      autoComplete="tel"
                      className="
                        h-[58px]
                        w-full
                        rounded-2xl
                        border
                        border-slate-300
                        bg-white
                        pl-13
                        pr-4
                        text-[16px]
                        text-slate-800
                        outline-none
                        transition-all
                        placeholder:text-slate-500
                        focus:border-teal-500
                        focus:ring-4
                        focus:ring-teal-500/10
                      "
                    />
                  </div>
                </div>

                {/* NIC */}
                <div>
                  <div className="relative">

                    <IdCard
                      size={22}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-500
                      "
                    />

                    <input
                      type="text"
                      value={nic}
                      onChange={(e) =>
                        setNic(
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="NIC Number"
                      autoComplete="username"
                      className="
                        h-[58px]
                        w-full
                        rounded-2xl
                        border
                        border-slate-300
                        bg-white
                        pl-13
                        pr-4
                        text-[16px]
                        uppercase
                        text-slate-800
                        outline-none
                        transition-all
                        placeholder:normal-case
                        placeholder:text-slate-500
                        focus:border-teal-500
                        focus:ring-4
                        focus:ring-teal-500/10
                      "
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="relative">

                    <LockKeyhole
                      size={22}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-500
                      "
                    />

                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Password"
                      autoComplete="current-password"
                      className="
                        h-[58px]
                        w-full
                        rounded-2xl
                        border
                        border-slate-300
                        bg-white
                        pl-13
                        pr-12
                        text-[16px]
                        text-slate-800
                        outline-none
                        transition-all
                        placeholder:text-slate-500
                        focus:border-teal-500
                        focus:ring-4
                        focus:ring-teal-500/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-500
                        transition
                        hover:text-teal-600
                      "
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff size={22} />
                      ) : (
                        <Eye size={22} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="
                      text-sm
                      font-semibold
                      text-teal-600
                      transition
                      hover:text-teal-700
                    "
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    flex
                    h-[58px]
                    w-full
                    items-center
                    justify-center
                    rounded-2xl
                    bg-teal-600
                    text-[16px]
                    font-bold
                    text-white
                    shadow-lg
                    shadow-teal-600/20
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-teal-700
                    hover:shadow-xl
                    hover:shadow-teal-600/25
                    active:translate-y-0
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loading ? (
                    <span
                      className="
                        h-5
                        w-5
                        animate-spin
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                      "
                    />
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              {/* Register */}
              <p
                className="
                  mt-7
                  text-center
                  text-sm
                  text-slate-500
                "
              >
                Don&apos;t have an account?{' '}

                <Link
                  href="/register"
                  className="
                    font-bold
                    text-teal-600
                    underline-offset-4
                    transition
                    hover:text-teal-700
                    hover:underline
                  "
                >
                  Register
                </Link>
              </p>
            </div>

            {/* Mobile footer */}
            <p
              className="
                mt-6
                text-center
                text-xs
                text-slate-400
                lg:hidden
              "
            >
              Secure healthcare access for patients and doctors.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}