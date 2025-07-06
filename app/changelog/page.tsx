"use client"

import { Header } from "@/components/header"
import { Container, Stack, Text } from "@/components/ui"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface UpdateEntry {
  date: string
  category: 'feature' | 'improvement' | 'fix'
  title: string
  story: string
  impact: string
  emoji: string
}

const updates: UpdateEntry[] = [
  {
    date: "June 18, 2025",
    category: "feature",
    title: "Learning Pods for Families & Classrooms",
    story: "I kept getting emails from parents asking if their kids could use CivicSense together, and from teachers wanting to use it in class. The problem was that civic education works best when you can discuss it with others—democracy isn't a solo activity. So I built learning pods where families and classrooms can learn together in private groups with proper oversight. It took way longer than expected because building collaborative features is hard, but watching families have real conversations about how government works has been incredible.",
    impact: "Families are finally having those dinner table conversations about civics that we've all been missing. Teachers are using it for government classes, and parents can guide their kids through complex political topics.",
    emoji: "👨‍👩‍👧‍👦"
  },
  {
    date: "June 18, 2025", 
    category: "improvement",
    title: "Better Surveys That Actually Matter",
    story: "The original surveys felt like homework—boring questions that didn't connect to real life. I rewrote everything to focus on what actually matters: understanding where people are in their civic journey and giving them concrete next steps. Instead of asking abstract questions, we now ask things like 'When was the last time you contacted your representative?' and follow up with specific actions you can take this week.",
    impact: "People are getting personalized recommendations that lead to real civic action, not just more knowledge they don't use.",
    emoji: "📋"
  },
  {
    date: "June 17, 2025",
    category: "improvement", 
    title: "Mobile-First Everything",
    story: "I realized most people were trying to use CivicSense on their phones during commutes or lunch breaks, but the experience was clunky. I rebuilt the entire interface mobile-first and added voice features so you can listen to explanations while walking. The swipe gestures for quiz answers feel natural now, and the text sizes actually work on small screens.",
    impact: "Civic learning now fits into your actual life instead of requiring you to sit at a computer.",
    emoji: "📱"
  },
  {
    date: "June 16-17, 2025",
    category: "fix",
    title: "Removed Barriers for Guest Users",
    story: "I was creating too many hoops for people to jump through before they could start learning. The whole point is to make civic education accessible, but I was asking for accounts and payments before people even knew if they wanted to use it. I simplified everything so anyone can start learning immediately, and added special access for students and teachers because civic education should be free for those who need it most.",
    impact: "Way more people are actually starting their civic learning journey instead of bouncing off the landing page.",
    emoji: "🚪"
  },
  {
    date: "June 12, 2025",
    category: "feature",
    title: "CivicSense Platform Launch",
    story: "After months of building in private, I finally launched CivicSense publicly. The goal was simple: create civic education that actually works—that teaches people how power really operates instead of just reciting textbook facts. I focused on uncomfortable truths about how government actually functions and connected everything to real actions people can take. It's the civic education I wish I'd had.",
    impact: "People are learning about civics in a way that actually prepares them for real democratic participation.",
    emoji: "🚀"
  }
]

const currentWork = [
  {
    title: "Making Media Bias Understandable",
    description: "I'm working on tools to help people understand how different news sources present the same story. Not to tell people what to think, but to help them see the techniques used to influence their thinking.",
    emoji: "🔍"
  },
  {
    title: "Connecting Learning to Action", 
    description: "Learning about civics is pointless if you don't use it. I'm building features that connect every lesson to specific actions you can take in your community—from contacting representatives to finding local meetings.",
    emoji: "🗳️"
  },
  {
    title: "Scaling Personal Conversations",
    description: "The best civic education happens in small groups with good discussion. I'm figuring out how to create that feeling even as more people join the platform.",
    emoji: "💬"
  }
]

function getCategoryColor(category: UpdateEntry['category']): string {
  switch (category) {
    case 'feature': return 'bg-primary/10 text-primary border-primary/20'
    case 'improvement': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
    case 'fix': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
    default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800'
  }
}

function getCategoryLabel(category: UpdateEntry['category']): string {
  switch (category) {
    case 'feature': return 'New Feature'
    case 'improvement': return 'Improvement'
    case 'fix': return 'Fix'
    default: return 'Update'
  }
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="w-full">
        <Container className="max-w-4xl py-12 sm:py-16 lg:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl font-light text-foreground tracking-tight mb-6">
              What I've Been Building
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              The real story behind CivicSense—what I've learned building civic education that actually works
            </p>
          </div>

          {/* Updates */}
   

            <Stack spacing="xl">
              {updates.map((update, index) => (
                <div key={index} className="border-b border-border pb-12 last:border-0 last:pb-0">
                  {/* Header */}
                  <Stack spacing="lg">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl sm:text-4xl flex-shrink-0 mt-1">
                        {update.emoji}
                      </div>
                      <Stack spacing="sm" className="flex-1">
                        <Text as="h3" size="xl" weight="medium" className="text-foreground">
                          {update.title}
                        </Text>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={getCategoryColor(update.category)}>
                            {getCategoryLabel(update.category)}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">
                            {update.date}
                          </span>
                        </div>
                      </Stack>
                    </div>

                    {/* Story */}
                    <div className="ml-0 sm:ml-16">
                      <Stack spacing="lg">
                        <div className="bg-muted/20 rounded-lg p-6">
                          <Text className="text-foreground leading-relaxed">
                            {update.story}
                          </Text>
                        </div>

                        <div>
                          <Stack spacing="sm">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">💡</span>
                              <Text weight="medium" className="text-foreground">
                                Why this matters
                              </Text>
                            </div>
                            <Text className="text-muted-foreground leading-relaxed">
                              {update.impact}
                            </Text>
                          </Stack>
                        </div>
                      </Stack>
                    </div>
                  </Stack>
                </div>
              ))}
            </Stack>

          {/* Current Work */}
          <Stack spacing="xl">
            <Stack spacing="lg">
              <Text as="h2" size="2xl" weight="normal" className="text-foreground mt-24">
                What I'm Working On Now
              </Text>
              <Text className="text-muted-foreground">
                The challenges I'm tackling next
              </Text>
            </Stack>

            <div className="grid gap-6">
              {currentWork.map((work, index) => (
                <div key={index} className="border-dashed border border-border rounded-lg p-6 bg-muted/10">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {work.emoji}
                    </div>
                    <Stack spacing="sm" className="flex-1">
                      <Text size="lg" weight="medium" className="text-foreground">
                        {work.title}
                      </Text>
                      <Text className="text-muted-foreground leading-relaxed">
                        {work.description}
                      </Text>
                    </Stack>
                  </div>
                </div>
              ))}
            </div>
          </Stack>

          {/* Footer CTA */}
          <div className="text-center pt-16">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium text-foreground">
                  Help me build better civic education
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Every person who uses CivicSense helps me understand what actually works for civic learning.
                </p>
              </div>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium transition-colors"
              >
                Support This Work
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </div>
  )
} 