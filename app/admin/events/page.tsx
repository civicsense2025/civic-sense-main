'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Container } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface UserEvent {
  id: string
  url: string
  event_title: string | null
  event_description: string | null
  event_date: string
  source_type: string
  source_metadata: any
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  user_id: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<UserEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [activeTab])

  async function loadEvents() {
    try {
      setLoading(true)
      const { data: events, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(events || [])
    } catch (error) {
      console.error('Error loading events:', error)
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(eventId: string, newStatus: 'approved' | 'rejected', notes?: string) {
    try {
      const { error } = await supabase
        .from('user_events')
        .update({ 
          status: newStatus,
          admin_notes: notes || null
        })
        .eq('id', eventId)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Event ${newStatus} successfully`
      })

      loadEvents()
    } catch (error) {
      console.error('Error updating event:', error)
      toast({
        title: 'Error',
        description: 'Failed to update event status',
        variant: 'destructive'
      })
    }
  }

  async function handleBulkImport() {
    try {
      const response = await fetch('/api/admin/events/bulk-import', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to start bulk import')

      toast({
        title: 'Success',
        description: 'Bulk import started successfully'
      })
    } catch (error) {
      console.error('Error starting bulk import:', error)
      toast({
        title: 'Error',
        description: 'Failed to start bulk import',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">
        <Container className="max-w-7xl py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light">Event Submissions</h1>
            <Button onClick={handleBulkImport}>
              Run Bulk Import
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-8">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {activeTab} events found
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map(event => (
                    <Card key={event.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">
                              {event.event_title || 'Untitled Event'}
                            </h3>
                            <Badge>
                              {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </Badge>
                            <Badge variant="outline">{event.source_type}</Badge>
                          </div>
                          
                          {event.event_description && (
                            <p className="text-muted-foreground">
                              {event.event_description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <a 
                              href={event.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Source URL
                            </a>
                            <span>•</span>
                            <span>
                              Submitted {format(new Date(event.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>

                          {event.admin_notes && (
                            <div className="mt-4 p-4 bg-muted rounded-md">
                              <p className="font-medium mb-1">Admin Notes:</p>
                              <p className="text-muted-foreground">{event.admin_notes}</p>
                            </div>
                          )}
                        </div>

                        {activeTab === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(event.id, 'rejected', 'Not relevant to our topics')}
                            >
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(event.id, 'approved')}
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Container>
      </main>
    </div>
  )
} 