const steps = [
  ['01', 'Create your profile', 'Register and set up your personal or family healthcare profile.'],
  ['02', 'Choose a service', 'Select the type of doctor, nurse, or home-care service you need.'],
  ['03', 'Connect with a provider', 'Review available providers and confirm the best option for your care.'],
  ['04', 'Receive care', 'Track the appointment, receive treatment, and access prescriptions afterward.'],
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">How it works</p>
          <h2 className="mt-3 text-4xl font-bold text-white">Simple care in four steps</h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {steps.map(([number, title, text]) => (
              <div key={number} className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <span className="text-sm font-bold text-teal-300">{number}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
