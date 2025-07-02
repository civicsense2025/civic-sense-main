import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@civicsense/ui-web/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Congressional Calendar | CivicSense',
  description: 'Track congressional sessions, recesses, and key votes. Know when decisions happen.',
  robots: 'noindex, nofollow',
};

export default function CongressCalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congressional Calendar
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Know when Congress is in session, when they're on recess, 
            and when key votes are scheduled.
          </p>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 font-medium">Coming Soon</p>
          <p className="text-amber-700 text-sm mt-1">
            Congressional calendar tracking is under development. Soon you'll never miss important legislative moments.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading calendar..." />}>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Congressional calendar will be displayed here once implemented.
            </p>
          </div>
        </Suspense>
      </div>
    </div>
  );
} 