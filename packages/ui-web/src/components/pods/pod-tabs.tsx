import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Users, Bell, BarChart3 } from 'lucide-react'

interface PodTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children: React.ReactNode
}

export function PodTabs({ activeTab, onTabChange, children }: PodTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-12 bg-slate-100 dark:bg-slate-800 h-12">
        <TabsTrigger value="my-pods" className="gap-2 font-light text-sm">
          <Users className="h-4 w-4" />
          My Pods
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2 font-light text-sm">
          <Bell className="h-4 w-4" />
          Activity
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2 font-light text-sm">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

export { TabsContent } 