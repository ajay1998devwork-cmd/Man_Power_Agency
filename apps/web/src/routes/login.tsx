import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@manpower/ui';
import { saveWorkspaceProfile } from '@/lib/workspace';
import { useToast } from '@/components/ui/toast';

export const Route = createFileRoute('/login')({
  component: LoginComponent,
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginComponent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!response.ok) throw new Error('Unable to sign in. Please check your credentials.');
      const result = await response.json();
      if (result.accessToken) localStorage.setItem('manpower_access_token', result.accessToken);
      saveWorkspaceProfile({
        tenantId: result.user?.tenantId ?? result.tenantId,
        agencyName: result.user?.tenant?.name ?? result.tenant?.name ?? result.agencyName,
        userName: result.user?.name ?? result.user?.fullName ?? result.user?.firstName,
        userEmail: result.user?.email ?? result.email ?? data.email,
        userRole: result.user?.role,
      });
      navigate({ to: '/dashboard' });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Unable to sign in right now.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-50">
      <section className="relative hidden w-[45%] overflow-hidden bg-brand p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-blue-400/10" />
        <div className="absolute -bottom-40 -left-24 size-96 rounded-full bg-accent/10" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white text-brand"><Building2 className="size-5" /></div>
            <div><p className="font-bold tracking-tight">Manpower</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Agency workspace</p></div>
          </div>
          <div className="mt-24 max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Workforce operations</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Build a stronger workforce, every day.</h1>
            <p className="mt-5 text-sm leading-7 text-slate-300">Manage candidates, employees, clients, and placements from one secure agency workspace.</p>
          </div>
        </div>
        <div className="relative space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> One workspace for your entire agency</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Secure access for your operations team</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Clear visibility into workforce health</div>
        </div>
      </section>

      <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[55%] lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-brand text-white"><Building2 className="size-5" /></div><div><p className="font-bold tracking-tight text-brand">Manpower</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Agency workspace</p></div></div></div>
          <div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">Welcome back</p><h2 className="text-2xl font-bold tracking-tight text-brand">Sign in to your workspace</h2><p className="mt-2 text-sm text-slate-500">Use your agency credentials to continue.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</div>}
              <div><label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">Email address</label><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" placeholder="you@agency.com" autoComplete="email" className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-orange-100" {...register('email')} /></div>{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}</div>
              <div><label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-9 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-orange-100" {...register('password')} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}</div>
              <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" className="size-3.5 rounded border-slate-300 accent-orange-500" {...register('remember')} /> Remember me</label><button type="button" className="text-xs font-semibold text-accent hover:text-accent-hover">Forgot password?</button></div>
              <Button type="submit" disabled={isLoading} className="h-11 w-full bg-accent text-sm font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Signing you in…' : 'Sign in to workspace'}</Button>
            </form>
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400"><ShieldCheck className="size-4 text-emerald-500" /> Your account and data are protected</div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">Need access? Contact your agency administrator.</p>
        </div>
      </section>
    </main>
  );
}
