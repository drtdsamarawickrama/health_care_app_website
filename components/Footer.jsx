import { Stethoscope } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-400 text-slate-950">
            <Stethoscope size={20} />
          </span>
          <div>
            <p className="font-semibold text-white">HealthCare Home</p>
            <p className="text-xs text-slate-500">Your care, your home.</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">© 2026 HealthCare Home. All rights reserved.</p>
      </div>
    </footer>
  );
}
