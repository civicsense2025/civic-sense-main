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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const skillSlug = searchParams.get('slug');
    const skillId = searchParams.get('id');
    
    if (!skillSlug && !skillId) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug or id' },
        { status: 400 }
      );
    }
    
    // Get skill details using either slug or ID
    const identifier = skillSlug || skillId!;
    const skillDetails = await skillOperations.getSkillDetails(identifier);
    
    if (!skillDetails.skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(skillDetails);
  } catch (error) {
    console.error('Error fetching skill details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 