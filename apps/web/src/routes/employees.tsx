import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/employees')({
  component: EmployeesComponent,
});

function EmployeesComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Employees</h1>
      <p className="text-gray-600">Employee management placeholder</p>
    </div>
  );
}
