"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function NewsQuizGenerator({ article }: { article: any }) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null)

  const handleGenerate = async () => {
    setStatus('generating')
    try {
      const response = await fetch('/api/admin/generate-quiz', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}` 
        },
        body: JSON.stringify({
          articleId: article.id,
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Generation failed')
      }
      
      const result = await response.json()
      setGeneratedQuiz(result)
      setStatus('success')
    } catch (error: unknown) {
      setStatus('error')
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate quiz'
      )
    }
  }

  return (
    <Card className="border border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            <Sparkles className="inline mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            Generate Civic Quiz
          </CardTitle>
          <Badge variant={article.credibility_score >= 80 ? 'default' : 'destructive'}>
            {article.credibility_score} Credibility
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Source Verification</p>
            <div className="flex items-center mt-1">
              {article.has_valid_ssl ? (
                <ShieldCheck className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-red-600 mr-2" />
              )}
              <span>{article.domain}</span>
            </div>
          </div>
          
          <div>
            <p className="font-medium">Content Analysis</p>
            <div className="mt-1">
              <Badge variant="outline" className="mr-2">
                {article.bias_rating}
              </Badge>
              <Badge variant="outline">
                {article.category}
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Power Structures...
            </>
          ) : (
            'Generate Civic Education Content'
          )}
        </Button>

        {status === 'success' && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-400 font-medium">
              Success! Created quiz "{generatedQuiz.quizId}" covering:
            </p>
            <ul className="list-disc pl-6 mt-2 text-green-600 dark:text-green-300">
              {generatedQuiz.learning_objectives.map((obj: string, i: number) => (
                <li key={i} className="text-sm">{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-lg bg-red-50 dark:red-green-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400 font-medium">
              Failed to generate. Check source validity or try another article.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 