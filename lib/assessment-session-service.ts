export async function createAssessmentSession(
  userId: string,
  assessmentType: 'onboarding' | 'civics_test' | 'topic_quiz',
  topicId?: string // Make this optional
): Promise<{ sessionId: string; questions: any[] }> {
  try {
    console.log('🔄 Creating assessment session:', { userId, assessmentType, topicId });

    // Validate topic_id exists if provided
    if (topicId) {
      const { data: topicExists, error: topicError } = await supabase
        .from('question_topics')
        .select('topic_id')
        .eq('topic_id', topicId)
        .single();

      if (topicError || !topicExists) {
        console.warn(`⚠️ Topic ${topicId} not found, creating session without topic_id`);
        topicId = undefined; // Clear invalid topic_id
      }
    }

    // Create progress session with proper topic_id handling
    const sessionData: any = {
      user_id: userId,
      session_type: assessmentType,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      metadata: {
        assessmentType,
        startTime: Date.now(),
      }
    };

    // Only add topic_id if it's valid and exists
    if (topicId) {
      sessionData.topic_id = topicId;
    }

    const { data: session, error: sessionError } = await supabase
      .from('progress_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating progress session:', sessionError);
      throw new Error(`Failed to create assessment session: ${sessionError.message}`);
    }

    console.log('✅ Assessment session created:', session.id);

    // Fetch questions based on assessment type
    let questions: any[] = [];
    
    if (assessmentType === 'topic_quiz' && topicId) {
      // Get questions for specific topic
      const { data: topicQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .limit(10);

      if (questionsError) {
        console.error('❌ Error fetching topic questions:', questionsError);
        // Fallback to general questions
        questions = await getGeneralQuestions();
      } else {
        questions = topicQuestions || [];
      }
    } else {
      // Get general assessment questions
      questions = await getGeneralQuestions();
    }

    return {
      sessionId: session.id,
      questions
    };

  } catch (error) {
    console.error('❌ Error creating assessment session:', error);
    throw error;
  }
}

async function getGeneralQuestions(): Promise<any[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .limit(20);

    if (error) {
      console.error('❌ Error fetching general questions:', error);
      return [];
    }

    return questions || [];
  } catch (error) {
    console.error('❌ Error in getGeneralQuestions:', error);
    return [];
  }
} 