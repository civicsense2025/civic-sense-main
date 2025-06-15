import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get category_ids from query parameters if provided
    const { searchParams } = new URL(request.url);
    const categoryIdsParam = searchParams.get('category_ids');
    
    let categoryIds = null;
    if (categoryIdsParam) {
      try {
        categoryIds = JSON.parse(categoryIdsParam);
      } catch (e) {
        // If parsing fails, treat as single ID
        categoryIds = [categoryIdsParam];
      }
    }

    // Call the Supabase function to get skills for onboarding
    const { data, error } = await supabase.rpc('get_onboarding_skills', {
      category_ids: categoryIds
    });
    
    if (error) {
      console.error('Error fetching skills:', error);
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 