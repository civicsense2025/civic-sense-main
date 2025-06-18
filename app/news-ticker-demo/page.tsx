import { Metadata } from 'next'
import { NewsTicker } from '@/components/news-ticker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Newspaper, 
  Sparkles, 
  Clock, 
  Target, 
  BookOpen,
  ArrowRight,
  Globe
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'News Ticker Demo - CivicSense',
  description: 'Interactive news ticker that transforms current events into civic education quizzes using AI.',
}

export default function NewsTickerDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Globe className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              News Ticker Demo
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time news powered by OpenAI's web search, automatically transformed into interactive civic education quizzes with AI-powered content generation
          </p>
        </div>

        {/* Feature Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>How It Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Newspaper className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">1. Live News Feed</h3>
                <p className="text-sm text-muted-foreground">
                  Uses OpenAI's web search to pull today's most important civic and political news, with fallback to trusted sources like Reuters, AP, NPR, and Politico
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">2. AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Click any article to have AI analyze the content and generate educational quiz questions
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">3. Interactive Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Generated quizzes focus on civic skills and real-world applications you can use immediately
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* News Ticker Component */}
        <NewsTicker 
          className="w-full"
          sources={['reuters', 'ap-news', 'politico', 'npr']}
          categories={['politics', 'government', 'elections']}
          autoScroll={true}
          scrollSpeed={40}
          maxArticles={15}
        />

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Real-Time Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The ticker continuously updates with the latest civic news, prioritizing stories with high educational value.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Live Feed</Badge>
                <Badge variant="outline">Civic Focus</Badge>
                <Badge variant="outline">Educational Relevance</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>AI-Powered Learning</span>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Premium
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Transform any news article into an educational quiz that builds practical civic skills and knowledge.
              </p>
                              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">OpenAI GPT-4o</Badge>
                <Badge variant="outline">Web Search</Badge>
                <Badge variant="outline">Skill Mapping</Badge>
                <Badge variant="outline">Action-Oriented</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Options */}
        <Card>
          <CardHeader>
            <CardTitle>Customization Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium mb-2">News Sources</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Reuters</div>
                  <div>• Associated Press</div>
                  <div>• Politico</div>
                  <div>• NPR</div>
                  <div>• BBC News</div>
                  <div>• + more</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Categories</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Politics</div>
                  <div>• Elections</div>
                  <div>• Government</div>
                  <div>• Civil Rights</div>
                  <div>• Economy</div>
                  <div>• Local Issues</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Display Options</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Auto-scroll speed</div>
                  <div>• Article count</div>
                  <div>• Update frequency</div>
                  <div>• Visual themes</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">AI Features</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Quiz generation</div>
                  <div>• Skill mapping</div>
                  <div>• Difficulty levels</div>
                  <div>• Learning paths</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">Basic Usage</h4>
              <pre className="text-sm text-muted-foreground overflow-x-auto">
{`<NewsTicker 
  sources={['reuters', 'ap-news', 'politico']}
  categories={['politics', 'government']}
  autoScroll={true}
  maxArticles={20}
/>`}
              </pre>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Required Environment Variables</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    NEWS_API_KEY
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Your NewsAPI.org API key for live news data
                  </p>
                </div>
                <div className="space-y-2">
                  <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    OPENAI_API_KEY
                  </code>
                  <p className="text-xs text-muted-foreground">
                    OpenAI API key for web search news retrieval and AI quiz generation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-2">Ready to Transform News into Learning?</h3>
            <p className="mb-4 opacity-90">
              Start using the news ticker to create engaging civic education content from current events
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary">
                <BookOpen className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <ArrowRight className="h-4 w-4 mr-2" />
                Try It Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 