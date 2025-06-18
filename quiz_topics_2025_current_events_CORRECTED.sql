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
    'Israel and Iran began exchanging missile strikes on June 13, 2025, with Israel hitting Iranian nuclear and military facilities. The U.S. deployed the USS Nimitz carrier group and over 30 aerial refueling tankers to support Israel. Trump posted on Truth Social demanding Iran''s "unconditional surrender" while oil prices spiked due to regional tensions.',
    '<ul><li><strong>Your president can deploy military forces without asking Congress first</strong> - and this crisis shows exactly how that power gets used when international tensions escalate</li><li><strong>Middle East conflicts directly affect your wallet</strong> - oil prices jumped immediately, which means you''re paying more at the gas pump right now</li><li><strong>The Constitution gives Congress war powers, but presidents often ignore that</strong> - Trump is making military moves that could pull us into another Middle East conflict</li><li><strong>America''s alliance commitments can force us into conflicts we didn''t choose</strong> - our military support for Israel means we get involved in their fights whether we want to or not</li><li><strong>Emergency powers allow presidents to expand their authority quickly</strong> - and once they use those powers, they rarely give them back voluntarily</li></ul>',
    '⚔️',
    '2025-06-13',
    'Friday',
    '["Foreign Policy", "Presidential Powers", "Military", "Constitutional Law", "Congress"]',
    true
),

-- Topic 2: Congressional War Powers Pushback - VERIFIED (June 17, 2025)
(
    'congress_war_powers_limitation_trump_2025',
    'Congress Tries to Block Trump from Starting War with Iran',
    'On June 17, 2025, Republican Thomas Massie and Democrat Ro Khanna introduced a bipartisan war powers resolution to prevent Trump from involving the U.S. in the Israel-Iran conflict without congressional approval. This unusual alliance between a libertarian Republican and progressive Democrat reflects growing concern about presidential war powers.',
    '<ul><li><strong>This is Congress finally pushing back against decades of presidential war powers</strong> - something they should have done years ago but were too politically scared to try</li><li><strong>Your representatives might actually do their constitutional job for once</strong> - the Constitution gives Congress, not the president, the power to declare war</li><li><strong>Strange political alliances reveal what politicians really care about</strong> - when libertarians and progressives team up, it means the issue cuts deeper than normal party politics</li><li><strong>War spending comes directly from your tax dollars</strong> - every military intervention adds billions to the national debt that you and your children will pay for</li><li><strong>If Congress doesn''t use their war powers now, they lose them forever</strong> - this might be their last real chance to reclaim constitutional authority over military action</li></ul>',
    '⚖️',
    '2025-06-17',
    'Tuesday',
    '["Congress", "Presidential Powers", "Constitutional Law", "War Powers", "Bipartisan Politics"]',
    true
),

-- Topic 3: Defense Secretary Hegseth Confirmation Hearings - CORRECTED (January 14, 2025)
(
    'hegseth_confirmation_hearings_january_2025',
    'Defense Secretary Hegseth Faces Tough Senate Confirmation Hearing',
    'On January 14, 2025, Pete Hegseth faced intense Senate questioning during his confirmation hearing for Defense Secretary. Senators grilled him about sexual assault allegations, alcohol abuse claims, his views on women in combat, and his qualifications to manage the Pentagon''s massive budget and workforce.',
    '<ul><li><strong>Your Defense Secretary controls an $850 billion budget and 2.9 million people</strong> - that''s bigger than most countries'' entire governments, and senators are questioning if he can handle it</li><li><strong>Personal conduct matters when you''re in charge of national security</strong> - allegations about drinking and sexual assault raise questions about judgment and leadership</li><li><strong>Senate confirmation hearings are political theater, but they sometimes work</strong> - this is one of the few ways to make Cabinet nominees explain their backgrounds and views in public</li><li><strong>Military culture wars affect real troops and real missions</strong> - debates about women in combat and "woke" policies impact actual soldiers serving overseas</li><li><strong>Cabinet appointments shape policy for years</strong> - whoever runs the Pentagon makes decisions that affect military readiness, troop safety, and your tax dollars</li></ul>',
    '🏛️',
    '2025-01-14',
    'Tuesday',
    '["Government", "Congressional Oversight", "Defense Policy", "Executive Accountability", "National Security"]',
    true
),

-- Topic 4: White House National Security Staff Changes - CORRECTED (May 2025)
(
    'white_house_nsc_staff_changes_may_2025',
    'Trump Reshuffles National Security Team During Iran Crisis',
    'In May 2025, Trump dramatically reduced National Security Council staff from nearly 400 to about 50 people. Marco Rubio now serves dual roles as both Secretary of State and National Security Advisor after Mike Waltz was reassigned following internal disagreements about Iran policy and military strategy.',
    '<ul><li><strong>Trump replaced the people who know how foreign policy actually works</strong> - career experts who managed previous crises for decades just got shown the door during an international crisis</li><li><strong>One person now controls both diplomacy and military strategy</strong> - Rubio wearing two hats means fewer checks and balances on crucial national security decisions</li><li><strong>Loyalty trumps expertise in this White House</strong> - knowing how to do the job matters less than personally supporting Trump''s political agenda</li><li><strong>America looks weak when we can''t properly staff our own government</strong> - other countries notice when we fire our experts right in the middle of international crises</li><li><strong>Career civil servants provide continuity between different administrations</strong> - but only if politicians let them do their jobs instead of firing them for political reasons</li></ul>',
    '🔄',
    '2025-05-23',
    'Friday',
    '["Executive Branch", "Government Personnel", "National Security", "Institutional Knowledge", "Crisis Management"]',
    true
);

-- Add helpful comment
COMMENT ON TABLE question_topics IS 'CivicSense quiz topics connecting current events to fundamental civic education principles, written in uncompromisingly honest brand voice - FACT-CHECKED AND VERIFIED';