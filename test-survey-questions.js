const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSurveyQuestions() {
  try {
    console.log('Testing survey questions access...')
    
    // First, check if we can access the survey
    const { data: survey, error: surveyError } = await supabase
      .from('survey_summary')
      .select('*')
      .eq('id', 'e53174f1-da4e-4c49-bcc6-c4ac540f8d0a')
      .single()
    
    if (surveyError) {
      console.error('Error fetching survey:', surveyError)
      return
    }
    
    console.log('✅ Survey found:', survey.title)
    console.log('   Status:', survey.status)
    console.log('   Questions count:', survey.question_count)
    
    // Now try to fetch the questions
    console.log('\nTesting survey_questions table access...')
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', 'e53174f1-da4e-4c49-bcc6-c4ac540f8d0a')
      .order('question_order')
    
    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError)
      console.error('   Code:', questionsError.code)
      console.error('   Message:', questionsError.message)
      console.error('   Details:', questionsError.details)
      console.error('   Hint:', questionsError.hint)
      
      // Try with service role key
      console.log('\nTrying with service role key...')
      const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
      
      const { data: serviceQuestions, error: serviceError } = await serviceSupabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', 'e53174f1-da4e-4c49-bcc6-c4ac540f8d0a')
        .order('question_order')
      
      if (serviceError) {
        console.error('❌ Service role also failed:', serviceError)
      } else {
        console.log('✅ Service role worked! Found', serviceQuestions?.length || 0, 'questions')
        if (serviceQuestions && serviceQuestions.length > 0) {
          console.log('   First question:', serviceQuestions[0].question_text?.substring(0, 50) + '...')
        }
      }
      
      return
    }
    
    console.log('✅ Questions fetched successfully!')
    console.log('   Found', questions?.length || 0, 'questions')
    if (questions && questions.length > 0) {
      console.log('   First question:', questions[0].question_text?.substring(0, 50) + '...')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testSurveyQuestions() 