import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@civicsense/shared/lib/auth';
import { skillOperations } from '@civicsense/shared/lib/skill-operations';
import { createClient } from '@civicsense/shared/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    
    // Parse limit parameter
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Get learning objectives for the authenticated user
    const objectives = await skillOperations.getUserLearningObjectives(user.id, limit);
    
    return NextResponse.json({ data: objectives });
  } catch (error) {
    console.error('Error fetching learning objectives:', error);
    
    // Use the mock data from skillOperations for consistency
    const mockObjectives = skillOperations.getMockLearningObjectives();
    return NextResponse.json({ data: mockObjectives });
  }
} 