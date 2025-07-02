import { Suspense } from 'react';
import { Metadata } from 'next';
import { CongressionalBillsList } from '@civicsense/ui-web/components/congressional/bills-list';
import { CongressionalBillsFilter } from '@civicsense/ui-web/components/congressional/bills-filter';
import { LoadingSpinner } from '@civicsense/ui-web/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Congressional Bills | CivicSense',
  description: 'Track and understand congressional legislation with clear explanations of how bills actually affect your life.',
  robots: 'noindex, nofollow',
};

export default function CongressionalBillsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congressional Bills
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Cut through the political theater. See what Congress is actually doing 
            and how it affects your life.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <CongressionalBillsFilter />
          </aside>

          <main className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner text="Loading bills..." />}>
              <CongressionalBillsList searchParams={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
} 