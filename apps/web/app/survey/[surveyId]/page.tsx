import { notFound } from 'next/navigation'
import { SurveyTaker } from './survey-taker'

interface SurveyPageProps {
  params: Promise<{
    surveyId: string
  }>
}

async function getSurvey(surveyId: string) {
  try {
    // Use localhost in development, or construct the URL properly
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
    
    const response = await fetch(`${baseUrl}/api/surveys/${surveyId}`, {
      cache: 'no-store' // Always get fresh data for surveys
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.survey
  } catch (error) {
    console.error('Error fetching survey:', error)
    return null
  }
}

export async function generateMetadata({ params }: SurveyPageProps) {
  const { surveyId } = await params
  const survey = await getSurvey(surveyId)
  
  if (!survey) {
    return {
      title: 'Survey Not Found - CivicSense',
      description: 'The requested survey could not be found.'
    }
  }

  return {
    title: `${survey.title} - CivicSense Survey`,
    description: survey.description || 'Take this survey to help improve civic education.',
    robots: {
      index: false, // Don't index survey pages
      follow: false
    }
  }
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { surveyId } = await params
  const survey = await getSurvey(surveyId)

  if (!survey) {
    notFound()
  }

  return <SurveyTaker survey={survey} />
} 