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
    const categoryFilter = searchParams.get('category');
    
    // Get skill relationships for visualization
    const relationships = await skillOperations.getAllSkillRelationships();
    
    // Filter by category if specified
    if (categoryFilter && relationships.nodes.length > 0) {
      const filteredNodes = relationships.nodes.filter(node => 
        node.category.toLowerCase() === categoryFilter.toLowerCase()
      );
      
      // Get IDs of filtered nodes
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      
      // Filter links to only include connections between filtered nodes
      const filteredLinks = relationships.links.filter(link => 
        nodeIds.has(link.source) && nodeIds.has(link.target)
      );
      
      return NextResponse.json({
        nodes: filteredNodes,
        links: filteredLinks
      });
    }
    
    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error fetching skill relationships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 