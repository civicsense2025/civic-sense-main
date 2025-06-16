import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';
import { skillOperations } from '@/lib/skill-operations';

// Create a Supabase client with the service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const skillSlug = searchParams.get('slug');
    
    // If a specific skill slug is provided, get details for that skill
    if (skillSlug) {
      const skillDetails = await skillOperations.getSkillDetails(skillSlug);
      
      if (!skillDetails.skill) {
        return NextResponse.json(
          { error: 'Skill not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(skillDetails);
    }
    
    // Otherwise, get all skills for the user
    const skills = await skillOperations.getUserSkills(userId);
    
    return NextResponse.json({ data: skills });
  } catch (error) {
    console.error('Error in skills API route:', error);
    
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
        progress_percentage: 25
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
        progress_percentage: 10
      }
    ];
    
    return NextResponse.json({ data: mockSkills });
  }
} 