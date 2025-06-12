export interface CivicCardData {
  id: string
  date: string
  dayOfWeek: string
  topic: string
  gameTitle: string
  emoji: string
  gameComponentKey: GameComponentKey
  topicId?: string
}

export type GameComponentKey =
  | "NominationNavigatorQuiz"
  | "PolicyImpactPuzzle"
  | "BallotBoxStrategy"
  | "TradeWindsNegotiation"
  | "TruthTrackerChallenge"
  | "BillToLawJourney"
  | "CommunityConnectorMap"

export const weeklyCivicCards: CivicCardData[] = [
  {
    id: "2025-06-09",
    date: "June 9, 2025",
    dayOfWeek: "Monday",
    topic: "Supreme Court Update: New Nomination Analysis",
    gameTitle: "Nomination Navigator Quiz",
    emoji: "⚖️",
    gameComponentKey: "NominationNavigatorQuiz",
    topicId: "supreme_court_nomination_2025",
  },
  {
    id: "2025-06-10",
    date: "June 10, 2025",
    dayOfWeek: "Tuesday",
    topic: "Understanding the New National Economic Policy",
    gameTitle: "Policy Impact Puzzle",
    emoji: "📊",
    gameComponentKey: "PolicyImpactPuzzle",
    topicId: "economic_policy_2025",
  },
  {
    id: "2025-06-11",
    date: "June 11, 2025",
    dayOfWeek: "Wednesday",
    topic: "Local Elections: Why Your Vote Matters",
    gameTitle: "Ballot Box Strategy",
    emoji: "🗳️",
    gameComponentKey: "BallotBoxStrategy",
    topicId: "local_elections_2025",
  },
  {
    id: "2025-06-12",
    date: "June 12, 2025",
    dayOfWeek: "Thursday",
    topic: "Global Affairs: A New International Trade Agreement",
    gameTitle: "Trade Winds Negotiation",
    emoji: "🌐",
    gameComponentKey: "TradeWindsNegotiation",
    topicId: "trade_agreement_2025",
  },
  {
    id: "2025-06-13",
    date: "June 13, 2025",
    dayOfWeek: "Friday",
    topic: "Media Literacy: Navigating News & Information",
    gameTitle: "Truth Tracker Challenge",
    emoji: "📰",
    gameComponentKey: "TruthTrackerChallenge",
    topicId: "media_literacy_2025",
  },
  {
    id: "2025-06-14",
    date: "June 14, 2025",
    dayOfWeek: "Saturday",
    topic: "The Legislative Process: How a Bill Becomes Law",
    gameTitle: "Bill to Law Journey",
    emoji: "📜",
    gameComponentKey: "BillToLawJourney",
    topicId: "legislative_process_2025",
  },
  {
    id: "2025-06-15",
    date: "June 15, 2025",
    dayOfWeek: "Sunday",
    topic: "Civic Duty: Engagement Beyond the Ballot Box",
    gameTitle: "Community Connector Map",
    emoji: "👥",
    gameComponentKey: "CommunityConnectorMap",
    topicId: "civic_engagement_2025",
  },
]
