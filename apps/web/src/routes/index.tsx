import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-slate-900/10"><span className="text-xl font-extrabold">M</span></div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">Agency workspace</p>
        <h1 className="text-4xl font-bold tracking-tight text-brand md:text-5xl">Manpower Platform</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-500">A focused workspace to manage candidates, employees, clients, and every placement in your agency.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/login" className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-accent-hover">Sign in to workspace</Link>
          <Link to="/dashboard" className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-brand transition hover:border-slate-300 hover:bg-slate-50">View dashboard</Link>
        </div>
      </div>
    </main>
  );
}
