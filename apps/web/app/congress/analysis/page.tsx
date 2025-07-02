import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@civicsense/ui-web';

export const metadata: Metadata = {
  title: 'Congressional Power Analysis | CivicSense',
  description: 'Understand influence networks, lobbying connections, and voting patterns in Congress.',
  robots: 'noindex, nofollow',
};

export default function CongressAnalysisPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congressional Power Analysis
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Understand the real influence networks. See lobbying connections, voting blocs, 
            and how power actually flows in Congress.
          </p>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 font-medium">Coming Soon</p>
          <p className="text-amber-700 text-sm mt-1">
            Power analysis tools are under development. Soon you'll see the hidden connections that drive decisions.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner text="Analyzing power dynamics..." />}>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Congressional power analysis will be displayed here once implemented.
            </p>
          </div>
        </Suspense>
      </div>
    </div>
  );
} 