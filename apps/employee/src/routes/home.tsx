import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home')({
  component: EmployeeHomeComponent,
});

function EmployeeHomeComponent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Home</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <p className="text-gray-600">View your profile information</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Payslips</h3>
          <p className="text-gray-600">Access your payslips</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Documents</h3>
          <p className="text-gray-600">View your documents</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <p className="text-gray-600">Update your profile</p>
        </div>
      </div>
    </div>
  );
}
