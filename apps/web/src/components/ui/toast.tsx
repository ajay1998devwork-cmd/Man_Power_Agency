import { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type Toast = { id: number; type: 'success' | 'error'; message: string };
type ToastContextValue = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  };
  const value = useMemo(() => ({ success: (message: string) => add('success', message), error: (message: string) => add('error', message) }), []);

  return <ToastContext.Provider value={value}><>{children}</><div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">{toasts.map((toast) => <div key={toast.id} role="status" className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-xl ${toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>{toast.type === 'success' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />}<p className="flex-1 text-sm font-semibold text-slate-700">{toast.message}</p><button aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="text-slate-400 hover:text-slate-700"><X className="size-4" /></button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
