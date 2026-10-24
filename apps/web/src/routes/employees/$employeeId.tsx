import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  History,
  LogOut,
  Pencil,
  PlusCircle,
  Save,
  UserX,
  X,
} from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export const Route = createFileRoute('/employees/$employeeId')({ component: EmployeeDetailPage });

/* ── Types ──────────────────────────────────────────────────────────────── */
type HistoryEntry = {
  id: string;
  companyId: string;
  companyName?: string;
  companyCode?: string;
  companyEmployeeCode?: string;
  designation?: string;
  department?: string;
  workLocation?: string;
  joiningDate: string;
  exitDate?: string;
  salary?: string;
  salaryBreakdown?: string;
  status: string; // active | exited
  exitReason?: string;
  exitRemarks?: string;
};

type CandidateSnap = {
  id: string;
  candidateCode: string;
  fullName: string;
  fatherName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  designation: string;
  experience?: string;
  currentAddress: string;
  permanentAddress: string;
  aadhaarLast4: string;
};

type BankDetails = {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  panNumber?: string;
};

type CompanyOption = {
  id: string;
  name: string;
  code: string;
};

type Employee = {
  id: string;
  agencyEmployeeCode: string;
  status: string;
  firstJoiningDate?: string;
  currentCompanyId?: string;
  candidate: CandidateSnap | null;
  bankDetails: BankDetails | null;
  employmentHistory: HistoryEntry[];
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const API = () => import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-emerald-50 border-emerald-300 text-emerald-800',
  benched:  'bg-amber-50 border-amber-300 text-amber-800',
  inactive: 'bg-slate-100 border-slate-300 text-slate-600',
};

const EXIT_REASON_LABELS: Record<string, string> = {
  resigned:       'Resigned voluntarily',
  terminated:     'Terminated by client/agency',
  absconded:      'Absconded / Left without notice',
  contract_ended: 'Project / Contract ended',
  transfer:       'Internal transfer to other company',
  other:          'Other reason',
};

