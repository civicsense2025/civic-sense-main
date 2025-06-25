/**
 * Example Usage of Enhanced AI Tools
 * 
 * This file demonstrates how to use the enhanced AI tools
 * with proper error handling, quality validation, and batch processing
 */

import {
  generateGlossaryTerms,
  generateKeyTakeaways,
  analyzeBias,
  createAITool,
  batchProcess,
  validateContentQuality,
  trackToolUsage,
  type AIToolResult
} from '@/lib/ai'

// ============================================================================
// EXAMPLE 1: Generate Glossary Terms
// ============================================================================

export async function exampleGlossaryGeneration() {
  console.log('🔍 Generating glossary terms...')
  
  // Generate new terms about a specific topic
  const result = await generateGlossaryTerms({
    type: 'generate_new',
    topic: 'Gerrymandering',
    count: 5,
    categories: ['elections', 'democracy'],
    difficulty_level: 3,
    include_web_search: true
  }, 'anthropic') // Optional: specify provider
  
  if (result.success && result.data) {
    console.log(`✅ Generated ${result.data.terms.length} terms`)
    console.log(`📊 Quality scores:`, result.data.metadata.quality_scores)
    console.log(`💾 Saved to DB: ${result.data.metadata.saved_to_db}`)
    console.log(`⏱️ Processing time: ${result.metadata.processingTime}ms`)
    
    // Display generated terms
    result.data.terms.forEach((term, index) => {
      console.log(`\n${index + 1}. ${term.term}`)
      console.log(`   Definition: ${term.definition}`)
      console.log(`   Uncomfortable Truth: ${term.uncomfortable_truth}`)
      console.log(`   Quality Score: ${term.quality_score}`)
    })
  } else {
    console.error('❌ Generation failed:', result.error)
    console.error('Retry count:', result.metadata.retryCount)
  }
}

// ============================================================================
// EXAMPLE 2: Generate Key Takeaways
// ============================================================================

export async function exampleKeyTakeawaysGeneration() {
  console.log('\n📚 Generating key takeaways...')
  
  const result = await generateKeyTakeaways({
    topicTitle: 'How the Electoral College Works',
    questionContent: [
      'How are electoral votes allocated to each state?',
      'What happens if no candidate wins 270 electoral votes?',
      'How does the winner-take-all system work?'
    ],
    existingContent: 'The Electoral College is a system established by the Constitution...',
    includeCurrentEvents: true
  })
  
  if (result.success && result.data) {
    console.log(`✅ Key takeaways generated for topic: ${result.data.topicId}`)
    console.log(`💾 Saved to database: ${result.data.saved}`)
    
    const takeaways = result.data.keyTakeaways
    console.log(`\n📋 Topic: ${takeaways.topic_title}`)
    console.log(`📊 Quality Scores:`, takeaways.metadata)
    
    takeaways.key_takeaways.forEach((takeaway, index) => {
      console.log(`\n${index + 1}. ${takeaway.takeaway}`)
      console.log(`   Power Dynamic: ${takeaway.power_dynamic_revealed}`)
      console.log(`   Action Step: ${takeaway.action_step}`)
    })
  } else {
    console.error('❌ Generation failed:', result.error)
  }
}

// ============================================================================
// EXAMPLE 3: Analyze Article Bias
// ============================================================================

export async function exampleBiasAnalysis() {
  console.log('\n📰 Analyzing article bias...')
  
  const result = await analyzeBias({
    articleUrl: 'https://example.com/article',
    articleContent: `
      Senate Republicans blocked the voting rights bill today, 
      arguing that federal oversight of state elections is unnecessary...
    `,
    sourceMetadataId: 'source_123',
    organizationId: 'org_456'
  })
  
  if (result.success && result.data) {
    console.log(`✅ Analysis completed: ${result.data.analysisId}`)
    console.log(`📊 Bias Scores:`)
    
    const scores = result.data.analysis.bias_scores
    Object.entries(scores).forEach(([dimension, score]) => {
      console.log(`   ${dimension}: ${score.score}/100 (${score.reasoning})`)
    })
    
    console.log(`\n🎯 Manipulation Techniques:`)
    result.data.analysis.manipulation_techniques.forEach((technique: any) => {
      console.log(`   - ${technique.technique} (${technique.severity})`)
      console.log(`     ${technique.description}`)
    })
    
    console.log(`\n📚 Civic Content Extracted:`)
    if (result.data.civicContentSaved) {
      console.log(`   Topics: ${result.data.civicContentSaved.question_topics?.created || 0} new, ${result.data.civicContentSaved.question_topics?.existing || 0} existing`)
    }
  } else {
    console.error('❌ Analysis failed:', result.error)
  }
}

// ============================================================================
// EXAMPLE 4: Batch Processing Multiple Topics
// ============================================================================

