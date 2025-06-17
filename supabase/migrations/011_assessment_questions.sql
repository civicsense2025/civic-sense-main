-- =========================================================
-- CivicSense Comprehensive Civic Assessment Questions
-- =========================================================
-- A modern, engaging assessment covering all essential civic knowledge
-- Written in CivicSense brand voice with real-world 2025 examples
-- Covers citizenship test + AP Government + high school civics standards
-- =========================================================

-- Update existing questions to match schema and add comprehensive new ones
INSERT INTO assessment_questions (question, options, correct_answer, explanation, friendly_explanation, difficulty, category, is_active) VALUES

-- =========================================================
-- LEVEL 1: FOUNDATION KNOWLEDGE (Basic Civic Literacy)
-- =========================================================

-- CONSTITUTION & BILL OF RIGHTS (Citizenship Test Level)
(
    'Someone tells you "the government can''t stop me from saying what I want." Which amendment protects free speech?',
    '["First Amendment", "Second Amendment", "Fourth Amendment", "Fifth Amendment"]',
    'First Amendment',
    'The First Amendment protects freedom of speech, religion, press, assembly, and petition. However, there are some limits—like you can''t shout "fire" in a crowded theater or make direct threats.',
    'First Amendment! It''s like the greatest hits album of American freedoms: speech, religion, press, assembly, and petition. Though remember, even freedom of speech has some limits—you still can''t yell "fire" in a crowded theater.',
    1,
    'constitution',
    true
),

(
    'You''re watching the news and they mention "Congress passed a bill." What happens next before it becomes law?',
    '["It automatically becomes law", "The President must sign it", "The Supreme Court must approve it", "State governments must ratify it"]',
    'The President must sign it',
    'After Congress passes a bill, it goes to the President who can either sign it into law or veto it. If vetoed, Congress can override with a two-thirds majority in both chambers.',
    'Think of it like a relay race! Congress passes the baton (bill) to the President, who can either run it across the finish line (sign it) or drop it (veto it). If they drop it, Congress can still carry it across if two-thirds of both chambers really want to.',
    1,
    'government_structure',
    true
),

(
    'What does the Constitution actually do for America?',
    '["Lists all the laws we have to follow", "Creates the government and limits its power", "Protects us from other countries", "Tells us our moral values"]',
    'Creates the government and limits its power',
    'The Constitution is essentially the government''s job description and rulebook - it creates the structure of government and sets boundaries on what it can and cannot do.',
    'Think of the Constitution as the ultimate employee handbook for the government. It doesn''t just say "here''s your job" - it also says "and here''s what you absolutely cannot do." It''s both an instruction manual and a leash.',
    1,
    'constitution',
    true
),

-- BASIC GOVERNMENT STRUCTURE
(
    'Your friend says "I''m voting for my Representative this year." How often do they get this chance?',
    '["Every year", "Every 2 years", "Every 4 years", "Every 6 years"]',
    'Every 2 years',
    'House Representatives serve 2-year terms, so there''s an election every even-numbered year. This shorter term keeps them more responsive to their constituents.',
    'Every 2 years! House reps are like your favorite TV show—constantly worried about renewal. This keeps them pretty responsive to what their viewers (voters) want, unlike Senators who get 6-year deals.',
    1,
    'elections',
    true
),

(
    'If both the President and Vice President died, who would become President?',
    '["Secretary of State", "Speaker of the House", "Senate Majority Leader", "Chief Justice"]',
    'Speaker of the House',
    'The Presidential Succession Act establishes the order: Vice President, then Speaker of the House, then President pro tempore of the Senate, then Cabinet members in order.',
    'The Speaker of the House is third in line! It goes President → Vice President → Speaker. That''s why when the Speaker visits other countries, it''s kind of a big deal - they''re pretty close to running the whole show.',
    1,
    'government_structure',
    true
),

(
    'What''s the basic job of the three branches of government?',
    '["All three make laws", "Legislative makes laws, Executive enforces laws, Judicial interprets laws", "Executive makes laws, Legislative enforces laws, Judicial makes laws", "They all do everything together"]',
    'Legislative makes laws, Executive enforces laws, Judicial interprets laws',
    'This is the fundamental separation of powers: Congress (Legislative) writes the laws, the President (Executive) carries them out, and courts (Judicial) decide what they mean.',
    'It''s like a restaurant: Congress writes the menu (makes laws), the President''s team cooks and serves the food (enforces laws), and the courts are like food critics who tell everyone what the menu really means (interprets laws).',
    1,
    'government_structure',
    true
),

-- BASIC RIGHTS AND RESPONSIBILITIES  
(
    'Police want to search your house. What do they normally need first?',
    '["Probable cause", "A warrant", "Your permission", "Any of these work"]',
    'Any of these work',
    'The Fourth Amendment protects against unreasonable searches. Police usually need a warrant, but they can search with your consent or with probable cause in emergency situations.',
    'The Fourth Amendment gives you options! Police need a warrant, OR your permission, OR probable cause in emergencies. It''s like having multiple locks on your door - they need a key that actually fits.',
    1,
    'civil_rights',
    true
),

(
    'You''re arrested and can''t afford a lawyer. What happens next?',
    '["You represent yourself", "You get a public defender", "Your trial is delayed", "Charges are dropped"]',
    'You get a public defender',
    'The Sixth Amendment guarantees legal representation in criminal cases. If you can''t afford a lawyer, the government must provide one.',
    'You get a lawyer anyway! Thanks to a guy named Gideon who handwrote a petition to the Supreme Court from prison, the government has to give you a public defender if you can''t afford one. Democracy works in mysterious ways.',
    1,
    'civil_rights',
    true
),

-- BASIC FEDERALISM
(
    'Your state passes a law that conflicts with federal law. What happens?',
    '["State law wins because states are closer to the people", "Federal law wins because of the Supremacy Clause", "They negotiate until they agree", "It goes to a voter referendum"]',
    'Federal law wins because of the Supremacy Clause',
    'Article VI contains the Supremacy Clause, making federal law "the supreme law of the land" when there''s a conflict with state law.',
    'Federal law wins this fight every time, thanks to the Supremacy Clause. It''s like when your family rules conflict with school rules - if the school says "no phones" and your parents say "always carry your phone," the school rule wins while you''re at school.',
    1,
    'federalism',
    true
),

-- BASIC VOTING AND ELECTIONS
(
    'In a presidential election, you''re actually voting for:',
    '["The presidential candidate directly", "Your state''s electors in the Electoral College", "Your party''s choice", "The candidate''s running mate"]',
    'Your state''s electors in the Electoral College',
    'The Electoral College system means you vote for electors pledged to support your preferred candidate, not directly for the candidate themselves.',
    'Plot twist: you''re not directly voting for the President! You''re voting for your state''s electors who promise to vote for your candidate. It''s like voting for people to vote for you. Democracy is weird sometimes.',
    1,
    'elections',
    true
),

-- =========================================================
-- LEVEL 2: INTERMEDIATE UNDERSTANDING
-- =========================================================

-- CONSTITUTIONAL INTERPRETATION AND APPLICATION
(
    'A federal judge strikes down a state law as "unconstitutional." What power allows them to do this?',
    '["Executive privilege", "Judicial review", "Legislative oversight", "Federal supremacy"]',
    'Judicial review',
    'Judicial review lets courts examine laws and government actions to see if they violate the Constitution. This power isn''t explicitly written in the Constitution—the Supreme Court established it in Marbury v. Madison (1803).',
    'Judicial review is like having a Constitutional fact-checker! Courts can say "hold up, that law violates the Constitution." The founders didn''t explicitly write this power in, but the Supreme Court claimed it in 1803 and everyone went along with it.',
    2,
    'government_structure',
    true
),

(
    'Matt Gaetz resigned from Congress in 2025 after Trump nominated him for Attorney General. What happens to his House seat?',
    '["It stays empty until the next election", "The governor appoints someone", "A special election is held", "The party chooses a replacement"]',
    'A special election is held',
    'House vacancies must be filled by special elections, unlike Senate seats where governors can make temporary appointments in most states. Florida scheduled Gaetz''s replacement election for April 2025.',
    'Time for a special election! House seats can''t just sit empty or get filled by appointment like Senate seats sometimes can. Florida voters had to choose Gaetz''s replacement in a special election, even though he withdrew his AG nomination later.',
    2,
    'elections',
    true
),

(
    'The Wisconsin Supreme Court election in April 2025 cost nearly $100 million. Why do judicial races get so expensive?',
    '["Judges make important policy decisions", "Campaign ads are required by law", "Billionaires like influencing courts", "Judicial races last longer than other elections"]',
    'Judges make important policy decisions',
    'State supreme courts decide major issues like abortion, voting rights, and redistricting. The Wisconsin court had recently overturned Republican-drawn legislative maps, showing how much power these courts have.',
    'Courts make huge decisions! Wisconsin''s Supreme Court had just redrawn the state''s legislative maps and was about to rule on abortion rights. When courts make decisions that affect millions of people, big donors like Elon Musk (who spent $25 million) want to influence who''s making those calls.',
    2,
    'current_events',
    true
),

-- FEDERALISM IN PRACTICE
(
    'Your city wants to set a $20 minimum wage, your state sets it at $15, and federal minimum wage is $7.25. Which applies to most workers?',
    '["Federal law - $7.25", "State law - $15", "City law - $20", "Whichever the employer prefers"]',
    'City law - $20',
    'In federalism, higher levels of government set the floor, not the ceiling. Local governments can be more generous than state or federal governments.',
    'Think of it like dress codes layering up - the federal government says "you must wear clothes," your state says "shirts and shoes required," and your city says "business casual only." Each level can add requirements, but they can''t take away what the higher level required. So the highest standard wins.',
    2,
    'federalism',
    true
),

(
    'During COVID-19, some governors closed businesses while the federal government wanted them open. Who had the authority?',
    '["Federal government - national emergency", "State governments - public health is traditionally a state power", "Local governments - they''re closest to the people", "It depends on which party controls what"]',
    'State governments - public health is traditionally a state power',
    'Public health emergencies have traditionally been handled by state governments under their "police powers" to protect public health, safety, and welfare.',
    'This was a real federalism stress test! Public health has traditionally been a state power - states can quarantine, close businesses, and take emergency health measures. The federal government can coordinate and provide resources, but states are usually in the driver''s seat for actual health emergency responses.',
    2,
    'federalism',
    true
),

-- LEGISLATIVE PROCESS
(
    'You hear that a bill "died in committee." What does this actually mean?',
    '["The committee voted against it", "It ran out of time", "Committee members refused to consider it", "Any of these could happen"]',
    'Any of these could happen',
    'Bills can "die" in committees several ways: the committee votes it down, the chair never schedules a hearing, or time runs out in the legislative session.',
    'Committee purgatory is real! Most bills never make it out alive. Think of committees as the bouncer at the club—they decide what gets to party on the floor and what gets left outside in the cold.',
    2,
    'legislative_process',
    true
),

(
    'Congress wants to reduce the federal budget deficit. What''s the fundamental trade-off they face?',
    '["Raise taxes or cut spending", "Domestic vs foreign spending", "Rich vs poor taxpayers", "Current vs future generations"]',
    'Raise taxes or cut spending',
    'Basic budget math: to reduce a deficit, you must either increase revenue (raise taxes) or decrease expenses (cut spending), or some combination of both.',
    'It''s simple math with complicated politics: spend less money or bring in more money. Everything else is just details about how to do those two things. The hard part isn''t the math - it''s getting people to agree on which taxes to raise or which spending to cut.',
    2,
    'policy_analysis',
    true
),

