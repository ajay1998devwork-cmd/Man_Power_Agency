import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/documents')({
  component: DocumentsComponent,
});

function DocumentsComponent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Documents</h1>
      <p className="text-gray-600">Documents list placeholder</p>
    </div>
  );
}
