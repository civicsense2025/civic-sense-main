import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Congressional Voting Records | CivicSense',
  description: 'Track how members of Congress vote on key issues. Compare promises to actions.',
  robots: 'noindex, nofollow',
};

export default function CongressVotesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congressional Voting Records
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Track every vote. See how representatives actually vote versus what they promise.
          </p>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 font-medium">Coming Soon</p>
          <p className="text-amber-700 text-sm mt-1">
            Vote tracking is under development. Check back soon to see detailed voting records.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading votes..." />}>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Congressional voting records will be displayed here once implemented.
            </p>
          </div>
        </Suspense>
      </div>
    </div>
  );
} 