-- CIVIL RIGHTS AND LIBERTIES
(
    'A school bans students from wearing political t-shirts. A student sues, claiming First Amendment violations. What''s the key legal question?',
    '["Do students have free speech rights?", "Can schools ever limit student expression?", "Does the ban disrupt the educational environment?", "Are political shirts different from other clothing?"]',
    'Does the ban disrupt the educational environment?',
    'Students do have First Amendment rights at school (Tinker v. Des Moines), but schools can limit speech that substantially disrupts education.',
    'Students have rights, but schools have authority too! The key test is whether the expression interferes with learning. It''s like having free speech at a library - you can express yourself, but you can''t be so loud that you disrupt everyone else.',
    2,
    'civil_rights',
    true
),

(
    'You''re arrested and police don''t read you your Miranda rights. What happens to your case?',
    '["The case gets thrown out automatically", "Any confession you made can''t be used against you", "You get released immediately", "Nothing - Miranda rights aren''t real"]',
    'Any confession you made can''t be used against you',
    'Miranda rights protect your Fifth Amendment right against self-incrimination. If police don''t read them before questioning, your statements generally can''t be used as evidence.',
    'Plot twist: your case doesn''t just disappear! Miranda rights protect you from having your own words used against you. If the cops didn''t read you your rights before questioning, anything you said typically can''t be used in court. But they can still try to convict you with other evidence.',
    2,
    'civil_rights',
    true
),

-- MEDIA LITERACY AND INFORMATION EVALUATION
(
    'Two news sources report the same speech differently. One says "Politician Calls for Unity" and another says "Politician Divides Audience." What''s happening?',
    '["One source is lying", "They''re reporting on different speeches", "They''re using selective quotes and different framing", "One source has bad fact-checkers"]',
    'They''re using selective quotes and different framing',
    'Different news outlets can report the same event very differently by choosing which quotes to highlight and how to frame the story, without necessarily being factually wrong.',
    'Welcome to the world of media framing! The same speech can be "glass half full" or "glass half empty" depending on which parts the news outlet chooses to highlight. Both might be technically accurate but create totally different impressions. It''s like describing a movie as either "a heartwarming story" or "a tragic tale" - same movie, different spin.',
    2,
    'media_literacy',
    true
),

(
    'You see a viral video of a politician saying something controversial, but something seems off. What should you check first?',
    '["Who posted the video", "When and where it was recorded", "How many people shared it", "What the comments say about it"]',
    'When and where it was recorded',
    'Context is crucial for evaluating video content. Videos can be old footage presented as recent, taken out of context, or even deepfaked.',
    'Context is everything! That "controversial" video might be from 10 years ago, taken out of context, or even AI-generated. Always check the when, where, and what was happening around it. Old videos love to resurface during election season pretending to be breaking news.',
    2,
    'media_literacy',
    true
),

-- =========================================================
-- LEVEL 3: ADVANCED ANALYSIS AND APPLICATION
-- =========================================================

-- ADVANCED CONSTITUTIONAL LAW
(
    'The Supreme Court rules 5-4 that a law is unconstitutional. Later, the Court''s composition changes and they''re asked to reconsider. What''s most likely?',
    '["They must follow the previous decision", "They can overturn the previous decision", "They will refuse to hear the case", "Congress must approve any changes"]',
    'They can overturn the previous decision',
    'The Supreme Court can overturn its own previous decisions, though it usually requires special justification. Examples include Brown v. Board overturning Plessy v. Ferguson, or Dobbs overturning Roe v. Wade.',
    'The Supreme Court can totally change its mind, but it''s supposed to be really hard to do. It''s like your family deciding to suddenly change a long-standing tradition - you need a really good reason, not just "we feel like it." Examples include Brown v. Board overturning segregation or Dobbs overturning Roe v. Wade.',
    3,
    'constitution',
    true
),

(
    'Congress wants to pass a constitutional amendment to overturn a recent Supreme Court decision. What''s required?',
    '["Simple majority in both houses of Congress", "Two-thirds of both houses and three-fourths of states", "President must sign it like a regular law", "Supreme Court must approve the amendment"]',
    'Two-thirds of both houses and three-fourths of states',
    'Constitutional amendments require a two-thirds majority in both houses of Congress and ratification by three-fourths of state legislatures (or state conventions).',
    'Changing the Constitution is supposed to be really, really hard - and it shows! You need two-thirds of both House and Senate, then three-fourths of all 50 states to agree. It''s like trying to get your entire extended family to agree on a restaurant - possible, but you better have a really good reason.',
    3,
    'constitution',
    true
),

(
    'A state wants to require a citizenship test to vote. What constitutional problems might this face?',
    '["Violates Equal Protection Clause", "Violates the 24th Amendment poll tax prohibition", "Violates the Voting Rights Act", "All of these are potential issues"]',
    'All of these are potential issues',
    'Voting requirements can violate equal protection (discriminatory impact), constitute poll taxes (time/money to prepare), and violate the Voting Rights Act (disproportionate impact on protected groups).',
    'This would face a constitutional pile-on! Equal protection because it might discriminate, poll tax because studying costs time and money, and Voting Rights Act because tests have historically been used to exclude voters. Courts would probably shut this down faster than a fire drill.',
    3,
    'voting_rights',
    true
),

-- ADVANCED POLICY ANALYSIS
(
    'A city passes rent control to help with affordable housing. What''s a likely unintended consequence economists worry about?',
    '["Rents will increase in other areas", "Fewer new rental units will be built", "Property values will decline", "All of these could happen"]',
    'All of these could happen',
    'Rent control can create complex market effects including reduced incentives to build new housing, spillover effects in uncontrolled areas, and impacts on property values.',
    'Policy is complicated! Rent control might help current tenants, but it could also mean fewer new apartments get built (why build if you can''t charge market rates?), higher rents in areas without controls, and lower property values. It''s like squeezing a balloon - the air has to go somewhere.',
    3,
    'policy_analysis',
    true
),

(
    'A politician proposes "eliminating government waste" to fund a new program. What should make you skeptical?',
    '["Government waste doesn''t exist", "They don''t specify what waste", "Waste elimination never works", "Politicians always lie"]',
    'They don''t specify what waste',
    'Vague promises to cut "waste, fraud, and abuse" are usually political theater. Real budget proposals specify exactly what gets cut.',
    'Vague promises to cut "waste, fraud, and abuse" are usually political theater. If someone can''t name specific programs or expenses to eliminate, they probably can''t actually fund their new idea that way. It''s like saying you''ll pay for vacation by "finding money around the house" - sounds nice, but where exactly?',
    3,
    'policy_analysis',
    true
),

-- ADVANCED CAMPAIGN FINANCE AND ELECTIONS
(
    'Elon Musk spent $25 million supporting Brad Schimel in Wisconsin''s 2025 Supreme Court race. How was this legal?',
    '["It wasn''t legal - it violated campaign finance laws", "He gave it to a Super PAC that can take unlimited donations", "Judicial races have no spending limits", "He''s a billionaire so different rules apply"]',
    'He gave it to a Super PAC that can take unlimited donations',
    'Since Citizens United v. FEC, individuals and corporations can give unlimited amounts to Super PACs, which can spend unlimited amounts on elections but cannot coordinate directly with candidates.',
    'Welcome to the wild world of campaign finance! Thanks to Citizens United, Super PACs can take unlimited money and spend it on elections, as long as they don''t directly coordinate with the candidate. It''s like having a really enthusiastic friend who throws you a surprise party - they''re helping you, but you can''t tell them what you want.',
    3,
    'elections',
    true
),

(
    'Your friend in Wyoming and you in California both vote for President. Whose vote has more power?',
    '["They''re exactly equal", "California vote is more powerful", "Wyoming vote is more powerful", "It depends on who''s running"]',
    'Wyoming vote is more powerful',
    'Due to the Electoral College, less populous states like Wyoming have more electoral votes per person than populous states like California.',
    'Wyoming wins this one! Because of the Electoral College, your friend in Wyoming has about 3.6 times more voting power than you do in California. Wyoming gets 3 electoral votes for about 580,000 people, while California gets 54 electoral votes for about 39 million people. Math is weird in the Electoral College.',
    3,
    'elections',
    true
),

-- ADVANCED FEDERALISM AND CONSTITUTIONAL STRUCTURE
(
    'The President wants to negotiate a trade agreement with another country. What role does Congress play?',
    '["Congress negotiates all trade deals", "Congress must approve any trade agreement", "President handles all foreign trade", "It depends on the type of agreement"]',
    'It depends on the type of agreement',
    'The President can negotiate executive agreements independently, but formal treaties require Senate approval. Trade deals often fall into a gray area with special "fast-track" procedures.',
    'It''s complicated! For major trade deals, Congress usually gets a say (especially the Senate), but the President has a lot of flexibility with executive agreements. Think of it like a business partnership - the CEO can make day-to-day deals, but the board of directors needs to approve the big stuff.',
    3,
    'foreign_policy',
    true
),

(
    'During World War II, the U.S. interned Japanese Americans. What does this teach us about constitutional rights during emergencies?',
    '["The Constitution doesn''t apply during wartime", "Even constitutional rights can be violated when people are scared", "National security always overrides individual rights", "The Supreme Court never makes mistakes"]',
    'Even constitutional rights can be violated when people are scared',
    'The Japanese American internment, later acknowledged as a grave injustice, shows how fear and prejudice can lead to constitutional violations even when they''re later recognized as wrong.',
    'This is one of America''s darkest moments and biggest lessons. Even with a Constitution protecting rights, fear and racism led to massive violations of civil liberties. The Supreme Court approved it at the time, but later generations recognized it was completely wrong. It''s a reminder that rights are only as strong as our commitment to protecting them.',
    3,
    'historical_context',
    true
),

-- CIVIC ENGAGEMENT AND PARTICIPATION
(
    'You want to get a pothole fixed on your street. Who should you contact first?',
    '["Your state representative", "The mayor", "Your city council member", "The governor"]',
    'Your city council member',
    'Local infrastructure like potholes is typically handled by city government, and city council members represent specific districts or wards.',
    'Start local for local problems! Your city council member is like your neighborhood''s representative in city government. They''re the ones who can actually get your pothole fixed, not the governor. Think of it like a chain of command - you don''t call the CEO about your broken office printer.',
    1,
    'civic_engagement',
    true
),

(
    'You''re testifying at a city council meeting about a proposed development. What''s the most effective approach?',
    '["Share your personal feelings about the project", "Present facts about how it affects the community", "Criticize council members who support it", "Read a petition with lots of signatures"]',
    'Present facts about how it affects the community',
    'Effective civic testimony focuses on specific, factual impacts on the community rather than personal opinions or attacks on officials.',
    'Think like a city council member: they want to know how this affects their constituents. Come with facts, numbers, and specific examples. "This will increase traffic by 30% during school hours" hits harder than "I just don''t like it." You''re making a business case for your community.',
    2,
    'civic_engagement',
    true
),

(
    'You want to change a state law. What''s the most effective long-term strategy?',
    '["Start a petition drive", "Contact your state legislators", "Build a coalition of affected groups", "Run for office yourself"]',
    'Build a coalition of affected groups',
    'Lasting change requires sustained pressure from multiple directions. One person''s opinion is easy to ignore, but a coalition of different groups with the same goal creates political momentum.',
    'Lasting change requires teamwork! One person''s opinion is easy to ignore, but a coalition of different groups with the same goal creates political momentum. Think: businesses, nonprofits, community groups, and voters all pushing together. It''s like moving a heavy couch - much easier with multiple people.',
    3,
    'civic_engagement',
    true
),

