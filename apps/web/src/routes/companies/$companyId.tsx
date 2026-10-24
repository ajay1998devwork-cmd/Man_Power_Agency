import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, MapPin, Pencil, Power, Save, Trash2, UserRound } from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/companies/$companyId')({ component: CompanyDetailsPage });
type Company = Record<string, string | null> & { id: string; status: string };
const sections = [
  { title: 'Company details', icon: Building2, fields: [['name', 'Company name'], ['code', 'Company code'], ['registrationNumber', 'Registration / GST number'], ['industry', 'Industry']] },
  { title: 'People & contacts', icon: UserRound, fields: [['primaryContactName', 'Main contact person'], ['primaryContactPhone', 'Main contact number'], ['primaryContactEmail', 'Main contact email'], ['hrContactName', 'HR contact person'], ['hrContactPhone', 'HR contact number'], ['hrContactEmail', 'HR contact email']] },
  { title: 'Registered address', icon: MapPin, fields: [['addressLine1', 'Address line 1'], ['addressLine2', 'Address line 2'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode'], ['country', 'Country']] },
] as const;

function CompanyDetailsPage() {
  const { companyId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const profile = getWorkspaceProfile();
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.tenantId) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies/${companyId}`, { headers: { 'x-tenant-id': profile.tenantId } }).then(async (response) => { if (!response.ok) throw new Error('Company could not be loaded.'); return response.json() as Promise<Company>; }).then((data) => { setCompany(data); setForm(Object.fromEntries(Object.keys(data).map((key) => [key, data[key] || '']))); }).catch((error) => toast.error(error instanceof Error ? error.message : 'Company could not be loaded.')).finally(() => setLoading(false));
  }, [companyId, profile.tenantId, toast]);

  const update = async () => {
    if (!profile.tenantId) return;
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies/${companyId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('Company could not be updated.');
      const data = await response.json() as Company;
      setCompany(data); setForm(Object.fromEntries(Object.keys(data).map((key) => [key, data[key] || '']))); setEditing(false); toast.success('Company updated successfully.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Company could not be updated.'); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!profile.tenantId || !window.confirm('Delete this company? It will be archived and removed from the active directory.')) return;
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies/${companyId}`, { method: 'DELETE', headers: { 'x-tenant-id': profile.tenantId } });
    if (!response.ok) { toast.error('Company could not be deleted.'); return; }
    toast.success('Company deleted successfully.'); navigate({ to: '/companies' });
  };

  const toggleStatus = async () => {
    if (!profile.tenantId || !company) return;
    const nextStatus = company.status === 'active' ? 'inactive' : 'active';
    const label = nextStatus === 'active' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${label} this company?`)) return;
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies/${companyId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId }, body: JSON.stringify({ status: nextStatus }) });
    if (!response.ok) { toast.error(`Company could not be ${label}d.`); return; }
    const updated = await response.json() as Company;
    setCompany(updated);
    toast.success(`Company ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
  };

  if (loading) return <AgencyShell><main className="px-5 pb-8 pt-4 text-sm text-slate-400 md:px-8 md:pt-5">Loading company details…</main></AgencyShell>;
  if (!company) return <AgencyShell><main className="px-5 pb-8 pt-4 md:px-8 md:pt-5"><Link to="/companies" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ArrowLeft className="size-3.5" /> Back to companies</Link><p className="mt-6 text-sm text-red-600">Company details are not available.</p></main></AgencyShell>;

  return <AgencyShell><main className="px-5 pb-8 pt-4 md:px-8 md:pb-8 md:pt-5 xl:px-10"><Link to="/companies" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="size-3.5" /> Back to companies</Link><section className="rounded-xl border border-slate-200/80 bg-white shadow-cardHover"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-accent">{(company.name || '').slice(0, 2).toUpperCase()}</div><h1 className="text-lg font-bold text-brand">{company.name}</h1></div><p className="mt-1 pl-10 text-xs text-slate-500">{company.code} · {company.status === 'active' ? 'Active company' : 'Inactive company'}</p></div><div className="flex flex-wrap gap-2"><Button type="button" onClick={toggleStatus} className={`h-9 gap-2 border px-3 text-xs font-bold ${company.status === 'active' ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><Power className="size-3.5" />{company.status === 'active' ? 'Deactivate' : 'Activate'}</Button><Button type="button" onClick={() => setEditing((value) => !value)} className="h-9 gap-2 border border-slate-200 bg-white px-3 text-xs font-bold text-brand hover:bg-slate-50"><Pencil className="size-3.5" />{editing ? 'Cancel' : 'Edit details'}</Button><Button type="button" onClick={remove} className="h-9 gap-2 bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"><Trash2 className="size-3.5" />Delete</Button></div></div><div className="divide-y divide-slate-100">{sections.map(({ title, icon: Icon, fields }) => <div key={title} className="px-4 py-5"><div className="mb-4 flex items-center gap-2"><Icon className="size-4 text-accent" /><h2 className="text-sm font-bold text-brand">{title}</h2><span className="text-xs text-slate-400">· Company information</span></div><div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([key, label]) => <label key={key} className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>{editing ? <input value={form[key] || ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-orange-100" /> : <p className="min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{company[key] || '—'}</p>}</label>)}</div></div>)}{editing && <div className="flex justify-end border-t border-slate-100 px-4 py-4"><Button type="button" disabled={saving} onClick={update} className="h-10 gap-2 bg-accent px-5 text-xs font-bold text-white hover:bg-accent-hover"><Save className="size-4" />{saving ? 'Saving…' : 'Save changes'}</Button></div>}</div></section></main></AgencyShell>;
}
