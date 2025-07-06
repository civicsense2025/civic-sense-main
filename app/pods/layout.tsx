import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learning Pods | CivicSense',
  description: 'Create and manage learning pods for collaborative civic education with family, friends, classrooms, and organizations.',
}

export default function PodsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 