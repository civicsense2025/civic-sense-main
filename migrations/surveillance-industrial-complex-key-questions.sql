-- Surveillance-Industrial Complex Key Questions
-- Based on comprehensive research findings
-- Reveals uncomfortable truths about tech giants' government integration

INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation, difficulty, source_urls) VALUES

-- Palantir Government Contracts (Key Questions)
('palantir-government-contracts', 
'Edward Snowden revealed Palantir made NSA surveillance "user-friendly." How much has Palantir received in federal contracts since capitalizing on these capabilities?', 
'["Less than $500 million", "Over $1.2 billion", "Around $800 million", "Approximately $2.5 billion"]', 
1, 
'Palantir has received over $1.2 billion in federal contracts since 2009, with government revenue reaching $373 million in Q1 2025 alone. Snowden''s revelations showed how Palantir''s integration made NSA surveillance programs more accessible to government agents.', 
'medium',
'["https://theintercept.com/2017/02/22/how-peter-thiels-palantir-helped-the-nsa-spy-on-the-whole-world/"]'),

('palantir-government-contracts',
'Vice President J.D. Vance received $15 million backing from which Palantir founder, creating unprecedented surveillance policy conflicts?',
'["Alex Karp", "Peter Thiel", "Joe Lonsdale", "Stephen Cohen"]',
1,
'Peter Thiel provided $15 million to back J.D. Vance''s political career and helped secure his VP position. With Vance now as Vice President, Palantir has direct access to the highest government levels while benefiting from surveillance expansion policies.',
'easy',
'["https://www.politico.com/news/2024/07/15/jd-vance-peter-thiel-00158711"]'),

('palantir-government-contracts',
'Harvard''s Shoshana Zuboff warns about the "fusion scenario." Which role is being considered for Trae Stephens, who sits on Anduril''s board while being a Thiel partner?',
'["Secretary of Defense", "Deputy Defense Secretary", "National Security Advisor", "CIA Director"]',
1,
'Trae Stephens is being considered for Deputy Defense Secretary—overseeing $841.4 billion while maintaining Anduril stakes. Zuboff''s "fusion scenario" describes this merger of surveillance capitalism with state power.',
'hard',
'["https://www.bloomberg.com/news/articles/2024-11-12/anduril-board-member-stephens-considered-for-deputy-defense-chief"]'),

-- Palantir Data Integration
('palantir-data-integration',
'Shoshana Zuboff describes the merger of corporate surveillance with state power as what scenario?',
'["Democratic integration", "The fusion scenario", "Balanced partnership", "Regulatory oversight"]',
1,
'Zuboff describes this as "the fusion scenario"—surveillance capitalism merging with state surveillance power. Her Harvard fellowship "Surveillance Capitalism or Democracy" warns this fusion threatens democratic governance structure.',
'hard',
'["https://shoshanazuboff.com/book/about/"]'),

('palantir-data-integration',
'Edward Snowden warned about which development representing AI replacing human judgment in surveillance?',
'["Google''s AI search", "OpenAI appointing former NSA director Paul Nakasone to its board", "ChatGPT integration", "Meta''s AI assistant"]',
1,
'Snowden warned about OpenAI appointing former NSA director Paul Nakasone to its board, describing this as AI replacing human judgment in surveillance systems—an unprecedented threat where AI makes surveillance decisions without human oversight.',
'hard',
'["https://twitter.com/Snowden/status/1800922691056418832"]'),

-- Anduril Autonomous Weapons
('anduril-autonomous-weapons',
'Palmer Luckey''s Anduril develops autonomous weapons with minimal human oversight. What concerns do experts raise about these "Oppenheimer moment" technologies?',
'["They enhance human decision-making", "They raise profound accountability questions when causing civilian casualties", "They improve military precision", "They reduce warfare costs"]',
1,
'International law experts warn Anduril''s autonomous weapons raise profound accountability questions when causing civilian casualties. The "Oppenheimer moment" refers to technologies that fundamentally change warfare through AI kill decisions.',
'hard',
'["https://www.hrw.org/report/2012/11/19/losing-humanity/case-against-killer-robots"]'),

