import { supabase } from '../supabase';

export async function fetchDailyTopics(dateStrings: string[]) {
  const { data, error } = await supabase
    .from('daily_question_topics')
    .select(`
      id, title, description, emoji, date, difficulty_level, estimated_minutes, question_count
    `)
    .in('date', dateStrings)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
} 