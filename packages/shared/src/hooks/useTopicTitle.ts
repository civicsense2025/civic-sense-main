import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useTopicTitle(topicId: string) {
  const [topicTitle, setTopicTitle] = useState("Civic Quiz");

  useEffect(() => {
    const fetchTopicTitle = async () => {
      if (!topicId) return;
      
      try {
        const { data, error } = await supabase
          .from('question_topics')
          .select('topic_title')
          .eq('topic_id', topicId)
          .single();
          
        if (error) {
          console.error('Error fetching topic title:', error);
          return;
        }
        
        if (data) {
          setTopicTitle(data.topic_title);
        }
      } catch (err) {
        console.error('Failed to fetch topic title:', err);
      }
    };
    
    fetchTopicTitle();
  }, [topicId]);

  return { topicTitle, setTopicTitle };
} 