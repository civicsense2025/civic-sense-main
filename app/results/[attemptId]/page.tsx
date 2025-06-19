import { use } from 'react'
import ResultsPageClient from './client'

interface ResultsPageProps {
  params: Promise<{
    attemptId: string
  }>
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = await params
  return <ResultsPageClient params={resolvedParams} />
} 