// =============================================================================
// TEXT HIGHLIGHTING DEMO PAGE
// =============================================================================

"use client"

import React, { useState, useRef } from 'react'
import { TextHighlighter } from '@civicsense/ui-web/components/bookmarks/text-highlighter'
import { SnippetCard } from '@civicsense/ui-web/components/bookmarks/snippet-card'
import { useAuth } from '@civicsense/ui-web/components/auth/auth-provider'
import { bookmarkOperations } from '@civicsense/shared/lib/bookmarks'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Separator } from '@civicsense/ui-web/components/ui/separator'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import type { BookmarkSnippet } from '@civicsense/shared/lib/types/bookmarks'

export default function TextHighlightingDemo() {
  const { user } = useAuth()
  const [savedSnippets, setSavedSnippets] = useState<BookmarkSnippet[]>([])
  const [highlightingEnabled, setHighlightingEnabled] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleHighlightSaved = async (snippetId: string) => {
    // Refresh the snippets list
    if (user?.id) {
      try {
        // In a real app, you'd fetch snippets for this specific content
        // For demo, we'll just show a placeholder
        console.log('Highlight saved with ID:', snippetId)
      } catch (error) {
        console.error('Failed to refresh snippets:', error)
      }
    }
  }

  const sampleContent = `
    The First Amendment to the United States Constitution protects several fundamental rights that are crucial to American democracy. These include freedom of speech, freedom of the press, freedom of religion, the right to assemble peacefully, and the right to petition the government for redress of grievances.

    However, what many people don't realize is that these rights are not absolute. The Supreme Court has established that the government can place certain restrictions on speech and expression, particularly when such expression poses a "clear and present danger" to public safety or national security.

    For example, the Court has ruled that the government can restrict speech that incites imminent lawless action, creates a hostile work environment, or constitutes defamation. The challenge lies in balancing these necessary restrictions with the fundamental principle of free expression.

    Understanding these nuances is essential for effective civic participation. Citizens who know both their rights and the legitimate limits on those rights are better equipped to engage meaningfully in democratic processes and hold their government accountable.

    This knowledge becomes particularly important when considering how social media platforms moderate content, how protest permits are issued, or how journalists protect their sources while serving the public interest.
  `

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Text Highlighting Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Select any text in the article below to highlight it with your choice of color. 
          Your highlights will be saved as bookmark snippets.
        </p>
        
        {!user && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Sign in to save your highlights permanently. Anonymous highlighting is not supported in this demo.
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={highlightingEnabled ? "default" : "outline"}
            onClick={() => setHighlightingEnabled(!highlightingEnabled)}
          >
            {highlightingEnabled ? "Disable" : "Enable"} Highlighting
          </Button>
          
          {user && (
            <Badge variant="outline" className="text-sm">
              Signed in as {user.email}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Understanding the First Amendment</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Text Highlighter Component */}
              <TextHighlighter
                contentType="article"
                contentId="first-amendment-demo"
                contentTitle="Understanding the First Amendment"
                contentUrl="/test-highlighting"
                enabled={highlightingEnabled && !!user}
                container={contentRef.current}
                onHighlightSaved={handleHighlightSaved}
                className="mb-4"
              />

              {/* Article content */}
              <div 
                ref={contentRef}
                className="prose prose-slate dark:prose-invert max-w-none"
              >
                {sampleContent.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with saved snippets */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              {savedSnippets.length > 0 ? (
                <div className="space-y-4">
                  {savedSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      showMetadata={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p className="mb-2">No highlights yet</p>
                  <p className="text-sm">
                    {user 
                      ? "Select text in the article to create your first highlight"
                      : "Sign in and select text to save highlights"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Highlight</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>1. Select any text in the article</p>
              <p>2. Choose a highlight color from the popup</p>
              <p>3. Your highlight is saved automatically</p>
              <p>4. Highlighted text appears with your chosen color</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSS for highlight styling */}
      <style jsx global>{`
        .civic-highlight {
          border-radius: 2px;
          padding: 1px 0;
          transition: all 0.2s ease;
        }
        
        .civic-highlight:hover {
          opacity: 0.8;
          transform: scale(1.01);
        }
      `}</style>
    </div>
  )
} 