import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/clients')({
  component: ClientsComponent,
});

function ClientsComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Clients</h1>
      <p className="text-gray-600">Client management placeholder</p>
    </div>
  );
}
