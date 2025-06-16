import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { skillOperations } from '@/lib/skill-operations';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession();
    
    let userId = 'guest-user';
    
    // If we have a valid session, use the actual user ID
    if (session?.user) {
      userId = session.user.id;
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    
    // Parse limit parameter
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Get learning objectives for the user
    const objectives = await skillOperations.getUserLearningObjectives(userId, limit);
    
    // If no objectives were found, return mock data
    if (!objectives || objectives.length === 0) {
      const mockObjectives = [
        {
          skill_slug: 'government-basics',
          skill_name: 'Government Basics',
          category_name: 'Government',
          objective_text: 'Understand the three branches of government',
          mastery_level_required: 'beginner',
          objective_type: 'knowledge',
          display_order: 1
        },
        {
          skill_slug: 'media-literacy',
          skill_name: 'Media Literacy',
          category_name: 'Media',
          objective_text: 'Identify reliable news sources',
          mastery_level_required: 'beginner',
          objective_type: 'application',
          display_order: 1
        },
        {
          skill_slug: 'civic-participation',
          skill_name: 'Civic Participation',
          category_name: 'Participation',
          objective_text: 'Learn how to contact your representatives',
          mastery_level_required: 'intermediate',
          objective_type: 'application',
          display_order: 2
        }
      ];
      
      return NextResponse.json({ data: mockObjectives });
    }
    
    return NextResponse.json({ data: objectives });
  } catch (error) {
    console.error('Error fetching learning objectives:', error);
    
    // Return fallback mock data in case of error
    const mockObjectives = [
      {
        skill_slug: 'government-basics',
        skill_name: 'Government Basics',
        category_name: 'Government',
        objective_text: 'Understand the three branches of government',
        mastery_level_required: 'beginner',
        objective_type: 'knowledge',
        display_order: 1
      },
      {
        skill_slug: 'media-literacy',
        skill_name: 'Media Literacy',
        category_name: 'Media',
        objective_text: 'Identify reliable news sources',
        mastery_level_required: 'beginner',
        objective_type: 'application',
        display_order: 1
      },
      {
        skill_slug: 'civic-participation',
        skill_name: 'Civic Participation',
        category_name: 'Participation',
        objective_text: 'Learn how to contact your representatives',
        mastery_level_required: 'intermediate',
        objective_type: 'application',
        display_order: 2
      }
    ];
    
    return NextResponse.json({ data: mockObjectives });
  }
} 