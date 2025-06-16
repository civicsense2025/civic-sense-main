import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { skillOperations } from '@/lib/skill-operations';

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
    
    // Get user skills with progress information
    const skills = await skillOperations.getUserSkills(userId);
    
    // If no skills were found, return a 404 error
    if (!skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'No skills found for this user' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: skills });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 