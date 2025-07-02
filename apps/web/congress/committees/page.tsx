import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@civicsense/ui-web/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Congressional Committees | CivicSense',
  description: 'Track congressional committees and where bills go to die. Understand committee power dynamics.',
  robots: 'noindex, nofollow',
};

export default function CongressCommitteesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congressional Committees
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            See where bills go to die. Track committee actions, membership, and power dynamics.
          </p>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 font-medium">Coming Soon</p>
          <p className="text-amber-700 text-sm mt-1">
            Committee tracking is under development. Soon you'll see which committees control which legislation.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading committees..." />}>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Congressional committee information will be displayed here once implemented.
            </p>
          </div>
        </Suspense>
      </div>
    </div>
  );
} 