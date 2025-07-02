-- Border Surveillance and Facial Recognition Questions
-- Verified facts and working source links

INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation, difficulty, source_urls) VALUES

-- ANDURIL BORDER SURVEILLANCE
('anduril-border-surveillance',
'What percentage of the U.S.-Mexico border is monitored by Anduril''s AI surveillance towers?',
'["15%", "30%", "45%", "60%"]',
1,
'Anduril''s 300+ Autonomous Surveillance Towers monitor approximately 30% of the U.S.-Mexico border using AI to track human movement.',
'medium',
'["https://www.washingtonpost.com/technology/2022/02/16/anduril-border-wall-surveillance/"]'),

('anduril-border-surveillance',
'Civil rights organizations describe Anduril''s border surveillance as contributing to what outcome?',
'["Improved safety", "Enhanced processing", "Deadly displacement", "Better humanitarian aid"]',
2,
'Civil rights organizations describe this as "deadly displacement"—pushing migrants toward dangerous routes and increasing deaths.',
'hard',
'["https://www.aclu.org/news/immigrants-rights/cbps-surveillance-technology-creates-virtual-border-wall"]'),

('anduril-border-surveillance',
'How many Autonomous Surveillance Towers has Anduril deployed along the border?',
'["200+", "300+", "400+", "500+"]',
1,
'Anduril has deployed over 300 Autonomous Surveillance Towers creating an AI-powered surveillance network.',
'medium',
'["https://www.anduril.com/capability/lattice-for-border-security/"]'),

-- CLEARVIEW AI FACIAL RECOGNITION  
('clearview-facial-recognition',
'How many law enforcement agencies globally have Clearview AI contracts?',
'["Over 1,000", "Over 2,200", "Over 3,500", "Over 4,800"]',
1,
'Clearview AI has contracts with over 2,200 law enforcement agencies globally, conducting over 2 million searches annually.',
'medium',
'["https://www.buzzfeednews.com/article/ryanmac/clearview-ai-fbi-ice-global-law-enforcement"]'),

('clearview-facial-recognition',
'How many images does Clearview AI''s database contain?',
'["10-20 billion", "50-60 billion", "25-30 billion", "75-80 billion"]',
1,
'Clearview AI''s database contains 50-60 billion images scraped from the internet without consent.',
'medium',
'["https://www.nytimes.com/2020/01/18/technology/clearview-privacy-facial-recognition.html"]'),

('clearview-facial-recognition',
'Who leads Clearview AI''s new leadership that created the "MAGA ETF"?',
'["David Scalzo", "Hal Lambert", "Michael Flynn", "Steve Bannon"]',
1,
'Hal Lambert, a Trump fundraiser who created the "MAGA ETF," is part of Clearview AI''s new leadership.',
'medium',
'["https://www.politico.com/news/2024/11/18/clearview-ai-facial-recognition-trump-00190234"]'); 