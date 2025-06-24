/**
 * Test Route for Historical Research AI Agent
 * 
 * Provides testing scenarios and validation for the AI agent system
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestScenario {
  name: string
  description: string
  config: {
    mode: string
    themes?: string[]
    start_year?: number
    end_year?: number
    max_events: number
  }
  expectedOutcomes: {
    min_events: number
    min_confidence: number
    min_context_utilization: number
    should_address_gaps: boolean
  }
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Civil Rights Era Focus',
    description: 'Test agent ability to generate events focusing on civil rights with existing database context',
    config: {
      mode: 'thematic_research',
      themes: ['Civil Rights', 'Supreme Court', 'Constitutional Law'],
      start_year: 1950,
      end_year: 1970,
      max_events: 10
    },
    expectedOutcomes: {
      min_events: 8,
      min_confidence: 75,
      min_context_utilization: 60,
      should_address_gaps: true
    }
  },
  {
    name: 'Early Republic Period',
    description: 'Test agent gap analysis for potentially underrepresented early American period',
    config: {
      mode: 'period_focus',
      start_year: 1789,
      end_year: 1820,
      max_events: 15
    },
    expectedOutcomes: {
      min_events: 12,
      min_confidence: 70,
      min_context_utilization: 40,
      should_address_gaps: true
    }
  },
  {
    name: 'Systematic Survey',
    description: 'Test comprehensive database analysis and gap identification',
    config: {
      mode: 'systematic_survey',
      max_events: 25
    },
    expectedOutcomes: {
      min_events: 20,
      min_confidence: 65,
      min_context_utilization: 70,
      should_address_gaps: true
    }
  },
  {
    name: 'Relationship Discovery',
    description: 'Test knowledge graph building and content relationship creation',
    config: {
      mode: 'relationship_discovery',
      themes: ['Presidential Powers', 'Congressional Actions', 'Judicial Review'],
      max_events: 20
    },
    expectedOutcomes: {
      min_events: 15,
      min_confidence: 75,
      min_context_utilization: 80,
      should_address_gaps: false
    }
  }
]

// ============================================================================
// TEST EXECUTION
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user } = adminCheck
    const body = await request.json()
    const { scenario_name, custom_config } = body

    console.log(`🧪 Starting AI Agent Test - Scenario: ${scenario_name || 'Custom'}`)

    let testConfig: any
    let expectedOutcomes: any
    
    if (scenario_name) {
      const scenario = TEST_SCENARIOS.find(s => s.name === scenario_name)
      if (!scenario) {
        return NextResponse.json({ 
          error: `Test scenario '${scenario_name}' not found`,
          available_scenarios: TEST_SCENARIOS.map(s => s.name)
        }, { status: 400 })
      }
      testConfig = scenario.config
      expectedOutcomes = scenario.expectedOutcomes
    } else if (custom_config) {
      testConfig = custom_config
      expectedOutcomes = {
        min_events: 5,
        min_confidence: 60,
        min_context_utilization: 50,
        should_address_gaps: true
      }
    } else {
      return NextResponse.json({ 
        error: 'Either scenario_name or custom_config required',
        available_scenarios: TEST_SCENARIOS.map(s => ({ name: s.name, description: s.description }))
      }, { status: 400 })
    }

    // Execute the agent test
    const agentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/historical-research-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        ...testConfig,
        include_content_relationships: true,
        include_news_connections: false,
        generate_content_packages: true,
        learning_context: {
          use_existing_content: true,
          analyze_patterns: true,
          build_knowledge_graph: true
        }
      })
    })

    if (!agentResponse.ok) {
      const errorData = await agentResponse.json()
      throw new Error(`Agent test failed: ${errorData.error}`)
    }

    const agentData = await agentResponse.json()

    // Validate test results
    const testResults = validateTestResults(agentData, expectedOutcomes, testConfig)

    console.log(`✅ AI Agent Test completed:`, testResults.summary)

    return NextResponse.json({
      success: true,
      scenario: scenario_name || 'Custom',
      test_config: testConfig,
      expected_outcomes: expectedOutcomes,
      agent_response: agentData,
      test_results: testResults,
      recommendations: generateTestRecommendations(testResults, agentData)
    })

  } catch (error) {
    console.error('❌ AI Agent Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test execution failed'
    }, { status: 500 })
  }
}

// ============================================================================
// TEST VALIDATION
// ============================================================================

function validateTestResults(agentData: any, expectedOutcomes: any, testConfig: any) {
  const results = {
    passed: true,
    score: 0,
    max_score: 100,
    checks: [] as any[],
    summary: {} as any
  }

  // Check 1: Minimum events generated (20 points)
  const eventsGenerated = agentData.data?.events?.length || 0
  const eventsCheck = {
    name: 'Events Generated',
    expected: expectedOutcomes.min_events,
    actual: eventsGenerated,
    passed: eventsGenerated >= expectedOutcomes.min_events,
    points: 20
  }
  results.checks.push(eventsCheck)
  if (eventsCheck.passed) results.score += eventsCheck.points

  // Check 2: Confidence scores (20 points)
  const avgConfidence = agentData.summary?.confidence_score || 0
  const confidenceCheck = {
    name: 'Average Confidence',
    expected: expectedOutcomes.min_confidence,
    actual: avgConfidence,
    passed: avgConfidence >= expectedOutcomes.min_confidence,
    points: 20
  }
  results.checks.push(confidenceCheck)
  if (confidenceCheck.passed) results.score += confidenceCheck.points

  // Check 3: Context utilization (25 points)
  const contextUtilization = agentData.performance?.context_effectiveness?.contextUtilization || 0
  const contextCheck = {
    name: 'Context Utilization',
    expected: expectedOutcomes.min_context_utilization,
    actual: contextUtilization,
    passed: contextUtilization >= expectedOutcomes.min_context_utilization,
    points: 25
  }
  results.checks.push(contextCheck)
  if (contextCheck.passed) results.score += contextCheck.points

  // Check 4: Content quality (20 points)
  const qualityScore = agentData.validation?.quality_score || 0
  const qualityCheck = {
    name: 'Content Quality',
    expected: 70,
    actual: qualityScore,
    passed: qualityScore >= 70,
    points: 20
  }
  results.checks.push(qualityCheck)
  if (qualityCheck.passed) results.score += qualityCheck.points

  // Check 5: Gap addressing (15 points)
  const gapsAddressed = agentData.performance?.context_effectiveness?.gapsCovered || 0
  const gapsCheck = {
    name: 'Content Gaps Addressed',
    expected: expectedOutcomes.should_address_gaps ? 20 : 0,
    actual: gapsAddressed,
    passed: expectedOutcomes.should_address_gaps ? gapsAddressed >= 20 : true,
    points: 15
  }
  results.checks.push(gapsCheck)
  if (gapsCheck.passed) results.score += gapsCheck.points

  // Overall pass/fail
  results.passed = results.score >= 70
  results.summary = {
    overall_score: `${results.score}/${results.max_score}`,
    overall_passed: results.passed,
    events_generated: eventsGenerated,
    avg_confidence: avgConfidence,
    context_utilization: contextUtilization,
    quality_score: qualityScore,
    gaps_addressed: gapsAddressed,
    processing_time: agentData.performance?.processing_time_ms || 0
  }

  return results
}

function generateTestRecommendations(testResults: any, agentData: any): string[] {
  const recommendations: string[] = []

  if (!testResults.checks.find((c: any) => c.name === 'Events Generated')?.passed) {
    recommendations.push('🔄 Consider adjusting max_events parameter or research prompt to generate more events')
  }

  if (!testResults.checks.find((c: any) => c.name === 'Average Confidence')?.passed) {
    recommendations.push('🎯 Low confidence scores suggest prompt refinement or more specific research parameters needed')
  }

  if (!testResults.checks.find((c: any) => c.name === 'Context Utilization')?.passed) {
    recommendations.push('🔗 Improve database context integration - agent may not be effectively learning from existing content')
  }

  if (!testResults.checks.find((c: any) => c.name === 'Content Quality')?.passed) {
    recommendations.push('✨ Content quality issues detected - review validation errors and improve generation prompts')
  }

  if (agentData.validation?.issues?.length > 0) {
    recommendations.push(`⚠️ Address validation issues: ${agentData.validation.issues.slice(0, 3).join(', ')}`)
  }

  if (testResults.score >= 90) {
    recommendations.push('🎉 Excellent performance! Agent is functioning optimally with strong learning capabilities')
  } else if (testResults.score >= 70) {
    recommendations.push('✅ Good performance with room for optimization')
  } else {
    recommendations.push('🚨 Performance below threshold - significant improvements needed')
  }

  return recommendations
}

// ============================================================================
// GET AVAILABLE TEST SCENARIOS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      available_scenarios: TEST_SCENARIOS.map(scenario => ({
        name: scenario.name,
        description: scenario.description,
        config: scenario.config,
        expected_outcomes: scenario.expectedOutcomes
      })),
      test_framework: {
        description: 'AI Agent testing framework with validation and performance monitoring',
        features: [
          'Scenario-based testing',
          'Performance validation',
          'Context effectiveness analysis',
          'Content quality scoring',
          'Gap analysis validation',
          'Automated recommendations'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error fetching test scenarios:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch test scenarios'
    }, { status: 500 })
  }
} 