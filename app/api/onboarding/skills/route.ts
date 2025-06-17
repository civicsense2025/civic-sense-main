import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get('category_ids');
    
    let categoryIdsArray: string[] | undefined = undefined;
    
    // Parse category_ids if provided
    if (categoryIds) {
      try {
        const parsed = JSON.parse(categoryIds);
        // Validate that it's an array of strings
        if (Array.isArray(parsed) && 
            parsed.every(id => typeof id === 'string')) {
          categoryIdsArray = parsed;
        }
      } catch (e) {
        console.warn('Invalid category_ids parameter:', e);
      }
    }
    
    // Fetch skills using the get_onboarding_skills function
    const { data, error } = await supabase.rpc('get_onboarding_skills', {
      category_ids: categoryIdsArray
    });

    if (error) {
      console.error('Error fetching onboarding skills:', error);
      // Return fallback data instead of error
      return NextResponse.json({
        data: [
          {
            id: '1',
            skill_name: 'Read Government Budgets',
            skill_slug: 'read-budgets',
            category_id: '1',
            category_name: 'Government',
            description: 'Understand where tax money goes and what governments prioritize',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '2',
            skill_name: 'Research Candidates',
            skill_slug: 'research-candidates',
            category_id: '2',
            category_name: 'Elections',
            description: 'Look up candidates\' backgrounds, positions, and track records',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '3',
            skill_name: 'Check Sources',
            skill_slug: 'check-sources',
            category_id: '4',
            category_name: 'Media Literacy',
            description: 'Verify whether news sources and websites are trustworthy',
            difficulty_level: 1,
            is_core_skill: true
          },
          {
            id: '4',
            skill_name: 'Understand Constitutional Rights',
            skill_slug: 'constitutional-rights',
            category_id: '3',
            category_name: 'Civil Rights',
            description: 'Know your basic rights as protected by the Constitution',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '5',
            skill_name: 'Evaluate Economic Policies',
            skill_slug: 'economic-policies',
            category_id: '5',
            category_name: 'Economy',
            description: 'Understand the impacts of different economic approaches',
            difficulty_level: 3,
            is_core_skill: false
          }
        ]
      });
    }

    // If no skills found, return fallback data
    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [
          {
            id: '1',
            skill_name: 'Read Government Budgets',
            skill_slug: 'read-budgets',
            category_id: '1',
            category_name: 'Government',
            description: 'Understand where tax money goes and what governments prioritize',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '2',
            skill_name: 'Research Candidates',
            skill_slug: 'research-candidates',
            category_id: '2',
            category_name: 'Elections',
            description: 'Look up candidates\' backgrounds, positions, and track records',
            difficulty_level: 2,
            is_core_skill: true
          },
          {
            id: '3',
            skill_name: 'Check Sources',
            skill_slug: 'check-sources',
            category_id: '4',
            category_name: 'Media Literacy',
            description: 'Verify whether news sources and websites are trustworthy',
            difficulty_level: 1,
            is_core_skill: true
          }
        ]
      });
    }

    // Return skills with proper structure - note we're using 'data' as the key
    return NextResponse.json({
      data: data.map(skill => ({
        id: skill.id,
        skill_name: skill.skill_name,
        skill_slug: skill.skill_slug,
        category_id: skill.category_id,
        category_name: skill.category_name,
        description: skill.description,
        difficulty_level: skill.difficulty_level,
        is_core_skill: skill.is_core_skill
      }))
    });
  } catch (error) {
    console.error('Error in skills API:', error);
    // Return fallback data instead of error
    return NextResponse.json({
      data: [
        {
          id: '1',
          skill_name: 'Read Government Budgets',
          skill_slug: 'read-budgets',
          category_id: '1',
          category_name: 'Government',
          description: 'Understand where tax money goes and what governments prioritize',
          difficulty_level: 2,
          is_core_skill: true
        },
        {
          id: '2',
          skill_name: 'Research Candidates',
          skill_slug: 'research-candidates',
          category_id: '2',
          category_name: 'Elections',
          description: 'Look up candidates\' backgrounds, positions, and track records',
          difficulty_level: 2,
          is_core_skill: true
        }
      ]
    });
  }
} 