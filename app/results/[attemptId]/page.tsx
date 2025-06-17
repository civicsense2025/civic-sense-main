import { use } from 'react'
import ResultsPageClient from './client'

interface ResultsPageProps {
  params: {
    attemptId: string
  }
}

export default function ResultsPage({ params }: ResultsPageProps) {
  // Resolve the params on the server before rendering the client component
  const resolvedParams = {
    attemptId: params.attemptId
  }
  
  return <ResultsPageClient params={resolvedParams} />
} 