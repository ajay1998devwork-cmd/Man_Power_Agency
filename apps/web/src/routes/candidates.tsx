import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/candidates')({
  component: CandidatesComponent,
});

function CandidatesComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Candidates</h1>
      <p className="text-gray-600">Candidate management placeholder</p>
    </div>
  );
}
