import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  return (
    <main className="min-h-screen p-5 md:p-8 xl:p-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">Agency workspace</p><h1 className="text-2xl font-bold tracking-tight text-brand">Good morning, welcome back</h1><p className="mt-2 text-sm text-slate-500">Keep your workforce operations moving from one clear view.</p></div><Link to="/login" className="text-sm font-semibold text-brand hover:text-accent">Sign out</Link></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><h3 className="text-sm font-semibold text-slate-600">Candidates</h3><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">In your talent pool</p>
        </div>
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><h3 className="text-sm font-semibold text-slate-600">Employees</h3><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">Currently placed</p>
        </div>
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><h3 className="text-sm font-semibold text-slate-600">Clients</h3><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">Active partnerships</p>
        </div>
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><h3 className="text-sm font-semibold text-slate-600">Locations</h3><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">Operational branches</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-brand p-6 text-white shadow-card"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Get started</p><h2 className="mt-3 text-xl font-bold">Build your agency workspace</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Start by adding your clients and candidates. Your operational overview will grow with every record you create.</p></div>
    </main>
  );
}