-- CURRENT EVENTS AND DEMOCRATIC PROCESSES
(
    'Congress is debating the debt ceiling in 2025. Your friend asks what this actually means. What do you tell them?',
    '["It determines how much money Congress can spend", "It allows the government to pay bills for spending already approved", "It sets the national credit card limit", "It controls how much we can borrow from other countries"]',
    'It allows the government to pay bills for spending already approved',
    'The debt ceiling doesn''t authorize new spending - it allows the Treasury to borrow money to pay for spending that Congress has already approved.',
    'Think of it like this: Congress already went shopping and racked up the credit card bill. The debt ceiling debate is about whether they''re allowed to pay the bill they already owe. It''s not about new spending - it''s about paying for stuff they already bought.',
    2,
    'current_events',
    true
),

(
    'A recent Supreme Court case overturned a decades-old precedent. Your friend asks why the Court can just "change its mind."',
    '["They can''t - Supreme Court decisions are permanent", "They can, but it rarely happens and requires strong justification", "They do it all the time when political parties change", "Only Congress can overturn Supreme Court decisions"]',
    'They can, but it rarely happens and requires strong justification',
    'The Supreme Court can overturn its own precedents, but it rarely does so. The doctrine of stare decisis (let the decision stand) creates a strong presumption in favor of keeping existing precedents.',
    'The Supreme Court can change its mind, but it''s supposed to be really hard to do. It''s like your family deciding to suddenly change a long-standing tradition - you need a really good reason, not just "we feel like it." Recent examples include overturning Roe v. Wade or legalizing same-sex marriage.',
    3,
    'current_events',
    true
),

-- DEMOCRACY AND POLITICAL PHILOSOPHY
(
    'Your friend says "America is a democracy." Your other friend says "Actually, it''s a republic." Who''s right?',
    '["The first friend - it''s a democracy", "The second friend - it''s a republic", "Both are right in different ways", "Neither - it''s actually something else"]',
    'Both are right in different ways',
    'The United States is both a democracy (people have power through voting) and a republic (power is exercised through elected representatives rather than direct voting on everything).',
    'Plot twist - they''re both right! We''re a democratic republic. We''re democratic because people have the power through voting, and we''re a republic because we elect representatives to make most decisions for us. It''s like choosing a team captain to make game decisions rather than having the whole team vote on every play.',
    1,
    'foundations_democracy',
    true
),

(
    'The Founding Fathers worried about "tyranny of the majority." What does this mean today?',
    '["The majority party always wins elections", "Popular policies automatically become law", "The majority could vote to take away minority rights", "Most people support the government"]',
    'The majority could vote to take away minority rights',
    'Tyranny of the majority means that just because most people support something doesn''t make it right - the majority could theoretically vote to oppress minorities.',
    'Think of it like this: just because 8 out of 10 friends want to exclude 2 friends from the group doesn''t make it fair. The Founders worried that democracy could become mob rule, so they built in protections like the Bill of Rights that even the majority can''t overturn.',
    2,
    'foundations_democracy',
    true
),

(
    'You''re at a town hall and someone shouts down a speaker they disagree with. What democratic principle does this violate?',
    '["Majority rule", "Individual rights", "Tolerance for different viewpoints", "Equal participation"]',
    'Tolerance for different viewpoints',
    'Democratic societies require tolerance for diverse opinions and civil discourse, even when we strongly disagree with someone''s views.',
    'Democracy is like a big dinner table conversation - everyone gets to speak, even if you think their opinion is terrible. The moment we start shouting people down, we''re not doing democracy anymore, we''re just doing noise.',
    2,
    'foundations_democracy',
    true
),

-- ADDITIONAL ESSENTIAL TOPICS

-- CHECKS AND BALANCES IN PRACTICE
(
    'The President issues an executive order. Congress doesn''t like it. What''s their most direct way to stop it?',
    '["Pass a law that contradicts it", "Impeach the President", "Ask the Supreme Court to review it", "Hold hearings to criticize it"]',
    'Pass a law that contradicts it',
    'Congress can pass legislation that contradicts or overrides executive orders, forcing the President to either sign it or face a potential veto override.',
    'Congress can basically overrule the President by passing a law that says the opposite of what the executive order says. It''s like when your manager makes a rule, but the CEO comes in and makes a different rule that cancels out the first one. Law beats executive order every time.',
    2,
    'government_structure',
    true
),

(
    'A federal judge makes a decision you think is wrong. What check does Congress have on judicial power?',
    '["They can overrule individual court decisions", "They can impeach federal judges", "They can cut court funding", "They have no check on judicial power"]',
    'They can impeach federal judges',
    'Congress can impeach and remove federal judges for "high crimes and misdemeanors," though this is rarely used. They can also propose constitutional amendments to overturn court decisions.',
    'Congress can actually fire federal judges through impeachment, though it almost never happens. It''s the nuclear option - like firing someone for a really bad decision at work. More realistically, Congress can change laws to work around court decisions or even propose constitutional amendments to overturn them.',
    3,
    'government_structure',
    true
),

-- ECONOMIC POLICY BASICS
(
    'The Federal Reserve raises interest rates to fight inflation. How does this affect ordinary people?',
    '["Makes it cheaper to borrow money", "Makes it more expensive to borrow money", "Directly controls prices at stores", "Only affects big banks"]',
    'Makes it more expensive to borrow money',
    'Higher interest rates make borrowing more expensive, which tends to reduce spending and investment, theoretically helping to control inflation.',
    'The Fed is basically making money more expensive to borrow. Higher interest rates mean your mortgage, car loan, and credit cards all cost more, so people spend less money. Less spending means less demand, which should help bring down prices. It''s like economic brakes.',
    2,
    'economic_policy',
    true
);

-- =========================================================
-- AMERICAN CULTURE, IDENTITY & SOCIOPOLITICAL KNOWLEDGE
-- Additional 50 Questions Covering Cultural Literacy
-- =========================================================

INSERT INTO assessment_questions (question, options, correct_answer, explanation, friendly_explanation, difficulty, category, is_active) VALUES

-- AMERICAN IDENTITY AND VALUES
(
    'Someone says "America is a melting pot." What does this traditional metaphor actually mean?',
    '["Everyone keeps their original culture", "All cultures blend into one American culture", "Different cultures exist separately", "Only European cultures matter"]',
    'All cultures blend into one American culture',
    'The "melting pot" metaphor suggests that different immigrant cultures combine and blend to create a unified American identity, though this has been challenged by "salad bowl" or "mosaic" models that celebrate maintaining distinct cultural identities.',
    'The melting pot idea is like making soup - you throw in different ingredients and they all blend together into something new called "American." But nowadays, lots of people prefer the "salad bowl" idea - different ingredients mixing together but each keeping their own flavor. Both approaches are very American!',
    1,
    'american_identity',
    true
),

(
    'What does "American exceptionalism" mean?',
    '["Americans are better than everyone else", "America has a unique role and mission in the world", "America should never make mistakes", "America doesn''t need to follow international rules"]',
    'America has a unique role and mission in the world',
    'American exceptionalism is the belief that the United States has a unique role in human history as a beacon of democracy and freedom, often used to justify both isolationist and interventionist foreign policies.',
    'It''s the idea that America is special - not necessarily better, but different. Like we''re the country that''s supposed to show everyone else how democracy works. Some people love this idea, others think it makes us arrogant. It''s been used to justify everything from staying out of world affairs to jumping into everyone else''s business.',
    2,
    'american_identity',
    true
),

(
    'The phrase "pull yourself up by your bootstraps" reflects which core American value?',
    '["Community cooperation", "Individual responsibility and self-reliance", "Government assistance", "Family support"]',
    'Individual responsibility and self-reliance',
    'This phrase embodies the American belief in individual responsibility and the idea that people can improve their circumstances through hard work and determination, regardless of their starting point.',
    'This is peak American individualism! The idea that you can literally lift yourself up by pulling on your own bootstraps (which is physically impossible, by the way) captures our obsession with self-made success. It''s why Americans love stories about people going from rags to riches through pure determination.',
    1,
    'american_values',
    true
),

-- SOCIAL MOVEMENTS AND CIVIL RIGHTS EVOLUTION
(
    'The Civil Rights Movement of the 1960s primarily used which strategy to create change?',
    '["Armed rebellion", "Nonviolent civil disobedience", "Political lobbying only", "Legal challenges only"]',
    'Nonviolent civil disobedience',
    'Led by figures like Martin Luther King Jr., the movement strategically used nonviolent resistance, sit-ins, marches, and boycotts to expose injustice and create pressure for change.',
    'MLK and others basically perfected the art of making your opponents look bad by staying peaceful while they got violent. Sit-ins, bus boycotts, marches - they broke unjust laws on purpose, went to jail with dignity, and forced America to see how ugly segregation really was. Brilliant strategy.',
    2,
    'civil_rights_history',
    true
),

(
    'The #MeToo movement that gained prominence in 2017 represents which type of social change?',
    '["Legal reform only", "Cultural shift in attitudes about sexual harassment", "Political party formation", "Economic policy change"]',
    'Cultural shift in attitudes about sexual harassment',
    'While #MeToo led to some legal and policy changes, its primary impact was cultural - changing how society talks about, responds to, and believes victims of sexual harassment and assault.',
    'MeToo was less about changing laws and more about changing the conversation. It shifted from "why didn''t she report it?" to "why do we make it so hard for people to report it?" That''s cultural change - when the whole society starts thinking differently about an issue.',
    2,
    'social_movements',
    true
),

(
    'What does "intersectionality" mean in discussions about civil rights?',
    '["People can only face one type of discrimination", "Different forms of discrimination can overlap and compound", "All discrimination is exactly the same", "Only some groups deserve civil rights"]',
    'Different forms of discrimination can overlap and compound',
    'Intersectionality recognizes that people can face multiple, overlapping forms of discrimination based on race, gender, class, sexuality, religion, etc., and that these experiences can''t be understood by looking at each category separately.',
    'It''s like being hit by multiple things at once. A Black woman doesn''t just face racism OR sexism - she faces both at the same time, in ways that are different from what a white woman or a Black man experiences. Intersectionality says you can''t understand discrimination by looking at just one piece at a time.',
    3,
    'civil_rights_theory',
    true
),

-- ECONOMIC CLASS AND OPPORTUNITY
(
    'What does "the American Dream" traditionally promise?',
    '["Everyone will become rich", "Hard work can lead to upward mobility regardless of background", "Success is guaranteed", "Only certain people can succeed"]',
    'Hard work can lead to upward mobility regardless of background',
    'The American Dream is the belief that anyone, regardless of their starting circumstances, can achieve success and prosperity through hard work, determination, and initiative.',
    'The American Dream is basically the promise that it doesn''t matter if your parents were poor - if you work hard enough, you can make it. It''s why people come here from all over the world. Whether that''s actually true anymore is a big debate, but the promise is what makes America feel different from places with rigid class systems.',
    1,
    'economic_opportunity',
    true
),

(
    'Income inequality in America has grown significantly since the 1970s. What''s a major cultural impact of this trend?',
    '["Everyone is happier", "Decreased trust in institutions and \\"the system\\"", "More people support socialism", "Nothing has changed culturally"]',
    'Decreased trust in institutions and "the system"',
    'Growing inequality has contributed to declining trust in government, media, and other institutions as people feel the system isn''t working for them, contributing to political polarization and populist movements.',
    'When the American Dream feels broken, people get angry at the whole system. If working hard doesn''t lead to getting ahead like it used to, people start questioning everything - government, media, experts, you name it. This is part of why we''re seeing so much distrust and anger in politics.',
    3,
    'economic_inequality',
    true
),

