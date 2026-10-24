import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Eye, Plus, Search } from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export const Route = createFileRoute('/companies/')({ component: CompaniesPage });
type Company = { id: string; name: string; code: string; industry?: string | null; addressLine1?: string | null; city: string; state: string; primaryContactName: string; primaryContactPhone: string; hrContactName?: string | null; hrContactPhone?: string | null; status: string };
type CompanyResponse = { data: Company[]; total: number; page: number; limit: number; totalPages: number };

function CompaniesPage() {
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile.tenantId) { setIsLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' });
        if (search.trim()) params.set('search', search.trim());
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies?${params}`, { headers: { 'x-tenant-id': profile.tenantId as string }, signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load companies.');
        const result = await response.json() as CompanyResponse;
        setCompanies(result.data || []);
        setPagination({ total: result.total || 0, totalPages: result.totalPages || 0 });
      } catch (error) { if (!controller.signal.aborted) toast.error(error instanceof Error ? error.message : 'Unable to load companies.'); } finally { if (!controller.signal.aborted) setIsLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [profile.tenantId, search, page, toast]);

  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  const firstRecord = pagination.total ? (page - 1) * 10 + 1 : 0;
  const lastRecord = Math.min(page * 10, pagination.total);

  return <AgencyShell><main className="px-5 pb-8 pt-4 md:px-8 md:pb-8 md:pt-5 xl:px-10 xl:pb-10 xl:pt-6"><div className="mb-3"><Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="size-3.5" /> Dashboard</Link></div><section className="rounded-xl border border-slate-200/80 bg-white shadow-cardHover"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center"><div><h1 className="text-lg font-bold text-brand">Companies</h1><p className="mt-0.5 text-xs text-slate-500">Manage contractor companies, contacts, branches, and contracts for this agency.</p></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:w-72"><Search className="size-4 shrink-0 text-slate-400" /><input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search companies" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></div><Link to="/companies/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-accent-hover"><Plus className="size-4" /> Add company</Link></div></div><div className="max-h-[calc(100vh-12rem)] min-h-[26rem] overflow-auto">{isLoading ? <div className="flex h-[26rem] items-center justify-center text-sm text-slate-400">Loading companies…</div> : companies.length ? <div className="min-w-[1080px]"><div className="grid grid-cols-[minmax(220px,1.4fr)_120px_150px_minmax(220px,1.4fr)_170px_170px_110px_100px] gap-4 border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"><span>Company name</span><span>Company code</span><span>Industry</span><span>Address</span><span>Main contact</span><span>HR contact</span><span>Status</span><span>Action</span></div><div className="divide-y divide-slate-100">{companies.map((company) => <div key={company.id} className="group grid grid-cols-[minmax(220px,1.4fr)_120px_150px_minmax(220px,1.4fr)_170px_170px_110px_100px] items-center gap-4 px-4 py-4 text-xs transition-colors hover:bg-slate-200/70"><div className="flex min-w-0 items-center gap-2.5"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[10px] font-bold text-accent">{company.name.slice(0, 2).toUpperCase()}</div><span className="truncate text-sm font-bold text-brand">{company.name}</span></div><span className="truncate font-medium text-slate-600">{company.code}</span><span className="truncate text-slate-600">{company.industry || '—'}</span><span className="truncate text-slate-600">{company.addressLine1 ? `${company.addressLine1}, ` : ''}{company.city}, {company.state}</span><div className="min-w-0"><p className="truncate font-semibold text-slate-700">{company.primaryContactName}</p><p className="truncate text-[11px] text-slate-500">{company.primaryContactPhone}</p></div><div className="min-w-0"><p className="truncate font-semibold text-slate-700">{company.hrContactName || '—'}</p><p className="truncate text-[11px] text-slate-500">{company.hrContactPhone || '—'}</p></div><span className={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${company.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{company.status}</span><Link aria-label={`View ${company.name}`} to="/companies/$companyId" params={{ companyId: company.id }} className="inline-flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-bold text-brand transition hover:border-orange-200 hover:bg-orange-50 hover:text-accent"><Eye className="size-3.5" /><span>View</span><ChevronRight className="size-3.5" /></Link></div>)}</div></div> : <div className="flex h-[26rem] flex-col items-center justify-center px-5 text-center"><div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-accent"><Building2 className="size-7" /></div><h3 className="mt-4 text-sm font-bold text-brand">{search ? 'No companies found' : 'Your company list is empty'}</h3><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{search ? 'Try a different company name or code.' : 'Create your first company to start managing contacts, branches, and contracts.'}</p>{!search && <Link to="/companies/new" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-hover"><Plus className="size-4" /> Create company</Link>}</div>}</div>{!isLoading && pagination.total > 0 && <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Showing {firstRecord}–{lastRecord} of {pagination.total} companies</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-brand hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /> Previous</button><span className="px-2 font-semibold text-brand">Page {page} of {pagination.totalPages}</span><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-brand hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="size-3.5" /></button></div></div>}</section></main></AgencyShell>;
}
