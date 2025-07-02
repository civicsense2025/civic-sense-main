import { Metadata } from 'next'
import { InstitutionalPodManager } from '@civicsense/ui-web/components/integrations/institutional-pod-manager'
import { SchoolPodFlowDiagram } from '@civicsense/ui-web/components/integrations/school-pod-flow-diagram'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@civicsense/ui-web/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Institutional Integration Test | CivicSense',
  description: 'Test the school-pod integration architecture with real-world workflows.',
}

export default function InstitutionalIntegrationTestPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs defaultValue="architecture" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-16 bg-slate-100 dark:bg-slate-800 h-12">
            <TabsTrigger value="architecture" className="gap-2 font-light">
              📐 Architecture Overview
            </TabsTrigger>
            <TabsTrigger value="management" className="gap-2 font-light">
              ⚙️ Pod Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="architecture">
            <SchoolPodFlowDiagram />
          </TabsContent>

          <TabsContent value="management">
            <InstitutionalPodManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 