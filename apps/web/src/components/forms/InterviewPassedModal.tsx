import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Info,
  LogOut,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export interface PassedInterviewData {
  id: string; // interviewId
  candidateId: string;
  candidateName: string;
  candidateCode?: string;
  companyId: string;
  companyName: string;
  designation?: string;
}

interface ActivePlacementInfo {
  id: string;
  companyId: string;
  companyName: string;
  companyCode?: string;
  designation?: string;
  department?: string;
  workLocation?: string;
  joiningDate: string;
  companyEmployeeCode?: string;
  salary?: string;
}

interface InterviewPassedModalProps {
  isOpen: boolean;
  interview: PassedInterviewData | null;
  onClose: () => void;
  onSuccess?: (employeeId: string, navigated: boolean) => void;
}

const EXIT_REASONS = [
  { value: 'transfer', label: 'Client Transfer (Moved to new client company)' },
  { value: 'resigned', label: 'Resigned voluntarily' },
  { value: 'contract_ended', label: 'Project / Contract ended' },
  { value: 'terminated', label: 'Terminated by client/agency' },
  { value: 'absconded', label: 'Absconded / Left without notice' },
  { value: 'other', label: 'Other reason' },
];

export function InterviewPassedModal({
  isOpen,
  interview,
  onClose,
  onSuccess,
}: InterviewPassedModalProps) {
  const profile = getWorkspaceProfile();
  const toast = useToast();
  const navigate = useNavigate();

  // Status check state
  const [checking, setChecking] = useState(true);
  const [activePlacement, setActivePlacement] = useState<ActivePlacementInfo | null>(null);
  const [existingEmployeeCode, setExistingEmployeeCode] = useState<string | null>(null);

  // New placement fields
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [companyEmployeeCode, setCompanyEmployeeCode] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Exit fields (mandatory when candidate is currently placed at another company)
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10));
  const [exitReason, setExitReason] = useState('transfer');
  const [exitRemarks, setExitRemarks] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Fetch candidate's active employment status whenever modal opens
  useEffect(() => {
    if (!isOpen || !interview?.candidateId || !profile.tenantId) return;

    let active = true;
    setChecking(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    fetch(`${apiBase}/employees/candidate-status/${interview.candidateId}`, {
      headers: { 'x-tenant-id': profile.tenantId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.activePlacement) {
          setActivePlacement(data.activePlacement);
        } else {
          setActivePlacement(null);
        }
        if (data?.employee?.agencyEmployeeCode) {
          setExistingEmployeeCode(data.employee.agencyEmployeeCode);
        }
      })
      .catch((err) => {
        console.error('Failed to check candidate status:', err);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    setDesignation(interview.designation || '');
    setExitRemarks(
      interview.companyName
        ? `Transferred to ${interview.companyName} upon clearing interview.`
        : '',
    );

    return () => {
      active = false;
    };
  }, [isOpen, interview?.candidateId, interview?.companyName, interview?.designation, profile.tenantId]);

  if (!isOpen || !interview) return null;

  // Does candidate currently work at a DIFFERENT company?
  const isActivelyPlacedElsewhere =
    Boolean(activePlacement && activePlacement.companyId !== interview.companyId);

  const handleConfirm = async (shouldNavigate: boolean) => {
    if (!profile.tenantId) {
      toast.error('Session expired. Please reload or login again.');
      return;
    }

    if (isActivelyPlacedElsewhere && !exitDate) {
      toast.error('Please enter the exit date from the current company.');
      return;
    }

    setSubmitting(true);
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': profile.tenantId,
    };
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      // Step 1: Mark interview as completed & passed
      const patchInterviewRes = await fetch(`${apiBase}/interviews/${interview.id}/result`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'completed',
          result: 'passed',
        }),
      });

      if (!patchInterviewRes.ok) {
        throw new Error('Could not update interview status to passed.');
      }

      // Step 2: Convert/re-deploy candidate to employee
      const payload: Record<string, unknown> = {
        interviewId: interview.id,
        joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
        salary: salary.trim() || undefined,
        companyEmployeeCode: companyEmployeeCode.trim() || undefined,
        designation: designation.trim() || interview.designation || undefined,
      };

      if (isActivelyPlacedElsewhere) {
        payload.exitCurrentPlacement = {
          exitDate: exitDate || new Date().toISOString().slice(0, 10),
          exitReason,
          exitRemarks: exitRemarks.trim() || undefined,
        };
      }

      const convertRes = await fetch(
        `${apiBase}/employees/from-candidate/${interview.candidateId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (!convertRes.ok) {
        const errJson = await convertRes.json().catch(() => null);
        throw new Error(errJson?.message || 'Failed to place candidate at new company.');
      }

      const { employee } = (await convertRes.json()) as {
        employee: { id: string; agencyEmployeeCode: string };
      };

      if (isActivelyPlacedElsewhere && activePlacement) {
        toast.success(
          `Exited from ${activePlacement.companyName} and deployed to ${interview.companyName} (${employee.agencyEmployeeCode}).`,
        );
      } else {
        toast.success(
          `Success! ${interview.candidateName} is now officially placed (${employee.agencyEmployeeCode}).`,
        );
      }

      if (onSuccess) {
        onSuccess(employee.id, shouldNavigate);
      }

      onClose();

      if (shouldNavigate) {
        navigate({
          to: '/employees/$employeeId',
          params: { employeeId: employee.id },
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-2xl shadow-xs ${
                isActivelyPlacedElsewhere
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isActivelyPlacedElsewhere ? (
                <AlertTriangle className="size-6 text-amber-600" />
              ) : (
                <Sparkles className="size-6 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-brand">Interview Cleared & Passed!</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isActivelyPlacedElsewhere
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isActivelyPlacedElsewhere ? 'Company Transfer' : 'Ready to Onboard'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {isActivelyPlacedElsewhere
                  ? 'Candidate cleared interview for a new client company.'
                  : 'Candidate will officially be registered as an employee placed at this company.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {checking ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Checking candidate employment records…
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* ── Active Placement Warning (Candidate Currently Placed Elsewhere) ── */}
            {isActivelyPlacedElsewhere && activePlacement && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-900 mt-0.5">
                    <LogOut className="size-4" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-amber-950 text-sm">
                      Candidate is currently working at{' '}
                      <span className="underline decoration-amber-400">
                        {activePlacement.companyName}
                      </span>
                    </p>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      <strong>{interview.candidateName}</strong> {existingEmployeeCode && `(${existingEmployeeCode})`} is currently active at{' '}
                      <strong>{activePlacement.companyName}</strong> as{' '}
                      <strong>{activePlacement.designation || 'Worker'}</strong> since{' '}
                      <strong>{activePlacement.joiningDate}</strong>.
                    </p>
                    <p className="text-amber-900 font-semibold text-[11px]">
                      ⚠️ To deploy this worker to <strong>{interview.companyName}</strong>, you must first complete their formal exit from <strong>{activePlacement.companyName}</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 1: Exit Details Form */}
                <div className="mt-3.5 border-t border-amber-200/80 pt-3 space-y-3">
                  <p className="font-bold text-amber-950 text-[11px] uppercase tracking-wider">
                    Step 1: Current Company Exit Details (Mandatory)
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                        Exit / Relieving Date *
                      </span>
                      <input
                        type="date"
                        required
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-orange-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                        Reason for Exit *
                      </span>
                      <select
                        value={exitReason}
                        onChange={(e) => setExitReason(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-accent"
                      >
                        {EXIT_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Exit Remarks / Handover Notes
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Cleared client interview, notice served, dues settled."
                      value={exitRemarks}
                      onChange={(e) => setExitRemarks(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Candidate & Placement Summary Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Candidate Details
                  </span>
                  <p className="mt-0.5 font-bold text-brand text-sm">{interview.candidateName}</p>
                  <p className="font-mono text-xs text-emerald-900 font-semibold">
                    {interview.candidateCode || 'Candidate'}
                    {existingEmployeeCode && ` · Permanent EMP: ${existingEmployeeCode}`}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {isActivelyPlacedElsewhere ? 'New Client Company' : 'Placed Client Company'}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Building2 className="size-4 text-emerald-700" />
                    <p className="font-bold text-brand text-sm">{interview.companyName}</p>
                  </div>
                  {interview.designation && (
                    <p className="text-xs text-slate-600">Role: {interview.designation}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2 or Standard Deployment Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold text-brand text-xs">
                  {isActivelyPlacedElsewhere
                    ? `Step 2: New Placement at ${interview.companyName}`
                    : 'Placement Details'}
                </p>
                {!isActivelyPlacedElsewhere && (
                  <button
                    type="button"
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {showOptionalFields ? '− Basic' : '+ More fields'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Joining Date *
                  </span>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Monthly CTC / Salary (₹)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 19000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Company EMP Code
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. XYZ-1049"
                    value={companyEmployeeCode}
                    onChange={(e) => setCompanyEmployeeCode(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent"
                  />
                </label>
              </div>

              {(isActivelyPlacedElsewhere || showOptionalFields) && (
                <div className="mt-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Designation / Role
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Welder, Fitter, Supervisor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Next steps guidance (if not active elsewhere) */}
            {!isActivelyPlacedElsewhere && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <Info className="size-4 text-blue-700 mt-0.5 shrink-0" />
                  <div className="space-y-1 text-slate-700 text-[11px]">
                    <p className="font-bold text-blue-950">Next Steps & Information:</p>
                    <ul className="list-disc space-y-0.5 pl-4 text-slate-600">
                      <li>
                        A permanent agency employee code will be generated (or preserved).
                      </li>
                      <li>
                        The worker will be placed at <strong>{interview.companyName}</strong>.
                      </li>
                      <li>
                        You can update client ID and salary breakdown anytime from Employee Details.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting || checking}
            onClick={() => handleConfirm(false)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              isActivelyPlacedElsewhere
                ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="size-4" />
            {submitting
              ? 'Processing…'
              : isActivelyPlacedElsewhere
              ? 'Confirm Exit & Deploy'
              : 'Confirm Placement'}
          </button>

          <button
            type="button"
            disabled={submitting || checking}
            onClick={() => handleConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-accent-hover transition"
          >
            <UserCheck className="size-4" />
            {submitting ? 'Updating…' : 'Confirm & Navigate to Details'}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
