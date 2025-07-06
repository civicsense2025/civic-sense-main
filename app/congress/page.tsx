import { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileText, 
  Users, 
  Vote, 
  TrendingUp, 
  Building2, 
  Calendar,
  Search,
  AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Congress Tracker | CivicSense',
  description: 'Track congressional activity, understand legislation, and see how your representatives vote on issues that affect you.',
  robots: 'noindex, nofollow',
};

export default function CongressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Congress Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Cut through political theater. Track what Congress actually does, 
            not what politicians say they'll do.
          </p>
        </header>

        {/* Alert Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">Early Access Feature</p>
            <p className="text-amber-700 text-sm mt-1">
              Congressional tracking is in active development. Data updates daily from Congress.gov.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link 
            href="/congress/bills"
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bills & Legislation
            </h3>
            <p className="text-gray-600 text-sm">
              Track bills through Congress. See who sponsors what and understand the real impact.
            </p>
          </Link>

          <Link 
            href="/congress/members"
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Members of Congress
            </h3>
            <p className="text-gray-600 text-sm">
              Find your representatives. See their voting records and sponsored legislation.
            </p>
          </Link>

          <Link 
            href="/congress/votes"
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Vote className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Voting Records
            </h3>
            <p className="text-gray-600 text-sm">
              Track how representatives vote on key issues. Compare promises to actions.
            </p>
          </Link>

          <Link 
            href="/congress/committees"
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Committees
            </h3>
            <p className="text-gray-600 text-sm">
              See where bills go to die. Track committee actions and power dynamics.
            </p>
          </Link>

          <Link 
            href="/congress/analysis"
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Power Analysis
            </h3>
            <p className="text-gray-600 text-sm">
              Understand influence networks, lobbying connections, and voting patterns.
            </p>
          </Link>

          <Link 
            href="/congress/calendar"
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Congressional Calendar
            </h3>
            <p className="text-gray-600 text-sm">
              Track sessions, recesses, and key votes. Know when decisions happen.
            </p>
          </Link>
        </div>

        {/* Search Section */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Find What Matters to You
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Search bills by topic, track your representatives, or explore voting patterns 
            on issues you care about.
          </p>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bills, members, or topics..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* CivicSense Value Prop */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Why Track Congress?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Real Impact</h3>
              <p className="text-gray-600 text-sm">
                See how bills affect your rent, healthcare, and daily life—not political talking points.
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Plain English</h3>
              <p className="text-gray-600 text-sm">
                We translate legislative jargon into language anyone can understand.
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Accountability</h3>
              <p className="text-gray-600 text-sm">
                Compare what politicians promise to how they actually vote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 