import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ToastProvider><div className="min-h-screen bg-slate-50 text-slate-900"><Outlet /></div></ToastProvider>
  );
}
