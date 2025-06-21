import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

interface PodPageProps {
  params: {
    podId: string
  }
}

async function getPodDetails(podId: string) {
  const supabase = await createClient()
  
  const { data: pod, error } = await supabase
    .from('learning_pods')
    .select('pod_name, pod_emoji, pod_motto')
    .eq('id', podId)
    .single()

  if (error || !pod) {
    return null
  }

  return pod
}

export async function generateMetadata({ params }: PodPageProps): Promise<Metadata> {
  const pod = await getPodDetails(params.podId)
  
  if (!pod) {
    return {
      title: 'Pod Not Found | CivicSense',
      description: 'This learning pod could not be found.',
    }
  }

  const podName = pod.pod_name
  const podEmoji = pod.pod_emoji || '👥'
  const podMotto = pod.pod_motto || 'A collaborative learning space'
  const title = `${podEmoji} ${podName}`

  // Generate the OpenGraph image URL with the pod details
  const imageUrl = new URL('/api/generate-image', process.env.NEXT_PUBLIC_APP_URL)
  imageUrl.searchParams.set('template', 'twitter-card')
  imageUrl.searchParams.set('title', title)
  imageUrl.searchParams.set('description', podMotto)
  imageUrl.searchParams.set('type', 'pod')
  imageUrl.searchParams.set('emoji', podEmoji)
  imageUrl.searchParams.set('theme', 'educator')

  return {
    title: `${title} | CivicSense`,
    description: podMotto,
    openGraph: {
      title: `${title} | CivicSense`,
      description: podMotto,
      images: [{
        url: imageUrl.toString(),
        width: 1200,
        height: 630,
        alt: `${podName} Learning Pod`
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | CivicSense`,
      description: podMotto,
      images: [imageUrl.toString()]
    }
  }
} 