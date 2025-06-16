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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 