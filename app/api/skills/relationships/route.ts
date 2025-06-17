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