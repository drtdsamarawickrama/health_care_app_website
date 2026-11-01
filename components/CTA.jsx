import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section id="contact" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-teal-400 to-cyan-400 p-8 text-slate-950 lg:p-12">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em]">HealthCare Home</p>
              <h2 className="mt-3 text-4xl font-bold">Healthcare support, closer to home.</h2>
              <p className="mt-4 text-slate-800">
                Connect patients and healthcare professionals through a modern, simple, and responsive platform.
              </p>
            </div>

            <Link
              href="#home"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
