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
    
    // Return fallback mock data in case of error
    const mockRelationships = {
      nodes: [
        { id: 'gov-basics', name: 'Government Basics', category: 'Government', level: 'beginner' },
        { id: 'media-literacy', name: 'Media Literacy', category: 'Media', level: 'beginner' },
        { id: 'civic-engagement', name: 'Civic Engagement', category: 'Participation', level: 'intermediate' }
      ],
      links: [
        { source: 'gov-basics', target: 'civic-engagement', required_level: 'beginner', is_strict: true },
        { source: 'media-literacy', target: 'civic-engagement', required_level: 'beginner', is_strict: false }
      ]
    };
    
    return NextResponse.json(mockRelationships);
  }
} 