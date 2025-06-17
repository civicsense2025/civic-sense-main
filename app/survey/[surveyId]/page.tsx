import { notFound } from 'next/navigation'
import { SurveyTaker } from './survey-taker'

interface SurveyPageProps {
  params: {
    surveyId: string
  }
}

async function getSurvey(surveyId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/surveys/${surveyId}`, {
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
  const survey = await getSurvey(params.surveyId)
  
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
  const survey = await getSurvey(params.surveyId)

  if (!survey) {
    notFound()
  }

  return <SurveyTaker survey={survey} />
} 