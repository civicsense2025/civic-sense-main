# CivicSense Interactive Components Guide

## Overview

This guide covers how to create engaging, interactive lesson steps using JSON configuration in the CivicSense learning platform. Each lesson step can include sophisticated interactive components that enhance civic education through hands-on engagement.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Lesson Step Structure](#lesson-step-structure)
3. [Interaction Types](#interaction-types)
4. [JSON Configuration Patterns](#json-configuration-patterns)
5. [Best Practices](#best-practices)
6. [Complete Examples](#complete-examples)
7. [Testing Guidelines](#testing-guidelines)

---

## Architecture Overview

### Component Flow
```
LessonStep → step_type + interaction_config → InteractiveContent → Specific Component
```

### Core Principles
- **Mobile-First**: All interactions designed for touch interfaces
- **Accessibility**: Full screen reader and keyboard navigation support
- **Progressive Disclosure**: Reveal complexity gradually
- **Civic Focus**: Every interaction connects to real democratic processes

---

## Lesson Step Structure

### Database Schema
```typescript
interface LessonStep {
  id: string;
  collection_item_id: string;
  step_number: number;
  step_type: string;                    // Determines component type
  title: string;
  content: string;
  estimated_seconds?: number;
  requires_interaction: boolean;        // Forces user engagement
  can_skip: boolean;                   // Allow skipping
  interaction_config?: any;            // JSON configuration object
  key_concepts?: string[];
  learning_objectives?: string[];
  sources?: any[];
}
```

### Key Fields for Interactions

| Field | Purpose | Example |
|-------|---------|---------|
| `step_type` | Primary component selector | `"knowledge_check"`, `"interaction"`, `"concept"` |
| `interaction_config.type` | Specific interaction variant | `"multiple_choice"`, `"concept"`, `"example"` |
| `requires_interaction` | Forces user engagement before proceeding | `true` for assessments, `false` for informational |
| `can_skip` | Allow users to bypass (accessibility) | `false` for critical knowledge checks |

---

## Interaction Types

### 1. Learning Content Components

#### Concept Explanation
**Purpose**: Present core civic concepts with key points and definitions

```json
{
  "step_type": "concept",
  "title": "Understanding the Electoral College",
  "content": "Learn how presidential elections actually work",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "concept",
    "key_points": [
      "The Electoral College has 538 total electors",
      "Each state gets electors equal to its Congressional delegation",
      "Winner-take-all system in 48 states",
      "270 electoral votes needed to win presidency"
    ],
    "definition": "A body of 538 electors who formally choose the U.S. President",
    "importance": "Determines presidential elections despite popular vote outcomes",
    "related_concepts": ["federalism", "representative-democracy", "swing-states"]
  }
}
```

#### Real-World Examples  
**Purpose**: Show concrete applications of civic concepts

```json
{
  "step_type": "example",
  "title": "When Your Vote Decides Everything",
  "content": "See how individual votes create massive political change",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "example",
    "examples": [
      {
        "title": "2020 Georgia Senate Runoffs",
        "description": "Two Senate seats determined party control, showing individual vote power",
        "source": "Secretary of State of Georgia",
        "highlight": "11,000 vote margin changed Senate majority"
      },
      {
        "title": "2018 Florida Governor Race", 
        "description": "32,463 vote difference in state of 21 million people",
        "source": "Florida Division of Elections",
        "highlight": "0.4% margin triggered automatic recount"
      }
    ],
    "takeaway": "Individual votes aggregate to create massive political change"
  }
}
```

#### Summary & Key Takeaways
**Purpose**: Consolidate learning with interactive review

```json
{
  "step_type": "summary",
  "title": "What You've Learned About Voting Power",
  "content": "Review these key insights about how your vote matters",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "summary",
    "key_points": [
      "Your vote directly impacts local elections with immediate community effects",
      "Ballot initiatives let you directly create policy",
      "Primary elections often decide the actual winner in safe districts",
      "Special elections can flip entire legislative majorities"
    ],
    "next_steps": [
      "Register to vote at your current address",
      "Research your local ballot initiatives",
      "Sign up for ballot delivery notifications",
      "Find your polling location and hours"
    ],
    "resources": [
      {
        "title": "Your State Election Office", 
        "url": "https://www.eac.gov/voters/register-and-vote-in-your-state"
      },
      {
        "title": "Ballotpedia Local Elections",
        "url": "https://ballotpedia.org/"
      }
    ]
  }
}
```

#### Case Study Analysis
**Purpose**: Deep dive into real civic situations with discussion

```json
{
  "step_type": "case_study",
  "title": "The Flint Water Crisis: How Local Government Failed",
  "content": "Analyze a case where government accountability broke down",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "case_study",
    "background": "In 2014, Flint, Michigan switched water sources to save money, leading to lead contamination affecting 100,000 residents.",
    "challenge": "Multiple levels of government ignored residents' complaints about brown, foul-smelling water for months.",
    "solution": "Federal intervention, emergency declaration, and massive infrastructure replacement project.",
    "outcome": "Criminal charges for officials, $600M settlement, ongoing health monitoring.",
    "lessons_learned": [
      "Local government decisions have immediate health consequences",
      "Environmental racism affects which communities face these crises",
      "Persistent citizen advocacy is essential for government accountability",
      "Federal oversight can be crucial when local systems fail"
    ],
    "discussion_questions": [
      "What early warning signs did officials ignore, and why?",
      "How did the community organize to demand action?",
      "What checks and balances failed in this situation?",
      "How can citizens monitor their local water quality?"
    ]
  }
}
```

#### Comparison Analysis
**Purpose**: Compare civic options to highlight differences

```json
{
  "step_type": "comparison",
  "title": "Presidential vs. Parliamentary Systems",
  "content": "Compare how different democracies organize power",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "comparison",
    "items": [
      {
        "name": "U.S. Presidential System",
        "attributes": {
          "Head of Government": "President (elected separately)",
          "Term Length": "4 years, fixed",
          "Legislative Control": "Can be different party than president",
          "Early Elections": "Not possible",
          "Coalition Government": "Rare"
        }
      },
      {
        "name": "UK Parliamentary System", 
        "attributes": {
          "Head of Government": "Prime Minister (from legislature)",
          "Term Length": "Up to 5 years, flexible",
          "Legislative Control": "Same party as PM",
          "Early Elections": "PM can call early",
          "Coalition Government": "Common"
        }
      }
    ],
    "focus_attributes": ["Legislative Control", "Early Elections"]
  }
}
```

#### Research Activity
**Purpose**: Guide students through structured civic research

```json
{
  "step_type": "research",
  "title": "Research Your Local Representatives",
  "content": "Find and analyze your elected officials' positions",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "research",
    "research_questions": [
      "Who is your current U.S. Representative and what district do you live in?",
      "What committees does your Representative serve on?",
      "What bills has your Representative sponsored in the last year?",
      "How did your Representative vote on the most recent major legislation?",
      "What town halls or public events has your Representative held recently?"
    ],
    "guided_questions": [
      "Use house.gov to find your Representative by zip code",
      "Check their official website for committee assignments",
      "Look at congress.gov for sponsored legislation",
      "Search voting records on govtrack.us",
      "Check their social media for event announcements"
    ],
    "resources": [
      {
        "title": "Find Your Representative",
        "url": "https://www.house.gov/representatives/find-your-representative",
        "type": "official_government"
      },
      {
        "title": "Track Congressional Votes",
        "url": "https://www.govtrack.us/",
        "type": "civic_tracker"
      }
    ]
  }
}
```

#### Debate Exploration
**Purpose**: Present multiple perspectives on civic issues

```json
{
  "step_type": "debate",
  "title": "The Electoral College Debate",
  "content": "Explore different perspectives on how we elect presidents",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "debate",
    "topic": "Should the United States eliminate the Electoral College?",
    "positions": [
      {
        "stance": "Eliminate the Electoral College",
        "arguments": [
          "Direct democracy: every vote counts equally nationwide",
          "Eliminates scenarios where popular vote winner loses",
          "Increases voter turnout in non-swing states",
          "Reduces outsized influence of swing states in campaigns"
        ],
        "evidence": [
          "Five presidents have won without popular vote majority",
          "68% of Americans support direct election (Gallup 2020)",
          "Current system concentrates campaign attention on 5-6 states"
        ]
      },
      {
        "stance": "Keep the Electoral College",
        "arguments": [
          "Protects influence of smaller states in presidential elections",
          "Maintains federalism - states elect president, not pure democracy",
          "Requires candidates to build geographically diverse coalitions",
          "Provides clear outcomes and avoids constantly close elections"
        ],
        "evidence": [
          "Without EC, campaigns would focus only on major cities",
          "Part of constitutional structure for 230+ years",
          "Eliminates need for national recounts in close elections"
        ]
      }
    ],
    "reflection_questions": [
      "Which arguments do you find most compelling and why?",
      "How would eliminating the Electoral College change campaign strategy?",
      "What are the practical challenges of constitutional amendment process?",
      "How does this debate reflect broader tensions between state and federal power?"
    ]
  }
}
```

### 2. Assessment Components

#### Multiple Choice Questions
**Purpose**: Test specific civic knowledge with immediate feedback

```json
{
  "step_type": "knowledge_check",
  "title": "Congressional Powers Check",
  "content": "Test your understanding of legislative branch authority",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "multiple_choice",
    "question": "Which branch of government can override a presidential veto?",
    "options": [
      "Supreme Court with majority vote",
      "Congress with two-thirds majority in both chambers", 
      "State governors with simple majority",
      "Cabinet members with unanimous consent"
    ],
    "correct_answer": 1,
    "explanation": "Article I, Section 7 of the Constitution gives Congress the power to override presidential vetoes with a two-thirds majority in both the House and Senate. This is a key check on executive power and maintains the balance between branches."
  }
}
```

#### True/False with Nuance
**Purpose**: Address civic misconceptions with detailed explanations

```json
{
  "step_type": "knowledge_check",
  "title": "Presidential War Powers",
  "content": "Test your understanding of executive vs. legislative war powers",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "true_false",
    "statement": "The President can single-handedly declare war on another country",
    "correct_answer": false,
    "explanation": "Only Congress has the constitutional power to declare war (Article I, Section 8). However, the President as Commander in Chief can deploy military forces for limited periods, creating a complex constitutional tension that continues today. The War Powers Resolution of 1973 attempted to clarify this but remains contested."
  }
}
```

#### Text Input & Reflection
**Purpose**: Encourage personal civic engagement planning

```json
{
  "step_type": "knowledge_check",
  "title": "Your Local Civic Issue",
  "content": "Identify an issue you want to engage with in your community",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "text_input",
    "question": "Name one specific local issue you want to research in your community",
    "placeholder": "e.g., school board funding, zoning laws, public transit, housing policy",
    "validation": "none"
  }
}
```

#### Ranking Exercise
**Purpose**: Prioritize civic values or policy options

```json
{
  "step_type": "knowledge_check",
  "title": "Prioritizing Democratic Values",
  "content": "Rank these democratic principles in order of importance to you",
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "ranking",
    "instruction": "Drag to reorder these democratic values from most to least important to you personally",
    "items": [
      "Individual Liberty and Rights",
      "Majority Rule and Popular Sovereignty", 
      "Minority Rights and Protection",
      "Government Transparency and Accountability",
      "Equal Representation and Voting Access",
      "Rule of Law and Constitutional Limits"
    ]
  }
}
```

---

## JSON Configuration Patterns

### Common Structure
```json
{
  "step_type": "component_category",
  "title": "User-facing title",
  "content": "Descriptive content or context",
  "estimated_seconds": 180,
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "specific_component_type",
    // Component-specific configuration
  },
  "key_concepts": ["concept1", "concept2"],
  "learning_objectives": ["objective1", "objective2"],
  "sources": [
    {
      "title": "Source Title",
      "url": "https://example.com",
      "type": "government_official"
    }
  ]
}
```

### Validation Patterns
```json
{
  "interaction_config": {
    "type": "text_input",
    "validation": "email",  // Options: "none", "email", "phone", "number"
    "required": true,
    "min_length": 10,
    "max_length": 500,
    "custom_message": "Please provide a thoughtful response (at least 10 characters)"
  }
}
```

### Progressive Enhancement
```json
{
  "accessibility": {
    "screen_reader_description": "Alternative description for screen readers",
    "keyboard_navigation": true,
    "high_contrast_mode": true,
    "skip_option": "Allow users to bypass if needed"
  }
}
```

---

## Best Practices

### 1. Civic Education Principles

#### Connect to Real Power
```json
// ✅ Good: Specific and actionable
{
  "content": "Your city council meets the 2nd Tuesday of each month at 7 PM",
  "interaction_config": {
    "type": "text_input",
    "question": "What's one agenda item you'd want to address at the next meeting?",
    "follow_up": "City council has direct authority over zoning, local taxes, and municipal services"
  }
}

// ❌ Avoid: Abstract and disconnected  
{
  "content": "Democracy is important",
  "interaction_config": {
    "type": "text_input",
    "question": "What do you think about democracy?"
  }
}
```

#### Use Current, Verifiable Examples
```json
{
  "interaction_config": {
    "type": "example",
    "examples": [
      {
        "title": "2024 Infrastructure Investment",
        "description": "How the Infrastructure Investment and Jobs Act affects your community",
        "source": "U.S. Department of Transportation",
        "highlight": "Find specific projects in your zip code at build.gov"
      }
    ]
  }
}
```

### 2. Mobile UX Principles

#### Touch-Friendly Design
- All interactive elements minimum 44px touch targets
- Adequate spacing between interactive elements (8px minimum)
- Clear visual feedback for all interactions
- Avoid hover-only interactions

#### Progressive Disclosure
```json
{
  "interaction_config": {
    "type": "concept",
    "key_points": [
      "Start with most essential point",
      "Build complexity gradually", 
      "Save nuanced details for later",
      "Provide clear next steps"
    ]
  }
}
```

### 3. Accessibility Standards

#### Screen Reader Support
```json
{
  "accessibility": {
    "aria_label": "Multiple choice question about congressional powers",
    "screen_reader_instructions": "Select one answer from the four options below",
    "keyboard_shortcuts": "Use arrow keys to navigate options, space to select"
  }
}
```

#### Cognitive Accessibility
- One clear instruction per step
- Specific, helpful error messages  
- No time limits (or user-controllable)
- Consistent navigation patterns

### 4. Content Quality Standards

#### Fact-Check Requirements
- All civic facts must include credible sources
- Use official government sources when possible
- Include publication/last updated dates
- Provide alternative sources for verification

#### Language Guidelines
- Use clear, jargon-free language
- Define any technical terms immediately
- Write at appropriate reading level
- Provide context for all examples

---

## Complete Examples

### Example 1: Full Lesson Step - Congressional Oversight

```json
{
  "id": "congressional-oversight-intro",
  "collection_item_id": "congress-decoded-lesson-3",
  "step_number": 1,
  "step_type": "concept",
  "title": "How Congress Investigates the Executive Branch",
  "content": "Congressional oversight is one of the most powerful but least understood tools for checking presidential power.",
  "estimated_seconds": 180,
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "concept",
    "key_points": [
      "Congress can subpoena documents and testimony from any executive branch official",
      "House and Senate committees each have independent oversight authority", 
      "Oversight power exists even when Congress and President are the same party",
      "Refusal to comply with congressional subpoenas can lead to contempt charges"
    ],
    "definition": "Congressional oversight is the power to investigate, monitor, and supervise federal agencies, programs, and officials",
    "importance": "Without oversight, executive power becomes unchecked - which is the definition of authoritarianism. Oversight ensures laws are implemented as Congress intended.",
    "related_concepts": [
      "separation-of-powers",
      "congressional-subpoenas", 
      "executive-privilege",
      "contempt-of-congress"
    ]
  },
  "key_concepts": [
    "congressional-oversight",
    "separation-of-powers",
    "checks-and-balances"
  ],
  "learning_objectives": [
    "Understand the constitutional basis for congressional oversight",
    "Recognize how oversight works in practice",
    "Identify tools Congress uses to compel executive cooperation",
    "Connect oversight to current political events"
  ],
  "sources": [
    {
      "title": "Congressional Oversight Manual",
      "url": "https://crsreports.congress.gov/product/pdf/RL/RL30240",
      "type": "government_official"
    },
    {
      "title": "Article I, Section 8 - U.S. Constitution",
      "url": "https://constitution.congress.gov/browse/article-1/section-8/",
      "type": "primary_source"
    }
  ]
}
```

### Example 2: Interactive Assessment

```json
{
  "id": "oversight-knowledge-check",
  "collection_item_id": "congress-decoded-lesson-3",
  "step_number": 3,
  "step_type": "knowledge_check",
  "title": "Test Your Oversight Knowledge",
  "content": "Apply what you've learned about congressional oversight powers",
  "estimated_seconds": 90,
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "multiple_choice",
    "question": "If the Treasury Secretary refuses to appear before a House committee investigating government spending, what can the committee do?",
    "options": [
      "Nothing - executive officials can't be compelled to testify",
      "Issue a subpoena requiring appearance or face contempt charges",
      "Only ask the President to encourage cooperation",
      "Wait until the next election to vote them out"
    ],
    "correct_answer": 1,
    "explanation": "Congressional committees can issue subpoenas compelling executive branch officials to testify and provide documents. Refusal to comply can result in contempt of Congress charges, which can include fines and imprisonment. This power is essential for congressional oversight and has been upheld by the Supreme Court multiple times, most notably in Trump v. Mazars (2020)."
  },
  "key_concepts": [
    "congressional-subpoenas",
    "contempt-of-congress",
    "oversight-enforcement"
  ],
  "learning_objectives": [
    "Apply knowledge of congressional oversight tools",
    "Understand enforcement mechanisms for oversight",
    "Connect constitutional powers to practical scenarios"
  ]
}
```

### Example 3: Action-Oriented Research

```json
{
  "id": "find-your-oversight",
  "collection_item_id": "congress-decoded-lesson-3", 
  "step_number": 5,
  "step_type": "research",
  "title": "Find Current Oversight in Action",
  "content": "Discover what oversight investigations are happening right now that affect you",
  "estimated_seconds": 300,
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "research",
    "research_questions": [
      "What oversight hearings has your Representative's committee held in the last 30 days?",
      "What executive agency or program is currently under congressional investigation?",
      "How might these investigations affect policies that impact your daily life?",
      "What questions would you want your Representative to ask in these hearings?"
    ],
    "guided_questions": [
      "Check your Rep's committee page on house.gov for recent hearings",
      "Look at committee press releases and hearing schedules",
      "Think about agencies that affect you: Education, Transportation, Health, etc.",
      "Consider what accountability questions matter to your community"
    ],
    "resources": [
      {
        "title": "House Committee Hearings",
        "url": "https://docs.house.gov/Committee/Calendar/",
        "type": "government_official"
      },
      {
        "title": "Senate Committee Hearings",
        "url": "https://www.senate.gov/committees/hearings_meetings.htm",
        "type": "government_official"
      },
      {
        "title": "C-SPAN Committee Coverage",
        "url": "https://www.c-span.org/congress/",
        "type": "media_coverage"
      }
    ]
  },
  "key_concepts": [
    "active-oversight",
    "committee-hearings", 
    "citizen-engagement"
  ],
  "learning_objectives": [
    "Connect oversight concepts to current events",
    "Practice researching congressional activities",
    "Develop critical questions for representatives",
    "Understand how to stay informed about oversight"
  ]
}
```

---

## Testing Guidelines

### 1. Functional Testing Checklist
- [ ] All interactive elements respond correctly to touch
- [ ] Validation works as expected for text inputs
- [ ] Progress tracking functions properly across step types
- [ ] Data persists appropriately when navigating between steps
- [ ] Error handling gracefully manages edge cases

### 2. Accessibility Testing Checklist
- [ ] Screen reader announces all content meaningfully
- [ ] Keyboard navigation reaches all interactive elements
- [ ] Color contrast meets WCAG AA standards (4.5:1 minimum)
- [ ] Touch targets are minimum 44px with adequate spacing
- [ ] Alternative text provided for any visual elements

### 3. Content Quality Checklist
- [ ] All civic facts verified against credible sources
- [ ] Examples use current, relevant events when possible
- [ ] Language appropriate for target reading level
- [ ] Technical terms defined immediately upon use
- [ ] Sources cited with publication dates

### 4. Performance Testing Checklist
- [ ] Component loads in under 2 seconds on mid-range mobile
- [ ] Animations are smooth (60fps) and purposeful
- [ ] Works properly on slow network connections
- [ ] Memory usage optimized for extended learning sessions

### 5. Learning Outcome Testing
- [ ] Clear connection between interaction and learning objective
- [ ] Appropriate cognitive load for step complexity
- [ ] Meaningful feedback provided for user responses
- [ ] Encourages deeper civic engagement beyond the lesson

---

## Implementation Guidelines

### Development Workflow
1. **Define Learning Objectives**: What should users understand/do after this step?
2. **Choose Interaction Type**: Match component to learning goal and content complexity
3. **Draft JSON Configuration**: Start with minimal viable interaction
4. **Content Review**: Verify civic accuracy and source credibility
5. **Accessibility Review**: Test with screen readers and keyboard navigation
6. **User Testing**: Validate with target audience for comprehension and engagement
7. **Performance Testing**: Ensure smooth mobile performance
8. **Iteration**: Refine based on user feedback and learning outcome data

### Quality Assurance
- All civic content must be fact-checked against official sources
- Interactive elements must meet WCAG 2.1 AA accessibility standards
- Mobile performance tested on devices 2+ years old
- Learning outcomes measured through user completion and engagement data

---

*This guide is a living document. As new interaction patterns emerge and civic education best practices evolve, these guidelines will be updated to reflect current standards and user needs.* 