-- CORRECTED Quiz Topics for CivicSense - June 2025 Current Events
-- Based on verified research and fact-checking of sources
-- All information has been cross-referenced with reliable sources

INSERT INTO question_topics (
    topic_id,
    topic_title,
    description,
    why_this_matters,
    emoji,
    date,
    day_of_week,
    categories,
    is_active
) VALUES 

-- Topic 1: Israel-Iran Conflict and U.S. Response (June 2025) - CORRECTED
(
    'israel_iran_conflict_us_response_june_2025',
    'Israel-Iran Conflict and U.S. Military Response',
    'Israel and Iran have engaged in direct military exchanges starting June 13, 2025, with Israel conducting airstrikes on Iranian nuclear and military facilities. The U.S. has deployed the USS Nimitz carrier strike group and over 30 aerial refueling tankers to the region. President Trump has demanded Iran''s "unconditional surrender" while oil markets react to regional tensions.',
    '<ul><li><strong>War Powers in Action</strong>: Watch how presidential crisis decision-making actually works when democracy faces international pressure</li><li><strong>Economic Impact</strong>: Regional conflicts directly affect oil prices, gas costs, and global markets that impact your daily expenses</li><li><strong>Constitutional Limits</strong>: This crisis tests whether Congress can still control when America goes to war, or if presidents now have unlimited military power</li><li><strong>Alliance Dynamics</strong>: U.S. foreign policy decisions made during crises reshape international relationships for decades</li><li><strong>Democratic Oversight</strong>: Understand how emergency powers can expand executive authority beyond constitutional intentions</li></ul>',
    '⚔️',
    '2025-06-18',
    'Wednesday',
    '["Foreign Policy", "Presidential Powers", "Military", "Constitutional Law", "Congress"]',
    true
),

-- Topic 2: Congressional War Powers Pushback - VERIFIED
(
    'congress_war_powers_limitation_trump_2025',
    'Congress Moves to Limit Trump''s War Powers Amid Iran Crisis',
    'A bipartisan coalition led by libertarian Republican Thomas Massie and progressive Democrat Ro Khanna is introducing war powers resolutions to prevent Trump from involving the U.S. in the Israel-Iran conflict without congressional approval. This unusual alliance unites libertarians and progressives around constitutional war powers, reflecting broad skepticism about endless wars.',
    '<ul><li><strong>Constitution Under Fire</strong>: This is democracy''s immune system fighting back against executive power grabs that have been building for decades</li><li><strong>Your Representatives'' Real Power</strong>: See whether Congress can actually reclaim its constitutional authority to decide when America goes to war</li><li><strong>Political Realignment</strong>: Libertarian Republicans and progressive Democrats finding common ground breaks traditional party lines</li><li><strong>Taxpayer Costs</strong>: Congressional war powers directly control how many billions of your tax dollars get spent on military interventions</li><li><strong>Historical Pattern</strong>: Every generation faces this question - will Congress enforce constitutional limits or let presidents become kings?</li></ul>',
    '⚖️',
    '2025-06-17',
    'Tuesday',
    '["Congress", "Presidential Powers", "Constitutional Law", "War Powers", "Bipartisan Politics"]',
    true
),

-- Topic 3: Defense Secretary Hegseth Under Congressional Fire - VERIFIED
(
    'hegseth_congressional_hearings_pentagon_june_2025',
    'Defense Secretary Hegseth Faces Congressional Grilling Over Signal App and Pentagon Priorities',
    'Pete Hegseth faces intense congressional questioning about his use of unsecured Signal messaging to share sensitive military information, his focus on Pentagon social changes over international crises, and proposed defense budget increases. Lawmakers are pressing him on everything from transgender troop policies to his handling of classified communications.',
    '<ul><li><strong>Executive Accountability</strong>: Watch congressional oversight in action as lawmakers grill a Cabinet secretary about national security failures</li><li><strong>Your Security at Risk</strong>: Defense officials sharing military secrets on unsecured apps puts American lives and operations in danger</li><li><strong>Budget Priorities</strong>: Defense spending increases mean massive impacts on domestic spending and your tax burden</li><li><strong>Civil-Military Relations</strong>: See how political appointees balance military effectiveness with ideological agenda items</li><li><strong>Democratic Checks</strong>: Congressional hearings are one of the few ways to hold unelected officials accountable for their decisions</li></ul>',
    '🏛️',
    '2025-06-18',
    'Wednesday',
    '["Government", "Congressional Oversight", "Defense Policy", "Executive Accountability", "National Security"]',
    true
),

-- Topic 4: White House National Security Staff Purge - VERIFIED
(
    'white_house_nsc_staff_shakeup_crisis_2025',
    'White House Purges National Security Staff During Foreign Crisis',
    'President Trump has drastically reduced National Security Council staff from nearly 400 to about 50 people during the Israel-Iran crisis. Secretary of State Marco Rubio now serves dual roles as both Secretary of State and National Security Advisor after Mike Waltz was reassigned as UN Ambassador following the Signal messaging controversy.',
    '<ul><li><strong>Institutional Knowledge Lost</strong>: Firing career experts during international crises puts American interests at risk when expertise matters most</li><li><strong>Power Concentration</strong>: One person holding two major national security roles concentrates unprecedented power in a single official</li><li><strong>Crisis Management</strong>: See how personnel decisions during emergencies reveal priorities about expertise versus loyalty</li><li><strong>Government Continuity</strong>: Career civil servants provide institutional memory that survives political changes - but only if they''re allowed to stay</li><li><strong>Democratic Stability</strong>: Purging experienced professionals for political reasons weakens America''s ability to respond to international challenges</li></ul>',
    '🔄',
    '2025-05-23',
    'Friday',
    '["Executive Branch", "Government Personnel", "National Security", "Institutional Knowledge", "Crisis Management"]',
    true
);

-- Add helpful comment
COMMENT ON TABLE question_topics IS 'CivicSense quiz topics connecting current events to fundamental civic education principles, written in uncompromisingly honest brand voice - FACT-CHECKED AND VERIFIED';