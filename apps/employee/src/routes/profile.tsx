import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/profile')({
  component: ProfileComponent,
});

function ProfileComponent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <p className="text-gray-600">Profile information placeholder</p>
    </div>
  );
}
