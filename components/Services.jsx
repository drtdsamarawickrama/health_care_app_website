import { Stethoscope, Syringe, HeartHandshake, Bandage, Activity, Users } from 'lucide-react';

const services = [
  { icon: Stethoscope, title: 'Doctor Consultation', text: 'Request a qualified doctor for home consultation and medical guidance.' },
  { icon: Syringe, title: 'Nurse Care', text: 'Access professional nursing support for home-based care and monitoring.' },
  { icon: Bandage, title: 'Wound Dressing', text: 'Get safe wound dressing and follow-up care from trained professionals.' },
  { icon: Activity, title: 'Physiotherapy', text: 'Receive guided physiotherapy support and recovery-focused home sessions.' },
  { icon: HeartHandshake, title: 'Elderly Care', text: 'Support daily care needs for elderly family members with trusted caregivers.' },
  { icon: Users, title: 'Family Profiles', text: 'Manage care information for multiple family members from one account.' },
];

export default function Services() {
  return (
    <section id="services" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">Our Services</p>
          <h2 className="mt-3 text-4xl font-bold text-white">Everything you need for home healthcare</h2>
          <p className="mt-4 text-slate-400">Designed around the same healthcare flow used in the mobile app.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