(
    'The phrase "temporarily embarrassed millionaires" describes which American phenomenon?',
    '["People who are actually rich", "People who think they''ll be rich someday so they support policies that favor the wealthy", "People who are embarrassed about money", "People who hide their wealth"]',
    'People who think they''ll be rich someday so they support policies that favor the wealthy',
    'This phrase captures how many Americans vote against their current economic interests because they believe they''ll eventually be wealthy and want policies that benefit the rich.',
    'It''s the idea that lots of Americans think they''re just temporarily not-rich yet. So they support tax cuts for millionaires because hey, someday that could be them! It explains why policies that help wealthy people sometimes get support from people who definitely aren''t wealthy.',
    2,
    'economic_psychology',
    true
),

-- REGIONAL AND CULTURAL DIVIDES
(
    'The "red state/blue state" divide roughly corresponds to which cultural split?',
    '["North vs South", "Urban vs rural values and lifestyles", "Rich vs poor", "Young vs old"]',
    'Urban vs rural values and lifestyles',
    'While not perfect, the red/blue divide often reflects differences between urban areas (which tend toward liberal/Democratic values) and rural areas (which tend toward conservative/Republican values).',
    'It''s really more about city vs country than Republican vs Democrat. Cities tend to be more diverse, fast-changing, and liberal. Rural areas tend to be more traditional, close-knit, and conservative. Both ways of life are totally valid, but they produce different political priorities.',
    2,
    'regional_divides',
    true
),

(
    'What does "Rust Belt" refer to in American geography and culture?',
    '["Areas with lots of rain", "Former industrial regions that lost manufacturing jobs", "Places where cars rust quickly", "Agricultural regions"]',
    'Former industrial regions that lost manufacturing jobs',
    'The Rust Belt refers to areas of the Midwest and Northeast that were once industrial powerhouses but lost manufacturing jobs due to automation, globalization, and economic changes.',
    'Think Detroit, Pittsburgh, Cleveland - places that used to make steel and cars and employed whole cities. When those jobs went overseas or got automated, these places got left behind. The "rust" is from all the abandoned factories. These areas have become key political battlegrounds.',
    2,
    'regional_economy',
    true
),

(
    'The cultural concept of "Southern hospitality" reflects which regional value?',
    '["Political conservatism", "Emphasis on personal relationships and courtesy", "Economic prosperity", "Religious fundamentalism"]',
    'Emphasis on personal relationships and courtesy',
    'Southern hospitality emphasizes warmth, courtesy, and taking care of guests and community members, reflecting cultural values around personal relationships and social connection.',
    'It''s the idea that in the South, you treat strangers like family - offer them sweet tea, ask about their folks, make sure they feel welcome. Whether you agree with someone politically or not, you''re still supposed to be polite and hospitable. It''s a real cultural value, even if it doesn''t always match reality.',
    1,
    'regional_culture',
    true
),

-- IMMIGRATION AND DIVERSITY
(
    'The largest group of immigrants to the U.S. today comes from which region?',
    '["Europe", "Latin America", "Asia", "Africa"]',
    'Latin America',
    'While immigration patterns have shifted over time, Latin America (particularly Mexico and Central America) currently represents the largest source of both documented and undocumented immigration to the United States.',
    'Latin America, especially Mexico, sends the most immigrants our way these days. This is pretty different from the early 1900s when most immigrants came from Europe. Immigration patterns change based on economics, politics, and wars in different parts of the world.',
    1,
    'immigration_patterns',
    true
),

(
    'What does it mean when sociologists say America is becoming "majority-minority"?',
    '["Minorities will rule over the majority", "Non-white Americans will outnumber white Americans", "There will be more immigrants than native-born Americans", "Minority opinions will become majority opinions"]',
    'Non-white Americans will outnumber white Americans',
    'Demographic projections suggest that by around 2045, non-Hispanic whites will make up less than 50% of the U.S. population, though they may still be the largest single group.',
    'It sounds confusing, but it just means white Americans will be less than half the population, even though they might still be the biggest single group. It''s like if a classroom had 40% white kids, 25% Latino kids, 20% Black kids, and 15% Asian kids - white kids would still be the biggest group, but not the majority.',
    2,
    'demographics',
    true
),

(
    'The concept of "model minority" most commonly refers to which experience?',
    '["All minorities should copy this group", "Asian Americans being stereotyped as universally successful", "The best way to be a minority", "A perfect example of integration"]',
    'Asian Americans being stereotyped as universally successful',
    'The "model minority" stereotype portrays Asian Americans as universally successful and problem-free, which can harm Asian Americans by ignoring their real struggles and is used to dismiss other minority groups'' experiences with discrimination.',
    'It''s a backhanded compliment that hurts everyone. It pretends all Asian Americans are naturally good at math and never have problems, which isn''t true. Plus it gets used to say "Why can''t other minorities be like them?" - which is really unfair to everyone involved.',
    3,
    'racial_stereotypes',
    true
),

-- RELIGION AND SECULARISM
(
    'The phrase "separation of church and state" comes from:',
    '["The Constitution directly", "A letter by Thomas Jefferson", "A Supreme Court case", "The Declaration of Independence"]',
    'A letter by Thomas Jefferson',
    'While the First Amendment prohibits establishing religion, the phrase "separation of church and state" comes from Jefferson''s 1802 letter to the Danbury Baptists, explaining what the Establishment Clause means.',
    'Plot twist: it''s not actually in the Constitution! Jefferson used this phrase in a letter to explain what he thought the First Amendment meant. But the phrase stuck and now everyone uses it to talk about keeping government and religion separate.',
    2,
    'church_state',
    true
),

(
    'What percentage of Americans identify as religiously unaffiliated ("nones") today?',
    '["About 10%", "About 30%", "About 50%", "About 70%"]',
    'About 30%',
    'Recent surveys show roughly 30% of Americans identify as religiously unaffiliated, including atheists, agnostics, and those who describe their religion as "nothing in particular."',
    'About 3 in 10 Americans don''t identify with any religion - that''s a huge change from 50 years ago when almost everyone claimed some religious affiliation. This shift is especially pronounced among younger Americans and has big implications for politics and culture.',
    2,
    'religious_trends',
    true
),

(
    'The "culture wars" in American politics often center on conflicts between:',
    '["Democrats and Republicans", "Urban and rural areas", "Religious and secular worldviews", "Young and old generations"]',
    'Religious and secular worldviews',
    'Culture wars typically involve conflicts between traditional/religious values and secular/progressive values on issues like abortion, LGBTQ+ rights, education, and family structure.',
    'Culture wars are really about different views of how life should work. Religious folks often want society to reflect traditional moral values, while secular folks want society to be more individualistic and inclusive. Both sides think the other is destroying America.',
    2,
    'culture_wars',
    true
),

-- TECHNOLOGY AND SOCIETY
(
    'Social media''s impact on American democracy has primarily been:',
    '["Entirely positive", "Entirely negative", "Mixed - enabling participation but also spreading misinformation", "No significant impact"]',
    'Mixed - enabling participation but also spreading misinformation',
    'Social media has democratized information sharing and political participation while also creating echo chambers, spreading misinformation, and contributing to political polarization.',
    'Social media is like giving everyone a megaphone - some people use it to organize amazing movements for justice, others use it to spread conspiracy theories. It''s made politics more participatory but also more chaotic. The jury''s still out on whether the net effect is good or bad.',
    2,
    'technology_democracy',
    true
),

(
    'The "digital divide" in America refers to:',
    '["Disagreements about technology policy", "Unequal access to internet and digital technologies", "The split between social media platforms", "Generational differences in tech use"]',
    'Unequal access to internet and digital technologies',
    'The digital divide describes how income, education, geography, and other factors create unequal access to high-speed internet, computers, and digital literacy skills.',
    'It''s like having some neighborhoods with great roads and others with dirt paths. In rural areas or low-income communities, people might not have reliable internet or modern devices, which makes it harder to do everything from homework to job applications. It''s a real barrier to opportunity.',
    2,
    'digital_inequality',
    true
),

(
    'The phrase "cancel culture" typically describes:',
    '["Canceling TV shows", "Boycotting or shunning people for controversial statements or actions", "Canceling political events", "Canceling subscriptions"]',
    'Boycotting or shunning people for controversial statements or actions',
    'Cancel culture refers to the practice of withdrawing support for public figures or companies after they''ve done something considered objectionable, often involving social media campaigns and boycotts.',
    'It''s when someone says or does something people find offensive, and then gets "canceled" - loses jobs, gets uninvited from events, faces social media pile-ons. Some say it''s accountability, others say it''s mob justice. The debate usually splits along the same lines as other culture war issues.',
    2,
    'social_media_culture',
    true
),

-- MEDIA AND INFORMATION LANDSCAPE
(
    'The rise of "alternative facts" and "fake news" claims reflects which broader trend?',
    '["Improved fact-checking", "Declining trust in traditional media and expertise", "Better educated population", "More diverse news sources"]',
    'Declining trust in traditional media and expertise',
    'These phrases reflect growing distrust of mainstream media, experts, and institutions, with different groups believing different sets of "facts" about reality.',
    'We''re living in a world where people can''t even agree on basic facts anymore. When trust in newspapers, scientists, and experts breaks down, everyone starts believing their own version of reality. It''s like playing a game where everyone has different rulebooks.',
    3,
    'information_crisis',
    true
),

(
    'What does "media bubble" or "echo chamber" mean in American politics?',
    '["News studios", "People only hearing information that confirms what they already believe", "Sound effects in media", "Underground news sources"]',
    'People only hearing information that confirms what they already believe',
    'Media bubbles occur when people consume news and information only from sources that confirm their existing beliefs, leading to increased polarization and decreased understanding of different viewpoints.',
    'It''s like only hanging out with people who agree with you about everything. If you only watch Fox News or only read liberal websites, you never hear the other side''s best arguments - just their worst moments. This makes everyone more extreme and less understanding.',
    2,
    'media_polarization',
    true
),

(
    'The business model of most social media platforms is based on:',
    '["Subscription fees", "Government funding", "Advertising revenue driven by user engagement", "Direct sales of products"]',
    'Advertising revenue driven by user engagement',
    'Platforms like Facebook, Twitter, and TikTok make money by selling ads, which means they''re incentivized to keep users engaged as long as possible, often through sensational or polarizing content.',
    'Social media companies make money by keeping your eyeballs glued to your screen so they can show you ads. Angry, outraged, or scared content keeps people scrolling longer than happy, boring content. So the algorithm feeds us whatever keeps us engaged - even if it''s making us miserable or misinformed.',
    3,
    'social_media_economics',
    true
),

-- GENERATIONAL AND CULTURAL CHANGE
(
    'The biggest generational divide in American politics today is often between:',
    '["Baby Boomers and everyone younger", "Millennials and Gen Z", "Gen X and Millennials", "Silent Generation and Baby Boomers"]',
    'Baby Boomers and everyone younger',
    'While there are differences between all generations, the biggest political and cultural divide tends to be between Baby Boomers (born 1946-1964) and younger generations on issues like climate change, diversity, and role of government.',
    'Boomers grew up during the Cold War and economic prosperity, while younger generations face climate change, student debt, and economic uncertainty. These different experiences create different priorities - Boomers often worry about big government, while younger folks often want government to solve big problems.',
    2,
    'generational_politics',
    true
),

