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
    const categoryFilter = searchParams.get('category');
    
    // Get skill relationships for visualization - this now handles filtering and guest users internally
    const relationships = await skillOperations.getAllSkillRelationships(categoryFilter || undefined);
    
    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error fetching skill relationships:', error);
    
    // Use the mock relationships from skillOperations for consistency
    const mockRelationships = skillOperations.getMockSkillRelationships();
    return NextResponse.json(mockRelationships);
  }
} 