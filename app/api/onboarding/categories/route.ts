import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch categories using the get_onboarding_categories function
    const { data, error } = await supabase.rpc('get_onboarding_categories');

    if (error) {
      console.error('Error fetching onboarding categories:', error);
      // Return fallback data instead of error
      return NextResponse.json({
        data: [
          {
            id: '1',
            name: 'Government',
            emoji: '🏛️',
            description: 'How government works at local, state, and federal levels',
            display_order: 1,
            question_count: 25
          },
          {
            id: '2',
            name: 'Elections',
            emoji: '🗳️',
            description: 'Voting rights, election processes, and campaign finance',
            display_order: 2,
            question_count: 18
          },
          {
            id: '3',
            name: 'Civil Rights',
            emoji: '✊',
            description: 'Constitutional rights and civil liberties',
            display_order: 3,
            question_count: 15
          },
          {
            id: '4',
            name: 'Media Literacy',
            emoji: '📰',
            description: 'Evaluating sources and identifying misinformation',
            display_order: 4,
            question_count: 20
          },
          {
            id: '5',
            name: 'Economy',
            emoji: '💰',
            description: 'Economic policy, taxes, and financial literacy',
            display_order: 5,
            question_count: 12
          }
        ]
      });
    }

    // If no categories found, return fallback data
    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [
          {
            id: '1',
            name: 'Government',
            emoji: '🏛️',
            description: 'How government works at local, state, and federal levels',
            display_order: 1,
            question_count: 25
          },
          {
            id: '2',
            name: 'Elections',
            emoji: '🗳️',
            description: 'Voting rights, election processes, and campaign finance',
            display_order: 2,
            question_count: 18
          },
          {
            id: '3',
            name: 'Civil Rights',
            emoji: '✊',
            description: 'Constitutional rights and civil liberties',
            display_order: 3,
            question_count: 15
          }
        ]
      });
    }

    // Return categories with proper structure - note we're using 'data' as the key
    return NextResponse.json({
      data: data.map(category => ({
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        description: category.description,
        display_order: category.display_order,
        question_count: category.question_count
      }))
    });
  } catch (error) {
    console.error('Error in categories API:', error);
    // Return fallback data instead of error
    return NextResponse.json({
      data: [
        {
          id: '1',
          name: 'Government',
          emoji: '🏛️',
          description: 'How government works at local, state, and federal levels',
          display_order: 1,
          question_count: 25
        },
        {
          id: '2',
          name: 'Elections',
          emoji: '🗳️',
          description: 'Voting rights, election processes, and campaign finance',
          display_order: 2,
          question_count: 18
        }
      ]
    });
  }
} 