(
    'What does "OK Boomer" represent culturally?',
    '["Respect for elders", "Generational frustration with dismissive attitudes toward young people''s concerns", "Agreement with older generations", "A neutral greeting"]',
    'Generational frustration with dismissive attitudes toward young people''s concerns',
    '"OK Boomer" became a way for younger generations to dismiss what they see as out-of-touch or condescending attitudes from older generations, particularly on issues like climate change and economic opportunity.',
    'It''s basically young people''s way of saying "you just don''t get it" to older folks who dismiss their concerns. When a young person talks about climate change or student debt and gets told they''re just whining, "OK Boomer" is the eye-roll response.',
    1,
    'generational_conflict',
    true
),

(
    'The concept of "adulting" among Millennials reflects:',
    '["Being more mature than previous generations", "Struggling with tasks previous generations took for granted", "Refusing to grow up", "Being obsessed with adult responsibilities"]',
    'Struggling with tasks previous generations took for granted',
    'The term "adulting" reflects how traditional markers of adulthood (buying homes, starting families, achieving financial independence) have become more difficult to achieve for younger generations.',
    'When basic adult milestones like buying a house or paying off student loans feel impossible, even mundane tasks like doing taxes or making doctor appointments become worthy of celebration. "Adulting" captures how hard it is to reach traditional markers of grown-up success.',
    2,
    'millennial_experience',
    true
),

-- HISTORICAL MEMORY AND MYTHOLOGY
(
    'The idea that America was "founded as a Christian nation" is:',
    '["Completely accurate", "Partially true - many founders were Christian but created secular government", "Completely false", "Impossible to determine"]',
    'Partially true - many founders were Christian but created secular government',
    'While many founders were Christians and Christian ideas influenced American culture, the Constitution explicitly creates a secular government with no religious tests and prohibits establishing an official religion.',
    'It''s complicated! Many founders were Christians and Christian ideas influenced American culture, but they specifically designed a government without an official religion. They wanted to protect both religious freedom and prevent religious wars that had torn apart Europe.',
    3,
    'founding_mythology',
    true
),

(
    'The phrase "Make America Great Again" appeals to which psychological concept?',
    '["Future optimism", "Nostalgia for an idealized past", "Present satisfaction", "Fear of the future"]',
    'Nostalgia for an idealized past',
    'MAGA appeals to nostalgia - the belief that America was better in some previous era and can return to that state, though people disagree about which era and whether it was actually better for everyone.',
    'MAGA is pure nostalgia politics - the idea that there was some golden age when America was better, and we can go back to it. The tricky part is that the "good old days" were usually only good for some people, not others. But nostalgia is a powerful political force.',
    2,
    'political_nostalgia',
    true
),

(
    'The "Lost Cause" narrative about the Civil War claimed that:',
    '["The North was wrong to fight", "The South fought for states'' rights, not slavery", "Slavery was actually good", "The war never really ended"]',
    'The South fought for states'' rights, not slavery',
    'The Lost Cause mythology, promoted after the Civil War, falsely claimed the conflict was about states'' rights rather than slavery, helping justify Jim Crow laws and Confederate monuments.',
    'This is historical whitewashing at its worst. The Lost Cause story tried to make the Confederacy seem noble by claiming it wasn''t really about slavery. But Confederate documents clearly show they were fighting to preserve slavery. This myth helped justify segregation for another century.',
    3,
    'historical_revisionism',
    true
),

-- CONTEMPORARY SOCIAL ISSUES
(
    'The Black Lives Matter movement primarily focuses on:',
    '["Economic inequality only", "Police brutality and systemic racism", "Political representation only", "Educational issues only"]',
    'Police brutality and systemic racism',
    'While BLM addresses various issues, its primary focus has been on police violence against Black Americans and broader systemic racism in criminal justice and other institutions.',
    'BLM started as a response to police killings of Black people, but it''s grown into a broader movement about how racism shows up in all kinds of systems - housing, healthcare, education, you name it. The goal is making "Black lives matter" not just a slogan but a reality.',
    2,
    'racial_justice',
    true
),

(
    'The phrase "defund the police" generally means:',
    '["Eliminate all police departments", "Reduce police budgets and invest in social services", "Give police more money", "Privatize police forces"]',
    'Reduce police budgets and invest in social services',
    'While interpretations vary, "defund the police" typically means shifting some funding from police departments to education, mental health services, and other programs that might prevent crime.',
    'It''s a slogan that''s been misunderstood by pretty much everyone. Most people saying "defund the police" don''t want to eliminate cops entirely - they want to spend some of that money on teachers, social workers, and mental health programs that might prevent crime in the first place.',
    2,
    'police_reform',
    true
),

(
    'The opioid crisis has most severely affected which communities?',
    '["Urban communities only", "Rural and working-class communities", "Wealthy suburban communities only", "College communities only"]',
    'Rural and working-class communities',
    'While opioid addiction affects all communities, rural and working-class areas have been disproportionately impacted, contributing to decreased life expectancy and economic problems in these regions.',
    'The opioid crisis hit hardest in places that were already struggling economically - former industrial towns, rural areas, working-class communities. It''s a big reason why life expectancy actually went down in America for a few years, which almost never happens in developed countries.',
    2,
    'public_health',
    true
),

-- CULTURAL SYMBOLS AND MEANINGS
(
    'Kneeling during the national anthem at sporting events was meant to protest:',
    '["The military", "America in general", "Police brutality and racial injustice", "The flag itself"]',
    'Police brutality and racial injustice',
    'Colin Kaepernick and others knelt during the anthem specifically to draw attention to police violence and racial inequality, not to disrespect the military or flag.',
    'Colin Kaepernick actually talked to a military veteran about how to protest respectfully, and they decided kneeling was more respectful than sitting. The whole point was to say "I love this country, but we need to do better on racial justice." Of course, not everyone saw it that way.',
    2,
    'protest_symbolism',
    true
),

(
    'The Confederate flag controversy represents a conflict between:',
    '["North vs South", "Different interpretations of history and symbols", "Republican vs Democrat", "Old vs young"]',
    'Different interpretations of history and symbols',
    'Some see the Confederate flag as representing Southern heritage and history, while others see it as a symbol of slavery and white supremacy, reflecting broader disagreements about how to remember difficult history.',
    'It''s a perfect example of how the same symbol can mean totally different things to different people. Some folks see Southern heritage and family history, others see slavery and oppression. Both feelings are real, which makes it such a difficult issue to resolve.',
    2,
    'symbolic_conflict',
    true
),

(
    'The Statue of Liberty''s inscription "Give me your tired, your poor" reflects which American ideal?',
    '["Economic prosperity", "Military strength", "Welcoming immigrants", "Religious freedom"]',
    'Welcoming immigrants',
    'Emma Lazarus''s poem on the Statue of Liberty expresses the ideal of America as a refuge for people seeking better lives, though this ideal has often conflicted with actual immigration policies.',
    'Lady Liberty basically says "send us your struggling masses and we''ll give them a chance." It''s a beautiful ideal that represents America at its best - the idea that anyone can come here and build a better life. Whether we live up to that ideal is an ongoing debate.',
    1,
    'immigration_ideals',
    true
),

-- CONTEMPORARY POLITICAL CULTURE
(
    'Political polarization in America means:',
    '["Everyone agrees on everything", "Democrats and Republicans have moved further apart ideologically", "There are more political parties", "Politics is less important"]',
    'Democrats and Republicans have moved further apart ideologically',
    'Polarization refers to how the two major parties have become more ideologically distinct and their supporters more hostile to each other, with fewer people in the ideological middle.',
    'Americans used to have liberal Republicans and conservative Democrats, but now the parties are sorted much more cleanly. Republicans are consistently conservative, Democrats are consistently liberal, and there''s way less overlap. This makes compromise much harder.',
    2,
    'political_polarization',
    true
),

(
    'The term "woke" originally meant:',
    '["Being awake in the morning", "Being alert to racial injustice", "Being politically liberal", "Being anti-conservative"]',
    'Being alert to racial injustice',
    'Originally used in Black communities, "woke" meant being aware of racial prejudice and discrimination. It''s since been adopted more broadly and often used ironically or as a political attack.',
    '"Woke" started as Black slang for staying alert to racism - like "stay woke" meant don''t let people fool you about discrimination. Then it got adopted by everyone, then it became a political insult. Now it means whatever the person using it wants it to mean.',
    2,
    'political_language',
    true
),

-- =========================================================
-- ADDITIONAL 50 QUESTIONS - EXPANDING CIVIC KNOWLEDGE
-- =========================================================

-- MODERN CIVIC ENGAGEMENT AND TECHNOLOGY
(
    'Your city wants to build a new highway through your neighborhood. What''s the most effective way to influence the decision?',
    '["Post angry comments on social media", "Attend city planning meetings and bring neighbors", "Write a letter to the President", "Start a petition online only"]',
    'Attend city planning meetings and bring neighbors',
    'Local government decisions are made through formal processes like planning meetings and public hearings. Showing up with other affected residents demonstrates organized community concern.',
    'Show up where decisions actually get made! City planning meetings might be boring, but that''s where the real power is. Bringing neighbors shows you''re not just one angry person - you represent a community. Social media posts don''t vote on zoning permits.',
    2,
    'civic_engagement',
    true
),

(
    'Social media companies like Facebook and Twitter can ban users because:',
    '["They violate the First Amendment", "They are private companies, not the government", "They are regulated like public utilities", "They have government contracts"]',
    'They are private companies, not the government',
    'The First Amendment only prohibits government censorship, not private company content moderation. Private platforms can set their own rules about what content they allow.',
    'Plot twist: the First Amendment doesn''t apply to private companies! It only stops the government from censoring you. Facebook, Twitter, and others are private businesses that can kick you out just like a restaurant can refuse service. Whether they should is a different debate.',
    2,
    'digital_rights',
    true
),

(
    'You want to fact-check a viral news story. What''s your best first step?',
    '["Share it and ask friends what they think", "Check if other news sources are reporting the same story", "Look for the original source or document", "Wait to see if it gets debunked"]',
    'Look for the original source or document',
    'The best fact-checking starts with primary sources - the actual document, study, or statement being discussed rather than interpretations or summaries.',
    'Go to the source! If someone claims "a new study shows..." find the actual study. If they say "the mayor announced..." find the mayor''s actual statement. Secondary sources can spin, misinterpret, or get things wrong. Primary sources tell you what actually happened.',
    2,
    'media_literacy',
    true
),

-- ECONOMIC POLICY AND UNDERSTANDING
(
    'When politicians promise to "bring back manufacturing jobs," what economic reality do they face?',
    '["Manufacturing is completely dead in America", "Many manufacturing jobs have been automated away", "Foreign workers are taking all the jobs", "Manufacturing only exists in China now"]',
    'Many manufacturing jobs have been automated away',
    'While some manufacturing moved overseas, automation and robotics have eliminated many jobs that once required human workers, making it difficult to simply "bring back" the same number of jobs.',
    'Here''s the tough truth: robots took a lot more jobs than trade deals did. Modern factories produce more stuff with way fewer workers than in the 1970s. You can bring back manufacturing, but you can''t bring back all the manufacturing jobs - machines do much of that work now.',
    3,
    'economic_policy',
    true
),

(
    'Universal Basic Income (UBI) is the idea that:',
    '["Only unemployed people get money", "Everyone gets a basic income from the government", "Only rich people pay taxes", "Government controls all wages"]',
    'Everyone gets a basic income from the government',
    'UBI proposes giving all citizens a regular, unconditional cash payment from the government, regardless of employment status, as a social safety net.',
    'UBI is like giving everyone an allowance from the government - rich, poor, working, or not working. The idea is that it would replace welfare systems and give people basic security. Some love it, others think it''s too expensive or would make people lazy.',
    2,
    'economic_policy',
    true
),

