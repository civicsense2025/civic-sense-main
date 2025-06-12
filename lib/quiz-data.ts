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
export type QuestionType = "multiple_choice" | "true_false" | "short_answer"

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

// Mock topic data
export const topicsData: Record<string, TopicMetadata> = {
  supreme_court_nomination_2025: {
    topic_id: "supreme_court_nomination_2025",
    topic_title: "Supreme Court Nomination Process",
    description:
      "The President has nominated Judge Maria Rodriguez to fill the Supreme Court vacancy. This nomination comes after Justice Thomas announced his retirement last month, creating an opportunity to reshape the court's ideological balance.",
    why_this_matters:
      "<ul><li><strong>Personal Impact:</strong> Supreme Court decisions directly affect your rights, from healthcare access to privacy protections.</li><li><strong>Civic Voice:</strong> Understanding the nomination process helps you advocate effectively to your senators who vote on confirmation.</li><li><strong>Generational Influence:</strong> Justices serve for life, meaning this appointment could shape laws for decades to come.</li><li><strong>Constitutional Role:</strong> This process demonstrates how our government's checks and balances work in real time.</li></ul>",
    emoji: "⚖️",
    date: "June 9, 2025",
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
    date: "June 10, 2025",
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
}

// Mock questions data - make sure this is properly exported
export const questionsData: Record<string, QuizQuestion[]> = {
  supreme_court_nomination_2025: [
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "Constitutional Powers",
      question: "Who has the constitutional authority to nominate Supreme Court justices?",
      option_a: "The President",
      option_b: "The Senate",
      option_c: "The Chief Justice",
      option_d: "The Attorney General",
      correct_answer: "option_a",
      hint: "Think about Article II of the Constitution.",
      explanation:
        "The President has the power to nominate Supreme Court justices under Article II, Section 2 of the Constitution. This is part of the system of checks and balances, as the Senate must then confirm the nomination.",
      tags: ["separation of powers", "constitutional powers", "judicial branch"],
      sources: [
        {
          name: "U.S. Constitution, Article II",
          url: "https://constitution.congress.gov/constitution/article-2/",
        },
        {
          name: "Supreme Court of the United States",
          url: "https://www.supremecourt.gov/about/constitutional.aspx",
        },
      ],
    },
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 2,
      question_type: "true_false",
      category: "Confirmation Process",
      question: "A simple majority vote in the Senate is required to confirm a Supreme Court nominee.",
      correct_answer: "true",
      hint: "This rule changed in recent years.",
      explanation:
        "Since 2017, Supreme Court nominations require only a simple majority (51 votes if all senators vote) for confirmation, after the Senate eliminated the 60-vote threshold previously required to overcome a filibuster for Supreme Court nominees.",
      tags: ["senate procedures", "judicial nominations", "filibuster"],
      sources: [
        {
          name: "United States Senate",
          url: "https://www.senate.gov/about/powers-procedures/nominations/nominations-process.htm",
        },
        {
          name: "Congressional Research Service",
          url: "https://crsreports.congress.gov/product/pdf/R/R44819",
        },
      ],
    },
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 3,
      question_type: "multiple_choice",
      category: "Judicial Qualifications",
      question: "What are the constitutional requirements to serve as a Supreme Court Justice?",
      option_a: "Law degree, 10 years of legal experience, and U.S. citizenship",
      option_b: "35 years of age, natural born citizen, and law degree",
      option_c: "Previous judicial experience and Senate approval",
      option_d: "There are no specific constitutional requirements",
      correct_answer: "option_d",
      hint: "The Constitution is surprisingly brief on this matter.",
      explanation:
        "The Constitution does not specify qualifications for Supreme Court Justices. There is no requirement for age, education, profession, or native-born citizenship. Justices don't even need a law degree, though all modern justices have been trained in law.",
      tags: ["judicial qualifications", "constitutional interpretation", "supreme court"],
      sources: [
        {
          name: "Supreme Court of the United States",
          url: "https://www.supremecourt.gov/about/faq_general.aspx",
        },
        {
          name: "U.S. Constitution",
          url: "https://constitution.congress.gov/",
        },
      ],
    },
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 4,
      question_type: "short_answer",
      category: "Historical Context",
      question: "What was the significance of the Marbury v. Madison case in establishing the Supreme Court's power?",
      correct_answer: "judicial review",
      hint: "It established a fundamental power of the Court over legislation.",
      explanation:
        "Marbury v. Madison (1803) established the principle of judicial review, giving the Supreme Court the power to invalidate acts of Congress that conflict with the Constitution. This landmark case fundamentally shaped the Court's role in our system of government.",
      tags: ["judicial review", "landmark cases", "constitutional interpretation"],
      sources: [
        {
          name: "National Archives",
          url: "https://www.archives.gov/milestone-documents/marbury-v-madison",
        },
        {
          name: "Oyez Project",
          url: "https://www.oyez.org/cases/1789-1850/5us137",
        },
      ],
    },
    {
      topic_id: "supreme_court_nomination_2025",
      question_number: 5,
      question_type: "multiple_choice",
      category: "Confirmation Process",
      question: "Which Senate committee is responsible for holding hearings on Supreme Court nominees?",
      option_a: "Judiciary Committee",
      option_b: "Rules Committee",
      option_c: "Ethics Committee",
      option_d: "Constitutional Affairs Committee",
      correct_answer: "option_a",
      hint: "This committee handles matters related to the federal courts and justice system.",
      explanation:
        "The Senate Judiciary Committee conducts hearings on Supreme Court nominations, where nominees testify and answer questions from senators. After hearings, the committee votes on whether to send the nomination to the full Senate with a positive, negative, or neutral recommendation.",
      tags: ["senate procedures", "confirmation process", "committees"],
      sources: [
        {
          name: "United States Senate Committee on the Judiciary",
          url: "https://www.judiciary.senate.gov/about/history",
        },
        {
          name: "Congressional Research Service",
          url: "https://crsreports.congress.gov/product/pdf/R/R44236",
        },
      ],
    },
  ],
  economic_policy_2025: [
    {
      topic_id: "economic_policy_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "Fiscal Policy",
      question: "What is the primary goal of the Inflation Reduction Act?",
      option_a: "To reduce the federal deficit",
      option_b: "To combat inflation while investing in domestic energy",
      option_c: "To increase corporate tax rates",
      option_d: "To expand Medicare coverage",
      correct_answer: "option_b",
      hint: "Think about the name of the act and its dual purpose.",
      explanation:
        "The Inflation Reduction Act aims to combat inflation while making significant investments in domestic energy production and manufacturing. It represents a major effort to address climate change while also tackling economic challenges.",
      tags: ["fiscal policy", "inflation", "climate change", "economic legislation"],
      sources: [
        {
          name: "U.S. Department of the Treasury",
          url: "https://home.treasury.gov/policy-issues/inflation-reduction-act",
        },
        {
          name: "Congressional Budget Office",
          url: "https://www.cbo.gov/publication/58366",
        },
      ],
    },
    {
      topic_id: "economic_policy_2025",
      question_number: 2,
      question_type: "true_false",
      category: "Tax Policy",
      question: "The Inflation Reduction Act imposes a minimum tax rate on all U.S. businesses.",
      correct_answer: "false",
      hint: "Consider which specific businesses are targeted by the tax provisions.",
      explanation:
        "The Act imposes a 15% minimum tax only on corporations with profits exceeding $1 billion, not on all businesses. This provision aims to ensure that the largest corporations pay at least a minimum level of tax regardless of deductions and credits.",
      tags: ["corporate taxation", "tax policy", "economic equity"],
      sources: [
        {
          name: "Internal Revenue Service",
          url: "https://www.irs.gov/inflation-reduction-act-of-2022",
        },
        {
          name: "Joint Committee on Taxation",
          url: "https://www.jct.gov/publications/2022/jcx-18-22/",
        },
      ],
    },
    {
      topic_id: "economic_policy_2025",
      question_number: 3,
      question_type: "multiple_choice",
      category: "Climate Policy",
      question: "Which of the following is NOT a climate provision in the Inflation Reduction Act?",
      option_a: "Tax credits for electric vehicles",
      option_b: "Funding for domestic renewable energy manufacturing",
      option_c: "Carbon tax on individual consumers",
      option_d: "Methane emission reduction program",
      correct_answer: "option_c",
      hint: "Think about who bears direct taxation under the Act.",
      explanation:
        "The Inflation Reduction Act does not include a carbon tax on individual consumers. It focuses instead on incentives like tax credits for clean energy and electric vehicles, investments in domestic manufacturing, and penalties for excess methane emissions from large oil and gas operations.",
      tags: ["climate policy", "clean energy", "environmental legislation"],
      sources: [
        {
          name: "Environmental Protection Agency",
          url: "https://www.epa.gov/inflation-reduction-act",
        },
        {
          name: "Department of Energy",
          url: "https://www.energy.gov/policy/inflation-reduction-act-2022",
        },
      ],
    },
  ],
  local_elections_2025: [
    {
      topic_id: "local_elections_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "Voter Participation",
      question: "What is the average voter turnout in local elections across the United States?",
      option_a: "65-70%",
      option_b: "45-50%",
      option_c: "25-30%",
      option_d: "10-15%",
      correct_answer: "option_c",
      hint: "It's significantly lower than presidential elections.",
      explanation:
        "Local election turnout in the U.S. typically averages between 25-30%, much lower than the 60%+ often seen in presidential elections. This low participation means local policies are decided by a small fraction of eligible voters, raising questions about representation.",
      tags: ["voter turnout", "local governance", "civic participation"],
      sources: [
        {
          name: "MIT Election Data and Science Lab",
          url: "https://electionlab.mit.edu/research/voter-turnout",
        },
        {
          name: "National Conference of State Legislatures",
          url: "https://www.ncsl.org/elections-and-campaigns/voter-turnout",
        },
      ],
    },
    {
      topic_id: "local_elections_2025",
      question_number: 2,
      question_type: "true_false",
      category: "Local Governance",
      question:
        "School board members typically have more direct control over local education policy than the U.S. Secretary of Education.",
      correct_answer: "true",
      hint: "Think about federalism and which level of government controls curriculum decisions.",
      explanation:
        "School board members have significant direct control over local education policies, including curriculum, budgets, and hiring. While the U.S. Secretary of Education can influence national education policy, most education decisions are made at the local and state levels due to the U.S. federalist system.",
      tags: ["federalism", "education policy", "local governance"],
      sources: [
        {
          name: "National School Boards Association",
          url: "https://www.nsba.org/About/About-School-Boards",
        },
        {
          name: "U.S. Department of Education",
          url: "https://www.ed.gov/about/overview/fed/role.html",
        },
      ],
    },
    {
      topic_id: "local_elections_2025",
      question_number: 3,
      question_type: "short_answer",
      category: "Electoral Systems",
      question:
        "What voting system allows voters to rank candidates in order of preference instead of selecting just one candidate?",
      correct_answer: "ranked choice voting",
      hint: "This system is increasingly being adopted in local elections across the U.S.",
      explanation:
        "Ranked choice voting (RCV) allows voters to rank candidates in order of preference. If no candidate receives a majority of first-choice votes, the candidate with the fewest votes is eliminated and their votes redistributed based on voters' next choices. This process continues until a candidate achieves a majority.",
      tags: ["electoral systems", "voting methods", "electoral reform"],
      sources: [
        {
          name: "FairVote",
          url: "https://www.fairvote.org/rcv",
        },
        {
          name: "National Conference of State Legislatures",
          url: "https://www.ncsl.org/elections-and-campaigns/ranked-choice-voting",
        },
      ],
    },
  ],
  media_literacy_2025: [
    {
      topic_id: "media_literacy_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "Media Literacy",
      question: "What is 'confirmation bias' in media consumption?",
      option_a: "When news outlets confirm facts before publishing",
      option_b: "The tendency to seek out information that confirms existing beliefs",
      option_c: "When social media platforms verify user identities",
      option_d: "The practice of citing multiple sources in reporting",
      correct_answer: "option_b",
      hint: "Think about how people select and interpret information.",
      explanation:
        "Confirmation bias is the tendency to search for, interpret, favor, and recall information in a way that confirms one's preexisting beliefs. In media consumption, this leads people to select news sources that align with their existing views and dismiss contradictory information.",
      tags: ["cognitive bias", "media literacy", "information processing"],
      sources: [
        {
          name: "American Psychological Association",
          url: "https://www.apa.org/topics/bias-discrimination",
        },
        {
          name: "Media Literacy Now",
          url: "https://medialiteracynow.org/what-is-media-literacy/",
        },
      ],
    },
    {
      topic_id: "media_literacy_2025",
      question_number: 2,
      question_type: "true_false",
      category: "Digital Media",
      question: "AI-generated content must be labeled as such on all major social media platforms.",
      correct_answer: "false",
      hint: "Consider current regulations across different platforms.",
      explanation:
        "While some platforms have begun implementing policies requiring disclosure of AI-generated content, there is no universal requirement across all major social media platforms. Regulations vary by platform and are still evolving as AI content generation becomes more sophisticated.",
      tags: ["artificial intelligence", "content moderation", "social media policy"],
      sources: [
        {
          name: "Pew Research Center",
          url: "https://www.pewresearch.org/internet/topics/artificial-intelligence/",
        },
        {
          name: "Federal Trade Commission",
          url: "https://www.ftc.gov/business-guidance/blog/2023/02/keep-your-ai-claims-check",
        },
      ],
    },
  ],
  trade_agreement_2025: [
    {
      topic_id: "trade_agreement_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "International Trade",
      question: "What is a primary goal of digital trade agreements?",
      option_a: "To increase tariffs on digital goods",
      option_b: "To establish rules for cross-border data flows",
      option_c: "To restrict international e-commerce",
      option_d: "To nationalize internet infrastructure",
      correct_answer: "option_b",
      hint: "Think about how data moves across national boundaries.",
      explanation:
        "Digital trade agreements primarily aim to establish rules for cross-border data flows, ensuring that information can move freely while addressing concerns about privacy, security, and intellectual property. These agreements create frameworks for digital commerce in an increasingly connected global economy.",
      tags: ["digital trade", "international agreements", "data flows"],
      sources: [
        {
          name: "Congressional Research Service",
          url: "https://crsreports.congress.gov/product/pdf/R/R46694",
        },
        {
          name: "World Trade Organization",
          url: "https://www.wto.org/english/tratop_e/ecom_e/ecom_e.htm",
        },
      ],
    },
  ],
  legislative_process_2025: [
    {
      topic_id: "legislative_process_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "Legislative Process",
      question: "Which of the following is NOT a step in how a bill becomes a law?",
      option_a: "Introduction in either the House or Senate",
      option_b: "Committee consideration",
      option_c: "Supreme Court approval",
      option_d: "Presidential signature or veto",
      correct_answer: "option_c",
      hint: "Think about separation of powers in the U.S. government.",
      explanation:
        "The Supreme Court does not approve bills as part of the legislative process. A bill becomes law through introduction in either chamber of Congress, committee consideration, floor debate and votes in both chambers, and finally presidential approval. The Supreme Court may later rule on a law's constitutionality, but is not part of the legislative process.",
      tags: ["legislative process", "separation of powers", "lawmaking"],
      sources: [
        {
          name: "U.S. Congress",
          url: "https://www.congress.gov/legislative-process",
        },
        {
          name: "USA.gov",
          url: "https://www.usa.gov/how-laws-are-made",
        },
      ],
    },
  ],
  civic_engagement_2025: [
    {
      topic_id: "civic_engagement_2025",
      question_number: 1,
      question_type: "multiple_choice",
      category: "Community Oversight",
      question: "What is the primary purpose of civilian oversight boards for police departments?",
      option_a: "To replace police leadership",
      option_b: "To provide independent review of police conduct and policies",
      option_c: "To reduce police department funding",
      option_d: "To train new police officers",
      correct_answer: "option_b",
      hint: "Think about transparency and accountability in law enforcement.",
      explanation:
        "Civilian oversight boards primarily exist to provide independent review of police conduct and policies. They aim to increase transparency, accountability, and community trust in law enforcement by giving community members a voice in how policing is conducted in their neighborhoods.",
      tags: ["police oversight", "community engagement", "accountability"],
      sources: [
        {
          name: "National Association for Civilian Oversight of Law Enforcement",
          url: "https://www.nacole.org/",
        },
        {
          name: "U.S. Department of Justice",
          url: "https://cops.usdoj.gov/html/dispatch/12-2013/civilian_oversight.asp",
        },
      ],
    },
  ],
}

// Helper function to get category emoji
export function getCategoryEmoji(categoryName: string): string {
  const category = allCategories.find((cat) => cat.name === categoryName)
  return category?.emoji || "📚"
}
