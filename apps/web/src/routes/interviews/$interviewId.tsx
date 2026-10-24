import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, BriefcaseBusiness, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { InterviewPassedModal } from '@/components/forms/InterviewPassedModal';

export const Route = createFileRoute('/interviews/$interviewId')({ component: EditInterviewPage });

type Interview = {
  id: string;
  interviewerName: string;
  scheduledAt: string;
  mode: string;
  location?: string;
  notes?: string;
  status: string;
  result?: string;
  candidateId: string;
  candidateName?: string;
  candidateCode?: string;
  companyId: string;
  companyName?: string;
};

function EditInterviewPage() {
  const { interviewId } = Route.useParams();
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<Interview | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassedModal, setShowPassedModal] = useState(false);

  useEffect(() => {
    if (!profile.tenantId) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/interviews/${interviewId}`, {
      headers: { 'x-tenant-id': profile.tenantId },
    })
      .then((r) => r.json())
      .then((data) =>
        setForm({
          ...data,
          status: data.result || data.status,
          scheduledAt: data.scheduledAt?.slice(0, 16),
        }),
      )
      .catch(() => toast.error('Interview could not be loaded.'));
  }, [interviewId, profile.tenantId, toast]);

  const update = (key: string, value: string) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    if (key === 'status' && value === 'passed') {
      setShowPassedModal(true);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.tenantId || !form) return;

    // If marking as passed, open the confirmation modal instead of plain submission
    if (form.status === 'passed') {
      setShowPassedModal(true);
      return;
    }

    setSaving(true);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/interviews/${interviewId}/result`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId },
        body: JSON.stringify({
          ...form,
          status: form.status === 'failed' ? 'completed' : form.status,
          result: form.status === 'failed' ? 'failed' : undefined,
        }),
      },
    );
    setSaving(false);
    if (!response.ok) {
      toast.error('Interview could not be updated.');
      return;
    }
    toast.success('Interview updated successfully.');
    navigate({ to: '/interviews' });
  };

  if (!form) {
    return (
      <AgencyShell>
        <main className="p-8 text-sm text-slate-400">Loading interview…</main>
      </AgencyShell>
    );
  }

  const isPassed = form.status === 'passed' || form.result === 'passed';

  return (
    <AgencyShell>
      {/* ── Modern Centered Passed Confirmation Modal ─────────────────────── */}
      <InterviewPassedModal
        isOpen={showPassedModal}
        interview={{
          id: interviewId,
          candidateId: form.candidateId,
          candidateName: form.candidateName || 'Candidate',
          candidateCode: form.candidateCode,
          companyId: form.companyId,
          companyName: form.companyName || 'Client Company',
        }}
        onClose={() => setShowPassedModal(false)}
        onSuccess={() => {
          setForm((f) => (f ? { ...f, status: 'passed', result: 'passed' } : f));
        }}
      />

      <main className="px-5 pb-8 pt-4 md:px-8 md:pt-5 xl:px-10">
        <Link
          to="/interviews"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"
        >
          <ArrowLeft className="size-3.5" /> Back to interviews
        </Link>

        {isPassed && (
          <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                ✓
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-950">Candidate Cleared Interview!</p>
                <p className="text-[11px] text-emerald-800">
                  Worker is ready to be onboarded as an official employee placed at {form.companyName || 'the client'}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPassedModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <BriefcaseBusiness className="size-3.5" /> Onboard as Employee
            </button>
          </div>
        )}

        <form
          onSubmit={submit}
          className="w-full rounded-xl border border-slate-200/80 bg-white p-5 shadow-cardHover"
        >
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <CalendarDays className="size-5 text-accent" />
            <div>
              <h1 className="text-lg font-bold text-brand">Edit Interview</h1>
              <p className="text-xs text-slate-500">Update result, schedule and interview details.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Interview status / result"
              value={form.status}
              onChange={(v) => update('status', v)}
              options={['scheduled', 'passed', 'failed', 'cancelled']}
            />
            <Field
              label="Interviewer name"
              value={form.interviewerName}
              onChange={(v) => update('interviewerName', v)}
            />
            <Field
              label="Date and time"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(v) => update('scheduledAt', v)}
            />
            <Field
              label="Mode"
              value={form.mode}
              onChange={(v) => update('mode', v)}
              options={['in_person', 'online', 'phone']}
            />
            <Field
              label="Location / meeting link"
              value={form.location || ''}
              onChange={(v) => update('location', v)}
            />
            <Field
              label="Notes / feedback"
              value={form.notes || ''}
              onChange={(v) => update('notes', v)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button disabled={saving} type="submit" className="bg-accent font-bold text-white">
              {saving ? 'Saving…' : form.status === 'passed' ? 'Save & Review Onboarding' : 'Save changes'}
            </Button>
          </div>
        </form>
      </main>
    </AgencyShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  options?: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-accent"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-orange-100"
        />
      )}
    </label>
  );
}
