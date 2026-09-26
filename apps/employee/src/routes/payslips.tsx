import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/payslips')({
  component: PayslipsComponent,
});

function PayslipsComponent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Payslips</h1>
      <p className="text-gray-600">Payslips list placeholder</p>
    </div>
  );
}
