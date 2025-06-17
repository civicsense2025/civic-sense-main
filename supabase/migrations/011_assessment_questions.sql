-- Create assessment questions table for onboarding
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    category TEXT NOT NULL,
    skill_id UUID REFERENCES skills(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_questions_category ON assessment_questions(category);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_skill_id ON assessment_questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_difficulty ON assessment_questions(difficulty);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_assessment_questions_updated_at ON assessment_questions;
CREATE TRIGGER update_assessment_questions_updated_at 
    BEFORE UPDATE ON assessment_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Authenticated users can read assessment questions" ON assessment_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for service role to manage
CREATE POLICY "Service role can manage assessment questions" ON assessment_questions
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON assessment_questions TO authenticated;
GRANT ALL ON assessment_questions TO service_role;
-- Comprehensive CivicSense Onboarding Assessment Questions
-- Following CivicSense brand guidelines: conversational, intelligent, accessible

-- Clear existing demo data and insert comprehensive assessment
DELETE FROM assessment_questions WHERE id IN (
    SELECT id FROM assessment_questions 
    WHERE question LIKE '%How many branches%' 
    OR question LIKE '%minimum age%'
    OR question LIKE '%amendment protects%'
    OR question LIKE '%process to remove%'
    OR question LIKE '%Senator serve%'
);

-- GOVERNMENT STRUCTURE & PROCESSES (Foundation Knowledge)
INSERT INTO assessment_questions (question, options, correct_answer, explanation, difficulty, category, is_active) VALUES

-- Level 1: Basic Civic Literacy
(
    'You''re watching the news and they mention "Congress passed a bill." What happens next before it becomes law?',
    '["It automatically becomes law", "The President must sign it", "The Supreme Court must approve it", "State governments must ratify it"]',
    'The President must sign it',
    'After Congress passes a bill, it goes to the President who can either sign it into law or veto it. If vetoed, Congress can override with a two-thirds majority in both chambers. This is how our system of checks and balances works in practice.',
    1,
    'government_structure',
    true
),

(
    'Your friend says "I''m voting for my Representative this year." How often do they get this chance?',
    '["Every year", "Every 2 years", "Every 4 years", "Every 6 years"]',
    'Every 2 years',
    'House Representatives serve 2-year terms, so there''s an election every even-numbered year. This shorter term keeps them more responsive to their constituents'' current concerns compared to Senators (6 years) or Presidents (4 years).',
    1,
    'elections',
    true
),

(
    'Someone tells you "the government can''t stop me from saying what I want." Which amendment protects this right?',
    '["First Amendment", "Second Amendment", "Fourth Amendment", "Fifth Amendment"]',
    'First Amendment',
    'The First Amendment protects freedom of speech, along with religion, press, assembly, and petition. However, there are some limits—like you can''t shout "fire" in a crowded theater or make direct threats.',
    1,
    'constitution',
    true
),

-- Level 2: Understanding How Government Actually Works
(
    'A federal judge strikes down a state law as "unconstitutional." What power allows them to do this?',
    '["Executive privilege", "Judicial review", "Legislative oversight", "Federal supremacy"]',
    'Judicial review',
    'Judicial review lets courts examine laws and government actions to see if they violate the Constitution. This power isn''t explicitly written in the Constitution—the Supreme Court established it in Marbury v. Madison (1803). It''s how courts serve as a check on legislative and executive power.',
    2,
    'government_structure',
    true
),

(
    'Your state wants to raise the drinking age to 25, but the federal government wants it at 21. What''s most likely to happen?',
    '["Federal law automatically wins", "State law takes precedence", "They negotiate a compromise", "Federal government threatens to withhold highway funding"]',
    'Federal government threatens to withhold highway funding',
    'This actually happened! The federal government can''t directly force states to set drinking ages, but they can withhold federal highway funding from states that don''t comply. It''s called "federal coercion" and it''s how many national policies get implemented.',
    2,
    'federalism',
    true
),

(
    'You hear that a bill "died in committee." What does this mean?',
    '["The committee voted against it", "It ran out of time", "Committee members refused to consider it", "Any of these could happen"]',
    'Any of these could happen',
    'Bills can "die" in committees several ways: the committee votes it down, the chair never schedules a hearing, or time runs out in the legislative session. Most bills actually die this way—committees are where the real filtering happens in Congress.',
    2,
    'legislative_process',
    true
),

-- Level 3: Real-World Application & Critical Thinking
(
    'A presidential candidate promises to "eliminate the Department of Education on Day One." What would actually be required to do this?',
    '["Presidential executive order", "Supreme Court ruling", "Congressional approval", "State government consent"]',
    'Congressional approval',
    'Only Congress can eliminate federal departments since they control government structure and spending. The President can''t unilaterally abolish departments, though they can propose it and change how departments operate. This is a common campaign promise that shows the limits of presidential power.',
    3,
    'government_structure',
    true
),

(
    'Your city council wants to ban a specific type of business. A business owner sues, claiming it violates the "Equal Protection Clause." What are they arguing?',
    '["The ban applies to everyone equally", "The ban targets their business specifically", "The ban treats similar businesses differently without good reason", "The ban violates their right to free speech"]',
    'The ban treats similar businesses differently without good reason',
    'Equal Protection means the government can''t treat similar people or businesses differently without a valid reason. If the law seems to single out one type of business while allowing similar ones, that could violate equal protection. Courts use different levels of scrutiny depending on what''s being restricted.',
    3,
    'constitution',
    true
),

-- MEDIA LITERACY & INFORMATION EVALUATION

-- Level 1: Basic Source Recognition
(
    'You see a news story with no author listed and no publication date. What should you do first?',
    '["Share it if it confirms what you believe", "Look for the same story from a known news source", "Assume it''s fake news", "Check if your friends shared it"]',
    'Look for the same story from a known news source',
    'Anonymous or undated content is a red flag. Before sharing anything, verify it through established news sources with editorial standards. Real news organizations put their names and dates on stories because they stand behind their reporting.',
    1,
    'media_literacy',
    true
),

(
    'A headline reads: "SHOCKING: Local School Board Makes CONTROVERSIAL Decision!" What does this language suggest?',
    '["The story is especially important", "The story is designed to grab attention", "The school board did something illegal", "The story is from a local newspaper"]',
    'The story is designed to grab attention',
    'Words like "SHOCKING" and "CONTROVERSIAL" in all caps are designed to trigger emotional responses and get clicks. Quality journalism usually avoids sensational language and lets the facts speak for themselves. This is often called "clickbait."',
    1,
    'media_literacy',
    true
),

-- Level 2: Understanding Bias and Perspective
(
    'Two news outlets report the same event differently. One says "protesters gathered" while the other says "crowds assembled." What''s happening?',
    '["One outlet is lying", "They''re describing different events", "They''re using different framing", "One outlet is more accurate"]',
    'They''re using different framing',
    'Word choice matters! "Protesters" suggests organized dissent, while "crowds" sounds more neutral. Both might be factually accurate but create different impressions. Good media consumers notice how language shapes perception.',
    2,
    'media_literacy',
    true
),

(
    'A politician''s website says their approval rating is "rising." A news report says it''s "declining." Who should you trust?',
    '["The politician—it''s their rating", "The news report—journalists are objective", "Check the polling data yourself", "Trust whichever matches your opinion"]',
    'Check the polling data yourself',
    'Both could be technically correct but using different time frames or polls. The politician might highlight recent upticks while the news looks at longer trends. Always check primary sources—the actual polls—when numbers conflict.',
    2,
    'media_literacy',
    true
),

-- Level 3: Advanced Information Evaluation
(
    'A study claims "90% of Americans support Policy X." Before sharing this, what''s the most important question to ask?',
    '["Who funded the study?", "How many people were surveyed?", "What exactly was the question asked?", "All of these matter"]',
    'All of these matter',
    'Polling is tricky! A study funded by advocates might have biased questions. Small sample sizes aren''t representative. And the exact wording of questions dramatically affects responses. For example, "support for background checks" polls differently than "support for gun control."',
    3,
    'media_literacy',
    true
),

-- CIVIC ENGAGEMENT & PARTICIPATION

-- Level 1: Basic Participation Knowledge
(
    'You want to influence a local issue like a new park. Who should you contact first?',
    '["Your state representative", "The mayor", "Your city council member", "The governor"]',
    'Your city council member',
    'Local issues are usually handled by local government! City councils typically manage parks, zoning, and neighborhood issues. Your council member represents your specific district and wants to hear from constituents. Start local for local issues.',
    1,
    'civic_engagement',
    true
),

(
    'Voting aside, what''s the most direct way for citizens to participate in lawmaking?',
    '["Writing letters to newspapers", "Attending public hearings", "Joining political parties", "Donating to campaigns"]',
    'Attending public hearings',
    'Public hearings let you speak directly to the people making decisions! Most government bodies—from school boards to Congress—hold hearings where citizens can testify. Your voice carries more weight when you show up in person.',
    1,
    'civic_engagement',
    true
),

-- Level 2: Effective Advocacy
(
    'You''re meeting with your Representative about an issue. What''s the most persuasive approach?',
    '["Tell them how you feel personally", "Explain how it affects their constituents", "Mention you voted for them", "Threaten to vote against them"]',
    'Explain how it affects their constituents',
    'Representatives care most about how issues affect the people they represent. Personal stories are powerful, but showing broader constituent impact proves there''s political importance. Come with specific examples from your district.',
    2,
    'civic_engagement',
    true
),

(
    'A ballot measure asks: "Shall the city issue $50 million in bonds for infrastructure improvements?" What should you research first?',
    '["What "infrastructure" means specifically", "How much taxes will increase", "Who supports and opposes it", "All of these"]',
    'All of these',
    'Ballot language is often vague on purpose! "Infrastructure" could mean roads, sewers, or city buildings. Tax impacts matter to your wallet. And knowing who''s for/against helps you understand different perspectives and motivations.',
    2,
    'civic_engagement',
    true
),

-- Level 3: Strategic Civic Action
(
    'You want to change a state law. The most effective long-term strategy is:',
    '["Start a petition drive", "Contact your state legislators", "Build a coalition of affected groups", "Run for office yourself"]',
    'Build a coalition of affected groups',
    'Lasting change requires sustained pressure from multiple directions. One person''s opinion is easy to ignore, but a coalition of different groups with the same goal creates political momentum. Think: businesses, nonprofits, community groups, and voters all pushing together.',
    3,
    'civic_engagement',
    true
),

-- CURRENT EVENTS & POLICY ANALYSIS

-- Level 1: Understanding Policy Basics
(
    'Congress debates "raising the debt ceiling." What are they actually deciding?',
    '["How much money to spend", "Whether to pay bills already owed", "How much to tax people", "Whether to borrow more money"]',
    'Whether to pay bills already owed',
    'The debt ceiling isn''t about new spending—it''s about paying for spending Congress already approved! Think of it like paying your credit card bill. The spending already happened; now we''re deciding whether to pay what we owe.',
    2,
    'policy_analysis',
    true
),

(
    'A policy has "unintended consequences." What does this mean?',
    '["The policy failed completely", "The policy had secret hidden goals", "The policy created unexpected results", "The policy was poorly written"]',
    'The policy created unexpected results',
    'Even well-intentioned policies can have surprising effects! For example, rent control meant to help renters might actually reduce housing supply. Or welfare policies might accidentally discourage work. Good policy analysis tries to predict these effects.',
    2,
    'policy_analysis',
    true
),

-- Level 2: Policy Trade-offs and Implementation
(
    'A city proposes raising minimum wage to $20/hour. What''s a legitimate concern critics might raise?',
    '["Workers don''t deserve higher pay", "It will definitely cause inflation", "Some businesses might reduce hiring", "It violates free market principles"]',
    'Some businesses might reduce hiring',
    'Policy debates involve real trade-offs. Higher wages help workers afford more, but might lead some businesses to hire fewer people or automate jobs. Both effects can happen simultaneously. Good policy discussions acknowledge these trade-offs rather than pretending they don''t exist.',
    2,
    'policy_analysis',
    true
),

-- Level 3: Complex Policy Understanding
(
    'A politician proposes "eliminating government waste" to fund a new program. What should make you skeptical?',
    '["Government waste doesn''t exist", "They don''t specify what waste", "Waste elimination never works", "Politicians always lie"]',
    'They don''t specify what waste',
    'Vague promises to cut "waste, fraud, and abuse" are usually political theater. Real budget proposals specify exactly what gets cut. If someone can''t name specific programs or expenses to eliminate, they probably can''t actually fund their new idea that way.',
    3,
    'policy_analysis',
    true
),

-- CONSTITUTIONAL KNOWLEDGE & CIVIL RIGHTS

-- Level 1: Basic Rights and Freedoms
(
    'Police want to search your house. What do they normally need?',
    '["Probable cause", "A warrant", "Your permission", "Any of these"]',
    'Any of these',
    'The Fourth Amendment protects against unreasonable searches. Police usually need a warrant, but they can search with your consent or with probable cause in emergency situations. Knowing your rights helps you make informed decisions during police encounters.',
    1,
    'constitution',
    true
),

(
    'You''re arrested and can''t afford a lawyer. What happens next?',
    '["You represent yourself", "You get a public defender", "Your trial is delayed", "Charges are dropped"]',
    'You get a public defender',
    'The Sixth Amendment guarantees legal representation in criminal cases. If you can''t afford a lawyer, the government must provide one. This comes from the famous Gideon v. Wainwright case—a poor man''s handwritten petition to the Supreme Court that changed American justice.',
    1,
    'constitution',
    true
),

-- Level 2: Constitutional Interpretation and Application
(
    'A school bans students from wearing political t-shirts. A student sues, claiming First Amendment violations. What''s the key legal question?',
    '["Do students have free speech rights?", "Can schools ever limit student expression?", "Does the ban disrupt the educational environment?", "Are political shirts different from other clothing?"]',
    'Does the ban disrupt the educational environment?',
    'Students do have First Amendment rights at school (Tinker v. Des Moines), but schools can limit speech that substantially disrupts education. The key test is whether the expression interferes with the school''s educational mission. Courts balance student rights against school authority.',
    3,
    'constitution',
    true
),

-- Level 3: Advanced Constitutional Concepts
(
    'The Supreme Court rules 5-4 that a law is unconstitutional. Later, the Court''s composition changes and they''re asked to reconsider. What''s most likely?',
    '["They must follow the previous decision", "They can overturn the previous decision", "They will refuse to hear the case", "Congress must approve any changes"]',
    'They can overturn the previous decision',
    'The Supreme Court can overturn its own previous decisions, though it usually requires special justification. Famous examples include Brown v. Board overturning Plessy v. Ferguson, or Dobbs overturning Roe v. Wade. This is why Court appointments matter so much for long-term policy.',
    3,
    'constitution',
    true
),

-- FEDERALISM & LEVELS OF GOVERNMENT

-- Level 1: Basic Government Structure
(
    'Your state passes a law that conflicts with federal law. What happens?',
    '["State law wins", "Federal law wins", "They negotiate", "Courts decide"]',
    'Federal law wins',
    'The Supremacy Clause makes federal law "the supreme law of the land." When state and federal laws conflict, federal law prevails. However, states can sometimes choose not to enforce federal laws—they just can''t pass laws that contradict them.',
    1,
    'federalism',
    true
),

(
    'You want to get married. Who actually issues the marriage license?',
    '["Federal government", "State government", "Local government", "It depends on the state"]',
    'It depends on the state',
    'Marriage licensing is handled differently in each state! Some states let counties issue licenses, others use state offices, and some delegate to cities. This is federalism in action—states control marriage law, but they can organize it however they want.',
    2,
    'federalism',
    true
),

-- Level 2: Federal-State Relationships
(
    'Your state legalizes marijuana, but it''s still federally illegal. What''s the practical result?',
    '["Federal agents will arrest everyone", "State law doesn''t matter", "It creates legal uncertainty", "The state law is automatically void"]',
    'It creates legal uncertainty',
    'This is happening right now! States can choose not to criminalize marijuana, but federal agents could theoretically still make arrests. In practice, federal priorities and resources determine enforcement. It''s a complex situation where both laws technically apply.',
    2,
    'federalism',
    true
),

-- ELECTORAL SYSTEMS & REPRESENTATION

-- Level 1: How Elections Work
(
    'You live in Wyoming and your friend lives in California. Whose presidential vote "counts more"?',
    '["They count equally", "California vote counts more", "Wyoming vote counts more", "It depends on the candidates"]',
    'Wyoming vote counts more',
    'Because of the Electoral College! Wyoming gets 3 electoral votes for about 580,000 people, while California gets 54 votes for about 39 million people. That means each Wyoming voter has about 3.6 times more influence on presidential elections than each California voter.',
    2,
    'elections',
    true
),

(
    'In your House district, the Republican wins 55% of the vote. What percentage of House seats do Republicans get from your district?',
    '["55%", "100%", "Depends on other districts", "It varies by state"]',
    '100%',
    'House elections use "winner-take-all" single-member districts. Even if you win by just one vote, you get the entire seat. This is different from proportional representation systems where a 55% vote share might get you 55% of the seats.',
    2,
    'elections',
    true
),

-- Level 3: Electoral Strategy and Consequences
(
    'A state changes from winner-take-all to proportional allocation of electoral votes. What''s the likely effect?',
    '["More candidates will visit the state", "Fewer candidates will visit the state", "No change in candidate behavior", "The state gets more electoral votes"]',
    'Fewer candidates will visit the state',
    'Counterintuitive but true! Proportional allocation makes states less "swingy." Instead of 20 electoral votes going entirely to whoever wins, they might split 12-8. This reduces the state''s importance in close elections, so candidates focus on states where they can flip all the electoral votes.',
    3,
    'elections',
    true
);

-- Add a few scenario-based questions for contextual assessment
INSERT INTO assessment_questions (question, options, correct_answer, explanation, difficulty, category, is_active) VALUES

-- Real-world scenario testing
(
    'Breaking news: "Supreme Court hears arguments in major case." Your friend asks what this means for immediate policy. What do you tell them?',
    '["Policy changes immediately", "We won''t know the impact for months", "It depends on the case", "Congress needs to act first"]',
    'We won''t know the impact for months',
    'Supreme Court cases take time! First, they hear arguments, then justices deliberate, write opinions, and release decisions (usually by June). Even then, implementation can take months or years. Unlike other news, Supreme Court developments unfold slowly.',
    2,
    'government_structure',
    true
),

(
    'Your town wants to build affordable housing, but neighbors oppose it. At the town hall, what''s the most productive way to engage?',
    '["Share your personal opinion loudly", "Ask specific questions about details", "Criticize the opponents", "Demand an immediate vote"]',
    'Ask specific questions about details',
    'Good civic engagement focuses on gathering information and understanding trade-offs. Questions like "How will this affect traffic?" or "What are the funding sources?" help everyone make better decisions. Personal attacks or demands usually backfire.',
    2,
    'civic_engagement',
    true
),

(
    'You see a viral video of a government official saying something controversial. Before sharing, what''s most important?',
    '["Check if you agree with their politics", "Verify when and where it was recorded", "See how many views it has", "Read the comments for context"]',
    'Verify when and where it was recorded',
    'Context is everything! Old videos resurface during election cycles. Clips get edited to remove context. Deep fakes exist. Always verify the when, where, and full context before sharing. Comments and view counts don''t indicate accuracy.',
    2,
    'media_literacy',
    true
);

-- Update the schema to add friendlier explanations for conversational feel
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS friendly_explanation TEXT;

-- Add friendly explanations to make the assessment more conversational
UPDATE assessment_questions SET friendly_explanation = CASE 
    WHEN question LIKE '%happens next before it becomes law%' THEN 
        'Think of it like a relay race! Congress passes the baton (bill) to the President, who can either run it across the finish line (sign it) or drop it (veto it). If they drop it, Congress can still carry it across if two-thirds of both chambers really want to.'
    WHEN question LIKE '%How often do they get this chance%' THEN 
        'Every 2 years! House reps are like your favorite TV show—constantly worried about renewal. This keeps them pretty responsive to what their viewers (voters) want, unlike Senators who get 6-year deals.'
    WHEN question LIKE '%amendment protects this right%' THEN 
        'First Amendment! It''s like the greatest hits album of American freedoms: speech, religion, press, assembly, and petition. Though remember, even freedom of speech has some limits—you still can''t yell "fire" in a crowded theater.'
    WHEN question LIKE '%power allows them to do this%' THEN 
        'Judicial review is like having a Constitutional fact-checker! Courts can say "hold up, that law violates the Constitution." The founders didn''t explicitly write this power in, but the Supreme Court claimed it in 1803 and everyone went along with it.'
    WHEN question LIKE '%highway funding%' THEN 
        'Classic federal move! They can''t directly boss states around on many issues, but they can say "nice highways you have there... would be a shame if something happened to that funding." It''s how we got nationwide speed limits and drinking ages.'
    WHEN question LIKE '%died in committee%' THEN 
        'Committee purgatory is real! Most bills never make it out alive. Think of committees as the bouncer at the club—they decide what gets to party on the floor and what gets left outside in the cold.'
    ELSE explanation
END;

-- Create assessment scoring rubric for personalized recommendations
CREATE TABLE IF NOT EXISTS assessment_scoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    score_range_min INTEGER NOT NULL,
    score_range_max INTEGER NOT NULL,
    category TEXT NOT NULL,
    skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    description TEXT NOT NULL,
    recommended_content TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO assessment_scoring (score_range_min, score_range_max, category, skill_level, description, recommended_content) VALUES
-- Overall scoring
(0, 40, 'overall', 'beginner', 'You''re just getting started with civic knowledge—and that''s totally fine! Everyone starts somewhere.', 
 ARRAY['government_basics', 'constitution_101', 'voting_guide']),
(41, 70, 'overall', 'intermediate', 'You have a solid foundation! You understand the basics and are ready to dive deeper.', 
 ARRAY['policy_analysis', 'media_literacy_advanced', 'local_government']),
(71, 100, 'overall', 'advanced', 'You really know your stuff! You''re ready for complex analysis and nuanced discussions.', 
 ARRAY['constitutional_law', 'political_strategy', 'policy_implementation']);

COMMENT ON TABLE assessment_questions IS 'Comprehensive civic education assessment questions with conversational explanations';
COMMENT ON TABLE assessment_scoring IS 'Scoring rubric and content recommendations based on assessment performance';