(
    'The phrase "trickle-down economics" refers to the theory that:',
    '["Poor people should work harder", "Tax cuts for the wealthy will eventually benefit everyone", "Money flows upward naturally", "Government should control the economy"]',
    'Tax cuts for the wealthy will eventually benefit everyone',
    'Trickle-down theory suggests that tax cuts and benefits for wealthy people and businesses will eventually benefit everyone as the wealthy spend and invest their extra money.',
    'The idea is that if you give rich people and businesses more money through tax cuts, they''ll spend it and create jobs, and eventually everyone benefits. Critics say it''s more like "trickle-up" - the rich get richer but benefits don''t reach regular people as promised.',
    2,
    'economic_theory',
    true
),

-- ENVIRONMENTAL POLICY AND CLIMATE CHANGE
(
    'The Paris Climate Agreement is:',
    '["A binding international law", "A voluntary agreement where countries set their own goals", "A trade agreement", "A military alliance"]',
    'A voluntary agreement where countries set their own goals',
    'The Paris Agreement is a voluntary international framework where countries commit to reducing greenhouse gas emissions, but each nation sets its own targets and there are no enforcement mechanisms.',
    'Paris is more like a group promise than a binding contract. Countries agree to try to limit climate change and set their own goals for reducing emissions, but there''s no climate police to enforce it. It''s peer pressure on a global scale.',
    2,
    'environmental_policy',
    true
),

(
    'A "carbon tax" would:',
    '["Ban all carbon emissions", "Make companies pay for their carbon emissions", "Give money to oil companies", "Require everyone to drive electric cars"]',
    'Make companies pay for their carbon emissions',
    'A carbon tax puts a price on carbon emissions, making companies and individuals pay for the environmental cost of their carbon footprint, theoretically encouraging cleaner alternatives.',
    'Think of it as a pollution fee. Companies that emit more carbon pay more taxes, which should encourage them to find cleaner ways to do business. It''s like charging extra for a bigger environmental footprint - the market decides how to respond.',
    2,
    'environmental_policy',
    true
),

-- HEALTHCARE POLICY
(
    '"Medicare for All" typically means:',
    '["Only elderly people get healthcare", "Government-run healthcare for everyone", "Private insurance for everyone", "Free healthcare only for the poor"]',
    'Government-run healthcare for everyone',
    'Medicare for All proposals generally involve expanding the existing Medicare system to cover all Americans, replacing private insurance with a single government-run program.',
    'It''s basically taking Medicare (the government health insurance for seniors) and giving it to everyone. Instead of getting insurance through your job or buying it yourself, everyone would get government health insurance. Supporters say it''s simpler and cheaper; critics worry about government control and costs.',
    2,
    'healthcare_policy',
    true
),

(
    'The main reason American healthcare costs more than other countries is:',
    '["Americans are sicker", "We have better technology", "Our system has more administrative complexity and higher prices", "We have more doctors"]',
    'Our system has more administrative complexity and higher prices',
    'Studies show American healthcare is expensive primarily due to higher prices for the same services and complex administrative systems, not necessarily better outcomes.',
    'We basically pay more for the same stuff. An MRI that costs $1,000 in Germany costs $3,000 here. Plus, our system is incredibly complex - insurance companies, billing departments, prior authorizations. All that bureaucracy costs money, and guess who pays for it?',
    3,
    'healthcare_policy',
    true
),

-- IMMIGRATION POLICY
(
    'The difference between a refugee and an immigrant is:',
    '["Refugees are temporary, immigrants are permanent", "Refugees flee persecution, immigrants choose to move", "There is no difference", "Refugees come from specific countries only"]',
    'Refugees flee persecution, immigrants choose to move',
    'Refugees are people who flee their home countries due to persecution, war, or violence and cannot safely return. Immigrants choose to move for various reasons including economic opportunity.',
    'Refugees don''t have a choice - they''re running from danger. Immigrants choose to move for better opportunities, to join family, or other reasons. It''s the difference between fleeing a burning building and deciding to move to a nicer neighborhood.',
    1,
    'immigration_policy',
    true
),

(
    'The process to become a U.S. citizen typically takes:',
    '["6 months", "1-2 years", "5-10 years or more", "It depends on which country you''re from"]',
    '5-10 years or more',
    'The path to citizenship usually involves getting a green card first (which can take years), then waiting 5 years as a permanent resident before applying for citizenship, plus processing time.',
    'It''s a marathon, not a sprint. First you need to get a green card (permanent residence), which can take years depending on your situation. Then you wait 5 years as a permanent resident before you can even apply for citizenship. The whole process often takes a decade or more.',
    2,
    'immigration_policy',
    true
),

-- CRIMINAL JUSTICE SYSTEM
(
    'The main difference between jail and prison is:',
    '["Jail is for minor crimes, prison is for major crimes", "Jail is short-term and local, prison is long-term and state/federal", "There is no difference", "Jail is for young people, prison is for adults"]',
    'Jail is short-term and local, prison is long-term and state/federal',
    'Jails are typically run by local governments and hold people awaiting trial or serving short sentences. Prisons are run by state or federal governments for longer sentences.',
    'Think of jail as the short-term holding area and prison as the long-term facility. Jail is where you go when you''re arrested and waiting for trial, or if you get a sentence of less than a year. Prison is for the longer sentences after you''ve been convicted.',
    1,
    'criminal_justice',
    true
),

(
    'Plea bargaining means:',
    '["The defendant pleads not guilty", "The defendant negotiates a deal to avoid trial", "The judge decides the sentence", "The jury decides guilt or innocence"]',
    'The defendant negotiates a deal to avoid trial',
    'Plea bargaining is when prosecutors and defendants negotiate an agreement where the defendant pleads guilty to a lesser charge or receives a lighter sentence in exchange for avoiding trial.',
    'It''s basically a legal deal: "plead guilty to this lesser charge and get a lighter sentence, or risk going to trial and potentially getting a harsher punishment." About 95% of criminal cases end in plea bargains rather than trials. It saves time and money, but critics worry it pressures innocent people to plead guilty.',
    2,
    'criminal_justice',
    true
),

-- EDUCATION POLICY
(
    'School vouchers are:',
    '["Government payments to public schools", "Certificates parents can use to pay for private schools", "Free lunch programs", "Teacher salary supplements"]',
    'Certificates parents can use to pay for private schools',
    'School vouchers give parents government money that can be used to pay tuition at private schools instead of sending their children to public schools.',
    'Think of vouchers like government coupons for private school. Instead of your tax money going to the local public school, you get a voucher worth a certain amount that you can use toward private school tuition. Supporters say it gives parents choice; critics worry it undermines public schools.',
    2,
    'education_policy',
    true
),

(
    'The achievement gap in education refers to:',
    '["The difference between boys and girls", "Persistent differences in academic performance between racial and economic groups", "The gap between American and international students", "The difference between public and private schools"]',
    'Persistent differences in academic performance between racial and economic groups',
    'The achievement gap describes how students from different racial and socioeconomic backgrounds consistently perform differently on standardized tests and other academic measures.',
    'It''s the stubborn fact that on average, white and Asian students score higher on tests than Black and Latino students, and wealthy students score higher than poor students. This gap has persisted for decades despite various efforts to close it, reflecting deeper inequalities in society.',
    2,
    'education_policy',
    true
),

-- FOREIGN POLICY BASICS
(
    'NATO is:',
    '["A trade agreement", "A military alliance", "A United Nations agency", "An economic union"]',
    'A military alliance',
    'NATO (North Atlantic Treaty Organization) is a military alliance where member countries agree that an attack on one member is an attack on all members.',
    'NATO is basically a group of countries that promise to have each other''s backs militarily. If Russia attacks Poland, all NATO members (including the U.S.) are supposed to help defend Poland. It was created during the Cold War and has been expanding eastward ever since.',
    1,
    'foreign_policy',
    true
),

(
    'The main purpose of foreign aid is:',
    '["To make other countries dependent on America", "To promote development, security, and American interests", "To get rid of excess money", "To control other governments"]',
    'To promote development, security, and American interests',
    'Foreign aid serves multiple purposes: humanitarian assistance, promoting economic development, advancing security interests, and building relationships that benefit American foreign policy goals.',
    'Foreign aid is part charity, part strategic investment. We help other countries develop and stay stable, which can prevent conflicts, create trading partners, and build goodwill. It''s like being a good neighbor - you help because it''s right, but also because stable neighbors make your own life better.',
    2,
    'foreign_policy',
    true
),

-- SUPREME COURT AND LEGAL SYSTEM
(
    'When the Supreme Court refuses to hear a case, it means:',
    '["They agree with the lower court decision", "They disagree with the lower court decision", "The lower court decision stands, but the Supreme Court hasn''t ruled on the issue", "The case was not important enough"]',
    'The lower court decision stands, but the Supreme Court hasn''t ruled on the issue',
    'When the Supreme Court denies certiorari (refuses to hear a case), the lower court''s decision remains in effect, but this doesn''t indicate the Supreme Court''s opinion on the merits.',
    'Refusing to hear a case doesn''t mean they agree or disagree - it just means they''re not taking it up. The lower court decision stands, but only for that specific case and jurisdiction. The Supreme Court gets thousands of requests each year and only hears about 60-80 cases.',
    3,
    'legal_system',
    true
),

(
    'A "living Constitution" interpretation means:',
    '["The Constitution changes automatically", "Constitutional meaning can evolve with society", "Only modern laws matter", "The Constitution should be rewritten regularly"]',
    'Constitutional meaning can evolve with society',
    'Living Constitution theory suggests that constitutional interpretation should adapt to changing social conditions and modern understanding, rather than being fixed to the original meaning.',
    'It''s the idea that the Constitution should grow and change with society. A "living Constitution" person might say the founders couldn''t have imagined the internet, so we need to apply constitutional principles to new situations. "Originalists" disagree and want to stick to what the founders meant.',
    3,
    'constitutional_interpretation',
    true
),

-- STATE AND LOCAL GOVERNMENT
(
    'Your state legislature meets for only 3 months every two years. This is called:',
    '["A part-time legislature", "An inefficient system", "A professional legislature", "A broken system"]',
    'A part-time legislature',
    'Many states have part-time or "citizen" legislatures where members have other jobs and meet for limited periods, as opposed to full-time professional legislatures.',
    'Some states treat their legislatures like part-time jobs - members are farmers, teachers, or business owners who come to the capital for a few months to make laws, then go back to their regular lives. Texas famously meets for just 140 days every two years. The idea is to keep government limited and legislators connected to regular life.',
    2,
    'state_government',
    true
),

(
    'Home rule for cities means:',
    '["Cities can make their own laws without state approval", "Homeowners control city government", "Cities must follow all state laws exactly", "Only property owners can vote in city elections"]',
    'Cities can make their own laws without state approval',
    'Home rule gives cities the authority to govern themselves and make local laws without needing specific permission from the state government for each action.',
    'Home rule is like giving cities permission to be adults. Instead of having to ask the state government "Mother, may I?" for every local decision, cities can make their own rules about things like zoning, business licenses, and local taxes. Not all states give their cities this much freedom.',
    2,
    'local_government',
    true
),

-- POLITICAL PARTIES AND ELECTIONS
(
    'An "open primary" means:',
    '["Anyone can vote in any party''s primary", "Primaries are held in public places", "Primary results are made public", "Voters must declare their party affiliation"]',
    'Anyone can vote in any party''s primary',
    'In open primaries, voters can choose which party''s primary to vote in regardless of their own party registration, unlike closed primaries which require party membership.',
    'Open primaries let you vote in whichever party primary you want, regardless of your own party registration. So if you''re a Democrat but the Republican primary has more interesting races, you can vote there instead. Some states do this, others require you to stick to your own party.',
    2,
    'election_systems',
    true
),

