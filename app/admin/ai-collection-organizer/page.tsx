/**
 * Admin Page: AI Collection Organizer
 * 
 * Provides access to the AI Collection Organizer Agent for administrators
 * to automatically generate thematic collections from existing content.
 */

import { Metadata } from 'next'
import { AICollectionOrganizer } from '@/components/admin/ai-collection-organizer'

export const metadata: Metadata = {
  title: 'AI Collection Organizer | CivicSense Admin',
  description: 'Intelligently organize content into thematic collections with inherited skills and sources'
}

export default function AICollectionOrganizerPage() {
  return (
    <div className="container mx-auto py-6">
      <AICollectionOrganizer />
    </div>
  )
} 