import { use } from 'react'
import ResultsPageClient from './client'

interface ResultsPageProps {
  params: {
    attemptId: string
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  return <ResultsPageClient params={params} />
} 