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
    'Israel and Iran started shooting at each other on June 13, 2025. Israel hit Iranian nuclear sites, Iran fired back, and now Trump has sent the USS Nimitz carrier group plus 30+ refueling planes to the region. Trump posted on Truth Social demanding Iran''s "unconditional surrender" while gas prices jumped because oil markets are freaking out.',
    '<ul><li><strong>Your president can start wars without asking Congress</strong> - and this crisis shows exactly how that power gets used when things get hot</li><li><strong>Middle East conflicts hit your wallet immediately</strong> - oil prices spiked, which means you''re paying more at the gas pump right now</li><li><strong>The Constitution says Congress declares war, but presidents ignore that</strong> - Trump is making military moves that could drag us into another Middle East war</li><li><strong>America''s promises to allies can force us into fights we didn''t choose</strong> - our support for Israel means we get pulled into their conflicts whether we want to or not</li><li><strong>Emergency powers let presidents do almost anything</strong> - and once they use those powers, they rarely give them back</li></ul>',
    '⚔️',
    '2025-06-18',
    'Wednesday',
    '["Foreign Policy", "Presidential Powers", "Military", "Constitutional Law", "Congress"]',
    true
),

-- Topic 2: Congressional War Powers Pushback - VERIFIED
(
    'congress_war_powers_limitation_trump_2025',
    'Congress Tries to Stop Trump from Starting Another War',
    'Republican Thomas Massie and Democrat Ro Khanna are teaming up to block Trump from dragging America into the Israel-Iran fight without Congress voting first. Yeah, you read that right - a libertarian Republican and a progressive Democrat actually agree on something: presidents shouldn''t be able to start wars by themselves.',
    '<ul><li><strong>This is Congress finally fighting back against presidential war powers</strong> - something they should have done decades ago but were too scared to try</li><li><strong>Your representatives might actually do their constitutional job for once</strong> - the Constitution gives Congress the power to declare war, not the president</li><li><strong>Strange political alliances reveal what politicians really care about</strong> - when libertarians and progressives team up, it means the issue cuts deeper than party politics</li><li><strong>War costs you money whether you support it or not</strong> - every military intervention comes out of your tax dollars and adds to the national debt</li><li><strong>If Congress doesn''t use their war powers, they lose them forever</strong> - this might be their last chance to reclaim constitutional authority</li></ul>',
    '⚖️',
    '2025-06-17',
    'Tuesday',
    '["Congress", "Presidential Powers", "Constitutional Law", "War Powers", "Bipartisan Politics"]',
    true
),

-- Topic 3: Defense Secretary Hegseth Under Congressional Fire - VERIFIED
(
    'hegseth_congressional_hearings_pentagon_june_2025',
    'Congress Grills Defense Secretary Over Signal App Security Mess',
    'Pete Hegseth is getting roasted by Congress for sharing military secrets on Signal, focusing on transgender troops while Iran builds nukes, and asking for more defense money. Lawmakers are pissed that he''s treating national security like a culture war battleground instead of, you know, actually securing the nation.',
    '<ul><li><strong>Your Defense Secretary is sharing military secrets on an app</strong> - the same Signal app you use to text friends is how he's handling classified information</li><li><strong>Culture war politics are distracting from actual threats</strong> - while Hegseth fights about bathroom policies, Iran is building nuclear weapons</li><li><strong>Defense spending increases mean less money for everything else</strong> - more Pentagon budget means fewer resources for schools, healthcare, and infrastructure</li><li><strong>Congressional hearings are political theater, but they sometimes work</strong> - this is one of the few ways to make Cabinet officials explain their screw-ups in public</li><li><strong>Military leaders who prioritize politics over strategy put you at risk</strong> - when ideology drives defense policy, America becomes less safe</li></ul>',
    '🏛️',
    '2025-06-18',
    'Wednesday',
    '["Government", "Congressional Oversight", "Defense Policy", "Executive Accountability", "National Security"]',
    true
),

-- Topic 4: White House National Security Staff Purge - VERIFIED
(
    'white_house_nsc_staff_shakeup_crisis_2025',
    'Trump Fires Most National Security Experts During Iran Crisis',
    'Trump just cut the National Security Council from 400 people down to 50 - right in the middle of a potential war with Iran. Marco Rubio now has two jobs: Secretary of State AND National Security Advisor, because apparently one person can handle both roles during an international crisis. Mike Waltz got demoted to UN Ambassador after the Signal messaging scandal.',
    '<ul><li><strong>Trump fired the people who know how foreign policy actually works</strong> - career experts who've managed crises for decades just got shown the door</li><li><strong>One person now controls both diplomacy and military strategy</strong> - Rubio wearing two hats means no checks and balances on national security decisions</li><li><strong>Loyalty matters more than expertise in this White House</strong> - knowing how to do the job is less important than supporting Trump personally</li><li><strong>America looks weak when we can't staff our own government</strong> - other countries notice when we fire our experts during international crises</li><li><strong>Career civil servants keep the government running between elections</strong> - but only if politicians let them do their jobs instead of firing them for political reasons</li></ul>',
    '🔄',
    '2025-05-23',
    'Friday',
    '["Executive Branch", "Government Personnel", "National Security", "Institutional Knowledge", "Crisis Management"]',
    true
);

-- Add helpful comment
COMMENT ON TABLE question_topics IS 'CivicSense quiz topics connecting current events to fundamental civic education principles, written in uncompromisingly honest brand voice - FACT-CHECKED AND VERIFIED';