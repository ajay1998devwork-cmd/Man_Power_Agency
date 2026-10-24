import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Eye,
  FilePlus2,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { InterviewPassedModal } from '@/components/forms/InterviewPassedModal';

export const Route = createFileRoute('/candidates/$candidateId')({ component: CandidateDetailsPage });

/* ── Types ──────────────────────────────────────────────────────────────── */
type Document = {
  id: string;
  documentType: string;
  originalName: string;
  verificationStatus: string;
  remarks?: string | null;
};

type Bank = {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  panNumber?: string;
};

type Interview = {
  id: string;
  companyId: string;
  companyName?: string;
  companyCode?: string;
  interviewerName: string;
  scheduledAt: string;
  mode: string;
  location?: string;
  status: string;
  result?: string | null;
  feedback?: string | null;
};

type CandidateEmployee = {
  id: string;
  agencyEmployeeCode: string;
  status: string;
};

type Candidate = {
  id: string;
  candidateCode: string;
  fullName: string;
  fatherName: string;
  aadhaarNumber: string;
  mobile: string;
  alternateMobile: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  designation: string;
  experience?: string;
  currentAddress: string;
  permanentAddress: string;
  status: string;
  documents: Document[];
  bankDetails?: Bank | null;
  interviewHistory?: Interview[];
  employee?: CandidateEmployee | null;
};

const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-orange-100';

const STATUS_BADGE: Record<string, string> = {
  onboarding:        'bg-slate-100 text-slate-700 border-slate-200',
  verified:          'bg-blue-50 text-blue-700 border-blue-200',
  interview_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  employed:          'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:          'bg-red-50 text-red-700 border-red-200',
};

