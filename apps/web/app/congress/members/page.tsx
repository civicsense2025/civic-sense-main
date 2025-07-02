import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@civicsense/ui-web';

export const metadata: Metadata = {
  title: 'Members of Congress | CivicSense',
  description: 'Find your representatives in Congress. See their voting records, sponsored bills, and track their actual impact.',
  robots: 'noindex, nofollow',
};

export default function CongressMembersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Members of Congress
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Find your representatives. See how they vote, what they sponsor, 
            and who funds their campaigns.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            {/* Placeholder for CongressionalMembersFilter component */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Filter Members</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">All States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chamber
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Both Chambers</option>
                    <option value="house">House</option>
                    <option value="senate">Senate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">All Parties</option>
                    <option value="D">Democrat</option>
                    <option value="R">Republican</option>
                    <option value="I">Independent</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner text="Loading members..." />}>
              {/* Placeholder for CongressionalMembersList component */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  Congressional members list will appear here once the component is implemented.
                </p>
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
} 