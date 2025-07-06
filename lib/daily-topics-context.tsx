import React, { createContext, useContext, useState } from 'react';

export type DailyTopic = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  date: string;
  difficulty_level: number;
  estimated_minutes: number;
  question_count: number;
  is_completed?: boolean;
};

type DailyTopicsContextType = {
  dailyTopics: DailyTopic[] | null;
  setDailyTopics: (topics: DailyTopic[]) => void;
};

const DailyTopicsContext = createContext<DailyTopicsContextType | undefined>(undefined);

export function DailyTopicsProvider({ children }: { children: React.ReactNode }) {
  const [dailyTopics, setDailyTopics] = useState<DailyTopic[] | null>(null);
  return (
    <DailyTopicsContext.Provider value={{ dailyTopics, setDailyTopics }}>
      {children}
    </DailyTopicsContext.Provider>
  );
}

export function useDailyTopics() {
  const ctx = useContext(DailyTopicsContext);
  if (!ctx) throw new Error('useDailyTopics must be used within DailyTopicsProvider');
  return ctx;
} 