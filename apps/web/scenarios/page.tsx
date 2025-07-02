import { Metadata } from 'next'
import { ScenariosClient } from '@/apps/web/scenarios/scenarios-client'

export const metadata: Metadata = {
  title: 'Civic Scenarios | Interactive Political Simulations',
  description: 'Experience democracy in action through interactive scenarios. Make decisions as mayors, senators, activists, and other civic leaders to understand how government really works.',
  keywords: ['civic scenarios', 'political simulation', 'government education', 'democracy', 'civic engagement'],
  openGraph: {
    title: 'Civic Scenarios | Interactive Political Simulations',
    description: 'Experience democracy in action through interactive scenarios. Make decisions as mayors, senators, activists, and other civic leaders.',
    type: 'website',
  },
}

export default function ScenariosPage() {
  return <ScenariosClient />
} 