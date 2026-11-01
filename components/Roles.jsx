import { UserRound, Stethoscope, Cross, HandHeart } from 'lucide-react';

const roles = [
  { icon: UserRound, title: 'Patients', text: 'Book appointments, manage family members, and access prescriptions.' },
  { icon: Stethoscope, title: 'Doctors', text: 'Accept consultations, review patient details, and provide prescriptions.' },
  { icon: Cross, title: 'Nurses', text: 'Respond to care requests and support patients with home nursing services.' },
  { icon: HandHeart, title: 'Caregivers', text: 'Support elderly care and day-to-day health assistance at home.' },
];

export default function Roles() {
  return (
    <section id="roles" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">Built for everyone</p>
          <h2 className="mt-3 text-4xl font-bold text-white">One platform. Multiple care roles.</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {roles.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <Icon className="text-teal-300" size={28} />
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
