import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learning Analytics | CivicSense',
  description: 'Comprehensive insights into your civic education journey',
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="analytics-layout">
      {children}
    </div>
  )
} 