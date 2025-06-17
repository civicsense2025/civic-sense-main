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
    
    // Get user skills with progress information - this now handles guest users internally
    const skills = await skillOperations.getUserSkills(userId);
    
    return NextResponse.json({ data: skills });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    
    // Use the mock skills from skillOperations for consistency
    const mockSkills = skillOperations.getMockSkills();
    return NextResponse.json({ data: mockSkills });
  }
} 