import type { TopicMetadata, QuizQuestion } from '@civicsense/types'

// Mock topic data - used as fallback when database is unavailable
export const mockTopicsData: Record<string, TopicMetadata> = {
  supreme_court_nomination_2025: {
    topic_id: "supreme_court_nomination_2025",
    topic_title: "Supreme Court Nomination Process",
    description:
      "The President has nominated Judge Maria Rodriguez to fill the Supreme Court vacancy. This nomination comes after Justice Thomas announced his retirement last month, creating an opportunity to reshape the court's ideological balance.",
    why_this_matters:
      "<ul><li><strong>Personal Impact:</strong> Supreme Court decisions directly affect your rights, from healthcare access to privacy protections.</li><li><strong>Civic Voice:</strong> Understanding the nomination process helps you advocate effectively to your senators who vote on confirmation.</li><li><strong>Generational Influence:</strong> Justices serve for life, meaning this appointment could shape laws for decades to come.</li><li><strong>Constitutional Role:</strong> This process demonstrates how our government's checks and balances work in real time.</li></ul>",
    emoji: "⚖️",
    date: "2025-06-09",
    dayOfWeek: "Monday",
    categories: ["Government", "Justice", "Constitutional Law"],
  },
  economic_policy_2025: {
    topic_id: "economic_policy_2025",
    topic_title: "The Inflation Reduction Act Implementation",
    description:
      "The Inflation Reduction Act's key provisions are now being implemented nationwide. This landmark legislation aims to combat inflation while investing in domestic energy production, manufacturing, and reducing carbon emissions.",
    why_this_matters:
      "<ul><li><strong>Household Budget:</strong> The Act directly affects prices you pay for healthcare, energy, and everyday goods.</li><li><strong>Tax Benefits:</strong> You may qualify for new tax credits for electric vehicles or home energy improvements.</li><li><strong>Job Opportunities:</strong> New investments in manufacturing and clean energy are creating jobs across the country.</li><li><strong>Climate Action:</strong> These policies will determine the air quality and environmental conditions in your community.</li></ul>",
    emoji: "📊",
    date: "2025-06-10",
    dayOfWeek: "Tuesday",
    categories: ["Economy", "Environment", "Government"],
  },
  local_elections_2025: {
    topic_id: "local_elections_2025",
    topic_title: "Local Election Participation Crisis",
    description:
      "Local election turnout has hit historic lows nationwide, with many municipal elections seeing less than 20% voter participation. These elections determine leadership for schools, police, infrastructure, and other essential local services.",
    why_this_matters:
      "<ul><li><strong>Neighborhood Impact:</strong> Local officials decide issues that affect your daily life—from school quality to road repairs.</li><li><strong>Your Tax Dollars:</strong> These elected officials control how your local tax money is spent.</li><li><strong>Accessible Democracy:</strong> Local officials are typically more accessible than national ones, giving you more direct influence.</li><li><strong>Representation Gap:</strong> Low turnout means decisions are made by a small fraction of the community, potentially missing your needs.</li></ul>",
    emoji: "🗳️",
    date: "June 11, 2025",
    dayOfWeek: "Wednesday",
    categories: ["Elections", "Local Issues", "Government"],
  },
  trade_agreement_2025: {
    topic_id: "trade_agreement_2025",
    topic_title: "U.S.-Pacific Digital Trade Agreement",
    description:
      "The United States has signed a new digital trade agreement with Pacific nations, establishing rules for cross-border data flows and digital commerce. This agreement creates the world's largest digital trade zone while addressing concerns about data privacy and security.",
    why_this_matters:
      "<ul><li><strong>Online Privacy:</strong> This agreement sets standards for how your personal data can be used across borders.</li><li><strong>Job Security:</strong> Digital trade rules affect which tech and service jobs stay in the U.S. versus moving overseas.</li><li><strong>Online Shopping:</strong> The agreement influences prices and availability of products you buy from international sellers.</li><li><strong>Digital Rights:</strong> These rules help determine your rights as a consumer in the global digital marketplace.</li></ul>",
    emoji: "🌐",
    date: "June 12, 2025",
    dayOfWeek: "Thursday",
    categories: ["Foreign Policy", "Economy", "Government"],
  },
  media_literacy_2025: {
    topic_id: "media_literacy_2025",
    topic_title: "Combating Misinformation in Elections",
    description:
      "With the 2026 midterm elections approaching, social media platforms have announced new policies to combat misinformation. These measures include enhanced fact-checking partnerships, labeling of AI-generated content, and restrictions on unverified political claims.",
    why_this_matters:
      "<ul><li><strong>Informed Voting:</strong> Your ability to make sound voting decisions depends on access to accurate information.</li><li><strong>Social Media Use:</strong> These policies affect what content you see daily on platforms you use.</li><li><strong>Community Trust:</strong> Misinformation can damage relationships in your community and fuel division among neighbors.</li><li><strong>Democratic Health:</strong> A shared factual understanding is essential for citizens to effectively participate in democracy together.</li></ul>",
    emoji: "📰",
    date: "June 13, 2025",
    dayOfWeek: "Friday",
    categories: ["Media", "Elections", "Civil Rights"],
  },
  legislative_process_2025: {
    topic_id: "legislative_process_2025",
    topic_title: "The Infrastructure Bill Debate",
    description:
      "Congress is debating a major infrastructure bill that would invest $2 trillion in roads, bridges, broadband, and clean energy. The bill represents one of the largest infrastructure investments in decades and has sparked intense debate about priorities and funding.",
    why_this_matters:
      "<ul><li><strong>Daily Commute:</strong> This bill could directly improve the roads and public transit you use every day.</li><li><strong>Internet Access:</strong> Broadband investments would affect your internet speed and reliability, especially in rural areas.</li><li><strong>Job Creation:</strong> Infrastructure projects create thousands of local jobs that could benefit your community.</li><li><strong>Tax Implications:</strong> Understanding how this bill is funded helps you evaluate its impact on your taxes.</li></ul>",
    emoji: "📜",
    date: "June 14, 2025",
    dayOfWeek: "Saturday",
    categories: ["Government", "Economy", "Local Issues"],
  },
  civic_engagement_2025: {
    topic_id: "civic_engagement_2025",
    topic_title: "Community Oversight of Policing",
    description:
      "Cities across America are implementing new civilian oversight boards for police departments. These boards give community members a voice in reviewing police policies, handling complaints, and increasing transparency in law enforcement practices.",
    why_this_matters:
      "<ul><li><strong>Community Safety:</strong> These boards influence how policing happens in your neighborhood.</li><li><strong>Civic Participation:</strong> They provide a direct way for citizens to shape public safety approaches.</li><li><strong>Accountability:</strong> Understanding these systems helps you know how to address concerns about local law enforcement.</li><li><strong>Trust Building:</strong> Effective oversight can improve relationships between communities and police that serve them.</li></ul>",
    emoji: "👥",
    date: "June 15, 2025",
    dayOfWeek: "Sunday",
    categories: ["Justice", "Local Issues", "Civil Rights"],
  },
  // Add the real database topic that exists in the SQL files
  tiktok_regulation_2024: {
    topic_id: "tiktok_regulation_2024",
    topic_title: "TikTok Regulation and Potential Ban",
    description: "The ongoing debate and legislative action on TikTok regulation and potential ban in the United States (2023-2024). Congress has passed legislation requiring TikTok's parent company to divest or face a ban, citing national security concerns about foreign data access and influence.",
    why_this_matters: "<ul><li><strong>Digital Privacy:</strong> This legislation affects how your personal data is protected and who can access it online.</li><li><strong>Free Speech:</strong> Understanding the balance between national security and First Amendment rights in the digital age.</li><li><strong>Economic Impact:</strong> Millions of creators and businesses depend on TikTok for income, affecting the digital economy.</li><li><strong>Democratic Process:</strong> This showcases how Congress responds to national security concerns in the modern digital landscape.</li></ul>",
    emoji: "📱",
    date: "2024-03-15",
    dayOfWeek: "Friday",
    categories: ["Government", "National Security", "Constitutional Rights", "Media Literacy", "Legislative Process"],
  },
}

