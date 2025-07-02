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
    const skillSlug = searchParams.get('slug');
    const skillId = searchParams.get('id');
    
    if (!skillSlug && !skillId) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug or id' },
        { status: 400 }
      );
    }
    
    // Get skill details
    const skillDetails = await skillOperations.getSkillDetails(skillSlug || skillId!);
    
    // If no skill was found, return mock data
    if (!skillDetails.skill) {
      const mockSkillDetails = {
        skill: {
          id: 'mock-skill-1',
          skill_name: skillSlug ? skillSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Mock Skill',
          skill_slug: skillSlug || 'mock-skill',
          category_name: 'General',
          description: 'This is a mock skill description for demonstration purposes.',
          difficulty_level: 2,
          is_core_skill: true
        },
        objectives: [
          {
            id: 'obj-1',
            skill_id: 'mock-skill-1',
            objective_text: 'Understand the basic concepts',
            objective_type: 'knowledge',
            mastery_level_required: 'beginner',
            display_order: 1
          },
          {
            id: 'obj-2',
            skill_id: 'mock-skill-1',
            objective_text: 'Apply the concepts in practical scenarios',
            objective_type: 'application',
            mastery_level_required: 'intermediate',
            display_order: 2
          }
        ],
        prerequisites: [
          {
            id: 'prereq-1',
            skill_id: 'mock-skill-1',
            prerequisite_skill_id: 'mock-prereq-1',
            prerequisite_skill_name: 'Basic Knowledge',
            prerequisite_skill_slug: 'basic-knowledge',
            required_mastery_level: 'beginner',
            is_strict_requirement: true
          }
        ],
        dependentSkills: [
          {
            skill_id: 'mock-dep-1',
            skill_name: 'Advanced Application'
          }
        ]
      };
      
      return NextResponse.json(mockSkillDetails);
    }
    
    return NextResponse.json(skillDetails);
  } catch (error) {
    console.error('Error fetching skill details:', error);
    
    // Return fallback mock data in case of error
    const mockSkillDetails = {
      skill: {
        id: 'mock-skill-1',
        skill_name: 'Mock Skill',
        skill_slug: 'mock-skill',
        category_name: 'General',
        description: 'This is a mock skill description for demonstration purposes.',
        difficulty_level: 2,
        is_core_skill: true
      },
      objectives: [
        {
          id: 'obj-1',
          skill_id: 'mock-skill-1',
          objective_text: 'Understand the basic concepts',
          objective_type: 'knowledge',
          mastery_level_required: 'beginner',
          display_order: 1
        },
        {
          id: 'obj-2',
          skill_id: 'mock-skill-1',
          objective_text: 'Apply the concepts in practical scenarios',
          objective_type: 'application',
          mastery_level_required: 'intermediate',
          display_order: 2
        }
      ],
      prerequisites: [
        {
          id: 'prereq-1',
          skill_id: 'mock-skill-1',
          prerequisite_skill_id: 'mock-prereq-1',
          prerequisite_skill_name: 'Basic Knowledge',
          prerequisite_skill_slug: 'basic-knowledge',
          required_mastery_level: 'beginner',
          is_strict_requirement: true
        }
      ],
      dependentSkills: [
        {
          skill_id: 'mock-dep-1',
          skill_name: 'Advanced Application'
        }
      ]
    };
    
    return NextResponse.json(mockSkillDetails);
  }
} 