function fmt(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Exit Modal ──────────────────────────────────────────────────────────── */
function ExitModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (data: { exitDate: string; exitReason: string; exitRemarks?: string }) => void;
}) {
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10));
  const [exitReason, setExitReason] = useState('resigned');
  const [exitRemarks, setExitRemarks] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <LogOut className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand">Exit / Relieve Employee</h2>
              <p className="text-[11px] text-slate-500">Record departure and return employee to bench pool.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Exit / Last Working Date *</span>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Reason for Exit *</span>
            <select
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-accent"
            >
              {Object.entries(EXIT_REASON_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Additional Remarks & Feedback</span>
            <textarea
              value={exitRemarks}
              onChange={(e) => setExitRemarks(e.target.value)}
              rows={3}
              placeholder="e.g. Contract completed satisfactorily, notice served, dues cleared."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-orange-100"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ exitDate, exitReason, exitRemarks: exitRemarks || undefined })}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
          >
            <UserX className="size-3.5" /> Confirm Exit & Bench
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Update Employment Modal ─────────────────────────────────────────────── */
function UpdateEmploymentModal({
  current,
  onClose,
  onSave,
}: {
  current: HistoryEntry;
  onClose: () => void;
  onSave: (data: Partial<HistoryEntry>) => void;
}) {
  const [form, setForm] = useState({
    companyEmployeeCode: current.companyEmployeeCode ?? '',
    designation: current.designation ?? '',
    department: current.department ?? '',
    workLocation: current.workLocation ?? '',
    salary: current.salary ?? '',
    salaryBreakdown: current.salaryBreakdown ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-brand">Update Placement Details</h2>
            <p className="text-[11px] text-slate-500">
              Update company code, designation or salary for {current.companyName || 'current client company'}.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ['Company Employee Code', 'companyEmployeeCode', 'e.g. ABC-2024-089 (issued by client)'],
            ['Designation', 'designation', 'e.g. Security Supervisor'],
            ['Department', 'department', 'e.g. Security Operations'],
            ['Work Location', 'workLocation', 'e.g. Sector 62, Noida Plant'],
            ['Monthly Salary (₹)', 'salary', 'e.g. 18500'],
            ['Salary Breakdown', 'salaryBreakdown', 'e.g. Basic ₹13k + HRA ₹3.5k + Misc ₹2k'],
          ] as [string, keyof typeof form, string][]).map(([label, key, placeholder]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-orange-100"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-hover shadow-sm"
          >
            <Save className="size-3.5" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Assign New Placement Modal (For Benched or Transferred Workers) ─────── */
function AssignPlacementModal({
  candidateDesignation,
  onClose,
  onSave,
}: {
  candidateDesignation: string;
  onClose: () => void;
  onSave: (data: {
    companyId: string;
    joiningDate: string;
    salary?: string;
    salaryBreakdown?: string;
    designation?: string;
    department?: string;
    workLocation?: string;
    companyEmployeeCode?: string;
  }) => void;
}) {
  const profile = getWorkspaceProfile();
  const [companiesList, setCompaniesList] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    companyId: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    designation: candidateDesignation || '',
    department: '',
    workLocation: '',
    salary: '',
    salaryBreakdown: '',
    companyEmployeeCode: '',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadCompanies() {
      try {
        setLoading(true);
        const tenantId = profile.tenantId;
        if (!tenantId) {
          setLoading(false);
          return;
        }
        const res = await fetch(`${API()}/companies?limit=100`, {
          headers: { 'x-tenant-id': tenantId },
        });
        if (!res.ok) throw new Error('Failed to fetch companies');
        const json = await res.json();
        const list: CompanyOption[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];
        if (isMounted) {
          setCompaniesList(list);
          if (list.length > 0) {
            setForm((f) => (f.companyId ? f : { ...f, companyId: list[0].id }));
          }
        }
      } catch (e) {
        console.error('Failed to load companies in AssignPlacementModal:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, [profile.tenantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PlusCircle className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand">Deploy to New Company</h2>
              <p className="text-[11px] text-slate-500">
                Keep the same permanent agency employee code and start a new placement.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading client companies…</div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Select Client Company *</span>
              <select
                required
                value={form.companyId}
                onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">-- Choose Client Company --</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
              {companiesList.length === 0 && !loading && (
                <p className="mt-1 text-[11px] font-medium text-amber-600">
                  No client companies found in your agency. Please add a company first.
                </p>
              )}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Joining Date *</span>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Monthly CTC / Salary (₹) *</span>
                <input
                  type="text"
                  value={form.salary}
                  onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                  placeholder="e.g. 19000"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Designation</span>
                <input
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Shift Incharge"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Department</span>
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Operations"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Work Location</span>
                <input
                  value={form.workLocation}
                  onChange={(e) => setForm((f) => ({ ...f, workLocation: e.target.value }))}
                  placeholder="e.g. Plant 4"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Company Employee Code</span>
                <input
                  value={form.companyEmployeeCode}
                  onChange={(e) => setForm((f) => ({ ...f, companyEmployeeCode: e.target.value }))}
                  placeholder="e.g. XYZ-1049"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Salary Breakdown</span>
              <input
                value={form.salaryBreakdown}
                onChange={(e) => setForm((f) => ({ ...f, salaryBreakdown: e.target.value }))}
                placeholder="e.g. Basic ₹14k + HRA ₹3.5k + Special ₹1.5k"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={loading || !form.companyId}
            onClick={() => onSave(form)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
          >
            <BriefcaseBusiness className="size-4" /> Start Placement
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
function EmployeeDetailPage() {
  const { employeeId } = Route.useParams();
  const profile = getWorkspaceProfile();
  const toast = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);

  const headers = { 'x-tenant-id': profile.tenantId ?? '', 'Content-Type': 'application/json' };

  const fetchEmployee = () => {
    if (!profile.tenantId) return;
    fetch(`${API()}/employees/${employeeId}`, { headers: { 'x-tenant-id': profile.tenantId } })
      .then(async (r) => {
        if (!r.ok) throw new Error('Employee could not be loaded.');
        return r.json() as Promise<Employee>;
      })
      .then(setEmployee)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load employee.'));
  };

  useEffect(() => {
    fetchEmployee();
  }, [employeeId, profile.tenantId]);

  const handleExit = async (data: { exitDate: string; exitReason: string; exitRemarks?: string }) => {
    try {
      const res = await fetch(`${API()}/employees/${employeeId}/exit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Could not process exit.');
      toast.success('Employee exited successfully. Status set to benched.');
      setShowExitModal(false);
      fetchEmployee();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not process exit.');
    }
  };

  const handleUpdateEmployment = async (data: Partial<HistoryEntry>) => {
    try {
      const res = await fetch(`${API()}/employees/${employeeId}/employment`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Could not update employment details.');
      toast.success('Placement details updated successfully.');
      setShowUpdateModal(false);
      fetchEmployee();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update employment details.');
    }
  };

  const handleNewPlacement = async (data: {
    companyId: string;
    joiningDate: string;
    salary?: string;
    salaryBreakdown?: string;
    designation?: string;
    department?: string;
    workLocation?: string;
    companyEmployeeCode?: string;
  }) => {
    try {
      const res = await fetch(`${API()}/employees/${employeeId}/placement`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Could not assign placement.');
      toast.success('New company placement assigned successfully!');
      setShowPlacementModal(false);
      fetchEmployee();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign placement.');
    }
  };

  if (!employee) {
    return (
      <AgencyShell>
        <main className="p-8 text-sm text-slate-400">Loading employee details…</main>
      </AgencyShell>
    );
  }

  const { candidate, employmentHistory, bankDetails } = employee;
  const activeHistory = employmentHistory.find((h) => h.status === 'active');

  return (
    <AgencyShell>
      {showExitModal && (
        <ExitModal onClose={() => setShowExitModal(false)} onConfirm={handleExit} />
      )}
      {showUpdateModal && activeHistory && (
        <UpdateEmploymentModal
          current={activeHistory}
          onClose={() => setShowUpdateModal(false)}
          onSave={handleUpdateEmployment}
        />
      )}
      {showPlacementModal && (
        <AssignPlacementModal
          candidateDesignation={candidate?.designation || ''}
          onClose={() => setShowPlacementModal(false)}
          onSave={handleNewPlacement}
        />
      )}

      <main className="px-5 pb-10 pt-4 md:px-8 md:pt-5 xl:px-10">
        {/* Breadcrumb */}
        <Link
          to="/employees"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"
        >
          <ArrowLeft className="size-3.5" /> Back to employees
        </Link>

        {/* ── Profile Header ─────────────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                <BriefcaseBusiness className="size-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-brand">{candidate?.fullName ?? 'Employee'}</h1>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      STATUS_COLOR[employee.status] ?? STATUS_COLOR.inactive
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-accent">{employee.agencyEmployeeCode}</span>
                  <span className="text-slate-300">·</span>
                  <span>{candidate?.designation}</span>
                  {candidate?.candidateCode && (
                    <>
                      <span className="text-slate-300">·</span>
                      <Link
                        to="/candidates/$candidateId"
                        params={{ candidateId: candidate.id }}
                        className="font-semibold text-slate-600 hover:text-accent underline"
                      >
                        Candidate {candidate.candidateCode}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {employee.status === 'active' ? (
                <>
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-brand shadow-xs hover:border-orange-200 hover:bg-orange-50 hover:text-accent"
                  >
                    <Pencil className="size-3.5" /> Update Placement Info
                  </button>
                  <button
                    onClick={() => setShowPlacementModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <Building2 className="size-3.5" /> Transfer Company
                  </button>
                  <button
                    onClick={() => setShowExitModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    <UserX className="size-3.5" /> Exit Employee
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPlacementModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <PlusCircle className="size-4" /> Deploy to New Company
                </button>
              )}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <Stat icon={<Calendar className="size-4" />} label="Agency since" value={fmt(employee.firstJoiningDate)} />
            <Stat icon={<Building2 className="size-4" />} label="Current company" value={activeHistory?.companyName ?? (employee.status === 'benched' ? 'Benched (Available)' : '—')} />
            <Stat
              icon={<DollarSign className="size-4" />}
              label="Current salary"
              value={activeHistory?.salary ? `₹${Number(activeHistory.salary).toLocaleString('en-IN')}/mo` : '—'}
            />
            <Stat icon={<Clock3 className="size-4" />} label="Total Placements" value={String(employmentHistory.length)} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ── Employment History (Timeline) ─────────────────────────────── */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <History className="size-4 text-accent" />
                <h2 className="text-sm font-bold text-brand">Placement & Employment History</h2>
              </div>
              <span className="text-xs text-slate-400">
                {employmentHistory.length} {employmentHistory.length === 1 ? 'placement' : 'placements'}
              </span>
            </div>

            <div className="p-5">
              {employmentHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No employment placements recorded yet.</p>
              ) : (
                <ol className="relative space-y-0 border-l-2 border-slate-200 pl-6">
                  {employmentHistory.map((h) => (
                    <li key={h.id} className="relative pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[29px] flex size-6 items-center justify-center rounded-full ring-4 ring-white ${
                          h.status === 'active' ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'
                        }`}
                      >
                        {h.status === 'active' ? (
                          <CheckCircle2 className="size-3.5 text-white" />
                        ) : (
                          <ChevronRight className="size-3.5 text-white" />
                        )}
                      </span>

                      <div
                        className={`rounded-2xl border p-6 sm:p-7 md:p-8 transition-all ${
                          h.status === 'active'
                            ? 'border-emerald-300 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-200/50'
                            : 'border-slate-200 bg-slate-50/70'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-200/70">
                          <div className="flex items-center gap-2.5">
                            <Building2 className="size-5 text-emerald-700" />
                            <span className="text-base font-bold text-brand">
                              {h.companyName ?? 'Client Company'}
                            </span>
                            {h.companyCode && (
                              <span className="font-mono text-xs text-slate-500 font-semibold bg-white/70 border border-slate-200 rounded-md px-2 py-0.5">
                                {h.companyCode}
                              </span>
                            )}
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              h.status === 'active'
                                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                : 'border-slate-300 bg-white text-slate-600'
                            }`}
                          >
                            {h.status}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-3">
                          <KV label="Joining date" value={fmt(h.joiningDate)} />
                          <KV label="Exit date" value={fmt(h.exitDate)} />
                          <KV label="Designation" value={h.designation} />
                          <KV label="Department" value={h.department} />
                          <KV label="Work location" value={h.workLocation} />
                          <KV
                            label="Monthly salary"
                            value={h.salary ? `₹${Number(h.salary).toLocaleString('en-IN')}` : undefined}
                          />

                          <div className="col-span-full mt-2 rounded-xl border border-emerald-200/70 bg-white/80 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                              Company Employee Code
                            </span>
                            <p className="mt-1 font-mono text-sm font-bold text-brand">
                              {h.companyEmployeeCode || '— (Not assigned yet by client)'}
                            </p>
                          </div>

                          {h.salaryBreakdown && (
                            <div className="col-span-full mt-1 rounded-xl border border-emerald-100 bg-white/60 p-3">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Salary breakdown
                              </span>
                              <p className="mt-1 text-xs text-slate-700 font-medium">{h.salaryBreakdown}</p>
                            </div>
                          )}
                        </div>

                        {h.status === 'exited' && h.exitReason && (
                          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 p-4">
                            <div className="flex items-center gap-1.5">
                              <LogOut className="size-4 text-red-600" />
                              <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                                Exit Reason: {EXIT_REASON_LABELS[h.exitReason] ?? h.exitReason}
                              </p>
                            </div>
                            {h.exitRemarks && (
                              <p className="mt-1.5 text-xs text-red-800 font-medium">{h.exitRemarks}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          {/* ── Right column: Personal + Bank ─────────────────────────────── */}
          <div className="space-y-5">
            {/* Personal info */}
            {candidate && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-brand">Personal Details</h2>
                  <Link
                    to="/candidates/$candidateId"
                    params={{ candidateId: candidate.id }}
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    View Candidate File →
                  </Link>
                </div>
                <div className="space-y-3">
                  <KV label="Full name" value={candidate.fullName} />
                  <KV label="Father's name" value={candidate.fatherName} />
                  <KV label="Mobile" value={candidate.mobile} />
                  <KV label="Alternate mobile" value={candidate.alternateMobile} />
                  <KV label="Email" value={candidate.email} />
                  <KV label="Date of birth" value={fmt(candidate.dateOfBirth)} />
                  <KV label="Gender" value={candidate.gender} />
                  <KV label="Experience" value={candidate.experience} />
                  <KV label="Aadhaar" value={`XXXX XXXX ${candidate.aadhaarLast4}`} />
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Current address
                    </span>
                    <p className="mt-0.5 text-xs text-slate-700">{candidate.currentAddress}</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Permanent address
                    </span>
                    <p className="mt-0.5 text-xs text-slate-700">{candidate.permanentAddress}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Bank details */}
            {bankDetails && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h2 className="mb-4 text-sm font-bold text-brand border-b border-slate-100 pb-3">
                  Bank & Payment Details
                </h2>
                <div className="space-y-3">
                  <KV label="Account holder" value={bankDetails.accountHolderName} />
                  <KV label="Account number" value={bankDetails.accountNumber} />
                  <KV label="IFSC code" value={bankDetails.ifscCode} />
                  <KV label="Bank name" value={bankDetails.bankName} />
                  <KV label="PAN number" value={bankDetails.panNumber} />
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </AgencyShell>
  );
}

/* ── Small reusable components ───────────────────────────────────────────── */
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-brand">{value}</p>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <p className="mt-0.5 text-xs font-semibold text-slate-700">{value || '—'}</p>
    </div>
  );
}
