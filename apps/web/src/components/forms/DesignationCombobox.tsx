import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import designations from '@/data/designations.json';

const inputClass = 'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-orange-100';

export function DesignationCombobox({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const filtered = useMemo(() => designations.filter((role) => role.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.localeCompare(b)).slice(0, 12), [query]);

  const change = (nextValue: string) => { setQuery(nextValue); onChange(nextValue); setOpen(true); };
  const select = (role: string) => { setQuery(role); onChange(role); setOpen(false); };

  return <div className="relative"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => change(event.target.value)} onFocus={() => setOpen(true)} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); if (event.key === 'Enter' && filtered[0]) { event.preventDefault(); select(filtered[0]); } }} placeholder="Search or type a designation" className={`${inputClass} pl-9`} role="combobox" aria-expanded={open} aria-autocomplete="list" /><ChevronDown className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition ${open ? 'rotate-180' : ''}`} /></div>{open && <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl" role="listbox">{filtered.length ? filtered.map((role) => <button type="button" key={role} onMouseDown={(event) => event.preventDefault()} onClick={() => select(role)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-brand">{role}{value.toLowerCase() === role.toLowerCase() && <Check className="size-4 text-accent" />}</button>) : <p className="px-3 py-3 text-xs text-slate-500">No suggestion found. You can continue with your custom designation.</p>}</div>}{error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}</div>;
}
