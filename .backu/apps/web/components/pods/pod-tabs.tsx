import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface PodTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
  children: React.ReactNode
}

export function PodTabs({ activeTab, onTabChange, children }: PodTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="my-pods">My Pods</TabsTrigger>
        <TabsTrigger value="notifications">Activity</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

export { TabsContent } from '@/components/ui/tabs' 