import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  FilePlus2,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export const Route = createFileRoute('/employees')({ component: EmployeesPage });

type Employee = {
  id: string;
  agencyEmployeeCode: string;
  status: string;
  firstJoiningDate?: string;
  fullName: string;
  mobile: string;
  designation: string;
  currentCompanyId?: string;
  companyName?: string;
  companyCode?: string;
};

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  benched:  'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

function EmployeesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'benched' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== '/employees' || !profile.tenantId) { setLoading(false); return; }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/employees${q}`,
          { headers: { 'x-tenant-id': profile.tenantId! }, signal: ctrl.signal },
        );
        if (!res.ok) throw new Error('Could not load employees.');
        setEmployees(await res.json() as Employee[]);
      } catch (e) {
        if (!ctrl.signal.aborted) toast.error(e instanceof Error ? e.message : 'Could not load employees.');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [pathname, profile.tenantId, search, toast]);

  if (pathname !== '/employees') return <Outlet />;

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter === 'all') return true;
    return emp.status === statusFilter;
  });

  const counts = {
    all: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    benched: employees.filter((e) => e.status === 'benched').length,
    inactive: employees.filter((e) => e.status === 'inactive').length,
  };

  return (
    <AgencyShell>
      <main className="px-5 pb-8 pt-4 md:px-8 md:pb-8 md:pt-5 xl:px-10">
        <div className="mb-3">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand">
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>
        </div>

        <section className="rounded-xl border border-slate-200/80 bg-white shadow-cardHover">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BriefcaseBusiness className="size-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-brand">Agency Employees & Placements</h1>
                  <p className="text-xs text-slate-500">
                    Official workforce assigned unique agency employee codes & placed at client companies.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:w-80">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, EMP code, company, mobile"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            {(
              [
                ['all', 'All Employees', counts.all],
                ['active', 'Active Placed', counts.active],
                ['benched', 'Benched (Available)', counts.benched],
                ['inactive', 'Inactive', counts.inactive],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === key
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    statusFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="max-h-[calc(100vh-14rem)] min-h-[26rem] overflow-auto">
            {loading ? (
              <div className="flex h-[26rem] items-center justify-center text-sm text-slate-400">
                Loading employees…
              </div>
            ) : filteredEmployees.length ? (
              <div className="min-w-[1100px]">
                {/* Column headers */}
                <div className="grid grid-cols-[minmax(220px,1.6fr)_160px_140px_minmax(160px,1fr)_180px_130px_100px] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  <span>Employee Name</span>
                  <span>Agency EMP Code</span>
                  <span>Mobile</span>
                  <span>Designation</span>
                  <span>Current Company</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="group grid grid-cols-[minmax(220px,1.6fr)_160px_140px_minmax(160px,1fr)_180px_130px_100px] items-center gap-4 px-5 py-4 text-xs transition-colors hover:bg-orange-50/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Users className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-bold text-brand">{emp.fullName}</span>
                          <span className="text-[10px] text-slate-400">Since {emp.firstJoiningDate ? new Date(emp.firstJoiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</span>
                        </div>
                      </div>
                      <span className="truncate font-mono font-bold text-accent">{emp.agencyEmployeeCode}</span>
                      <span className="truncate text-slate-600">{emp.mobile}</span>
                      <span className="truncate text-slate-700 font-medium">{emp.designation}</span>
                      <div className="min-w-0 truncate">
                        {emp.companyName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 shrink-0 text-slate-400" />
                            <span className="font-semibold text-brand truncate">{emp.companyName}</span>
                          </div>
                        ) : (
                          <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            Benched (Available)
                          </span>
                        )}
                      </div>
                      <div>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[emp.status] ?? STATUS_BADGE.inactive}`}>
                          {emp.status}
                        </span>
                      </div>
                      <Link
                        to="/employees/$employeeId"
                        params={{ employeeId: emp.id }}
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-brand transition hover:border-orange-200 hover:bg-orange-50 hover:text-accent shadow-xs"
                      >
                        <UserCheck className="size-3.5" />
                        <span>View</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[26rem] flex-col items-center justify-center px-5 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FilePlus2 className="size-7" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-brand">
                  {search ? 'No employees matching search' : statusFilter !== 'all' ? `No ${statusFilter} employees found` : 'No employees onboarded yet'}
                </h3>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  {search
                    ? 'Try searching by agency code (e.g. EMP-DEMO-0001), employee name, company name, or mobile.'
                    : 'Candidates who pass interviews are converted to official employees with unique agency codes.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </AgencyShell>
  );
}
