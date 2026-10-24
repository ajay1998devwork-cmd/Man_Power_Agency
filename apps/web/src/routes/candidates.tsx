import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, FilePlus2, Plus, Search, UserRound } from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export const Route = createFileRoute('/candidates')({ component: CandidatesPage });

type Candidate = {
  id: string;
  candidateCode: string;
  fullName: string;
  fatherName: string;
  mobile: string;
  designation: string;
  experience?: string;
  status: string;
};

function CandidatesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== '/candidates' || !profile.tenantId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/candidates${query}`,
          {
            headers: { 'x-tenant-id': profile.tenantId as string },
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error('Unable to load candidates.');
        setCandidates((await response.json()) as Candidate[]);
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error(error instanceof Error ? error.message : 'Unable to load candidates.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [pathname, profile.tenantId, search, toast]);

  if (pathname !== '/candidates') return <Outlet />;

  return (
    <AgencyShell>
      <main className="px-5 pb-8 pt-4 md:px-8 md:pb-8 md:pt-5 xl:px-10">
        <div className="mb-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"
          >
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>
        </div>

        <section className="rounded-xl border border-slate-200/80 bg-white shadow-cardHover">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-lg font-bold text-brand">Candidates</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Onboard workers and verify their basic documents for your agency.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:w-72">
                <Search className="size-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search code, name or mobile"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <Link
                to="/candidates/new"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-accent-hover transition"
              >
                <Plus className="size-4" /> Add candidate
              </Link>
            </div>
          </div>

          <div className="max-h-[calc(100vh-12rem)] min-h-[26rem] overflow-auto">
            {loading ? (
              <div className="flex h-[26rem] items-center justify-center text-sm text-slate-400">
                Loading candidates…
              </div>
            ) : candidates.length ? (
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[minmax(220px,1.5fr)_130px_minmax(170px,1fr)_150px_minmax(150px,1fr)_120px_110px_90px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  <span>Candidate name</span>
                  <span>Candidate code</span>
                  <span>Father name</span>
                  <span>Mobile</span>
                  <span>Designation</span>
                  <span>Experience</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="group grid grid-cols-[minmax(220px,1.5fr)_130px_minmax(170px,1fr)_150px_minmax(150px,1fr)_120px_110px_90px] items-center gap-4 px-5 py-4 text-xs transition-colors hover:bg-orange-100/70"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-accent">
                          <UserRound className="size-4" />
                        </div>
                        <span className="truncate text-sm font-bold text-brand">{candidate.fullName}</span>
                      </div>
                      <span className="truncate font-medium text-slate-600 font-mono">{candidate.candidateCode}</span>
                      <span className="truncate text-slate-600">{candidate.fatherName}</span>
                      <span className="truncate text-slate-600">{candidate.mobile}</span>
                      <span className="truncate text-slate-600">{candidate.designation}</span>
                      <span className="truncate text-slate-600">{candidate.experience || '—'}</span>
                      <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        {candidate.status}
                      </span>
                      <Link
                        aria-label={`View ${candidate.fullName}`}
                        to="/candidates/$candidateId"
                        params={{ candidateId: candidate.id }}
                        className="inline-flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-brand transition hover:border-orange-200 hover:bg-orange-50 hover:text-accent shadow-xs"
                      >
                        <Eye className="size-3.5" />
                        <span>View</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[26rem] flex-col items-center justify-center px-5 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-accent">
                  <FilePlus2 className="size-7" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-brand">
                  {search ? 'No candidates found' : 'No candidates yet'}
                </h3>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  {search
                    ? 'Try a different code, name or mobile number.'
                    : 'Create your first candidate record and upload their Aadhaar document and photo.'}
                </p>
                {!search && (
                  <Link
                    to="/candidates/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-hover shadow-sm"
                  >
                    <Plus className="size-4" /> Add first candidate
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </AgencyShell>
  );
}