(
    'Gerrymandering is:',
    '["Drawing district lines to benefit one party", "A type of voting machine", "Voter registration fraud", "Counting votes incorrectly"]',
    'Drawing district lines to benefit one party',
    'Gerrymandering is the practice of drawing electoral district boundaries to give one political party an advantage over another.',
    'Gerrymandering is basically cheating with maps. Politicians draw voting district lines in weird shapes to pack their opponents'' voters into a few districts or spread them thin across many districts. The result? One party can win more seats even with fewer total votes. Both parties do it when they get the chance.',
    2,
    'election_systems',
    true
),

-- BUDGET AND TAXATION
(
    'A progressive tax system means:',
    '["Tax rates increase with income", "Taxes support progressive causes", "Tax rates decrease with income", "Everyone pays the same rate"]',
    'Tax rates increase with income',
    'In a progressive tax system, people with higher incomes pay higher tax rates, while those with lower incomes pay lower rates.',
    'Progressive taxation is like a sliding scale - the more you make, the higher percentage you pay. Someone making $30,000 might pay 10% while someone making $300,000 pays 35%. The idea is that wealthy people can afford to pay a higher rate. Flat tax supporters disagree and want everyone to pay the same percentage.',
    2,
    'taxation',
    true
),

(
    'The federal government''s biggest expense is:',
    '["Defense spending", "Social Security and Medicare", "Interest on the debt", "Education"]',
    'Social Security and Medicare',
    'Social Security and Medicare (healthcare for seniors) together make up the largest portion of federal spending, more than defense or any other category.',
    'Surprise! It''s not the military - it''s taking care of seniors. Social Security and Medicare eat up the biggest chunk of the federal budget because we have a lot of retired people and healthcare is expensive. This is why politicians worry about the "aging population" - more retirees means higher costs.',
    2,
    'federal_budget',
    true
),

-- CIVIC KNOWLEDGE AND PARTICIPATION
(
    'The most effective way to influence your Representative''s vote on a bill is:',
    '["Posting on their social media", "Calling their office with a specific ask", "Sending a form letter email", "Protesting outside their house"]',
    'Calling their office with a specific ask',
    'Congressional offices track phone calls and consider them a strong indicator of constituent opinion. A specific, polite call is usually more effective than social media posts or form letters.',
    'Phone calls still work! Congressional offices count calls and take them seriously because calling requires more effort than clicking "like" or signing an online petition. Be polite, be specific about what you want them to do, and be brief. Angry rants don''t help your cause.',
    2,
    'civic_engagement',
    true
),

(
    'If you want to run for city council, the first thing you should do is:',
    '["Start raising money", "Learn about local issues and meet community leaders", "Hire a campaign manager", "Create social media accounts"]',
    'Learn about local issues and meet community leaders',
    'Successful local campaigns start with understanding community needs and building relationships with people who are already engaged in local issues.',
    'Local politics is all about relationships and knowing the issues that actually matter to your neighbors. Before you worry about fundraising or campaign tactics, you need to understand what problems need solving and who the key players are. Door-to-door conversations beat TV ads in local races.',
    2,
    'civic_engagement',
    true
),

-- MEDIA AND DEMOCRACY
(
    'The main difference between news reporting and opinion journalism is:',
    '["News is always true, opinion is always false", "News reports facts, opinion interprets and argues", "There is no difference anymore", "News is free, opinion costs money"]',
    'News reports facts, opinion interprets and argues',
    'News reporting aims to present factual information objectively, while opinion journalism presents analysis, interpretation, and arguments based on those facts.',
    'Think of news as "what happened" and opinion as "what I think about what happened." Good news reporting tells you the facts and lets you decide what to think. Opinion pieces tell you what the writer thinks you should think about those facts. Both are valuable, but you need to know which is which.',
    2,
    'media_literacy',
    true
),

(
    'When a news story cites "anonymous sources," it usually means:',
    '["The story is probably fake", "Sources agreed to provide information but not be named publicly", "The reporter made up the information", "The sources don''t exist"]',
    'Sources agreed to provide information but not be named publicly',
    'Anonymous sources are real people who provide information to journalists but don''t want their names published, often because they fear retaliation or are not authorized to speak publicly.',
    'Anonymous sources are real people who have good reasons to stay unnamed - they might get fired, face legal trouble, or put themselves in danger if their names were published. Good journalists verify anonymous information with multiple sources and editors know who the sources are, even if readers don''t.',
    2,
    'media_literacy',
    true
),

-- =========================================================
-- ADDITIONAL QUESTIONS TO REACH 10+ PER THEME
-- =========================================================

-- ELECTIONS & VOTING (Need 2 more to reach 10)
(
    'Ranked choice voting means:',
    '["Voters rank candidates in order of preference", "Only ranked officials can vote", "Votes are counted multiple times", "Candidates are ranked by popularity"]',
    'Voters rank candidates in order of preference',
    'In ranked choice voting, voters rank candidates 1st, 2nd, 3rd choice, etc. If no candidate gets a majority, the lowest vote-getter is eliminated and their voters'' second choices are redistributed until someone has a majority.',
    'Think of it like picking your top 3 pizza toppings in order. If your first choice (pepperoni) isn''t available, they''ll give you your second choice (sausage). It lets you vote for who you really want without "wasting" your vote on someone who can''t win.',
    2,
    'voting_systems',
    true
),

(
    'What is voter suppression?',
    '["Making voting easier for everyone", "Efforts to prevent eligible people from voting", "Encouraging more people to vote", "Counting votes multiple times"]',
    'Efforts to prevent eligible people from voting',
    'Voter suppression includes tactics like closing polling places in certain neighborhoods, requiring hard-to-get IDs, purging voter rolls, or spreading false information about voting dates and locations.',
    'It''s basically making it harder for certain people to vote, often targeting communities that might vote for the "wrong" candidate. Think of it like moving the basketball hoop higher for one team - technically both teams can still play, but one side has an unfair disadvantage.',
    2,
    'voting_rights',
    true
),

-- ECONOMIC POLICY (Need 2 more to reach 10)
(
    'What does "fiscal policy" mean?',
    '["How the government spends and taxes", "How banks set interest rates", "How companies set prices", "How workers negotiate wages"]',
    'How the government spends and taxes',
    'Fiscal policy refers to government decisions about spending (like infrastructure projects) and taxation (like income tax rates) to influence the economy.',
    'Fiscal policy is the government''s way of steering the economy using two big levers: the spending lever (build more roads? hire more teachers?) and the tax lever (raise taxes? cut taxes?). It''s like driving a car with a gas pedal (spending) and brakes (taxes).',
    2,
    'economic_policy',
    true
),

(
    'The national debt is:',
    '["Money the government owes", "Money citizens owe the government", "The total value of everything in America", "Money other countries owe us"]',
    'Money the government owes',
    'The national debt is the total amount of money the federal government has borrowed and still owes to creditors, including individuals, institutions, and other countries.',
    'Think of it like the government''s credit card balance - except it''s about $33 trillion. The government borrows money by selling bonds to pay for things like roads, defense, and Social Security when tax revenue isn''t enough to cover expenses.',
    2,
    'federal_budget',
    true
),

-- MEDIA & INFORMATION (Need 3 more to reach 10)
(
    'What is "astroturfing" in politics?',
    '["Fake grassroots movements funded by corporations or wealthy interests", "Installing artificial grass", "Real grassroots organizing", "Environmental activism"]',
    'Fake grassroots movements funded by corporations or wealthy interests',
    'Astroturfing creates the appearance of genuine grassroots support when it''s actually funded and organized by corporations, political groups, or wealthy individuals to advance their agenda.',
    'It''s fake grassroots that looks real - like AstroTurf looks like grass but isn''t. A "Citizens for Clean Air" group that sounds like concerned neighbors but is actually funded by an oil company? That''s astroturfing. Real grassroots grows from the bottom up; astroturf is manufactured from the top down.',
    3,
    'media_literacy',
    true
),

(
    'The difference between misinformation and disinformation is:',
    '["There is no difference", "Misinformation is accidental, disinformation is intentional", "Misinformation is worse than disinformation", "Misinformation comes from media, disinformation from government"]',
    'Misinformation is accidental, disinformation is intentional',
    'Misinformation is false information spread without malicious intent, while disinformation is deliberately created and spread to deceive people.',
    'Think of misinformation like accidentally giving someone wrong directions because you''re confused about the route. Disinformation is like intentionally giving someone wrong directions to make them late for something important. Same bad outcome, different intent.',
    2,
    'information_crisis',
    true
),

(
    'What makes a news source credible?',
    '["It agrees with your political views", "It has editorial standards, fact-checking, and corrections policies", "It''s popular on social media", "It''s been around for a long time"]',
    'It has editorial standards, fact-checking, and corrections policies',
    'Credible news sources have editorial standards, verify information before publishing, clearly separate news from opinion, cite sources, and issue corrections when they make mistakes.',
    'A credible news source is like a good restaurant - they have standards for their ingredients (sources), trained chefs (journalists), quality control (editors), and if they mess up your order, they''ll fix it and apologize. Popularity doesn''t equal credibility.',
    2,
    'media_literacy',
    true
),

-- REGIONAL & DEMOGRAPHIC DIVIDES (Need 3 more to reach 10)
(
    'The "Sun Belt" refers to:',
    '["States with the most sunny days", "Southern and southwestern states that gained population and political power", "States with solar energy", "Beach states"]',
    'Southern and southwestern states that gained population and political power',
    'The Sun Belt includes states from Florida to California that experienced rapid population growth, economic development, and increased political influence starting in the mid-20th century.',
    'The Sun Belt is where Americans have been moving for decades - think Florida, Texas, Arizona, Nevada. These states got more people, more jobs, more electoral votes, and more political clout. It''s like the country''s center of gravity shifted south and west.',
    2,
    'regional_economy',
    true
),

(
    'What is "white flight"?',
    '["White people moving to diverse neighborhoods", "The historical pattern of white residents leaving cities as Black families moved in", "White people avoiding airplane travel", "White people leaving the country"]',
    'The historical pattern of white residents leaving cities as Black families moved in',
    'White flight describes the large-scale migration of white residents from urban areas to suburbs, often triggered by racial integration and demographic changes in cities.',
    'White flight was like a domino effect - as Black families moved into previously all-white neighborhoods (often due to discriminatory housing policies finally being challenged), many white families moved to the suburbs. This drained cities of tax revenue and investment, creating many of the urban problems we still see today.',
    3,
    'demographics',
    true
),

(
    'The term "food desert" describes:',
    '["Areas with no restaurants", "Places where crops won''t grow", "Areas with limited access to affordable, nutritious food", "Very dry regions"]',
    'Areas with limited access to affordable, nutritious food',
    'Food deserts are typically low-income areas where residents have limited access to supermarkets or grocery stores that sell fresh, affordable, and nutritious food.',
    'A food desert isn''t about sand and cacti - it''s about being surrounded by fast food and convenience stores but having no real grocery store within walking distance or affordable transportation. It''s like living in a place where the only "food" is gas station snacks and McDonald''s.',
    2,
    'regional_divides',
    true
),

-- CIVIC ENGAGEMENT & PARTICIPATION (Need 4 more to reach 10)
(
    'The best time to contact your Representative about a bill is:',
    '["After they''ve already voted", "While they''re still deciding how to vote", "Only during election season", "Never - they don''t listen anyway"]',
    'While they''re still deciding how to vote',
    'Representatives are most influenced by constituent contact when they haven''t yet made up their minds on an issue. Once they''ve committed to a position, it''s much harder to change their vote.',
    'Timing is everything! It''s like trying to change someone''s mind about where to go for dinner - much easier before they''ve already made the reservation. Call while the bill is in committee or before the vote, not after they''ve already decided.',
    2,
    'civic_engagement',
    true
),

