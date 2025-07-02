-- Additional Verified Surveillance Questions  
-- Based on Knight Institute and Brennan Center research

INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation, difficulty, source_urls) VALUES

-- SPACEX/STARLINK SURVEILLANCE
('spacex-starlink-surveillance',
'How many satellites does SpaceX operate, creating global surveillance capabilities?',
'["Over 3,000", "Over 5,000", "Over 7,000", "Over 10,000"]',
2,
'SpaceX operates over 7,000 Starlink satellites creating near-continuous Earth coverage for dual-use surveillance.',
'medium',
'["https://www.spacex.com/updates/starlink/"]'),

('spacx-starlink-surveillance',
'What is the value of SpaceX''s classified spy satellite contract?',
'["$1.2 billion", "$1.8 billion", "$2.4 billion", "$3.1 billion"]',
1,
'SpaceX operates under a classified $1.8 billion contract to deploy spy satellites for the National Reconnaissance Office.',
'medium',
'["https://www.reuters.com/technology/space/spacex-building-spy-satellite-network-us-intelligence-agency-sources-say-2024-03-16/"]'),

-- AWS GOVERNMENT CLOUD
('aws-government-cloud',
'What is the value of the NSA''s "WildandStormy" contract with AWS?',
'["$5 billion", "$10 billion", "$15 billion", "$20 billion"]',
1,
'The "WildandStormy" contract provides AWS $10 billion over 10 years to process classified surveillance data.',
'hard',
'["https://www.nextgov.com/emerging-tech/2021/07/nsa-awards-10b-cloud-computing-contract-amazon/183787/"]'),

-- SURVEILLANCE CONSTITUTIONAL CRISIS
('surveillance-constitutional-crisis',
'The Knight Institute warns social media surveillance partnerships threaten what rights?',
'["Security interests", "Freedom of speech and association online", "Economic development", "International cooperation"]',
1,
'The Knight Institute warns these partnerships threaten to undermine freedom of speech and association online.',
'hard',
'["https://knightcolumbia.org/blog/the-worrying-expansion-of-the-social-media-surveillance-industrial-complex"]'),

('surveillance-constitutional-crisis',
'According to the Brennan Center, what is problematic about AI surveillance tools?',
'["Perfect accuracy", "Making reliable threat judgments is beyond existing technology capacity", "Enhanced precision", "Improved efficiency"]',
1,
'The Brennan Center notes that making reliable judgments about threats is beyond the capacity of existing technology.',
'hard',
'["https://www.brennancenter.org/our-work/research-reports/social-media-surveillance-us-government"]'),

('surveillance-constitutional-crisis',
'The Brennan Center warns surveillance tools particularly impact which communities?',
'["All equally", "Non-standard English speakers and minority communities", "Wealthy areas", "Rural populations"]',
1,
'The Brennan Center warns these tools fare particularly poorly on non-standard English speakers, often from minority communities.',
'hard',
'["https://www.brennancenter.org/our-work/research-reports/social-media-surveillance-us-government"]'),

-- SURVEILLANCE CORPORATE PROFITS
('surveillance-corporate-profits',
'What was Palantir''s stock performance ranking in the S&P 500 for 2024?',
'["First", "Second", "Third", "Fifth"]',
1,
'Palantir was the second-best performer in the S&P 500 in 2024, demonstrating market rewards for surveillance expansion.',
'medium',
'["https://finance.yahoo.com/news/palantir-technologies-stock-soars-200-percent-trump-election-victory-162847474.html"]'),

('surveillance-corporate-profits',
'How much did Amazon spend on lobbying in 2024?',
'["$12 million", "$19.14 million", "$25 million", "$32 million"]',
1,
'Amazon spent $19.14 million on lobbying in 2024, targeting surveillance and cloud infrastructure policies.',
'medium',
'["https://www.opensecrets.org/federal-lobbying/clients/summary?cycle=2024&id=D000000135"]'),

-- SURVEILLANCE RESISTANCE MOVEMENTS
('surveillance-resistance-movements',
'The Knight Institute filed FOIA requests to investigate what concern?',
'["Cost efficiency", "The scope and details of public-private surveillance partnerships", "Technical capabilities", "International cooperation"]',
1,
'The Knight Institute filed FOIA requests to inform the public about the scope and details of surveillance partnerships.',
'medium',
'["https://knightcolumbia.org/blog/the-worrying-expansion-of-the-social-media-surveillance-industrial-complex"]'),

('surveillance-resistance-movements',
'According to the Brennan Center, what fundamental problem exists with outsourcing surveillance?',
'["Cost savings", "Obscured transparency and weakened safeguards", "Improved efficiency", "Better oversight"]',
1,
'The Brennan Center identifies that outsourcing obscures transparency and weakens safeguards against abuse.',
'hard',
'["https://www.brennancenter.org/our-work/research-reports/social-media-surveillance-us-government"]'); 