'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, HeartPulse, ShieldCheck, Clock3 } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.18),transparent_28%)]" />

      <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-sm text-teal-200">
            <HeartPulse size={16} />
            Smart healthcare at home
          </div>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Find trusted healthcare professionals
            <span className="block bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
              right when you need them.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Book doctor consultations, nurse care, home visits, prescriptions,
            and ongoing support from one simple healthcare platform.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              Explore Services <ArrowRight size={18} />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              How It Works
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              [ShieldCheck, 'Verified', 'Professionals'],
              [Clock3, 'Fast', 'Booking'],
              [HeartPulse, 'Home', 'Care'],
            ].map(([Icon, top, bottom]) => (
              <div key={top} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Icon className="mb-3 text-teal-300" size={22} />
                <p className="font-semibold text-white">{top}</p>
                <p className="text-sm text-slate-400">{bottom}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative"
        >
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Today&apos;s care</p>
                  <h3 className="text-xl font-semibold text-white">Your Health Dashboard</h3>
                </div>
                <span className="rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-300">Online</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Doctor Consultation', 'Available now'],
                  ['Nurse Home Care', 'Nearby providers'],
                  ['Prescription History', 'Secure access'],
                  ['Appointments', 'Easy scheduling'],
                ].map(([title, subtitle]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-3 h-10 w-10 rounded-xl bg-teal-400/10" />
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-400 p-5 text-slate-950">
                <p className="text-sm font-medium">Need medical support?</p>
                <p className="mt-1 text-xl font-bold">Request a healthcare provider in minutes.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
