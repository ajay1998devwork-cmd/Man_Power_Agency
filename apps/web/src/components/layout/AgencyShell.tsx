import { useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Building2, BriefcaseBusiness, CalendarDays, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { getWorkspaceProfile } from '@/lib/workspace';

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Companies', to: '/companies', icon: Building2 },
  { label: 'Candidates', to: '/candidates', icon: Users },
  { label: 'Interviews', to: '/interviews', icon: CalendarDays },
  { label: 'Employees', to: '/employees', icon: BriefcaseBusiness },
  { label: 'Contracts', to: '/clients', icon: FileText },
] as const;

export function AgencyShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const profile = getWorkspaceProfile();
  const agencyName = profile.agencyName || 'Your agency';
  const userName = profile.userName || 'Workspace user';
  const initials = userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const logout = () => { localStorage.removeItem('manpower_access_token'); localStorage.removeItem('manpower_workspace_profile'); navigate({ to: '/login' }); };

  return <div className="min-h-screen bg-slate-100">
    {isOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-brand/30 lg:hidden" onClick={() => setIsOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand text-white transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-6"><Link to="/dashboard" className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-white text-brand"><Building2 className="size-5" /></span><span><span className="block font-bold tracking-tight">Manpower</span><span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">Agency workspace</span></span></Link><button className="text-slate-300 lg:hidden" onClick={() => setIsOpen(false)}><X className="size-5" /></button></div>
      <div className="border-b border-white/10 px-4 py-5"><button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-3 text-left hover:bg-white/15"><span className="flex size-9 items-center justify-center rounded-lg bg-orange-400/20 text-xs font-bold text-orange-200">{agencyName.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{agencyName}</span><span className="block text-xs text-slate-400">Current agency</span></span><ChevronDown className="size-4 text-slate-400" /></button></div>
      <nav className="flex-1 space-y-1 px-3 py-5">{navigation.map(({ label, to, icon: Icon }) => { const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to)); return <Link key={label} to={to} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-white text-brand shadow-sm font-semibold' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon className="size-4" />{label}</Link>; })}</nav>
      <div className="border-t border-white/10 p-3"><Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"><Settings className="size-4" />Workspace settings</Link><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-400/10 hover:text-red-200"><LogOut className="size-4" />Logout</button></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button aria-label="Open navigation" className="rounded-lg p-2 text-brand hover:bg-slate-100 lg:hidden" onClick={() => setIsOpen(true)}><Menu className="size-5" /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Agency workspace</p><p className="mt-0.5 text-sm font-semibold text-brand">{agencyName}</p></div></div><div className="flex items-center gap-3"><button className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 sm:block">Help center</button><div className="flex items-center gap-2 border-l border-slate-200 pl-3"><span className="flex size-9 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-accent">{initials}</span><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-brand">{userName}</p><p className="text-[10px] text-slate-400">{profile.userRole || 'Agency user'}</p></div></div></div></header>{children}</div>
  </div>;
}
