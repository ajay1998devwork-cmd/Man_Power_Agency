import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-xl px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Employee Portal
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to your employee portal
        </p>
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