/* ── Main Candidate Details Page ─────────────────────────────────────────── */
function CandidateDetailsPage() {
  const { candidateId } = Route.useParams();
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState<Partial<Candidate>>({});
  const [bank, setBank] = useState<Bank>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [uploading, setUploading] = useState(false);
  const [convertInterview, setConvertInterview] = useState<Interview | null>(null);

  const fetchCandidate = () => {
    if (!profile.tenantId) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/candidates/${candidateId}`, {
      headers: { 'x-tenant-id': profile.tenantId },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Candidate could not be loaded.');
        return r.json() as Promise<Candidate>;
      })
      .then((data) => {
        setCandidate(data);
        setForm(data);
        setBank(data.bankDetails || {});
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Candidate could not be loaded.'));
  };

  useEffect(() => {
    fetchCandidate();
  }, [candidateId, profile.tenantId]);

  const setFormValue = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const saveAll = async () => {
    if (!profile.tenantId) return;
    setSaving(true);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const r = await fetch(`${base}/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error('Candidate details could not be saved.');
      const c = await r.json() as Candidate;

      const b = await fetch(`${base}/candidates/${candidateId}/bank-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId },
        body: JSON.stringify(bank),
      });
      if (!b.ok) throw new Error('Additional details could not be saved.');
      const bankData = await b.json() as Bank;

      setCandidate({ ...c, bankDetails: bankData, employee: candidate?.employee });
      setForm(c);
      setBank(bankData);
      setEditing(false);
      toast.success('Candidate details updated successfully.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Candidate details could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!profile.tenantId || !candidate) return;
    const r = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/candidates/${candidateId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId },
        body: JSON.stringify({ status }),
      },
    );
    if (r.ok) {
      setCandidate({ ...candidate, status });
      toast.success('Candidate status updated.');
    }
  };

  const uploadDocument = async (type: string, file: File | null) => {
    if (!profile.tenantId || !file || !candidate) return;
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('documentType', type);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/candidates/${candidateId}/documents`,
      {
        method: 'POST',
        headers: { 'x-tenant-id': profile.tenantId },
        body: data,
      },
    );
    if (response.ok) {
      const uploaded = await response.json() as Document;
      setCandidate({ ...candidate, documents: [...candidate.documents, uploaded] });
      toast.success('Document uploaded successfully.');
    } else {
      toast.error('Document upload failed.');
    }
    setUploading(false);
  };

  const viewDocument = async (id: string) => {
    if (!profile.tenantId) return;
    const r = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/candidates/${candidateId}/documents/${id}/file`,
      { headers: { 'x-tenant-id': profile.tenantId } },
    );
    if (r.ok) {
      window.open(URL.createObjectURL(await r.blob()), '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Document could not be opened.');
    }
  };

  const documentStatus = async (id: string, status: 'approved' | 'rejected' | 'pending', remarks?: string) => {
    if (!profile.tenantId) return;
    setBusy(id);
    const r = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/candidates/${candidateId}/documents/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId },
        body: JSON.stringify({ status, remarks }),
      },
    );
    if (r.ok) {
      const d = await r.json() as Document;
      setCandidate((c) => (c ? { ...c, documents: c.documents.map((item) => (item.id === id ? d : item)) } : c));
      toast.success(status === 'pending' ? 'Document reopened.' : `Document ${status}.`);
    }
    setBusy('');
  };

  if (!candidate) {
    return (
      <AgencyShell>
        <main className="p-8 text-sm text-slate-400">Loading candidate details…</main>
      </AgencyShell>
    );
  }

  // Check for any interview that was passed
  const passedInterview = candidate.interviewHistory?.find((i) => i.result === 'passed');
  const isEmployed = candidate.status === 'employed' || !!candidate.employee;

  return (
    <AgencyShell>
      {convertInterview && (
        <InterviewPassedModal
          isOpen={Boolean(convertInterview)}
          interview={{
            id: convertInterview.id,
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            candidateCode: candidate.candidateCode,
            companyId: convertInterview.companyId,
            companyName: convertInterview.companyName || 'Client Company',
            designation: candidate.designation,
          }}
          onClose={() => setConvertInterview(null)}
          onSuccess={(empId) => {
            setConvertInterview(null);
            navigate({ to: '/employees/$employeeId', params: { employeeId: empId } });
          }}
        />
      )}

      <main className="px-5 pb-10 pt-4 md:px-8 md:pt-5 xl:px-10">
        <Link
          to="/candidates"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"
        >
          <ArrowLeft className="size-3.5" /> Back to candidates
        </Link>

        {/* ── Status Banner for Employed or Passed Interview ──────────────── */}
        {isEmployed && candidate.employee ? (
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-emerald-100/40 p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-emerald-950">Officially Placed Employee</h3>
                  <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    {candidate.employee.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-emerald-800">
                  Agency Code: <span className="font-mono font-bold text-brand">{candidate.employee.agencyEmployeeCode}</span> · Full employment history is active
                </p>
              </div>
            </div>
            <Link
              to="/employees/$employeeId"
              params={{ employeeId: candidate.employee.id }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <BriefcaseBusiness className="size-4" />
              View Employee Details & Placement
            </Link>
          </div>
        ) : passedInterview ? (
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950">Interview Cleared & Passed!</h3>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                    Ready for Onboarding
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-amber-850">
                  {passedInterview.companyName ? `Client company: ${passedInterview.companyName}` : 'Interview completed successfully.'} Convert this candidate to an official employee to assign agency code and track placement.
                </p>
              </div>
            </div>
            <button
              onClick={() => setConvertInterview(passedInterview)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              <UserCheck className="size-4" />
              Convert to Employee (Onboard)
            </button>
          </div>
        ) : null}

        {/* ── Main Profile Header ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-cardHover">
          <header className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-brand">{candidate.fullName}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[candidate.status] || STATUS_BADGE.onboarding}`}>
                  {candidate.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-mono font-semibold text-accent">{candidate.candidateCode}</span> · {candidate.designation} {candidate.experience && `· ${candidate.experience} exp`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {passedInterview && !isEmployed && (
                <button
                  onClick={() => setConvertInterview(passedInterview)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <BriefcaseBusiness className="size-3.5" />
                  Convert to employee
                </button>
              )}

              <select
                value={candidate.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold uppercase text-slate-700 outline-none focus:border-accent"
              >
                <option value="onboarding">Onboarding</option>
                <option value="verified">Verified</option>
                <option value="interview_pending">Interview pending</option>
                <option value="employed">Employed</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="h-9 gap-2 border border-slate-200 bg-white px-3 text-xs font-bold text-brand hover:bg-slate-50"
              >
                <Pencil className="size-3.5" />
                {editing ? 'Cancel' : 'Edit details'}
              </Button>
            </div>
          </header>

          <div className="divide-y divide-slate-100">
            {/* Personal Details */}
            <EditableGroup
              title="Personal & work details"
              fields={[
                ['Father name', 'fatherName'],
                ['Aadhaar number', 'aadhaarNumber'],
                ['Mobile number', 'mobile'],
                ['Alternate mobile', 'alternateMobile'],
                ['Email address', 'email'],
                ['Designation', 'designation'],
                ['Experience', 'experience'],
              ]}
              values={form}
              editing={editing}
              onChange={setFormValue}
            />

            {/* Addresses */}
            <EditableGroup
              title="Addresses"
              fields={[
                ['Current residential address', 'currentAddress'],
                ['Permanent address', 'permanentAddress'],
              ]}
              values={form}
              editing={editing}
              onChange={setFormValue}
            />

            {/* Interview History */}
            <InterviewHistory
              interviews={candidate.interviewHistory || []}
              onConvert={(interview) => setConvertInterview(interview)}
              isEmployed={isEmployed}
            />

            {/* Bank details */}
            <div className="px-5 py-5">
              <h2 className="mb-4 text-sm font-bold text-brand">
                Bank & financial details <span className="font-normal text-slate-400">· Optional</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['Account holder name', 'accountHolderName'],
                  ['Account number', 'accountNumber'],
                  ['IFSC code', 'ifscCode'],
                  ['Bank name', 'bankName'],
                  ['PAN number', 'panNumber'],
                ].map(([label, key]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
                    <input
                      disabled={!editing}
                      value={bank[key as keyof Bank] || ''}
                      onChange={(e) => setBank((b) => ({ ...b, [key]: e.target.value }))}
                      className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-800`}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Post-interview Checklist & Documents */}
            <div className="px-5 py-5">
              <DocumentChecklist documents={candidate.documents} />

              <div className="mb-4 mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-sm font-bold text-brand">Verified documents</h2>
                <div className="flex items-center gap-2">
                  <select
                    id="additional-document-type"
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="aadhaar">Aadhaar card</option>
                    <option value="photo">Candidate photo</option>
                    <option value="pan">PAN card</option>
                    <option value="police_verification">Police verification</option>
                    <option value="medical_certificate">Medical certificate</option>
                    <option value="bank_proof">Bank proof / cancelled cheque</option>
                    <option value="address_proof">Address proof</option>
                    <option value="experience_certificate">Experience certificate</option>
                    <option value="other">Other document</option>
                  </select>
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-bold text-white shadow-sm hover:bg-accent-hover">
                    <FilePlus2 className="size-3.5" />
                    {uploading ? 'Uploading…' : 'Add document'}
                    <input
                      type="file"
                      disabled={uploading}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(event) => {
                        const type = (document.getElementById('additional-document-type') as HTMLSelectElement).value;
                        uploadDocument(type, event.target.files?.[0] || null);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2.5">
                {candidate.documents.map((d) => (
                  <DocumentRow
                    key={d.id}
                    document={d}
                    busy={busy === d.id}
                    view={() => viewDocument(d.id)}
                    update={(status, reason) => documentStatus(d.id, status, reason)}
                  />
                ))}
              </div>
            </div>

            {/* Save Button when in edit mode */}
            {editing && (
              <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={saveAll}
                  className="h-10 gap-2 bg-accent px-5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover"
                >
                  <Save className="size-3.5" />
                  {saving ? 'Saving…' : 'Save candidate details'}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </AgencyShell>
  );
}

/* ── Interview History Component ─────────────────────────────────────────── */
function InterviewHistory({
  interviews,
  onConvert,
  isEmployed,
}: {
  interviews: Interview[];
  onConvert: (interview: Interview) => void;
  isEmployed: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-brand">Interview history & results</h2>
        <Link
          to="/interviews/new"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          + Schedule another interview
        </Link>
      </div>

      {interviews.length ? (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                interview.result === 'passed'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : interview.result === 'failed'
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-brand">
                    {interview.companyName || 'Client Company'}
                  </span>
                  {interview.companyCode && (
                    <span className="text-[10px] text-slate-400 font-mono">({interview.companyCode})</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      interview.result === 'passed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : interview.result === 'failed'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {interview.result ? `Result: ${interview.result}` : interview.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>📅 {new Date(interview.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>·</span>
                  <span>Interviewer: {interview.interviewerName}</span>
                  <span>·</span>
                  <span className="capitalize">{interview.mode.replace('_', ' ')}</span>
                </div>
                {interview.feedback && (
                  <p className="mt-1 text-xs text-slate-600 italic">
                    Feedback: &ldquo;{interview.feedback}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {interview.result === 'passed' && !isEmployed && (
                  <button
                    onClick={() => onConvert(interview)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <BriefcaseBusiness className="size-3.5" />
                    Onboard to this company
                  </button>
                )}
                <Link
                  to="/interviews/$interviewId"
                  params={{ interviewId: interview.id }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Edit / Result
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          No interviews scheduled yet. Once scheduled and cleared, you can convert this candidate to an official employee.
        </p>
      )}
    </div>
  );
}

/* ── Checklist Component ─────────────────────────────────────────────────── */
function DocumentChecklist({ documents }: { documents: Document[] }) {
  const types = [
    ['pan', 'PAN Card'],
    ['bank_proof', 'Bank Proof / Cheque'],
    ['police_verification', 'Police Verification'],
    ['medical_certificate', 'Medical Fitness Certificate'],
  ] as const;

  return (
    <div>
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        Post-interview onboarding checklist
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {types.map(([type, label]) => {
          const doc = documents.find((item) => item.documentType === type);
          const isApproved = doc?.verificationStatus === 'approved';
          const isRejected = doc?.verificationStatus === 'rejected';

          return (
            <div
              key={type}
              className={`rounded-xl border p-3 ${
                isApproved
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : isRejected
                  ? 'border-red-200 bg-red-50/60'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">{label}</p>
                {isApproved && <Check className="size-3.5 text-emerald-600" />}
              </div>
              <p
                className={`mt-1.5 text-[10px] font-bold uppercase tracking-wide ${
                  isApproved ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-slate-400'
                }`}
              >
                {doc?.verificationStatus || 'Pending upload'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Editable Group ──────────────────────────────────────────────────────── */
function EditableGroup({
  title,
  fields,
  values,
  editing,
  onChange,
}: {
  title: string;
  fields: [string, string][];
  values: Partial<Candidate>;
  editing: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="px-5 py-5">
      <h2 className="mb-4 text-sm font-bold text-brand">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([label, key]) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
            <input
              disabled={!editing}
              value={String(values[key as keyof Candidate] || '')}
              onChange={(e) => onChange(key, e.target.value)}
              className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-800`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Document Row ────────────────────────────────────────────────────────── */
function DocumentRow({
  document,
  busy,
  view,
  update,
}: {
  document: Document;
  busy: boolean;
  view: () => void;
  update: (status: 'approved' | 'rejected' | 'pending', reason?: string) => void;
}) {
  const reject = () => {
    const reason = window.prompt('Why are you rejecting this document?');
    if (reason?.trim()) update('rejected', reason.trim());
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold text-brand capitalize">
          {document.documentType.replace('_', ' ')} · <span className="font-normal text-slate-600">{document.originalName}</span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
              document.verificationStatus === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : document.verificationStatus === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {document.verificationStatus}
          </span>
          {document.remarks && <p className="text-xs text-red-600">Note: {document.remarks}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={view}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
        >
          <Eye className="mr-1 inline size-3.5 text-slate-500" /> View
        </button>
        {document.verificationStatus === 'approved' ? (
          <span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
            <Check className="mr-1 inline size-3.5" /> Approved
          </span>
        ) : document.verificationStatus === 'rejected' ? (
          <button
            onClick={() => update('pending')}
            className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
          >
            <RotateCcw className="mr-1 inline size-3.5" /> Reopen
          </button>
        ) : (
          <>
            <button
              disabled={busy}
              onClick={() => update('approved')}
              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="mr-1 inline size-3.5" /> Approve
            </button>
            <button
              disabled={busy}
              onClick={reject}
              className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              <X className="mr-1 inline size-3.5" /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}
