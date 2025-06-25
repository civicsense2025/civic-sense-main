import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { skillOperations } from '@/lib/skill-operations';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user skills with progress information - this now handles guest users internally
    const skills = await skillOperations.getUserSkills(user.id);
    
    return NextResponse.json({ data: skills });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    
    // Use the mock skills from skillOperations for consistency
    const mockSkills = skillOperations.getMockSkills();
    return NextResponse.json({ data: mockSkills });
  }
} 