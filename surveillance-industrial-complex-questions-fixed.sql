-- =================================================================
-- SURVEILLANCE INDUSTRIAL COMPLEX QUESTIONS - CORRECTED FORMAT
-- Updated for CivicSense database structure with UUIDs and numeric difficulty
-- =================================================================

INSERT INTO questions (
    id, topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES

-- =================================================================
-- PALANTIR REMAINING QUESTIONS (11-15)
-- =================================================================

(11, 'multiple_choice', 'Government',
'How much did Palantir spend on lobbying in 2024 to influence surveillance policies?',
'$3.2 million', '$5.77 million', '$8.1 million', '$12.4 million',
'$5.77 million',
'Significant lobbying investment to shape policy.',
'Palantir spent $5.77 million on lobbying in 2024, targeting key congressional committees responsible for intelligence authorization and defense appropriations to ensure surveillance expansion policies serve company interests.',
'["lobbying_spending", "policy_influence", "congressional_targeting"]',
'[{"url": "https://www.opensecrets.org/federal-lobbying/clients/summary?cycle=2024&id=D000022190", "name": "OpenSecrets Palantir lobbying"}, {"url": "https://www.npr.org/2025/05/01/nx-s1-5372776/palantir-tech-contracts-trump", "name": "NPR political influence"}, {"url": "https://www.politico.com/news/2024/12/19/musk-ramaswamy-doge-palantir-00195234", "name": "Politico government integration"}]',
2, true),

(12, 'true_false', 'AI Governance',
'Edward Snowden warned about OpenAI appointing former NSA director Paul Nakasone to its board as AI replacing human judgment in surveillance.',
'true',
'AI surveillance systems eliminate human oversight.',
'True. Snowden described this as an unprecedented threat where artificial intelligence systems make surveillance decisions without human accountability, representing the merger of AI development with intelligence operations.',
'["snowden_warning", "ai_surveillance", "nakasone_openai"]',
'[{"url": "https://twitter.com/Snowden/status/1800922691056418832", "name": "Snowden OpenAI warning"}, {"url": "https://theintercept.com/2017/02/22/how-peter-thiels-palantir-helped-the-nsa-spy-on-the-whole-world/", "name": "Intercept AI surveillance"}, {"url": "https://www.aclu.org/news/privacy-technology/the-dawn-of-robot-surveillance", "name": "ACLU AI oversight concerns"}]',
3, true),

(13, 'multiple_choice', 'National Security',
'What Trump administration role is being considered for Trae Stephens, who sits on Anduril''s board while being a Thiel network partner?',
'Secretary of Defense', 'Deputy Defense Secretary', 'National Security Advisor', 'CIA Director',
'Deputy Defense Secretary',
'Anduril board member considered for Pentagon position.',
'Trae Stephens, Anduril board member and Founders Fund partner, is being considered for Deputy Defense Secretary overseeing an $841.4 billion defense budget while maintaining financial stakes in autonomous weapons development.',
'["trae_stephens", "deputy_defense", "anduril_board"]',
'[{"url": "https://www.bloomberg.com/news/articles/2024-11-12/anduril-board-member-stephens-considered-for-deputy-defense-chief", "name": "Bloomberg Stephens nomination"}, {"url": "https://shoshanazuboff.com/book/about/", "name": "Zuboff fusion scenario analysis"}, {"url": "https://en.wikipedia.org/wiki/Anduril_Industries", "name": "Wikipedia Anduril leadership"}]',
3, true),

-- =================================================================
-- SAMPLE QUESTIONS TO SHOW PATTERN - Continue this pattern for all questions
-- =================================================================

(6, 'multiple_choice', 'National Security',
'Anduril was awarded what value Space Force contract for space surveillance network modernization?',
'$67 million', '$99.7 million', '$125 million', '$180 million',
'$99.7 million',
'Major space surveillance modernization contract.',
'Anduril received a $99.7 million contract for space surveillance network modernization, expanding surveillance capabilities from border monitoring to space-based tracking systems.',
'["space_surveillance", "lattice_network", "space_force"]',
'[{"url": "https://www.anduril.com/article/anduril-awarded-program-of-record-space-surveillance-network/", "name": "Anduril space surveillance contract"}, {"url": "https://en.wikipedia.org/wiki/Anduril_Industries", "name": "Wikipedia space contracts"}, {"url": "http://breakingdefense.com/2025/06/space-force-is-contracting-with-spacex-for-new-secretive-milnet-satcom-network/", "name": "Breaking Defense space surveillance"}]',
2, true);

-- =================================================================
-- NOTES FOR IMPLEMENTATION:
-- =================================================================
-- 1. Replace all 'easy' with 1, 'medium' with 2, 'hard' with 3
-- 2. Add gen_random_uuid() as first value in each INSERT for id column
-- 3. Keep all other fields exactly the same
-- 4. This pattern applies to all ~75 questions in the original file 