export async function exampleBatchProcessing() {
  console.log('\n🔄 Batch processing multiple topics...')
  
  // Create a glossary generator
  const glossaryTool = createAITool({
    toolType: 'glossary_generator',
    provider: 'anthropic',
    maxRetries: 2,
    retryDelay: 2000
  })
  
  // Topics to process
  const topics = [
    { type: 'generate_new' as const, topic: 'Filibuster', count: 3 },
    { type: 'generate_new' as const, topic: 'Executive Orders', count: 3 },
    { type: 'generate_new' as const, topic: 'Supreme Court Nominations', count: 3 },
    { type: 'generate_new' as const, topic: 'Congressional Committees', count: 3 },
    { type: 'generate_new' as const, topic: 'Lobbying', count: 3 }
  ]
  
  const { successful, failed } = await batchProcess(
    glossaryTool,
    topics,
    {
      concurrency: 2, // Process 2 at a time
      continueOnError: true,
      progressCallback: (completed, total) => {
        console.log(`   Progress: ${completed}/${total} (${Math.round(completed/total * 100)}%)`)
      }
    }
  )
  
  console.log(`\n✅ Successful: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)
  
  // Show results
  successful.forEach(({ input, output }) => {
    if (output.success && output.data) {
      console.log(`   ✅ ${input.topic}: ${output.data.terms?.length || 0} terms generated`)
    }
  })
  
  failed.forEach(({ input, error }) => {
    console.log(`   ❌ ${input.topic}: ${error}`)
  })
}

// ============================================================================
// EXAMPLE 5: Quality Validation
// ============================================================================

export async function exampleQualityValidation() {
  console.log('\n🎯 Validating content quality...')
  
  // Example content to validate
  const contentToValidate = {
    term: 'Gerrymandering',
    definition: 'Politicians drawing district maps to choose their voters instead of voters choosing them.',
    uncomfortable_truth: 'Both parties use sophisticated software to manipulate districts for guaranteed wins.',
    power_dynamics: ['State legislatures control federal districts', 'Courts rarely intervene'],
    specific_example: 'In Wisconsin 2022, Democrats won 51% of votes but only 35% of seats.',
    civic_action: 'Attend redistricting hearings and support independent commissions.'
  }
  
  const quality = validateContentQuality(contentToValidate)
  
  console.log('📊 Quality Scores:')
  console.log(`   Overall: ${quality.overall_score.toFixed(1)}/100`)
  console.log(`   Brand Voice: ${quality.brand_voice_score}/100`)
  console.log(`   Accuracy: ${quality.accuracy_score}/100`)
  console.log(`   Actionability: ${quality.actionability_score}/100`)
  console.log(`   Uncomfortable Truth: ${quality.uncomfortable_truth_score}/100`)
  console.log(`   ✅ Passes Minimum: ${quality.passes_minimum ? 'YES' : 'NO'}`)
}

// ============================================================================
// EXAMPLE 6: Error Handling Patterns
// ============================================================================

export async function exampleErrorHandling() {
  console.log('\n⚠️ Demonstrating error handling...')
  
  try {
    // Attempt to generate content
    const result = await generateGlossaryTerms({
      type: 'extract_from_content',
      content: '', // Empty content will cause validation error
      count: 5
    })
    
    if (!result.success) {
      // Handle specific error types
      if (result.error?.includes('Content is required')) {
        console.error('❌ Validation Error: Please provide content for extraction')
      } else if (result.error?.includes('API key')) {
        console.error('❌ Configuration Error: API key not configured')
      } else if (result.error?.includes('rate limit')) {
        console.error('❌ Rate Limit: Please wait before trying again')
        console.log(`   Retry after ${result.metadata.retryCount} attempts`)
      } else {
        console.error('❌ Unknown Error:', result.error)
      }
      
      // Log metadata for debugging
      console.log('Debug Info:', {
        tool: result.metadata.toolName,
        provider: result.metadata.provider,
        model: result.metadata.model,
        processingTime: result.metadata.processingTime,
        retryCount: result.metadata.retryCount
      })
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error('❌ Unexpected error:', error)
  }
}

// ============================================================================
// EXAMPLE 7: Custom Tool Usage Tracking
// ============================================================================

export async function exampleUsageTracking() {
  console.log('\n📊 Tracking tool usage...')
  
  await trackToolUsage({
    tool_name: 'Custom Content Analyzer',
    tool_type: 'content_generator',
    provider: 'openai',
    model: 'gpt-4',
    tokens_used: 2500,
    cost: 0.075, // $0.075
    processing_time: 4500, // 4.5 seconds
    success: true
  })
  
  console.log('✅ Usage tracked for analytics')
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export async function runAllExamples() {
  console.log('🚀 Running Enhanced AI Tools Examples\n')
  console.log('=' .repeat(80))
  
  try {
    await exampleGlossaryGeneration()
    console.log('\n' + '='.repeat(80))
    
    await exampleKeyTakeawaysGeneration()
    console.log('\n' + '='.repeat(80))
    
    await exampleBiasAnalysis()
    console.log('\n' + '='.repeat(80))
    
    await exampleBatchProcessing()
    console.log('\n' + '='.repeat(80))
    
    await exampleQualityValidation()
    console.log('\n' + '='.repeat(80))
    
    await exampleErrorHandling()
    console.log('\n' + '='.repeat(80))
    
    await exampleUsageTracking()
    
  } catch (error) {
    console.error('❌ Example failed:', error)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Examples complete!')
}

// Run if executed directly
if (require.main === module) {
  runAllExamples()
} 