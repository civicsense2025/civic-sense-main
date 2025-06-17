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
    
    // Get learning objectives for the user - this now handles guest users internally
    const objectives = await skillOperations.getUserLearningObjectives(userId, limit);
    
    return NextResponse.json({ data: objectives });
  } catch (error) {
    console.error('Error fetching learning objectives:', error);
    
    // Use the mock data from skillOperations for consistency
    const mockObjectives = await skillOperations.getMockLearningObjectives();
    return NextResponse.json({ data: mockObjectives });
  }
} 