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
    
    // Get user skills with progress information
    const skills = await skillOperations.getUserSkills(userId);
    
    // If no skills were found, return mock data
    if (!skills || skills.length === 0) {
      const mockSkills = [
        {
          id: 'mock-skill-1',
          skill_name: 'Understanding Government',
          skill_slug: 'understanding-government',
          category_name: 'Government',
          description: 'Learn the basics of how government works',
          difficulty_level: 1,
          is_core_skill: true,
          mastery_level: 'beginner',
          progress_percentage: 25,
          questions_attempted: 5,
          questions_correct: 3,
          last_practiced_at: new Date().toISOString()
        },
        {
          id: 'mock-skill-2',
          skill_name: 'Media Literacy',
          skill_slug: 'media-literacy',
          category_name: 'Media',
          description: 'Learn to critically evaluate media sources',
          difficulty_level: 2,
          is_core_skill: true,
          mastery_level: 'beginner',
          progress_percentage: 10,
          questions_attempted: 2,
          questions_correct: 1,
          last_practiced_at: new Date().toISOString()
        }
      ];
      
      return NextResponse.json({ data: mockSkills });
    }
    
    return NextResponse.json({ data: skills });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    
    // Return fallback mock data in case of error
    const mockSkills = [
      {
        id: 'mock-skill-1',
        skill_name: 'Understanding Government',
        skill_slug: 'understanding-government',
        category_name: 'Government',
        description: 'Learn the basics of how government works',
        difficulty_level: 1,
        is_core_skill: true,
        mastery_level: 'beginner',
        progress_percentage: 25,
        questions_attempted: 5,
        questions_correct: 3,
        last_practiced_at: new Date().toISOString()
      },
      {
        id: 'mock-skill-2',
        skill_name: 'Media Literacy',
        skill_slug: 'media-literacy',
        category_name: 'Media',
        description: 'Learn to critically evaluate media sources',
        difficulty_level: 2,
        is_core_skill: true,
        mastery_level: 'beginner',
        progress_percentage: 10,
        questions_attempted: 2,
        questions_correct: 1,
        last_practiced_at: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({ data: mockSkills });
  }
} 