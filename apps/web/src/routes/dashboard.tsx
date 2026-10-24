import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Building2, CheckCircle2, Clock3, Plus, Users } from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const profile = getWorkspaceProfile();
  const userName = profile.userName || 'there';
  const agencyName = profile.agencyName || 'your agency';
  return (
    <AgencyShell><main className="p-5 md:p-8 xl:p-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">Agency workspace</p><h1 className="text-2xl font-bold tracking-tight text-brand">Good morning, {userName}</h1><p className="mt-2 text-sm text-slate-500">Here’s what’s happening across {agencyName} today.</p></div><Link to="/companies/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-accent-hover"><Plus className="size-4" /> Add company</Link></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-600">Candidates</h3><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users className="size-4" /></div></div><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">In your talent pool</p>
        </div>
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-600">Employees</h3><div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 className="size-4" /></div></div><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">Currently placed</p>
        </div>
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-600">Companies</h3><div className="rounded-lg bg-orange-50 p-2 text-accent"><Building2 className="size-4" /></div></div><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">Your company accounts</p>
        </div>
        <div className="rounded-2xl border-0 bg-white p-5 shadow-card"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-600">Open contracts</h3><div className="rounded-lg bg-violet-50 p-2 text-violet-600"><Clock3 className="size-4" /></div></div><p className="mt-4 text-3xl font-extrabold text-brand">0</p><p className="mt-1 text-xs text-slate-400">Across all companies</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]"><section className="rounded-2xl bg-white shadow-card"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-bold text-brand">Company directory</h2><p className="mt-1 text-xs text-slate-500">Manage companies and their branches</p></div><Link to="/companies" className="flex items-center gap-1 text-xs font-bold text-accent">View all <ArrowRight className="size-3.5" /></Link></div><div className="flex flex-col items-center px-5 py-12 text-center"><div className="flex size-12 items-center justify-center rounded-xl bg-orange-50 text-accent"><Building2 className="size-6" /></div><h3 className="mt-4 text-sm font-bold text-brand">No companies added yet</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Create your first company to start managing contacts, branches, and contracts.</p><Link to="/companies/new" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-hover"><Plus className="size-4" /> Create first company</Link></div></section><section className="rounded-2xl bg-brand p-6 text-white shadow-card"><div className="flex size-10 items-center justify-center rounded-xl bg-white/10"><Building2 className="size-5 text-orange-300" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Workspace health</p><h2 className="mt-2 text-xl font-bold">Ready to grow</h2><p className="mt-2 text-sm leading-6 text-slate-300">Set up your first company and keep every workforce operation organized by tenant.</p></section></div>
    </main></AgencyShell>
  );
}
