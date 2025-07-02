import type { CivicsTestQuestion } from '../types/civics-test';

export const CIVICS_TEST_QUESTIONS: CivicsTestQuestion[] = [
  // American Government Questions
  {
    id: '1',
    question: 'What is the supreme law of the land?',
    topic: 'American Government',
    correctAnswer: 'the Constitution',
    possibleAnswers: [
      'the Constitution',
      'the Declaration of Independence',
      'the Bill of Rights',
      'the Articles of Confederation'
    ],
    allowPartialCredit: true,
    acceptableVariations: ['Constitution', 'U.S. Constitution', 'United States Constitution'],
    difficulty: 'easy',
    category: 'Principles of American Democracy'
  },
  {
    id: '2',
    question: 'What does the Constitution do?',
    topic: 'American Government',
    correctAnswer: 'sets up the government',
    possibleAnswers: [
      'sets up the government',
      'defines the government',
      'protects basic rights of Americans',
      'all of the above'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'defines the government',
      'protects basic rights of Americans',
      'establishes the government'
    ],
    difficulty: 'medium',
    category: 'Principles of American Democracy'
  },
  {
    id: '3',
    question: 'How many amendments does the Constitution have?',
    topic: 'American Government',
    correctAnswer: '27',
    possibleAnswers: ['10', '21', '27', '31'],
    allowPartialCredit: false,
    acceptableVariations: ['twenty-seven', '27 amendments'],
    difficulty: 'medium',
    category: 'System of Government'
  },
  {
    id: '4',
    question: 'What are the two parts of the U.S. Congress?',
    topic: 'American Government',
    correctAnswer: 'the Senate and House of Representatives',
    possibleAnswers: [
      'the Senate and House of Representatives',
      'the House of Lords and House of Commons',
      'the Upper House and Lower House',
      'Democrats and Republicans'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'Senate and House',
      'House and Senate',
      'the House and the Senate'
    ],
    difficulty: 'easy',
    category: 'System of Government'
  },
  {
    id: '5',
    question: 'How many U.S. Senators are there?',
    topic: 'American Government',
    correctAnswer: '100',
    possibleAnswers: ['50', '100', '435', '538'],
    allowPartialCredit: false,
    acceptableVariations: ['one hundred', '100 senators'],
    difficulty: 'easy',
    category: 'System of Government'
  },
  {
    id: '6',
    question: 'We elect a U.S. Senator for how many years?',
    topic: 'American Government',
    correctAnswer: '6',
    possibleAnswers: ['2', '4', '6', '8'],
    allowPartialCredit: false,
    acceptableVariations: ['six', '6 years', 'six years'],
    difficulty: 'medium',
    category: 'System of Government'
  },
  {
    id: '7',
    question: 'Who is one of your state\'s U.S. Senators now?',
    topic: 'American Government',
    correctAnswer: 'Answers will vary',
    possibleAnswers: ['Answers will vary by state'],
    allowPartialCredit: true,
    difficulty: 'hard',
    category: 'System of Government'
  },
  {
    id: '8',
    question: 'The House of Representatives has how many voting members?',
    topic: 'American Government',
    correctAnswer: '435',
    possibleAnswers: ['100', '200', '435', '538'],
    allowPartialCredit: false,
    acceptableVariations: ['four hundred thirty-five', '435 members'],
    difficulty: 'medium',
    category: 'System of Government'
  },
  {
    id: '9',
    question: 'We elect a U.S. Representative for how many years?',
    topic: 'American Government',
    correctAnswer: '2',
    possibleAnswers: ['2', '4', '6', '8'],
    allowPartialCredit: false,
    acceptableVariations: ['two', '2 years', 'two years'],
    difficulty: 'easy',
    category: 'System of Government'
  },
  {
    id: '10',
    question: 'Who does a U.S. Senator represent?',
    topic: 'American Government',
    correctAnswer: 'all people of the state',
    possibleAnswers: [
      'all people of the state',
      'the state government',
      'only the people who voted for them',
      'their political party'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'everyone in the state',
      'the entire state',
      'all citizens of the state'
    ],
    difficulty: 'medium',
    category: 'System of Government'
  },
  
  // American History Questions
  {
    id: '11',
    question: 'What is one reason colonists came to America?',
    topic: 'American History',
    correctAnswer: 'freedom',
    possibleAnswers: [
      'freedom',
      'political liberty',
      'religious freedom',
      'economic opportunity'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'political liberty',
      'religious freedom',
      'economic opportunity',
      'escape persecution',
      'practice their religion'
    ],
    difficulty: 'easy',
    category: 'Colonial Period and Independence'
  },
  {
    id: '12',
    question: 'Who wrote the Declaration of Independence?',
    topic: 'American History',
    correctAnswer: 'Thomas Jefferson',
    possibleAnswers: [
      'Thomas Jefferson',
      'George Washington',
      'John Adams',
      'Benjamin Franklin'
    ],
    allowPartialCredit: false,
    acceptableVariations: ['Jefferson'],
    difficulty: 'easy',
    category: 'Colonial Period and Independence'
  },
  {
    id: '13',
    question: 'When was the Declaration of Independence adopted?',
    topic: 'American History',
    correctAnswer: 'July 4, 1776',
    possibleAnswers: [
      'July 4, 1776',
      'July 4, 1774',
      'July 4, 1778',
      'July 4, 1787'
    ],
    allowPartialCredit: true,
    acceptableVariations: ['July 4th, 1776', 'July fourth, seventeen seventy-six'],
    difficulty: 'medium',
    category: 'Colonial Period and Independence'
  },
  {
    id: '14',
    question: 'Who was the first President?',
    topic: 'American History',
    correctAnswer: 'George Washington',
    possibleAnswers: [
      'George Washington',
      'John Adams',
      'Thomas Jefferson',
      'Abraham Lincoln'
    ],
    allowPartialCredit: false,
    acceptableVariations: ['Washington'],
    difficulty: 'easy',
    category: '1800s'
  },
  {
    id: '15',
    question: 'What territory did the United States buy from France in 1803?',
    topic: 'American History',
    correctAnswer: 'the Louisiana Territory',
    possibleAnswers: [
      'the Louisiana Territory',
      'Alaska',
      'Florida',
      'Texas'
    ],
    allowPartialCredit: true,
    acceptableVariations: ['Louisiana', 'Louisiana Purchase'],
    difficulty: 'medium',
    category: '1800s'
  },
  
  // Integrated Civics Questions
  {
    id: '16',
    question: 'Name one branch or part of the government.',
    topic: 'Integrated Civics',
    correctAnswer: 'Congress',
    possibleAnswers: [
      'Congress',
      'legislative',
      'President',
      'executive',
      'the courts',
      'judicial'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'legislative',
      'executive',
      'judicial',
      'President',
      'the courts',
      'Senate',
      'House of Representatives'
    ],
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '17',
    question: 'What is the capital of the United States?',
    topic: 'Integrated Civics',
    correctAnswer: 'Washington, D.C.',
    possibleAnswers: [
      'Washington, D.C.',
      'New York City',
      'Los Angeles',
      'Philadelphia'
    ],
    allowPartialCredit: true,
    acceptableVariations: ['Washington', 'D.C.', 'Washington D.C.', 'DC'],
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '18',
    question: 'Where is the Statue of Liberty?',
    topic: 'Integrated Civics',
    correctAnswer: 'New York Harbor',
    possibleAnswers: [
      'New York Harbor',
      'Liberty Island',
      'New York',
      'New Jersey'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'New York',
      'Liberty Island',
      'New York/New Jersey',
      'Ellis Island'
    ],
    difficulty: 'easy',
    category: 'Symbols'
  },
  {
    id: '19',
    question: 'Why does the flag have 13 stripes?',
    topic: 'Integrated Civics',
    correctAnswer: 'because there were 13 original colonies',
    possibleAnswers: [
      'because there were 13 original colonies',
      'because the stripes represent the original colonies',
      'to honor the first 13 states',
      'because of the 13 founding fathers'
    ],
    allowPartialCredit: true,
    acceptableVariations: [
      'the stripes represent the original colonies',
      '13 original colonies',
      'thirteen colonies'
    ],
    difficulty: 'medium',
    category: 'Symbols'
  },
  {
    id: '20',
    question: 'When do we celebrate Independence Day?',
    topic: 'Integrated Civics',
    correctAnswer: 'July 4',
    possibleAnswers: [
      'July 4',
      'July 14',
      'June 4',
      'January 1'
    ],
    allowPartialCredit: true,
    acceptableVariations: ['July 4th', 'Fourth of July', 'July fourth'],
    difficulty: 'easy',
    category: 'Holidays'
  }
]; 