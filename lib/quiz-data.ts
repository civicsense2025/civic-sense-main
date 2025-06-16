// Topic metadata structure
export interface TopicMetadata {
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string // HTML content
  emoji: string
  date: string
  dayOfWeek: string
  categories: string[] // Added categories field
}

// Question types
export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "matching" | "fill_in_blank" | "drag_and_drop" | "ordering" | "crossword"

// Question structure
export interface QuizQuestion {
  topic_id: string
  question_number: number
  question_type: QuestionType
  category: string
  question: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer: string
  hint: string
  explanation: string
  tags: string[]
  sources: Source[]
  // New fields for interactive question types
  matching_pairs?: Array<{ left: string; right: string }>
  fill_in_blanks?: Array<{ text: string; answer: string }>
  drag_items?: Array<{ id: string; content: string; category?: string }>
  ordering_items?: Array<{ id: string; content: string; correct_order: number }>
  crossword_data?: {
    size: { rows: number; cols: number };
    words: Array<{
      word: string;
      clue: string;
      position: { row: number; col: number };
      direction: 'across' | 'down';
      number: number;
    }>;
  }
}

export interface Source {
  name: string
  url: string
}

// All available categories with emojis
export const allCategories = [
  { name: "Government", emoji: "🏛️" },
  { name: "Elections", emoji: "🗳️" },
  { name: "Economy", emoji: "💰" },
  { name: "Foreign Policy", emoji: "🌐" },
  { name: "Justice", emoji: "⚖️" },
  { name: "Civil Rights", emoji: "✊" },
  { name: "Environment", emoji: "🌱" },
  { name: "Media", emoji: "📱" },
  { name: "Local Issues", emoji: "🏙️" },
  { name: "Constitutional Law", emoji: "📜" },
] as const

export type CategoryType = (typeof allCategories)[number]["name"]

// Data is now fetched from database via dataService
// Mock data moved to lib/mock-data.ts for fallback scenarios

// Questions data is now fetched from database via dataService
// Mock questions moved to lib/mock-data.ts for fallback scenarios

// Helper function to get category emoji
export function getCategoryEmoji(categoryName: string): string {
  const category = allCategories.find((cat) => cat.name === categoryName)
  return category?.emoji || "📚"
}