(
    'What is a town hall meeting?',
    '["A meeting to plan town construction", "An open public meeting where officials answer questions from constituents", "A meeting only for town employees", "A historical reenactment"]',
    'An open public meeting where officials answer questions from constituents',
    'Town halls are public forums where elected officials meet with constituents to discuss issues, answer questions, and hear concerns directly from the people they represent.',
    'Think of a town hall as democracy''s version of office hours. Your Representative shows up, you get to ask them questions face-to-face, and they have to answer in front of everyone. It''s one of the few times politicians can''t hide behind press releases or staff.',
    1,
    'civic_engagement',
    true
),

(
    'What does it mean to "lobby" the government?',
    '["To wait in government building lobbies", "To try to influence government officials on specific issues", "To protest outside government buildings", "To run for office"]',
    'To try to influence government officials on specific issues',
    'Lobbying involves meeting with government officials to provide information and advocate for specific policies or positions on behalf of organizations, industries, or causes.',
    'Lobbying is basically professional persuasion. Lobbyists are like salespeople, except instead of selling cars, they''re selling ideas to politicians. "Hey Senator, here''s why you should vote for this environmental bill..." That''s lobbying. It''s legal, regulated, and happens constantly.',
    2,
    'civic_engagement',
    true
),

(
    'How can you find out how your Representative voted on a specific bill?',
    '["You can''t - votes are secret", "Check their campaign website", "Look up congressional voting records online", "Ask them personally"]',
    'Look up congressional voting records online',
    'Congressional votes are public record and can be found on websites like Congress.gov, GovTrack.us, or your Representative''s official website.',
    'Democracy is supposed to be transparent! Every congressional vote is public record - you can literally look up how your Representative voted on every single bill. Websites like GovTrack make it super easy. No excuses for not knowing where your rep stands.',
    1,
    'civic_engagement',
    true
),

-- SOCIAL MOVEMENTS & JUSTICE (Need 4 more to reach 10)
(
    'What was the Stonewall Riots'' significance?',
    '["Started the modern LGBTQ+ rights movement", "Ended segregation", "Started the women''s rights movement", "Had no lasting impact"]',
    'Started the modern LGBTQ+ rights movement',
    'The 1969 Stonewall Riots in New York City marked a turning point when LGBTQ+ people fought back against police harassment, sparking the modern gay rights movement and annual Pride celebrations.',
    'Stonewall was like the Boston Tea Party for LGBTQ+ rights. After years of police raids and harassment at gay bars, people finally said "enough" and fought back. It turned a community that had been hiding into a movement that would change the world. That''s why we have Pride parades in June.',
    2,
    'social_movements',
    true
),

(
    'The Americans with Disabilities Act (ADA) requires:',
    '["Free healthcare for disabled people", "Public places to be accessible to people with disabilities", "Special schools for disabled children", "Disabled people to register with the government"]',
    'Public places to be accessible to people with disabilities',
    'The ADA mandates that public accommodations, employment, transportation, and telecommunications be accessible to people with disabilities.',
    'The ADA basically said "if you''re open to the public, you need to be open to ALL the public." Ramps, elevators, accessible bathrooms, sign language interpreters - it''s about making sure disability doesn''t mean exclusion. It''s civil rights for people with disabilities.',
    2,
    'civil_rights_history',
    true
),

(
    'What is "environmental justice"?',
    '["Punishing people who pollute", "Ensuring all communities have equal protection from environmental hazards", "Only caring about nature, not people", "Environmental laws that are fair to businesses"]',
    'Ensuring all communities have equal protection from environmental hazards',
    'Environmental justice addresses how environmental hazards disproportionately affect low-income communities and communities of color, seeking equal protection and meaningful involvement in environmental decisions.',
    'Environmental justice recognizes that pollution doesn''t affect everyone equally. Poor communities and communities of color often get stuck with the toxic waste dumps, polluting factories, and contaminated water. It''s about making sure clean air and water aren''t luxuries for rich neighborhoods only.',
    3,
    'racial_justice',
    true
),

(
    'What does "solidarity" mean in social movements?',
    '["Being alone in your struggle", "Different groups supporting each other''s causes", "Only caring about your own group", "Competing with other movements"]',
    'Different groups supporting each other''s causes',
    'Solidarity involves different groups or movements supporting each other, recognizing that their struggles for justice are interconnected.',
    'Solidarity is like saying "your fight is my fight." When labor unions support civil rights movements, or when LGBTQ+ groups support immigrant rights - that''s solidarity. It''s the idea that injustice anywhere affects justice everywhere, so we''re stronger when we work together.',
    2,
    'social_movements',
    true
),

-- TECHNOLOGY & MODERN SOCIETY (Need 5 more to reach 10)
(
    'What is "net neutrality"?',
    '["Making the internet free for everyone", "Treating all internet traffic equally", "Censoring harmful content online", "Only allowing neutral political content"]',
    'Treating all internet traffic equally',
    'Net neutrality requires internet service providers to treat all internet traffic equally, without blocking, slowing down, or prioritizing certain websites or content.',
    'Net neutrality is like making sure the highway doesn''t have a "rich people only" fast lane. Your internet provider can''t slow down Netflix because they want you to use their streaming service instead, or charge extra for you to access certain websites. All data gets treated equally.',
    2,
    'digital_rights',
    true
),

(
    'What are "deepfakes"?',
    '["Very realistic fake videos created using AI", "Videos filmed underwater", "Videos that are very emotional", "Videos that are hard to understand"]',
    'Very realistic fake videos created using AI',
    'Deepfakes use artificial intelligence to create convincing fake videos where people appear to say or do things they never actually did.',
    'Deepfakes are like digital puppetry on steroids. AI can now put anyone''s face on anyone else''s body and make them say anything. Imagine a video of the President declaring war, except it''s completely fake but looks totally real. That''s the scary power of deepfakes.',
    3,
    'technology_democracy',
    true
),

(
    'What is "surveillance capitalism"?',
    '["Government spying on citizens", "Companies making money by collecting and selling personal data", "Using cameras to prevent theft", "Capitalism that watches movies"]',
    'Companies making money by collecting and selling personal data',
    'Surveillance capitalism describes how tech companies collect vast amounts of personal data from users to create detailed profiles for targeted advertising and other commercial purposes.',
    'Surveillance capitalism is when your personal life becomes someone else''s business model. Google, Facebook, and others offer "free" services but make billions by tracking everything you do online and selling that information to advertisers. You''re not the customer - you''re the product being sold.',
    3,
    'digital_inequality',
    true
),

(
    'What does "algorithmic bias" mean?',
    '["Computer programs that are intentionally unfair", "AI systems that reflect or amplify human prejudices", "Algorithms that are too complicated", "Computer viruses that spread bias"]',
    'AI systems that reflect or amplify human prejudices',
    'Algorithmic bias occurs when AI systems produce discriminatory results due to biased training data or flawed design, often disadvantaging certain groups.',
    'Algorithmic bias is like teaching a robot to be prejudiced without meaning to. If you train an AI on biased data (like historical hiring practices that favored men), the AI will learn to be biased too. The computer isn''t intentionally sexist, but it learned from sexist humans.',
    3,
    'technology_democracy',
    true
),

(
    'What is "digital redlining"?',
    '["Drawing red lines on digital maps", "Unequal access to high-speed internet based on neighborhood demographics", "Marking dangerous websites in red", "Digital art with red lines"]',
    'Unequal access to high-speed internet based on neighborhood demographics',
    'Digital redlining refers to the practice of providing different levels of internet service to different neighborhoods, often leaving low-income and minority communities with slower, more expensive internet access.',
    'Digital redlining is old-school discrimination with new technology. Just like banks used to refuse loans in certain neighborhoods (literally drawing red lines on maps), internet companies now provide slower, more expensive service to poor and minority communities. Same discrimination, different decade.',
    3,
    'digital_inequality',
    true
),

-- POLITICAL CULTURE (Need 5 more to reach 10)
(
    'What does "virtue signaling" mean in politics?',
    '["Demonstrating moral values through actions", "Expressing opinions primarily to appear morally superior rather than create change", "Using sign language", "Supporting virtuous candidates"]',
    'Expressing opinions primarily to appear morally superior rather than create change',
    'Virtue signaling refers to publicly expressing opinions or taking positions primarily to demonstrate good character or moral correctness rather than to effect meaningful change.',
    'Virtue signaling is like posting "thoughts and prayers" after a tragedy but never actually doing anything to help. It''s when someone''s more interested in looking good than doing good. The criticism is that it''s performative morality - all show, no substance.',
    2,
    'political_language',
    true
),

(
    'What is "political tribalism"?',
    '["Politics based on Native American tribes", "Treating political parties like competing tribes rather than policy differences", "Rural vs urban politics", "Family political traditions"]',
    'Treating political parties like competing tribes rather than policy differences',
    'Political tribalism occurs when people identify so strongly with their political party that they view politics as us-vs-them warfare rather than disagreements about policy.',
    'Political tribalism is when your party becomes your tribe and the other party becomes your enemy. Instead of "I disagree with their healthcare policy," it becomes "They''re evil and everything they do is wrong." It''s like turning politics into a sports rivalry where you hate the other team no matter what.',
    2,
    'political_polarization',
    true
),

(
    'What does "gaslighting" mean in politics?',
    '["Using gas-powered lighting", "Making someone question their own perception of reality", "Lighting up political rallies", "Burning campaign materials"]',
    'Making someone question their own perception of reality',
    'Political gaslighting involves repeatedly denying or distorting facts to make people doubt their own memory, perception, or judgment about political events.',
    'Gaslighting is like someone moving your keys and then insisting you''re crazy for thinking they moved them. In politics, it''s when someone says "I never said that" about something they said on video, or "that never happened" about something everyone witnessed. It''s designed to make you doubt your own sanity.',
    3,
    'political_language',
    true
),

(
    'What is "astroturfing" in political campaigns?',
    '["Installing artificial grass at campaign events", "Creating fake grassroots support", "Outdoor campaigning", "Environmental campaign themes"]',
    'Creating fake grassroots support',
    'Political astroturfing involves creating artificial grassroots movements or campaigns that appear to be organic citizen efforts but are actually funded and organized by political operatives or special interests.',
    'Campaign astroturfing is fake grassroots politics. Instead of real citizens organizing because they care about an issue, it''s paid operatives creating fake "citizen groups" with names like "Moms for Better Schools" that are actually funded by corporate interests. It''s political theater pretending to be authentic democracy.',
    3,
    'political_culture',
    true
),

(
    'What does "political capital" mean?',
    '["Money used in campaigns", "The influence and goodwill a politician has to advance their agenda", "The city where government meets", "Campaign headquarters"]',
    'The influence and goodwill a politician has to advance their agenda',
    'Political capital refers to the trust, goodwill, and influence a politician has built up that they can "spend" to get things done, especially on controversial issues.',
    'Political capital is like having a reputation bank account. When you do popular things or win big elections, you build up capital. When you want to do something risky or unpopular, you "spend" that capital. A president with high approval ratings has lots of political capital to spend on big changes.',
    2,
    'political_culture',
    true
)

-- =========================================================
-- END OF COMPREHENSIVE ASSESSMENT
-- =========================================================

COMMENT ON TABLE assessment_questions IS 'Comprehensive civic education assessment questions covering citizenship test through advanced civic knowledge, plus American culture, identity, and sociopolitical knowledge - written in CivicSense brand voice with real examples';