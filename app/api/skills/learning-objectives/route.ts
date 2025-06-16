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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    
    // Parse limit parameter
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Get learning objectives for the user
    const objectives = await skillOperations.getUserLearningObjectives(userId, limit);
    
    return NextResponse.json({ data: objectives });
  } catch (error) {
    console.error('Error fetching learning objectives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 