('anduril-autonomous-weapons',
'How much did Anduril''s valuation increase in six months as defense contracts multiplied?',
'["$8B to $15B", "From $14 billion to $30.5 billion", "$20B to $35B", "$5B to $12B"]',
1,
'Anduril''s valuation doubled from $14 billion to $30.5 billion in six months as defense contracts multiplied, creating powerful market incentives for developing increasingly lethal autonomous weapons systems.',
'medium',
'["https://www.bloomberg.com/news/articles/2024-12-12/anduril-raises-1-5-billion-at-14-billion-valuation"]'),

-- Anduril Border Surveillance  
('anduril-border-surveillance',
'What percentage of the U.S.-Mexico border is monitored by Anduril''s AI surveillance towers?',
'["15%", "30%", "45%", "60%"]',
1,
'Anduril''s 300+ Autonomous Surveillance Towers monitor approximately 30% of the U.S.-Mexico border using AI to track human movement. Civil rights groups warn this contributes to "deadly displacement."',
'medium',
'["https://www.washingtonpost.com/technology/2022/02/16/anduril-border-wall-surveillance/"]'),

('anduril-border-surveillance',
'Civil rights organizations describe Anduril''s border surveillance as contributing to what outcome?',
'["Improved safety", "Enhanced legal processing", "Deadly displacement", "Better humanitarian aid"]',
2,
'Civil rights organizations describe Anduril''s towers as contributing to "deadly displacement"—pushing migrants toward dangerous routes and increasing deaths while collecting biometric data without consent.',
'hard',
'["https://www.aclu.org/news/immigrants-rights/cbps-surveillance-technology-creates-virtual-border-wall"]'),

-- SpaceX/Starlink
('spacex-starlink-surveillance',
'How many satellites does SpaceX operate, creating unprecedented global surveillance capabilities?',
'["Over 3,000", "Over 5,000", "Over 7,000", "Over 10,000"]',
2,
'SpaceX operates over 7,000 Starlink satellites creating near-continuous Earth coverage. The classified Starshield program gives U.S. intelligence agencies persistent global surveillance capabilities.',
'medium',
'["https://www.spacex.com/updates/starlink-update-04-28-2023/"]'),

-- AWS Government Cloud
('aws-government-cloud',
'What is the value of NSA''s "WildandStormy" contract providing AWS with classified surveillance data processing?',
'["$5 billion over 5 years", "$10 billion over 10 years", "$15 billion over 8 years", "$20 billion over 12 years"]',
1,
'The "WildandStormy" contract provides AWS $10 billion over 10 years to process signals intelligence and classified data, representing privatization of core intelligence functions.',
'hard',
'["https://www.nextgov.com/emerging-tech/2021/07/nsa-awards-10b-cloud-computing-contract-amazon/183787/"]'),

-- Clearview AI
('clearview-facial-recognition',
'How many law enforcement agencies globally have Clearview AI contracts?',
'["Over 1,000", "Over 2,200", "Over 3,500", "Over 4,800"]',
1,
'Clearview AI has contracts with over 2,200 law enforcement agencies globally, conducting over 2 million facial recognition searches annually against 50-60 billion scraped images.',
'medium',
'["https://www.buzzfeednews.com/article/ryanmac/clearview-ai-fbi-ice-global-law-enforcement"]'),

-- Constitutional Crisis Questions
('surveillance-constitutional-crisis',
'Senator Ron Wyden characterizes government purchase of surveillance data as what constitutional violation?',
'["Enhanced security measure", "Using credit cards to end-run Americans'' Fourth Amendment rights", "Improved law enforcement", "Necessary intelligence gathering"]',
1,
'Wyden describes this as "using their credit cards to end-run Americans'' Fourth Amendment rights"—purchasing surveillance data to conduct searches that would require warrants if done directly.',
'hard',
'["https://www.wyden.senate.gov/news/press-releases/wyden-calls-on-biden-administration-to-stop-purchasing-americans-personal-data"]'); 