// Mock questions data - used as fallback when database is unavailable
export const mockQuestionsData: Record<string, QuizQuestion[]> = {
  supreme_court_nomination_2025: [
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 1,
      type: "multiple_choice",
      category: "Constitutional Powers",
      question: "Who has the constitutional authority to nominate Supreme Court justices?",
      option_a: "The President",
      option_b: "The Senate",
      option_c: "The Chief Justice",
      option_d: "The Attorney General",
      correct_answer: "The President",
      hint: "Think about Article II of the Constitution.",
      explanation:
        "The President has the power to nominate Supreme Court justices under Article II, Section 2 of the Constitution. This is part of the system of checks and balances, as the Senate must then confirm the nomination.",
      tags: ["separation of powers", "constitutional powers", "judicial branch"],
      sources: [
        {
          title: "U.S. Constitution, Article II",
          url: "https://constitution.congress.gov/constitution/article-2/",
          type: "article"
        },
        {
          title: "Supreme Court of the United States",
          url: "https://www.supremecourt.gov/about/constitutional.aspx",
          type: "article"
        }
      ]
    },
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 2,
      type: "true_false",
      category: "Confirmation Process",
      question: "A simple majority vote in the Senate is required to confirm a Supreme Court nominee.",
      option_a: "True",
      option_b: "False",
      correct_answer: "True",
      hint: "This rule changed in recent years.",
      explanation:
        "Since 2017, Supreme Court nominations require only a simple majority (51 votes if all senators vote) for confirmation, after the Senate eliminated the 60-vote threshold previously required to overcome a filibuster for Supreme Court nominees.",
      tags: ["senate procedures", "judicial nominations", "filibuster"],
      sources: [
        {
          title: "United States Senate",
          url: "https://www.senate.gov/about/powers-procedures/nominations/nominations-process.htm",
          type: "article"
        },
        {
          title: "Congressional Research Service",
          url: "https://crsreports.congress.gov/product/pdf/R/R44819",
          type: "article"
        }
      ]
    },
  ],
  economic_policy_2025: [
    {
      topic_id: "economic_policy_2025",
      question_number: 1,
      type: "multiple_choice",
      category: "Economy",
      question: "What is a key goal of the Inflation Reduction Act?",
      option_a: "Increase international trade",
      option_b: "Combat inflation while investing in domestic energy",
      option_c: "Reduce government spending",
      option_d: "Raise interest rates",
      correct_answer: "Combat inflation while investing in domestic energy",
      hint: "Think about the name and main provisions of the Act.",
      explanation: "The Inflation Reduction Act aims to combat inflation through various measures while making significant investments in domestic energy production and manufacturing.",
      tags: ["economy", "legislation", "energy policy"],
      sources: [
        {
          title: "Overview of the Inflation Reduction Act",
          url: "https://www.congress.gov/bill/117th-congress/house-bill/5376",
          type: "article"
        }
      ]
    }
  ],
  // Add a placeholder for the real TikTok questions (these would be fetched from database)
  tiktok_regulation_2024: [
    {
      topic_id: "tiktok_regulation_2024",
      question_number: 1,
      type: "multiple_choice",
      category: "Government",
      question: "Which federal body passed legislation in 2024 requiring TikTok's parent company to divest or face a ban in the U.S.?",
      option_a: "The Supreme Court",
      option_b: "The House of Representatives",
      option_c: "The Federal Communications Commission",
      option_d: "The Department of Justice",
      correct_answer: "option_b",
      hint: "It's the legislative chamber where bills often originate.",
      explanation: "In March 2024, the U.S. House of Representatives passed a bill targeting TikTok, citing national security concerns.",
      tags: [],
      sources: [
        {
          name: "New York Times - TikTok House Vote",
          url: "https://www.nytimes.com/2024/03/13/technology/tiktok-house-vote.html"
        }
      ],
    },
  ],
}

