import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, FileArchive, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { AgencyShell } from '@/components/layout/AgencyShell';
import { Button } from '@/components/ui/button';
import { getWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export const Route = createFileRoute('/companies/new')({ component: NewCompanyPage });

const fields = [
  ['name', 'Company name', 'Apex Infrastructure Pvt. Ltd.', true], ['code', 'Company code', 'APEX-001', true], ['registrationNumber', 'Registration / GST number', 'Optional registration reference', false], ['industry', 'Industry', 'Construction, logistics, facilities…', false],
  ['primaryContactName', 'Main contact person', 'Full name', true], ['primaryContactPhone', 'Main contact number', '+91 98765 43210', true], ['primaryContactEmail', 'Main contact email', 'contact@company.com', false], ['hrContactName', 'HR contact person', 'Full name', false], ['hrContactPhone', 'HR contact number', '+91 98765 43210', false], ['hrContactEmail', 'HR contact email', 'hr@company.com', false],
  ['addressLine1', 'Address line 1', 'Building / street address', true], ['addressLine2', 'Address line 2', 'Suite, area or landmark', false], ['city', 'City', 'City', true], ['state', 'State', 'State', true], ['pincode', 'Pincode', '000000', true],
] as const;

function NewCompanyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const profile = getWorkspaceProfile();
  const agencyName = profile.agencyName || 'your agency';
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!profile.tenantId) { setError('Your session is not linked to an agency tenant yet. Please sign in again.'); return; }
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant-id': profile.tenantId }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('Unable to save company. Please review the details and try again.');
      const created = await response.json() as { id: string };
      const documentInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-company-document]'));
      for (const input of documentInputs) { const file = input.files?.[0]; if (!file) continue; const uploadData = new FormData(); uploadData.append('file', file); uploadData.append('documentType', input.dataset.documentType || 'other'); const upload = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies/${created.id}/documents`, { method: 'POST', headers: { 'x-tenant-id': profile.tenantId }, body: uploadData }); if (!upload.ok) throw new Error(`${input.dataset.documentType || 'Document'} upload failed.`); }
      setSaved(true); toast.success('Company created successfully.'); setTimeout(() => navigate({ to: '/companies' }), 900);
    } catch (submissionError) { const message = submissionError instanceof Error ? submissionError.message : 'Unable to save company.'; setError(message); toast.error(message); } finally { setIsSaving(false); }
  };

  return <AgencyShell><main className="px-5 pb-8 pt-4 md:px-8 md:pb-8 md:pt-5 xl:px-10"><Link to="/companies" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="size-3.5" /> Back to companies</Link><form onSubmit={submit} noValidate className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-cardHover"><div className="border-b border-slate-100 px-5 py-4"><h1 className="mt-1 text-lg font-bold tracking-tight text-brand">Add a company</h1><p className="mt-1 text-sm text-slate-500">Create a company inside <span className="font-semibold text-brand">{agencyName}</span>. This record will remain isolated to the current agency tenant.</p></div>{error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}{saved && <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> Company details saved. Opening the company directory…</div>}<div className="grid md:grid-cols-2"><Section icon={Building2} title="Company details" description="Basic identity and classification"><div className="grid gap-4 sm:grid-cols-2">{fields.slice(0, 4).map(([key, label, placeholder, required]) => <Field key={key} name={key} label={label} placeholder={placeholder} required={required} value={form[key] || ''} onChange={update} />)}</div></Section><Section icon={UserRound} title="People & contacts" description="Who should your agency coordinate with?"><div className="grid gap-4 sm:grid-cols-2">{fields.slice(4, 10).map(([key, label, placeholder, required]) => <Field key={key} name={key} label={label} placeholder={placeholder} required={required} value={form[key] || ''} onChange={update} icon={key.toLowerCase().includes('email') ? Mail : key.toLowerCase().includes('phone') ? Phone : UserRound} />)}</div></Section><div className="md:col-span-2"><Section icon={MapPin} title="Registered address" description="Primary company location; branches can be added later"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.slice(10).map(([key, label, placeholder, required]) => <Field key={key} name={key} label={label} placeholder={placeholder} required={required} value={form[key] || ''} onChange={update} />)}</div></Section></div></div><div className="flex justify-end border-t border-slate-100 px-5 py-4"><Button type="submit" disabled={isSaving} className="h-10 bg-accent px-5 text-xs font-bold text-white hover:bg-accent-hover">{isSaving ? 'Saving company…' : 'Save company'}</Button></div></form></main></AgencyShell>;
}

function Section({ icon: Icon, title, description, children }: { icon: typeof Building2; title: string; description: string; children: React.ReactNode }) { return <section className="border-b border-slate-100 p-5"><div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3"><div className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-accent"><Icon className="size-4" /></div><div><h2 className="text-sm font-bold text-brand">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{description}</p></div></div>{children}{title === 'Registered address' && <div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-3 flex items-center gap-2"><FileArchive className="size-4 text-accent" /><p className="text-xs font-semibold text-slate-700">Optional company documents</p><span className="text-[11px] text-slate-400">(not mandatory)</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[['gst_certificate', 'GST certificate'], ['registration_certificate', 'Registration certificate'], ['labour_license', 'Labour license'], ['contract_document', 'Contract document'], ['other', 'Other document']].map(([type, label]) => <label key={type} className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span><input data-company-document data-document-type={type} type="file" accept="image/*,.pdf,.doc,.docx" className="block w-full rounded-lg border border-slate-200 bg-white text-xs file:mr-3 file:border-0 file:bg-orange-50 file:px-3 file:py-2.5 file:font-semibold file:text-accent" /></label>)}</div></div>}</section>; }
function Field({ name, label, placeholder, required, value, onChange, icon: Icon }: { name: string; label: string; placeholder: string; required: boolean; value: string; onChange: (key: string, value: string) => void; icon?: typeof Mail }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-accent">*</span>}</span><div className="relative">{Icon && <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />}<input name={name} required={required} value={value} onChange={(event) => onChange(name, event.target.value)} placeholder={placeholder} className={`h-10 w-full rounded-lg border border-slate-200 bg-white ${Icon ? 'pl-9' : 'px-3'} pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-orange-100`} /></div></label>; }
