import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@civicsense/shared/lib/supabase';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enhanced sample questions for civic knowledge with CivicSense conversational style
const COMPREHENSIVE_SAMPLE_QUESTIONS = [
  // Government Structure & Processes - Level 1
  {
    id: 'cs_gov_1',
    question: 'You\'re watching the news and they mention "Congress passed a bill." What happens next before it becomes law?',
    options: ['It automatically becomes law', 'The President must sign it', 'The Supreme Court must approve it', 'State governments must ratify it'],
    correctAnswer: 'The President must sign it',
    explanation: 'After Congress passes a bill, it goes to the President who can either sign it into law or veto it. If vetoed, Congress can override with a two-thirds majority in both chambers.',
    friendlyExplanation: 'Think of it like a relay race! Congress passes the baton (bill) to the President, who can either run it across the finish line (sign it) or drop it (veto it). If they drop it, Congress can still carry it across if two-thirds of both chambers really want to.',
    difficulty: 1,
    category: 'government_structure',
    skill_id: 'basic_civics'
  },
  {
    id: 'cs_gov_2',
    question: 'Your friend says "I\'m voting for my Representative this year." How often do they get this chance?',
    options: ['Every year', 'Every 2 years', 'Every 4 years', 'Every 6 years'],
    correctAnswer: 'Every 2 years',
    explanation: 'House Representatives serve 2-year terms, so there\'s an election every even-numbered year.',
    friendlyExplanation: 'Every 2 years! House reps are like your favorite TV show—constantly worried about renewal. This keeps them pretty responsive to what their viewers (voters) want, unlike Senators who get 6-year deals.',
    difficulty: 1,
    category: 'elections',
    skill_id: 'basic_civics'
  },
  {
    id: 'cs_const_1',
    question: 'Someone tells you "the government can\'t stop me from saying what I want." Which amendment protects this right?',
    options: ['First Amendment', 'Second Amendment', 'Fourth Amendment', 'Fifth Amendment'],
    correctAnswer: 'First Amendment',
    explanation: 'The First Amendment protects freedom of speech, along with religion, press, assembly, and petition.',
    friendlyExplanation: 'First Amendment! It\'s like the greatest hits album of American freedoms: speech, religion, press, assembly, and petition. Though remember, even freedom of speech has some limits—you still can\'t yell "fire" in a crowded theater.',
    difficulty: 1,
    category: 'constitution',
    skill_id: 'constitutional_rights'
  },
  
  // Level 2 - Intermediate Understanding
  {
    id: 'cs_gov_3',
    question: 'A federal judge strikes down a state law as "unconstitutional." What power allows them to do this?',
    options: ['Executive privilege', 'Judicial review', 'Legislative oversight', 'Federal supremacy'],
    correctAnswer: 'Judicial review',
    explanation: 'Judicial review lets courts examine laws and government actions to see if they violate the Constitution. This power isn\'t explicitly written in the Constitution—the Supreme Court established it in Marbury v. Madison (1803).',
    friendlyExplanation: 'Judicial review is like having a Constitutional fact-checker! Courts can say "hold up, that law violates the Constitution." The founders didn\'t explicitly write this power in, but the Supreme Court claimed it in 1803 and everyone went along with it.',
    difficulty: 2,
    category: 'government_structure',
    skill_id: 'separation_of_powers'
  },
  {
    id: 'cs_fed_1',
    question: 'Your state wants to raise the drinking age to 25, but the federal government wants it at 21. What\'s most likely to happen?',
    options: ['Federal law automatically wins', 'State law takes precedence', 'They negotiate a compromise', 'Federal government threatens to withhold highway funding'],
    correctAnswer: 'Federal government threatens to withhold highway funding',
    explanation: 'This actually happened! The federal government can\'t directly force states to set drinking ages, but they can withhold federal highway funding from states that don\'t comply.',
    friendlyExplanation: 'Classic federal move! They can\'t directly boss states around on many issues, but they can say "nice highways you have there... would be a shame if something happened to that funding." It\'s how we got nationwide speed limits and drinking ages.',
    difficulty: 2,
    category: 'federalism',
    skill_id: 'federal_state_relations'
  },
  {
    id: 'cs_leg_1',
    question: 'You hear that a bill "died in committee." What does this mean?',
    options: ['The committee voted against it', 'It ran out of time', 'Committee members refused to consider it', 'Any of these could happen'],
    correctAnswer: 'Any of these could happen',
    explanation: 'Bills can "die" in committees several ways: the committee votes it down, the chair never schedules a hearing, or time runs out in the legislative session.',
    friendlyExplanation: 'Committee purgatory is real! Most bills never make it out alive. Think of committees as the bouncer at the club—they decide what gets to party on the floor and what gets left outside in the cold.',
    difficulty: 2,
    category: 'legislative_process',
    skill_id: 'how_bills_become_laws'
  },

  // Media Literacy Questions
  {
    id: 'cs_media_1',
    question: 'You see a news story with no author listed and no publication date. What should you do first?',
    options: ['Share it if it confirms what you believe', 'Look for the same story from a known news source', 'Assume it\'s fake news', 'Check if your friends shared it'],
    correctAnswer: 'Look for the same story from a known news source',
    explanation: 'Anonymous or undated content is a red flag. Before sharing anything, verify it through established news sources with editorial standards.',
    friendlyExplanation: 'Red flag alert! No author + no date = time to fact-check. Real news organizations put their names on stories because they stand behind their reporting.',
    difficulty: 1,
    category: 'media_literacy',
    skill_id: 'source_evaluation'
  },
  {
    id: 'cs_media_2',
    question: 'A headline reads: "SHOCKING: Local School Board Makes CONTROVERSIAL Decision!" What does this language suggest?',
    options: ['The story is especially important', 'The story is designed to grab attention', 'The school board did something illegal', 'The story is from a local newspaper'],
    correctAnswer: 'The story is designed to grab attention',
    explanation: 'Words like "SHOCKING" and "CONTROVERSIAL" in all caps are designed to trigger emotional responses and get clicks.',
    friendlyExplanation: 'Clickbait alert! All caps words like "SHOCKING" are designed to make you feel something and click immediately. Quality journalism usually avoids sensational language and lets the facts speak for themselves.',
    difficulty: 1,
    category: 'media_literacy',
    skill_id: 'source_evaluation'
  },
  {
    id: 'cs_media_3',
    question: 'Two news outlets report the same event differently. One says "protesters gathered" while the other says "crowds assembled." What\'s happening?',
    options: ['One outlet is lying', 'They\'re describing different events', 'They\'re using different framing', 'One outlet is more accurate'],
    correctAnswer: 'They\'re using different framing',
    explanation: 'Word choice matters! "Protesters" suggests organized dissent, while "crowds" sounds more neutral. Both might be factually accurate but create different impressions.',
    friendlyExplanation: 'Word choice is everything! "Protesters" makes you think of organized dissent, while "crowds" sounds more neutral. Both could be describing the same people, but they\'re painting different pictures in your head.',
    difficulty: 2,
    category: 'media_literacy',
    skill_id: 'media_bias_recognition'
  },

  // Civic Engagement Questions
  {
    id: 'cs_civic_1',
    question: 'You want to influence a local issue like a new park. Who should you contact first?',
    options: ['Your state representative', 'The mayor', 'Your city council member', 'The governor'],
    correctAnswer: 'Your city council member',
    explanation: 'Local issues are usually handled by local government! City councils typically manage parks, zoning, and neighborhood issues.',
    friendlyExplanation: 'Start local for local issues! Your city council member is like your neighborhood\'s representative in local government. They\'re the ones who actually vote on park funding and zoning decisions.',
    difficulty: 1,
    category: 'civic_engagement',
    skill_id: 'local_participation'
  },
  {
    id: 'cs_civic_2',
    question: 'Voting aside, what\'s the most direct way for citizens to participate in lawmaking?',
    options: ['Writing letters to newspapers', 'Attending public hearings', 'Joining political parties', 'Donating to campaigns'],
    correctAnswer: 'Attending public hearings',
    explanation: 'Public hearings let you speak directly to the people making decisions! Most government bodies hold hearings where citizens can testify.',
    friendlyExplanation: 'Show up and speak up! Public hearings are like open mic night for democracy—you get to speak directly to the people making the decisions. Your voice carries more weight when you show up in person.',
    difficulty: 1,
    category: 'civic_engagement',
    skill_id: 'democratic_participation'
  },
  {
    id: 'cs_civic_3',
    question: 'You\'re meeting with your Representative about an issue. What\'s the most persuasive approach?',
    options: ['Tell them how you feel personally', 'Explain how it affects their constituents', 'Mention you voted for them', 'Threaten to vote against them'],
    correctAnswer: 'Explain how it affects their constituents',
    explanation: 'Representatives care most about how issues affect the people they represent. Personal stories are powerful, but showing broader constituent impact proves political importance.',
    friendlyExplanation: 'Think like a Representative! They want to know how issues affect all the people they represent, not just one person. Come with specific examples from your district and you\'ll get their attention.',
    difficulty: 2,
    category: 'civic_engagement',
    skill_id: 'effective_advocacy'
  },

  // Advanced Level 3 Questions
  {
    id: 'cs_gov_4',
    question: 'A presidential candidate promises to "eliminate the Department of Education on Day One." What would actually be required to do this?',
    options: ['Presidential executive order', 'Supreme Court ruling', 'Congressional approval', 'State government consent'],
    correctAnswer: 'Congressional approval',
    explanation: 'Only Congress can eliminate federal departments since they control government structure and spending. The President can\'t unilaterally abolish departments.',
    friendlyExplanation: 'Nice try, but that\'s not how it works! Only Congress can eliminate federal departments because they\'re the ones who created them and fund them. The President can propose it and make departments less effective, but can\'t just delete them with an executive order.',
    difficulty: 3,
    category: 'government_structure',
    skill_id: 'executive_limitations'
  },
  {
    id: 'cs_const_2',
    question: 'Your city council wants to ban a specific type of business. A business owner sues, claiming it violates the "Equal Protection Clause." What are they arguing?',
    options: ['The ban applies to everyone equally', 'The ban targets their business specifically', 'The ban treats similar businesses differently without good reason', 'The ban violates their right to free speech'],
    correctAnswer: 'The ban treats similar businesses differently without good reason',
    explanation: 'Equal Protection means the government can\'t treat similar people or businesses differently without a valid reason. If the law singles out one type of business while allowing similar ones, that could violate equal protection.',
    friendlyExplanation: 'Equal protection is about fairness! If the city is treating similar businesses differently without a good reason (like banning food trucks but allowing hot dog stands), that\'s potentially unconstitutional discrimination.',
    difficulty: 3,
    category: 'constitution',
    skill_id: 'equal_protection'
  },

  // Keep some of your original questions for compatibility
  {
    id: 'q1',
    question: 'Which branch of government is responsible for interpreting laws?',
    options: ['Executive', 'Legislative', 'Judicial', 'Administrative'],
    correctAnswer: 'Judicial',
    explanation: 'The Judicial branch, headed by the Supreme Court, interprets laws and determines if they are constitutional.',
    difficulty: 1,
    category: 'government_structure',
    skill_id: 'basic_civics'
  },
  {
    id: 'q2',
    question: 'What is the term length for a U.S. Senator?',
    options: ['2 years', '4 years', '6 years', '8 years'],
    correctAnswer: '6 years',
    explanation: 'U.S. Senators serve six-year terms, with about one-third of the Senate up for election every two years.',
    difficulty: 1,
    category: 'elections',
    skill_id: 'basic_civics'
  },
  {
    id: 'q3',
    question: 'Which of these is NOT protected by the First Amendment?',
    options: ['Freedom of speech', 'Freedom of religion', 'Right to bear arms', 'Freedom of assembly'],
    correctAnswer: 'Right to bear arms',
    explanation: 'The right to bear arms is protected by the Second Amendment, not the First Amendment.',
    difficulty: 2,
    category: 'constitution',
    skill_id: 'constitutional_rights'
  },
  {
    id: 'q4',
    question: 'What is the purpose of checks and balances in the U.S. government?',
    options: [
      'To ensure one branch of government doesn\'t become too powerful',
      'To make sure all laws are fair',
      'To balance the federal budget',
      'To check that all citizens are treated equally'
    ],
    correctAnswer: 'To ensure one branch of government doesn\'t become too powerful',
    explanation: 'Checks and balances allow each branch of government to limit the powers of the other branches, preventing any single branch from becoming too powerful.',
    difficulty: 2,
    category: 'government_structure',
    skill_id: 'separation_of_powers'
  },
  {
    id: 'q5',
    question: 'Which of these is an example of a primary source for news?',
    options: [
      'A newspaper article summarizing an event',
      'A tweet from someone who witnessed the event',
      'An opinion piece analyzing the event',
      'A history book mentioning the event'
    ],
    correctAnswer: 'A tweet from someone who witnessed the event',
    explanation: 'Primary sources are direct, firsthand accounts of events, like eyewitness testimonies, original documents, or direct recordings.',
    difficulty: 2,
    category: 'media_literacy',
    skill_id: 'source_evaluation'
  }
];

