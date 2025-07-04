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
| `interaction_config.type` | Specific interaction variant | `"multiple_choice"`, `"timeline"`, `"reflection"` |
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
  "interaction_config": {
    "type": "concept",
    "key_points": [
      "The Electoral College has 538 total electors",
      "Each state gets electors equal to its Congressional delegation",
      "Winner-take-all system in 48 states"
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

#### Summary & Next Steps
**Purpose**: Consolidate learning and provide clear action items

```json
{
  "step_type": "summary",
  "interaction_config": {
    "type": "summary",
    "key_points": [
      "Your vote directly impacts local elections with immediate community effects",
      "Ballot initiatives let you directly create policy",
      "Primary elections often decide the actual winner in safe districts"
    ],
    "next_steps": [
      "Register to vote in your current address",
      "Research your local ballot initiatives",
      "Sign up for ballot delivery notifications"
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

### 2. Assessment Components

#### Multiple Choice Questions
**Purpose**: Test specific civic knowledge with immediate feedback

```json
{
  "step_type": "knowledge_check",
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
    "explanation": "Article I, Section 7 of the Constitution gives Congress the power to override presidential vetoes with a two-thirds majority in both the House and Senate. This is a key check on executive power."
  }
}
```

#### True/False with Nuance
**Purpose**: Address civic misconceptions with detailed explanations

```json
{
  "step_type": "knowledge_check",
  "interaction_config": {
    "type": "true_false",
    "statement": "The President can single-handedly declare war on another country",
    "correct_answer": false,
    "explanation": "Only Congress has the constitutional power to declare war (Article I, Section 8). However, the President as Commander in Chief can deploy military forces, creating a complex constitutional tension that continues today."
  }
}
```

#### Text Input & Reflection
**Purpose**: Encourage personal civic engagement planning

```json
{
  "step_type": "knowledge_check",
  "interaction_config": {
    "type": "text_input",
    "question": "Name one specific local issue you want to research in your community",
    "placeholder": "e.g., school board funding, zoning laws, public transit",
    "validation": "none",
    "follow_up_prompt": "Next, we'll show you how to find the decision-makers for this issue"
  }
}
```

### 3. Interactive Experiences

#### Data Visualization Interactions
**Purpose**: Make abstract civic data tangible and exploratory

```json
{
  "step_type": "interaction",
  "interaction_config": {
    "type": "data_exploration",
    "title": "Explore Your District's Voting Patterns",
    "data_source": "your_district_voting_data",
    "interaction_type": "slider_timeline",
    "parameters": {
      "start_year": 2008,
      "end_year": 2024,
      "data_points": ["voter_turnout", "margin_of_victory", "demographic_breakdown"],
      "user_controls": ["year_range", "election_type", "demographic_filter"]
    },
    "insights_to_highlight": [
      "Presidential vs. midterm turnout gaps",
      "Local election participation rates",
      "Swing vote demographics"
    ]
  }
}
```

#### Simulation Exercises
**Purpose**: Let users experience civic processes firsthand

```json
{
  "step_type": "interaction",
  "interaction_config": {
    "type": "civic_simulation",
    "scenario": "city_budget_allocation",
    "user_role": "city_council_member",
    "budget_total": 50000000,
    "spending_categories": [
      {
        "name": "Public Safety",
        "current_allocation": 0.35,
        "min_allocation": 0.25,
        "max_allocation": 0.50,
        "description": "Police, fire, emergency services"
      },
      {
        "name": "Education",
        "current_allocation": 0.40,
        "min_allocation": 0.30,
        "max_allocation": 0.55,
        "description": "Schools, libraries, adult education"
      },
      {
        "name": "Infrastructure",
        "current_allocation": 0.15,
        "min_allocation": 0.10,
        "max_allocation": 0.25,
        "description": "Roads, water, broadband"
      },
      {
        "name": "Social Services",
        "current_allocation": 0.10,
        "min_allocation": 0.05,
        "max_allocation": 0.20,
        "description": "Housing assistance, food programs"
      }
    ],
    "constraints": [
      "Total must equal 100%",
      "Public safety cannot be reduced below 25%",
      "Education must maintain federal minimums"
    ],
    "feedback_mechanism": "real_time_impact_preview"
  }
}
```

#### Timeline Interactions
**Purpose**: Show civic events in chronological context

```json
{
  "step_type": "interaction",
  "interaction_config": {
    "type": "timeline",
    "title": "How Your Vote Gets Counted",
    "timeline_items": [
      {
        "timestamp": "2024-11-05T08:00:00Z",
        "event": "Polls Open",
        "description": "First voters arrive at polling stations",
        "details": "Poll workers verify voter registration and provide ballots",
        "interactive": true,
        "user_action": "tap_to_simulate_voting"
      },
      {
        "timestamp": "2024-11-05T20:00:00Z",
        "event": "Polls Close",
        "description": "Last voters in line can still vote",
        "details": "Poll workers begin counting ballots immediately"
      },
      {
        "timestamp": "2024-11-05T23:30:00Z",
        "event": "First Results",
        "description": "Preliminary county totals reported",
        "details": "Media begins calling uncontested races"
      }
    ],
    "user_interactions": {
      "scrub_timeline": true,
      "view_details": true,
      "simulate_actions": ["voting", "ballot_counting", "result_reporting"]
    }
  }
}
```

### 4. Action-Oriented Components

#### Contact Representative Form
**Purpose**: Turn learning into immediate civic action

```json
{
  "step_type": "action_item",
  "interaction_config": {
    "type": "contact_form",
    "title": "Contact Your Representative About This Issue",
    "auto_lookup": {
      "use_location": true,
      "fallback_to_zip": true
    },
    "message_template": {
      "customizable": true,
      "suggested_opener": "As your constituent, I'm writing about...",
      "key_points_to_include": [
        "State your position clearly",
        "Mention you're a voter in their district",
        "Request specific action",
        "Provide your contact information"
      ]
    },
    "delivery_options": ["email", "phone_call_script", "postal_mail"],
    "follow_up_tracking": true
  }
}
```

#### Action Checklist
**Purpose**: Provide concrete steps for civic engagement

```json
{
  "step_type": "action_item",
  "interaction_config": {
    "type": "action_checklist",
    "title": "Your Civic Engagement Checklist",
    "time_commitment": "30 minutes",
    "actions": [
      {
        "id": "voter_registration",
        "title": "Verify your voter registration",
        "description": "Check your address and party affiliation are current",
        "estimated_minutes": 5,
        "priority": "high",
        "external_link": "https://www.vote.gov/",
        "completion_criteria": "user_confirms_registration_status"
      },
      {
        "id": "research_ballot",
        "title": "Research your next ballot",
        "description": "Look up candidates and ballot measures",
        "estimated_minutes": 15,
        "priority": "high",
        "external_link": "https://ballotpedia.org/",
        "completion_criteria": "user_knows_whats_on_ballot"
      },
      {
        "id": "follow_local_news",
        "title": "Follow your local news outlet",
        "description": "Stay informed about community issues",
        "estimated_minutes": 5,
        "priority": "medium",
        "completion_criteria": "user_subscribes_or_bookmarks"
      }
    ],
    "progress_tracking": true,
    "reminder_system": true
  }
}
```

### 5. Reflection Components

#### Personal Reflection
**Purpose**: Connect abstract civic concepts to personal experience

```json
{
  "step_type": "reflection",
  "interaction_config": {
    "type": "reflection",
    "prompts": [
      {
        "question": "Think of a time when a government decision directly affected your daily life. What was it?",
        "follow_up": "How did you learn about this decision? Who made it?",
        "context": "Examples: school closures, road construction, business regulations, park hours"
      },
      {
        "question": "What's one local issue you hear neighbors talking about?",
        "follow_up": "Do you know which government body has the power to address it?",
        "context": "Common issues: traffic, housing costs, school quality, business permits"
      }
    ],
    "privacy_note": "Your reflections are private and help personalize your learning experience",
    "optional_sharing": false,
    "save_responses": true
  }
}
```

---

## JSON Configuration Patterns

### Common Structure
```json
{
  "type": "component_type",
  "title": "User-facing title",
  "description": "Optional context",
  "content": "Main content or question",
  "parameters": {
    // Component-specific configuration
  },
  "accessibility": {
    "screen_reader_description": "Alternative description",
    "keyboard_navigation": true,
    "high_contrast_mode": true
  },
  "tracking": {
    "analytics_event": "component_interaction",
    "completion_criteria": "user_action_required"
  }
}
```

### Validation Patterns
```json
{
  "validation": {
    "required": true,
    "min_length": 10,
    "max_length": 500,
    "pattern": "email|phone|zip|none",
    "custom_message": "Please provide a thoughtful response"
  }
}
```

### Progressive Enhancement
```json
{
  "fallback_behavior": {
    "no_javascript": "show_static_content",
    "slow_connection": "reduce_animations",
    "screen_reader": "provide_text_alternatives"
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
  "question": "Your city council meets the 2nd Tuesday of each month. What's one agenda item you'd want to address?",
  "context": "City council has direct authority over zoning, local taxes, and municipal services"
}

// ❌ Avoid: Abstract and disconnected
{
  "question": "What do you think about democracy?",
  "context": "Democracy is important"
}
```

#### Use Current Events
```json
{
  "example": {
    "title": "2024 Infrastructure Investment",
    "description": "How the federal Infrastructure Investment and Jobs Act affects your community",
    "current_relevance": "Projects beginning construction in 2024-2025",
    "local_connection": "Find projects in your zip code"
  }
}
```

### 2. Mobile UX Principles

#### Touch-Friendly Interactions
```json
{
  "interaction_config": {
    "touch_targets": {
      "minimum_size": "44px",
      "spacing": "8px_minimum",
      "feedback": "haptic_on_selection"
    },
    "gestures": ["tap", "swipe", "long_press"],
    "avoid": ["hover_only", "right_click", "keyboard_shortcuts"]
  }
}
```

#### Progressive Disclosure
```json
{
  "content_strategy": {
    "initial_view": "essential_information_only",
    "expansion_triggers": ["user_request", "completion_of_step"],
    "detail_levels": ["overview", "detailed", "expert"]
  }
}
```

### 3. Accessibility Standards

#### Screen Reader Support
```json
{
  "accessibility": {
    "aria_labels": "Complete and descriptive",
    "heading_structure": "Proper h1-h6 hierarchy",
    "focus_management": "Clear tab order",
    "alternative_text": "Meaningful image descriptions"
  }
}
```

#### Cognitive Accessibility
```json
{
  "cognitive_support": {
    "clear_instructions": "One action per instruction",
    "error_messages": "Specific and helpful",
    "time_limits": "None or user-controllable",
    "consistent_navigation": "Same patterns throughout"
  }
}
```

### 4. Performance Optimization

#### Lazy Loading
```json
{
  "loading_strategy": {
    "critical_content": "load_immediately",
    "interactive_elements": "load_on_interaction",
    "media_assets": "lazy_load_with_placeholders"
  }
}
```

#### Offline Support
```json
{
  "offline_behavior": {
    "cache_strategy": "cache_essential_content",
    "sync_strategy": "sync_when_connection_returns",
    "user_feedback": "clear_offline_indicators"
  }
}
```

---

## Complete Examples

### Example 1: Congressional Oversight Lesson

```json
{
  "id": "oversight-intro",
  "step_number": 1,
  "step_type": "concept",
  "title": "How Congress Investigates the Executive Branch",
  "content": "Congressional oversight is one of the most powerful but least understood tools for checking presidential power.",
  "estimated_seconds": 120,
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "concept",
    "key_points": [
      "Congress can subpoena documents and testimony from any executive branch official",
      "House and Senate committees each have independent oversight authority",
      "Oversight power exists even when Congress and President are the same party"
    ],
    "definition": "Congressional oversight is the power to investigate, monitor, and supervise federal agencies and programs",
    "importance": "Without oversight, executive power becomes unchecked - the definition of authoritarianism",
    "related_concepts": ["separation-of-powers", "congressional-subpoenas", "executive-privilege"],
    "real_world_examples": [
      {
        "title": "Watergate Hearings (1973)",
        "impact": "Led to President Nixon's resignation",
        "lesson": "Even a popular president isn't above congressional investigation"
      },
      {
        "title": "9/11 Commission (2004)",
        "impact": "Created Department of Homeland Security",
        "lesson": "Oversight can lead to major government restructuring"
      }
    ]
  },
  "learning_objectives": [
    "Understand the constitutional basis for congressional oversight",
    "Recognize how oversight works in practice",
    "Identify current oversight investigations"
  ]
}
```

### Example 2: Local Budget Simulation

```json
{
  "id": "budget-simulation",
  "step_number": 3,
  "step_type": "interaction",
  "title": "Allocate Your City's Budget",
  "content": "You're a city council member with $50 million to allocate. Every dollar matters to real people.",
  "estimated_seconds": 300,
  "requires_interaction": true,
  "can_skip": false,
  "interaction_config": {
    "type": "budget_allocation_game",
    "scenario": {
      "city_name": "Springfield",
      "population": 125000,
      "total_budget": 50000000,
      "budget_context": "Post-pandemic recovery with increased social needs but reduced tax revenue"
    },
    "spending_categories": [
      {
        "id": "public_safety",
        "name": "Police & Fire",
        "current_percentage": 35,
        "min_percentage": 25,
        "max_percentage": 50,
        "impact_preview": {
          "increase": "Faster emergency response, more community policing",
          "decrease": "Longer response times, reduced fire station coverage"
        },
        "real_world_data": "National average: 31% of municipal budgets"
      },
      {
        "id": "education",
        "name": "Schools & Libraries", 
        "current_percentage": 40,
        "min_percentage": 30,
        "max_percentage": 55,
        "impact_preview": {
          "increase": "Smaller class sizes, updated textbooks, library hours",
          "decrease": "Larger classes, deferred maintenance, reduced programs"
        },
        "real_world_data": "National average: 38% of municipal budgets"
      },
      {
        "id": "infrastructure",
        "name": "Roads & Utilities",
        "current_percentage": 15,
        "min_percentage": 10,
        "max_percentage": 25,
        "impact_preview": {
          "increase": "Better roads, reliable water, faster internet",
          "decrease": "Pothole delays, water main breaks, slow internet"
        }
      },
      {
        "id": "social_services",
        "name": "Housing & Health",
        "current_percentage": 10,
        "min_percentage": 5,
        "max_percentage": 20,
        "impact_preview": {
          "increase": "More homeless shelters, mental health services",
          "decrease": "Reduced homeless services, longer wait times"
        }
      }
    ],
    "constraints": [
      {
        "type": "federal_mandate",
        "description": "Education must maintain 30% minimum for federal funding",
        "affects": ["education"]
      },
      {
        "type": "union_contract",
        "description": "Police salaries are fixed by 3-year contract",
        "affects": ["public_safety"]
      }
    ],
    "feedback_system": {
      "real_time_impact": true,
      "community_reactions": [
        {
          "stakeholder": "Teachers Union",
          "response_to": "education_changes",
          "positive_threshold": 42,
          "negative_threshold": 35
        },
        {
          "stakeholder": "Business Council",
          "response_to": "infrastructure_changes", 
          "positive_threshold": 18,
          "negative_threshold": 12
        }
      ]
    },
    "completion_criteria": {
      "budget_must_total_100_percent": true,
      "all_minimums_met": true,
      "reflection_question_answered": true
    },
    "reflection_prompt": "What surprised you most about the tradeoffs in municipal budgeting? How might you research your own city's budget priorities?"
  }
}
```

### Example 3: Voting Rights Timeline

```json
{
  "id": "voting-rights-timeline",
  "step_number": 2,
  "step_type": "interaction",
  "title": "The Evolution of American Voting Rights",
  "content": "Explore how the definition of 'eligible voter' has expanded and contracted throughout U.S. history.",
  "estimated_seconds": 240,
  "requires_interaction": true,
  "can_skip": true,
  "interaction_config": {
    "type": "interactive_timeline",
    "timeline_data": [
      {
        "year": 1789,
        "event": "Constitution Ratified",
        "voting_eligibility": "White male property owners (6% of population)",
        "interactive_element": {
          "type": "population_calculator",
          "prompt": "In a town of 1,000 people, how many could vote?",
          "answer": 60,
          "explanation": "Only about 6% of the population could vote in early America"
        }
      },
      {
        "year": 1870,
        "event": "15th Amendment",
        "voting_eligibility": "All male citizens regardless of race (12% of population)",
        "interactive_element": {
          "type": "law_text_analyzer",
          "prompt": "Read the 15th Amendment text. What loophole did Southern states exploit?",
          "text": "The right of citizens to vote shall not be denied... on account of race, color, or previous condition of servitude",
          "hint": "Notice what's NOT mentioned that states could still restrict",
          "answer_key": ["literacy tests", "poll taxes", "grandfather clauses"]
        }
      },
      {
        "year": 1920,
        "event": "19th Amendment",
        "voting_eligibility": "All citizens regardless of gender (60% of population)",
        "interactive_element": {
          "type": "impact_calculator",
          "prompt": "How did doubling the electorate change political strategy?",
          "scenario": "1920 presidential election",
          "variables": ["campaign_messaging", "candidate_selection", "issue_priorities"]
        }
      },
      {
        "year": 1965,
        "event": "Voting Rights Act",
        "voting_eligibility": "Federal protection for all citizens (95% of population)",
        "interactive_element": {
          "type": "before_after_comparison",
          "location": "Selma, Alabama",
          "before_data": {
            "black_voter_registration": "2.1%",
            "white_voter_registration": "69.3%"
          },
          "after_data": {
            "black_voter_registration": "61.3%", 
            "white_voter_registration": "73.8%"
          },
          "user_task": "Calculate the change in political power"
        }
      },
      {
        "year": 2013,
        "event": "Shelby County v. Holder",
        "voting_eligibility": "Weakened federal oversight",
        "interactive_element": {
          "type": "current_events_tracker",
          "prompt": "Research: How many states changed voting laws after 2013?",
          "data_source": "Brennan Center for Justice",
          "user_action": "Find and report current voting law changes"
        }
      }
    ],
    "user_interactions": {
      "timeline_scrubbing": true,
      "zoom_to_decades": true,
      "compare_any_two_periods": true,
      "overlay_demographic_data": true
    },
    "learning_checkpoints": [
      {
        "after_year": 1870,
        "question": "Why did the 15th Amendment not immediately give Black Americans voting power?",
        "required": true
      },
      {
        "after_year": 1965,
        "question": "What specific tactics did the Voting Rights Act prohibit?",
        "required": true
      }
    ],
    "final_reflection": {
      "prompt": "Based on this timeline, is voting rights expansion inevitable or fragile?",
      "follow_up": "What evidence supports your view?",
      "connect_to_present": "How does this history inform current voting rights debates?"
    }
  }
}
```

---

## Testing Guidelines

### 1. Functional Testing
- [ ] All interactive elements respond correctly
- [ ] Validation works as expected
- [ ] Progress tracking functions properly
- [ ] Data persists appropriately

### 2. Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation support
- [ ] Color contrast compliance
- [ ] Touch target sizing

### 3. Performance Testing
- [ ] Load times under 3 seconds
- [ ] Smooth animations on mid-range devices
- [ ] Graceful degradation on slow connections
- [ ] Memory usage optimization

### 4. Content Testing
- [ ] Civic accuracy verification
- [ ] Source citation validation
- [ ] Current events relevance
- [ ] Local applicability

### 5. User Experience Testing
- [ ] Mobile usability testing
- [ ] Cognitive load assessment
- [ ] Engagement measurement
- [ ] Learning outcome validation

---

## Implementation Checklist

### Before Development
- [ ] Define learning objectives clearly
- [ ] Choose appropriate interaction type
- [ ] Plan accessibility features
- [ ] Consider mobile constraints

### During Development  
- [ ] Follow JSON schema patterns
- [ ] Implement progressive enhancement
- [ ] Add comprehensive error handling
- [ ] Include analytics tracking

### After Development
- [ ] Test across devices and abilities
- [ ] Validate civic content accuracy
- [ ] Measure learning outcomes
- [ ] Iterate based on user feedback

---

*This guide is a living document. As new interaction patterns emerge and civic education best practices evolve, these guidelines will be updated to reflect current standards.* 