import { LocationAwareCivicDemo } from '@civicsense/ui-web/components/civic/location-aware-demo'

export default function LocationCivicTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            🚧 Demo Feature - Location-Aware Civic Engagement
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Connect Learning to Action
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            CivicSense's location-aware features connect your civic education to real-world action. 
            Find your representatives, understand how to contact them effectively, and get specific 
            scripts and templates for democratic participation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-8">
          <div className="text-center">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏛️</span>
            </div>
            <h3 className="font-semibold mb-2">Find Your Reps</h3>
            <p className="text-sm text-gray-600">
              Get your federal, state, and local representatives based on your address
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📞</span>
            </div>
            <h3 className="font-semibold mb-2">Get Action Steps</h3>
            <p className="text-sm text-gray-600">
              Receive specific scripts, templates, and tactics for effective advocacy
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold mb-2">Take Real Action</h3>
            <p className="text-sm text-gray-600">
              Transform civic knowledge into democratic participation that counts
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h4 className="font-semibold text-yellow-800 mb-2">🔧 Technical Implementation Demo</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>API Integration:</strong> Uses Congress.gov, OpenStates (Plural), and Google Civic APIs</p>
            <p><strong>Graceful Degradation:</strong> Handles API failures and missing data transparently</p>
            <p><strong>Action-Oriented:</strong> Connects representatives to specific engagement strategies</p>
            <p><strong>Brand Alignment:</strong> Embodies "action over passive consumption" core value</p>
          </div>
        </div>

        {/* Main Demo Component */}
        <LocationAwareCivicDemo />

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-4">Integration with CivicSense Platform</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h5 className="font-medium mb-2">Content Connection</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Link quiz topics to relevant representatives</li>
                <li>• Show voting records on quiz subjects</li>
                <li>• Connect news analysis to local impact</li>
                <li>• Integrate with learning paths and scenarios</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Future Enhancements</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Election alerts and voter guides</li>
                <li>• Local issue tracking and notifications</li>
                <li>• Community organizing tools</li>
                <li>• Impact tracking and success stories</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 