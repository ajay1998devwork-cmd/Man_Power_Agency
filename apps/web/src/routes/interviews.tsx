import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Plus } from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';
import { InterviewPassedModal, PassedInterviewData } from '@/components/forms/InterviewPassedModal';

export const Route = createFileRoute('/interviews')({ component: InterviewsPage });

type Interview = {
  id: string;
  companyId: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateCode: string;
  interviewerName: string;
  scheduledAt: string;
  mode: string;
  location?: string;
  status: string;
  result?: string;
};

function InterviewsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForPassing, setSelectedForPassing] = useState<PassedInterviewData | null>(null);

  const fetchInterviews = () => {
    if (!profile.tenantId) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/interviews`, {
      headers: { 'x-tenant-id': profile.tenantId },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Interviews could not be loaded.');
        return response.json() as Promise<Interview[]>;
      })
      .then(setInterviews)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Interviews could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (pathname !== '/interviews' || !profile.tenantId) return;
    fetchInterviews();
  }, [pathname, profile.tenantId, toast]);

  if (pathname !== '/interviews') return <Outlet />;

  return (
    <AgencyShell>
      {/* ── Modern Centered Passed Confirmation Modal ───────────────────── */}
      <InterviewPassedModal
        isOpen={!!selectedForPassing}
        interview={selectedForPassing}
        onClose={() => setSelectedForPassing(null)}
        onSuccess={() => {
          fetchInterviews();
        }}
      />

      <main className="px-5 pb-8 pt-4 md:px-8 md:pt-5 xl:px-10">
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-cardHover">
          <header className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-lg font-bold text-brand">Candidate Interviews</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Track scheduled interviews, record results, and officially onboard cleared candidates as employees.
              </p>
            </div>
            <Link
              to="/interviews/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition"
            >
              <Plus className="size-4" /> Schedule interview
            </Link>
          </header>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-slate-400">
              Loading interviews…
            </div>
          ) : interviews.length ? (
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                <div className="grid grid-cols-[180px_200px_160px_170px_110px_130px_170px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <span>Client Company</span>
                  <span>Candidate</span>
                  <span>Interviewer</span>
                  <span>Date & time</span>
                  <span>Mode</span>
                  <span>Result / Status</span>
                  <span>Action</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {interviews.map((interview) => {
                    const isPassed = interview.result === 'passed';
                    const isFailed = interview.result === 'failed';

                    return (
                      <div
                        key={interview.id}
                        className="grid grid-cols-[180px_200px_160px_170px_110px_130px_170px] items-center gap-4 px-5 py-4 text-xs transition-colors hover:bg-orange-50/70"
                      >
                        <span className="truncate font-bold text-brand">{interview.companyName}</span>
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-slate-800">
                            {interview.candidateName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {interview.candidateCode}
                          </span>
                        </div>
                        <span className="truncate text-slate-600">{interview.interviewerName}</span>
                        <span className="text-slate-600">
                          {new Date(interview.scheduledAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="capitalize text-slate-600">
                          {interview.mode.replace('_', ' ')}
                        </span>
                        <div>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isFailed
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {interview.result || interview.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isPassed ? (
                            <button
                              onClick={() =>
                                setSelectedForPassing({
                                  id: interview.id,
                                  candidateId: interview.candidateId,
                                  candidateName: interview.candidateName,
                                  candidateCode: interview.candidateCode,
                                  companyId: interview.companyId,
                                  companyName: interview.companyName,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                            >
                              <CheckCircle2 className="size-3" />
                              <span>Pass & Onboard</span>
                            </button>
                          ) : (
                            <Link
                              to="/candidates/$candidateId"
                              params={{ candidateId: interview.candidateId }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1.5 text-[11px] font-bold hover:bg-emerald-100 transition"
                            >
                              <BriefcaseBusiness className="size-3" />
                              <span>View Onboarded</span>
                            </Link>
                          )}

                          <Link
                            to="/interviews/$interviewId"
                            params={{ interviewId: interview.id }}
                            className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 shadow-xs transition"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-accent">
                <CalendarDays className="size-7" />
              </div>
              <p className="mt-3 text-sm font-bold text-brand">No interviews scheduled</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Schedule candidate interviews with client companies. Cleared candidates can be immediately converted into official employees.
              </p>
            </div>
          )}
        </section>
      </main>
    </AgencyShell>
  );
}
