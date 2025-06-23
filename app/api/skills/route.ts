import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/skills - List skills with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    
    // Parse filters from query params
    const category = searchParams.get('category'); // Single category filter
    const categories = searchParams.get('categories')?.split(','); // Multiple categories
    const difficulty_levels = searchParams.get('difficulty_levels')?.split(',').map(Number);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const include_stats = searchParams.get('include_stats') === 'true';

    // Build query
    let query = supabase
      .from('skills')
      .select('*');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    if (difficulty_levels && difficulty_levels.length > 0) {
      query = query.in('difficulty_level', difficulty_levels);
    }

    if (search) {
      query = query.or(`skill_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .order('category', { ascending: true })
      .order('difficulty_level', { ascending: true })
      .order('skill_name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: skills, error, count } = await query;

    if (error) {
      console.error('Error fetching skills:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let skillsWithStats = skills;

    // Include usage statistics if requested
    if (include_stats && skills) {
      skillsWithStats = await Promise.all(
        skills.map(async (skill: any) => {
          try {
            // Get usage stats from both tables
            const [questionUsage, contentUsage] = await Promise.all([
              supabase
                .from('question_skills')
                .select('id', { count: 'exact' })
                .eq('skill_id', skill.id),
              supabase
                .from('content_item_skills')
                .select('id', { count: 'exact' })
                .eq('skill_id', skill.id)
            ]);

            // Get collections that use this skill
            const { data: collectionsUsage } = await supabase
              .rpc('get_collections_with_skills', { skill_ids: [skill.id] });

            return {
              ...skill,
              usage_stats: {
                total_questions: questionUsage.count || 0,
                total_content_items: contentUsage.count || 0,
                total_collections: collectionsUsage?.length || 0,
                total_usage: (questionUsage.count || 0) + (contentUsage.count || 0)
              }
            };
          } catch (statsError) {
            console.warn(`Failed to load stats for skill ${skill.id}:`, statsError);
            return skill;
          }
        })
      );
    }

    // Get available categories for filtering
    const { data: categoryData } = await supabase
      .from('skills')
      .select('category')
      .neq('category', null);

    const availableCategories = [...new Set(categoryData?.map((s: any) => s.category) || [])];

    return NextResponse.json({
      skills: skillsWithStats,
      total: count,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil((count || 0) / limit),
      available_categories: availableCategories
    });
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/skills - Create new skill (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.skill_name || !body.description || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: skill_name, description, category' },
        { status: 400 }
      );
    }

    // Generate slug from skill name
    const skill_slug = body.skill_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const { data: existingSkill } = await supabase
      .from('skills')
      .select('id')
      .eq('skill_slug', skill_slug)
      .single();

    if (existingSkill) {
      return NextResponse.json(
        { error: `A skill with slug "${skill_slug}" already exists` },
        { status: 400 }
      );
    }

    // Create skill
    const { data: skill, error } = await supabase
      .from('skills')
      .insert({
        skill_name: body.skill_name,
        skill_slug,
        description: body.description,
        category: body.category,
        difficulty_level: body.difficulty_level || 1,
        icon: body.icon || 'Star',
        color: body.color || '#3B82F6',
        prerequisite_skills: body.prerequisite_skills || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating skill:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Create skill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 