// Mock data for testing
export const mockTopics: TopicMetadata[] = [
  {
    topic_id: 'mock-topic-1',
    topic_title: 'Mock Topic 1',
    description: 'This is a mock topic for testing',
    why_this_matters: 'Understanding mock data is important for testing',
    emoji: '🧪',
    date: '2024-01-01',
    dayOfWeek: 'Monday',
    categories: ['Testing', 'Mock Data']
  },
  {
    topic_id: 'mock-topic-2',
    topic_title: 'Mock Topic 2',
    description: 'Another mock topic for testing',
    why_this_matters: 'Multiple test cases help ensure robustness',
    emoji: '🔬',
    date: '2024-01-02',
    dayOfWeek: 'Tuesday',
    categories: ['Testing', 'Mock Data']
  }
];

export const mockQuestions: QuizQuestion[] = [
  {
    topic_id: 'mock-topic-1',
    question_number: 1,
    type: 'multiple_choice',
    category: 'Testing',
    question: 'What is the purpose of mock data?',
    option_a: 'To make the code look pretty',
    option_b: 'To test functionality without real data',
    option_c: 'To confuse developers',
    option_d: 'To slow down tests',
    correct_answer: 'To test functionality without real data',
    hint: 'Think about what we need during development',
    explanation: 'Mock data allows us to test functionality without depending on real data sources',
    tags: ['testing', 'development'],
    sources: [
      {
        title: 'Testing Best Practices',
        url: 'https://example.com/testing',
        type: 'article'
      }
    ]
  },
  {
    topic_id: 'mock-topic-1',
    question_number: 2,
    type: 'true_false',
    category: 'Testing',
    question: 'Mock data should be as complex as possible.',
    option_a: 'True',
    option_b: 'False',
    correct_answer: 'False',
    hint: 'Think about maintainability',
    explanation: 'Mock data should be simple and focused on testing specific functionality',
    tags: ['testing', 'best-practices'],
    sources: [
      {
        title: 'Mock Data Guidelines',
        url: 'https://example.com/mock-data',
        type: 'article'
      }
    ]
  }
]; 