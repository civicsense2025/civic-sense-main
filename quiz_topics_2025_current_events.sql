-- Updated Quiz Topics for CivicSense - June 2025 Current Events
-- Based on actual database structure and current events research

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

-- Topic 1: Israel-Iran Conflict and U.S. Response (June 2025)
(
    'israel_iran_conflict_us_response_june_2025',
    'Israel-Iran Conflict and U.S. Military Response',
    'As Israel and Iran engage in their sixth day of direct military conflict, the U.S. has deployed two carrier strike groups (USS Nimitz and USS Carl Vinson) and over 30 refueling tankers to the Middle East. President Trump has demanded Iran''s "unconditional surrender" while oil prices surge to 5-month highs and global markets tremble.',
    '<ul><li><strong>War Powers in Action</strong>: Watch how presidential crisis decision-making actually works when democracy is under pressure</li><li><strong>Your Money at Stake</strong>: Oil price spikes and market volatility from Middle East conflicts directly hit your gas tank and investment accounts</li><li><strong>Constitutional Limits</strong>: This crisis tests whether Congress can still control when America goes to war, or if presidents now have unlimited military power</li><li><strong>Global Consequences</strong>: U.S. foreign policy decisions made in crisis moments reshape international relations for decades</li><li><strong>Democratic Oversight</strong>: Understand how emergency powers can expand executive authority beyond what the founders intended</li></ul>',
    '�',
    '2025-06-18',
    'Wednesday',
    '["Foreign Policy", "Presidential Powers", "Military", "Constitutional Law", "Congress"]',
    true
),

-- Topic 2: Congressional War Powers Pushback
(
    'congress_war_powers_limitation_trump_2025',
    'Congress Moves to Limit Trump''s War Powers Amid Iran Crisis',
    'A rare bipartisan coalition uniting libertarian Republican Thomas Massie with progressive Democrats like Alexandria Ocasio-Cortez and Ro Khanna is introducing war powers resolutions to prevent Trump from dragging America into the Israel-Iran conflict without congressional approval. This strange-bedfellows alliance reflects deep skepticism about endless wars across the political spectrum.',
    '<ul><li><strong>Constitution Under Fire</strong>: This is democracy''s immune system fighting back against executive power grabs that have been building for decades</li><li><strong>Your Representatives'' Real Power</strong>: See whether Congress can actually reclaim its constitutional authority to decide when America goes to war</li><li><strong>Political Realignment</strong>: Libertarian Republicans and progressive Democrats are finding common ground on war powers, breaking traditional party lines</li><li><strong>Taxpayer Costs</strong>: Congressional war powers directly control how many billions of your tax dollars get spent on military interventions</li><li><strong>Historical Pattern</strong>: Every generation faces this same question - will Congress enforce constitutional limits or let presidents become kings?</li></ul>',
    '⚖️',
    '2025-06-17',
    'Tuesday',
    '["Congress", "Presidential Powers", "Constitutional Law", "War Powers", "Bipartisan Politics"]',
    true
),

-- Topic 3: Defense Secretary Hegseth Under Congressional Fire
(
    'hegseth_congressional_hearings_pentagon_june_2025',
    'Defense Secretary Hegseth Faces Congressional Grilling Over Signal Leaks and Pentagon Priorities',
    'Pete Hegseth returns to Capitol Hill for intense questioning about his use of unsecured Signal messaging to share sensitive military strike plans, his focus on Pentagon social changes over international crises, and a proposed $1 trillion defense budget. Lawmakers are pressing him on everything from transgender troop bans to his $134 million deployment of Marines to Los Angeles.',
    '<ul><li><strong>Executive Accountability</strong>: Watch congressional oversight in action as lawmakers grill a Cabinet secretary about national security failures</li><li><strong>Your Security at Risk</strong>: Defense officials sharing military secrets on unsecured apps puts American lives and operations in danger</li><li><strong>Budget Priorities</strong>: A $1 trillion defense budget means massive impacts on domestic spending and your tax burden</li><li><strong>Civil-Military Relations</strong>: See how political appointees balance military effectiveness with ideological agenda items</li><li><strong>Democratic Checks</strong>: Congressional hearings are one of the few ways to hold unelected officials accountable for their decisions</li></ul>',
    '🏛️',
    '2025-06-18',
    'Wednesday',
    '["Government", "Congressional Oversight", "Defense Policy", "Executive Accountability", "National Security"]',
    true
),

-- Topic 4: White House National Security Staff Purge
(
    'white_house_nsc_staff_shakeup_crisis_2025',
    'White House Purges National Security Staff During Foreign Crisis',
    'President Trump has slashed National Security Council staff from nearly 400 to about 50 people, sending career experts home at 4:30 PM on Friday during the Israel-Iran crisis. Secretary of State Marco Rubio now serves dual roles as both Secretary of State and interim National Security Advisor after Mike Waltz was pushed out following the Signal messaging scandal.',
    '<ul><li><strong>Institutional Knowledge Lost</strong>: Firing career experts during international crises puts American interests at risk when expertise matters most</li><li><strong>Power Concentration</strong>: One person holding two major national security roles concentrates unprecedented power in a single official</li><li><strong>Crisis Management</strong>: See how personnel decisions during emergencies reveal priorities about expertise versus loyalty</li><li><strong>Government Continuity</strong>: Career civil servants provide institutional memory that survives political changes - but only if they''re allowed to stay</li><li><strong>Democratic Stability</strong>: Purging experienced professionals for political reasons weakens America''s ability to respond to international challenges</li></ul>',
    '�',
    '2025-05-23',
    'Friday',
    '["Executive Branch", "Government Personnel", "National Security", "Institutional Knowledge", "Crisis Management"]',
    true
);

-- Add helpful comment
COMMENT ON TABLE question_topics IS 'CivicSense quiz topics connecting current events to fundamental civic education principles, written in uncompromisingly honest brand voice';