// Transform database question to match API format
function transformDatabaseQuestion(dbQuestion: any) {
  return {
    id: dbQuestion.id,
    question: dbQuestion.question,
    options: Array.isArray(dbQuestion.options) ? dbQuestion.options : JSON.parse(dbQuestion.options || '[]'),
    correctAnswer: dbQuestion.correct_answer,
    explanation: dbQuestion.explanation,
    friendlyExplanation: dbQuestion.friendly_explanation,
    difficulty: dbQuestion.difficulty,
    category: dbQuestion.category,
    skill_id: dbQuestion.skill_id
  };
}

// Get balanced mix of questions for initial assessment
function getBalancedQuestions(questions: any[], count: number) {
  const level1Count = Math.ceil(count * 0.4); // 40% beginner
  const level2Count = Math.ceil(count * 0.4); // 40% intermediate  
  const level3Count = count - level1Count - level2Count; // 20% advanced

  const level1Questions = questions.filter(q => q.difficulty === 1).slice(0, level1Count);
  const level2Questions = questions.filter(q => q.difficulty === 2).slice(0, level2Count);
  const level3Questions = questions.filter(q => q.difficulty === 3).slice(0, level3Count);

  // Combine and shuffle
  const balancedQuestions = [...level1Questions, ...level2Questions, ...level3Questions];
  return balancedQuestions.sort(() => Math.random() - 0.5);
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const skillId = searchParams.get('skill_id');
    const difficulty = searchParams.get('difficulty');
    const count = parseInt(searchParams.get('count') || '8', 10);
    const adaptive = searchParams.get('adaptive') === 'true';
    const balanced = searchParams.get('balanced') === 'true';
    const categories = searchParams.get('categories') ? JSON.parse(searchParams.get('categories')!) : [];
    
    let questions: any[] = [];
    
    try {
      // Try to fetch questions from the database first
      let query = supabase
        .from('assessment_questions')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }
      
      if (categories.length > 0) {
        // TODO: Optimize with junction table approach for better performance
        // Similar to app/api/topics/search/route.ts implementation
        query = query.in('category', categories);
      }
      
      if (skillId) {
        query = query.eq('skill_id', skillId);
      }
      
      if (difficulty) {
        query = query.eq('difficulty', parseInt(difficulty, 10));
      }

      query = query.order('created_at', { ascending: false }).limit(count * 2); // Get more than needed for selection

      const { data: dbQuestions, error } = await query;
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Transform database questions to API format
      if (dbQuestions && dbQuestions.length > 0) {
        questions = dbQuestions.map(transformDatabaseQuestion);
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      questions = []; // Will fall back to sample questions
    }
    
    // If no database questions, use comprehensive sample questions
    if (questions.length === 0) {
      console.log('Using sample questions as fallback');
      questions = COMPREHENSIVE_SAMPLE_QUESTIONS.filter(q => {
        let match = true;
        
        if (category && q.category !== category) {
          match = false;
        }
        
        if (categories.length > 0 && !categories.includes(q.category)) {
          match = false;
        }
        
        if (skillId && q.skill_id !== skillId) {
          match = false;
        }
        
        if (difficulty && q.difficulty !== parseInt(difficulty, 10)) {
          match = false;
        }
        
        return match;
      });
    }

    // Apply question selection strategy
    let selectedQuestions = [];
    
    if (balanced || adaptive) {
      // For balanced assessment, get a good mix of difficulties
      selectedQuestions = getBalancedQuestions(questions, count);
    } else {
      // For regular requests, just slice the requested count
      selectedQuestions = questions.slice(0, count);
    }

    // Ensure we have at least some questions
    if (selectedQuestions.length === 0 && questions.length > 0) {
      selectedQuestions = questions.slice(0, Math.min(count, questions.length));
    }

    // Final fallback if we still have no questions
    if (selectedQuestions.length === 0) {
      selectedQuestions = COMPREHENSIVE_SAMPLE_QUESTIONS.slice(0, 5);
    }

    return NextResponse.json({ 
      questions: selectedQuestions,
      total: selectedQuestions.length,
      source: questions.length > 0 && questions[0].id?.startsWith('cs_') ? 'sample' : 'database',
      balanced: balanced || adaptive
    });

  } catch (error) {
    console.error('Error in assessment questions API:', error);
    
    // Emergency fallback - return basic questions
    const emergencyQuestions = COMPREHENSIVE_SAMPLE_QUESTIONS.slice(0, 5);
    
    return NextResponse.json({
      questions: emergencyQuestions,
      total: emergencyQuestions.length,
      source: 'emergency_fallback',
      error: 'Database unavailable, using fallback questions'
    });
  }
}

