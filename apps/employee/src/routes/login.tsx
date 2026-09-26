import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginComponent,
});

function LoginComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Employee Login</h2>
        <p className="text-center text-gray-600">Login form placeholder</p>
      </div>
    </div>
  );
}
