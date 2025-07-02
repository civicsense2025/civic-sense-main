import { Suspense } from 'react'
import QuizPageClient from './client'

// Define the correct type for params
type PageParams = {
  params: Promise<{ topicId: string }>
}

// Make the component async to handle async operations properly
export default async function QuizPage({ params }: PageParams) {
  // Resolve the params on the server before rendering the client component
  const resolvedParams = await params
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz...</p>
        </div>
      </div>
    }>
      <QuizPageClient params={resolvedParams} />
    </Suspense>
  )
} 