// POST endpoint for adaptive question selection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      performance,
      answeredQuestions = [],
      targetDifficulty = 2,
      categories = [],
      excludeQuestions = []
    } = body;

    let questions: any[] = [];
    
    try {
      // Try database first
      let query = supabase
        .from('assessment_questions')
        .select('*')
        .eq('is_active', true)
        .eq('difficulty', targetDifficulty);

      // Exclude already answered questions
      const allExcluded = [...answeredQuestions, ...excludeQuestions];
      if (allExcluded.length > 0) {
        query = query.not('id', 'in', `(${allExcluded.map(id => `'${id}'`).join(',')})`);
      }

      // Focus on specific categories if provided
      if (categories.length > 0) {
        // TODO: Optimize with junction table approach for better performance
        // Similar to app/api/topics/search/route.ts implementation
        query = query.in('category', categories);
      }

      const { data: dbQuestions, error } = await query.limit(10);
      
      if (error) throw error;
      
      if (dbQuestions && dbQuestions.length > 0) {
        questions = dbQuestions.map(transformDatabaseQuestion);
      }
    } catch (dbError) {
      console.error('Database error in adaptive selection:', dbError);
    }

    // Fallback to sample questions
    if (questions.length === 0) {
      questions = COMPREHENSIVE_SAMPLE_QUESTIONS.filter(q => {
        if (q.difficulty !== targetDifficulty) return false;
        if (answeredQuestions.includes(q.id) || excludeQuestions.includes(q.id)) return false;
        if (categories.length > 0 && !categories.includes(q.category)) return false;
        return true;
      });
    }

    if (questions.length === 0) {
      return NextResponse.json({
        question: null,
        message: 'No more questions available for the specified criteria'
      });
    }

    // Select a random question from the filtered results
    const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];

    return NextResponse.json({
      question: selectedQuestion,
      adaptive: true,
      performance: performance,
      targetDifficulty: targetDifficulty
    });

  } catch (error) {
    console.error('Error in adaptive question selection:', error);
    return NextResponse.json(
      { error: 'Failed to select adaptive question' },
      { status: 500 }
    );
  }
}