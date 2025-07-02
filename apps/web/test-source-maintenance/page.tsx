import { SourceMaintenancePanel } from '@civicsense/ui-web/components/source-maintenance-panel'

export default function TestSourceMaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Source Maintenance Tool
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage broken sources in quiz questions with AI-powered replacements
          </p>
        </div>
        
        <SourceMaintenancePanel />
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🔧 Development Notes
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Environment Variables Required:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>OPENAI_API_KEY - Required for the "Fix" functionality</li>
              <li>Database connection - For reading/writing question sources</li>
            </ul>
            <p className="mt-3"><strong>Safety:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>"Scan" is read-only and safe to run anytime</li>
              <li>"Fix" modifies the database but keeps backups in source_metadata</li>
              <li>"Remove" permanently deletes broken source references</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 