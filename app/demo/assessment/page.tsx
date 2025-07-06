'use client'

import { useState } from 'react'
import { IndicatorCard } from '@/components/assessment/indicator-card'
import { RelatedTopics } from '@/components/assessment/related-topics'
import { FrameworkOverview } from '@/components/assessment/framework-overview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Grid2X2, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentFramework, Indicator, IndicatorSource } from '@/lib/assessment-framework/types'

export default function DemoPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Demo data
  const demoFramework: AssessmentFramework = {
    id: 'demo-framework',
    name: 'CivicSense Democracy Threat Assessment Framework',
    slug: 'civicsense_authoritarianism',
    description: 'Framework assessing threats of authoritarianism and democratic decline in the U.S.',
    frameworkType: 'authoritarianism',
    scoringSystem: {
      type: 'binary',
      scale: '0-20'
    },
    createdBy: 'system_seed',
    lastUpdated: new Date().toISOString(),
    categories: [
      {
        id: 'level1',
        frameworkId: 'demo-framework',
        name: 'Early Warning Signs',
        slug: 'level1_early_warning',
        description: 'Initial signs of authoritarian behavior that serve as warnings.',
        severityLevel: 1,
        thresholdDescription: 'Within the bounds of a functioning democracy but showing moderate anti-democratic violations.',
        displayOrder: 1
      }
    ],
    indicators: [
      {
        id: 'ind1',
        frameworkId: 'demo-framework',
        categoryId: 'level1',
        name: 'Anti-Democratic Rhetoric by Leaders',
        slug: 'anti_democratic_rhetoric',
        description: 'Leaders openly reject or show weak commitment to democratic rules.',
        evidenceThreshold: 'The indicator is triggered if a leader refuses to accept electoral outcomes.',
        measurementType: 'binary',
        measurementConfig: {
          options: ['triggered', 'partial', 'not_triggered']
        },
        weight: 1.0,
        displayOrder: 1,
        historicalContext: 'In 2020 the U.S. president refused to accept an election loss.',
        civicEducationAngle: 'Highlights importance of respecting election results.',
        status: 'TRIGGERED',
        currentStatus: 'Leaders continue to question election integrity without evidence.',
        lastUpdated: new Date().toISOString(),
        sources: [{
          id: 'src1',
          indicatorId: 'ind1',
          title: 'Analysis of Democratic Backsliding',
          url: 'https://example.com/analysis',
          type: 'academic',
          publicationDate: new Date().toISOString(),
          relevanceScore: 0.95,
          summary: 'Detailed analysis of anti-democratic rhetoric.'
        }]
      },
      {
        id: 'ind2',
        frameworkId: 'demo-framework',
        categoryId: 'level1',
        name: 'Delegitimizing the Opposition',
        slug: 'delegitimizing_opposition',
        description: 'Leaders describe political rivals as illegitimate or criminal enemies.',
        evidenceThreshold: 'Consistent labeling of opponents as traitors or criminals.',
        measurementType: 'binary',
        measurementConfig: {
          options: ['triggered', 'partial', 'not_triggered']
        },
        weight: 1.0,
        displayOrder: 2,
        historicalContext: 'Common tactic in authoritarian movements.',
        civicEducationAngle: 'Teaches importance of loyal opposition.',
        status: 'PARTIAL',
        currentStatus: 'Some concerning rhetoric but not systematic.',
        lastUpdated: new Date().toISOString(),
        sources: []
      },
      {
        id: 'ind3',
        frameworkId: 'demo-framework',
        categoryId: 'level1',
        name: 'Encouraging Political Violence',
        slug: 'encouraging_political_violence',
        description: 'Leaders endorse or refuse to condemn violence by supporters.',
        evidenceThreshold: 'Clear pattern of encouraging or excusing political violence.',
        measurementType: 'binary',
        measurementConfig: {
          options: ['triggered', 'partial', 'not_triggered']
        },
        weight: 1.0,
        displayOrder: 3,
        historicalContext: 'Historical examples show how violence becomes normalized.',
        civicEducationAngle: 'Emphasizes peaceful conflict resolution.',
        status: 'NOT_YET',
        currentStatus: 'No significant incidents in current period.',
        lastUpdated: new Date().toISOString(),
        sources: []
      }
    ],
    topicMappings: [],
    metadata: {
      totalIndicators: 3,
      triggeredCount: 1,
      partialCount: 1,
      notYetCount: 1,
      overallThreatLevel: 50
    }
  }

  const demoTopics = [
    {
      id: '1',
      title: 'Understanding Democratic Backsliding',
      description: 'Learn about the warning signs and historical patterns of democratic decline.',
      questionCount: 15,
      relevanceScore: 95,
      slug: 'democratic-backsliding'
    },
    {
      id: '2',
      title: 'Election Integrity',
      description: 'Explore the fundamentals of free and fair elections.',
      questionCount: 12,
      relevanceScore: 85,
      slug: 'election-integrity'
    },
    {
      id: '3',
      title: 'Political Violence in Democracies',
      description: 'Understanding the role and impact of political violence in democratic societies.',
      questionCount: 8,
      relevanceScore: 75,
      slug: 'political-violence'
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Assessment Framework Demo</h1>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800' : ''}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800' : ''}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <FrameworkOverview framework={demoFramework} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RelatedTopics 
              topics={demoTopics} 
              compact 
            />
            <div className="space-y-4">
              {demoFramework.indicators.slice(0, 2).map(indicator => (
                <IndicatorCard 
                  key={indicator.id} 
                  indicator={indicator}
                  compact
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-6">
          <div className={cn(
            'grid gap-6',
            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}>
            {demoFramework.indicators.map(indicator => (
              <IndicatorCard 
                key={indicator.id} 
                indicator={indicator}
                compact={viewMode === 'grid'}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="topics">
          <RelatedTopics 
            topics={demoTopics} 
            compact={viewMode === 'grid'}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 