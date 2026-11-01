'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Phone,
  ShieldPlus,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import { loginMember, registerMember } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { saveAuthSession } = useAuth();

  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [userType, setUserType] = useState(1);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

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

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (userType !== 1 && userType !== 2) {
      setError('Please select a valid user type.');
      return;
    }

    setLoading(true);

    try {
      const result = await registerMember({
        phone,
        nic,
        password,
        userType,
      });

      if (!result?.success) {
        setError(
          result?.message || 'Registration failed.'
        );
        return;
      }

      const memberId = Number(result.member_id);

      if (!memberId || memberId <= 0) {
        setError(
          'Registration succeeded but member ID was not received.'
        );
        return;
      }

      setSuccess(
        result?.message || 'Registration successful. Redirecting to profile setup...'
      );

      let loginResult = null;
      try {
        loginResult = await loginMember({
          phone,
          nic,
          password,
        });
      } catch {
        // Fallback if auto-login fails
      }

      if (loginResult?.success && loginResult?.member) {
        saveAuthSession({
          member: loginResult.member,
          memberId: Number(loginResult.member.id || memberId),
          userType: Number(loginResult.member.user_type || userType),
          patientId: Number(loginResult.member.patient_id || 0),
          doctorId: Number(loginResult.member.doctor_id || 0),
          sessionToken: loginResult.session_token || '',
        });
      } else {
        saveAuthSession({
          member: {
            id: memberId,
            phone: phone.trim(),
            nic: nic.trim().toUpperCase(),
            user_type: userType,
          },
          memberId,
          userType,
        });
      }

      if (userType === 1) {
        setTimeout(() => {
          router.replace('/patient/complete-profile');
        }, 700);
        return;
      }

      if (userType === 2) {
        setTimeout(() => {
          router.replace('/doctor/register-profile');
        }, 700);
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

        {/* =====================================================
            LEFT DESKTOP PANEL
        ====================================================== */}
        <section
          className="
            relative
            hidden
            w-[46%]
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
          <div className="pointer-events-none absolute inset-0">
            <div
              className="
                absolute
                -left-24
                top-16
                h-[380px]
                w-[380px]
                rounded-full
                bg-teal-400/10
                blur-[120px]
              "
            />

            <div
              className="
                absolute
                bottom-[-60px]
                right-[-80px]
                h-[420px]
                w-[420px]
                rounded-full
                bg-cyan-400/10
                blur-[130px]
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
              Create Your Account
            </span>

            <h1
              className="
                mt-7
                text-5xl
                font-bold
                leading-[1.06]
                tracking-[-0.04em]
                text-white
                xl:text-[62px]
              "
            >
              One account.
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
                App and Web.
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
              Register once and use the same healthcare account
              from the mobile application or this website.
            </p>
          </div>

          {/* Bottom cards */}
          <div
            className="
              relative
              z-10
              grid
              grid-cols-2
              gap-3
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                p-5
              "
            >
              <UserRound
                size={22}
                className="text-teal-400"
              />

              <p className="mt-4 font-semibold text-white">
                Patient
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Request healthcare services and manage your care.
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                p-5
              "
            >
              <Stethoscope
                size={22}
                className="text-teal-400"
              />

              <p className="mt-4 font-semibold text-white">
                Doctor
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Register your professional profile and provide care.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT REGISTER AREA
        ====================================================== */}
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
          <div className="w-full max-w-[560px]">

            {/* Mobile logo */}
            <div
              className="
                mb-8
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
                  h-[78px]
                  w-[78px]
                  items-center
                  justify-center
                  rounded-full
                  bg-teal-100
                "
              >
                <div
                  className="
                    flex
                    h-[54px]
                    w-[54px]
                    items-center
                    justify-center
                    rounded-[18px]
                    bg-teal-600
                    text-white
                    shadow-lg
                    shadow-teal-600/20
                  "
                >
                  <ShieldPlus size={28} />
                </div>
              </div>

              <h1
                className="
                  mt-5
                  text-[30px]
                  font-bold
                  tracking-[-0.04em]
                  text-slate-900
                "
              >
                HealthCare Home
              </h1>

              <p className="mt-2 text-[14px] text-slate-500">
                Create your healthcare account
              </p>
            </div>

            {/* Register card */}
            <div
              className="
                rounded-[30px]
                bg-white
                p-5
                sm:p-8
                lg:border
                lg:border-slate-200
                lg:p-10
                lg:shadow-[0_30px_80px_rgba(15,23,42,0.12)]
                xl:p-12
              "
            >
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
                  Create Account
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
                  Use the same account from the mobile app
                  and website.
                </p>
              </div>

              {/* Alerts */}
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

              {success && (
                <div
                  className="
                    mt-6
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

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >

                {/* Phone */}
                <div className="relative">
                  <Phone
                    size={21}
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
                      pl-12
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

                {/* NIC */}
                <div className="relative">
                  <IdCard
                    size={21}
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
                      pl-12
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

                {/* Password */}
                <div className="relative">
                  <LockKeyhole
                    size={21}
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
                    autoComplete="new-password"
                    className="
                      h-[58px]
                      w-full
                      rounded-2xl
                      border
                      border-slate-300
                      bg-white
                      pl-12
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
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <LockKeyhole
                    size={21}
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
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    className="
                      h-[58px]
                      w-full
                      rounded-2xl
                      border
                      border-slate-300
                      bg-white
                      pl-12
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
                      setShowConfirmPassword(
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
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>

                {/* User Type */}
                <div>
                  <p
                    className="
                      mb-3
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    I am registering as
                  </p>

                  <div className="grid grid-cols-2 gap-3">

                    {/* Patient */}
                    <button
                      type="button"
                      onClick={() =>
                        setUserType(1)
                      }
                      className={`
                        flex
                        min-h-[96px]
                        flex-col
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        px-4
                        py-4
                        text-center
                        transition-all
                        duration-200
                        ${
                          userType === 1
                            ? 'border-teal-500 bg-teal-50 text-teal-700 ring-4 ring-teal-500/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40'
                        }
                      `}
                    >
                      <UserRound size={24} />

                      <span className="mt-2 text-sm font-bold">
                        Patient
                      </span>
                    </button>

                    {/* Doctor */}
                    <button
                      type="button"
                      onClick={() =>
                        setUserType(2)
                      }
                      className={`
                        flex
                        min-h-[96px]
                        flex-col
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        px-4
                        py-4
                        text-center
                        transition-all
                        duration-200
                        ${
                          userType === 2
                            ? 'border-teal-500 bg-teal-50 text-teal-700 ring-4 ring-teal-500/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40'
                        }
                      `}
                    >
                      <Stethoscope size={24} />

                      <span className="mt-2 text-sm font-bold">
                        Doctor
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit */}
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
                    'Create Account'
                  )}
                </button>
              </form>

              <p
                className="
                  mt-7
                  text-center
                  text-sm
                  text-slate-500
                "
              >
                Already have an account?{' '}

                <Link
                  href="/login"
                  className="
                    font-bold
                    text-teal-600
                    transition
                    hover:text-teal-700
                    hover:underline
                  "
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}