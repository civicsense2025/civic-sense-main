# CivicSense Content Development Cursor Rules

*Civic education that politicians don't want you to have.*

## Table of Contents
1. [Core Content Principles](#core-content-principles)
2. [Database Schema Rules](#database-schema-rules)
3. [Content Generation Standards](#content-generation-standards)
4. [Quality Validation Rules](#quality-validation-rules)
5. [API Development Guidelines](#api-development-guidelines)
6. [Frontend Content Display](#frontend-content-display)
7. [Content Workflow Automation](#content-workflow-automation)
8. [Module Export Management Rule](#module-export-management-rule)

## Documentation Standards
**REQUIRED**: All content development must follow documentation standards in `.cursor/rules/documentation-organization.mdc`:
- Complete function and component documentation with civic impact focus
- Dual changelog maintenance (internal and public)
- Clean code practices with immediate technical debt cleanup
- Quality gates for every commit and release

## Accessibility Standards
**REQUIRED**: All interactive civic education features must follow accessibility standards in `.cursor/rules/accessibility-standards.mdc`:
- 100% keyboard navigation support for all quiz and multiplayer components
- Screen reader compatibility with proper ARIA implementation
- Audio accessibility with transcripts and keyboard controls
- Visual accessibility meeting WCAG 2.1 AA standards
- Real user testing with disabled community members

---

## Core Content Principles

### Brand Voice Integration in Code
When developing content-related features, ALWAYS ensure:

**Truth Over Comfort**
- Content validation must check for uncomfortable truths about power structures
- Never implement features that soften political criticism or create false equivalencies
- Error messages should be direct, not diplomatic

**Clarity Over Politeness** 
- Use active voice in content templates and prompts
- Avoid passive constructions that obscure responsibility
- Name specific institutions and officials, not vague "government" references

**Action Over Passive Consumption**
- Every content piece must include actionable next steps for users
- Implement engagement tracking for real-world actions, not just consumption metrics
- Build features that connect learning to civic participation

**Evidence Over Opinion**
- All content must be backed by verifiable sources
- Implement robust source validation and fact-checking workflows
- Distinguish clearly between facts and analysis in UI components

**Systems Thinking Over Surface Solutions**
- Content should reveal root causes and power dynamics
- Avoid features that treat symptoms without addressing underlying issues
- Connect individual actions to systemic change in content frameworks

### Content Type Standards

#### Quiz Questions
```typescript
interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'scenario_based'
  question_text: string
  
  // REQUIRED: Every question must reveal power dynamics
  power_dynamics_focus: string
  
  // REQUIRED: Connect to real-world action
  civic_action_connection: string
  
  // REQUIRED: Challenge common misconceptions
  misconception_addressed: string
  
  options?: QuestionOption[]
  correct_answer: string
  
  // REQUIRED: Explanation must include "what you can do with this knowledge"
  explanation: string
  action_steps: string[]
  
  // Source validation
  primary_sources: SourceReference[]
  credibility_score: number
  
  // Brand voice validation
  uses_active_voice: boolean
  names_specific_institutions: boolean
  provides_uncomfortable_truth: boolean
}
```

#### Topics
```typescript
interface Topic {
  id: string
  
  // REQUIRED: Follow "How X Actually Works" pattern
  title: string // Must match pattern: "How [System] Actually Works: [Current Example]"
  
  // REQUIRED: Hook with uncomfortable truth
  description: string
  hook: string // Uncomfortable truth that challenges conventional wisdom
  reality_vs_official: {
    official_explanation: string
    actual_process: string
    hidden_stakeholders: string[]
  }
  
  // REQUIRED: Personal impact framework
  why_this_matters: {
    your_money: string
    your_rights: string  
    your_power: string
    your_community: string
  }
  
  category: 'power_dynamics' | 'constitutional_reality' | 'economic_control' | 'information_warfare' | 'local_impact'
  
  // Quality validation
  challenges_misconception: boolean
  names_specific_actors: boolean
  includes_current_examples: boolean
  provides_action_steps: boolean
  reveals_hidden_power: boolean
}
```

#### News Analysis
```typescript
interface NewsAnalysis {
  id: string
  source_article_id: string
  
  // REQUIRED: Power dynamics analysis
  surface_vs_reality: {
    headlines_say: string
    actually_happening: string
    not_telling_you: string
  }
  
  // REQUIRED: Follow the money
  financial_analysis: {
    who_benefits: string[]
    contracts_at_stake: string[]
    donor_influence: string[]
  }
  
  // REQUIRED: Institutional analysis
  power_analysis: {
    apparent_power: string[]
    actual_power: string[]
    decision_makers: string[]
    bypass_mechanisms: string[]
  }
  
  // REQUIRED: Citizen action connections
  citizen_actions: {
    immediate_steps: string[]
    long_term_strategy: string[]
    leverage_points: string[]
    coalition_opportunities: string[]
  }
  
  credibility_score: number
  bias_analysis: BiasAnalysis
  primary_sources: SourceReference[]
}
```

#### Public Figures
```typescript
interface PublicFigure {
  id: string
  name: string
  
  // REQUIRED: Power analysis, not biography
  power_analysis: {
    official_positions: Position[]
    actual_influence: string
    decision_making_authority: string[]
    funding_sources: FundingSource[]
    network_connections: NetworkConnection[]
  }
  
  // REQUIRED: Track record analysis
  track_record: {
    promises_vs_actions: PromiseAction[]
    voting_patterns: VotingRecord[]
    policy_outcomes: PolicyOutcome[]
    accountability_moments: AccountabilityMoment[]
  }
  
  // REQUIRED: Citizen engagement guide
  citizen_engagement: {
    contact_methods: ContactMethod[]
    pressure_points: string[]
    coalition_opportunities: string[]
    monitoring_tools: string[]
  }
  
  // Avoid personality focus
  focuses_on_systems: boolean
  evidence_based_assessment: boolean
  primary_sources: SourceReference[]
}
```

---

## Database Schema Rules

### Content Tables
When creating or modifying content-related tables:

#### Source Validation
```sql
-- All content tables MUST include source tracking
CREATE TABLE content_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- REQUIRED: Source validation
  primary_sources JSONB NOT NULL, -- Array of SourceReference objects
  credibility_score INTEGER NOT NULL CHECK (credibility_score >= 0 AND credibility_score <= 100),
  fact_checked_at TIMESTAMPTZ,
  fact_checker_id UUID REFERENCES users(id),
  
  -- REQUIRED: Brand voice validation
  brand_voice_validated BOOLEAN NOT NULL DEFAULT FALSE,
  uses_active_voice BOOLEAN NOT NULL DEFAULT FALSE,
  names_specific_institutions BOOLEAN NOT NULL DEFAULT FALSE,
  provides_action_steps BOOLEAN NOT NULL DEFAULT FALSE,
  challenges_assumptions BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Content effectiveness tracking
  engagement_score DECIMAL(5,2),
  civic_action_reported INTEGER DEFAULT 0,
  misconception_correction_score INTEGER
);
```

#### Power Dynamics Tracking
```sql
-- Track power relationships in content
CREATE TABLE power_dynamics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'question', 'topic', 'news_analysis', 'public_figure'
  
  -- Power structure analysis
  institutions_mentioned TEXT[] NOT NULL,
  decision_makers TEXT[] NOT NULL,
  financial_interests JSONB, -- Who benefits financially
  influence_networks JSONB, -- Connections between actors
  
  -- Reveal vs. obscure tracking
  reveals_hidden_power BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_misconceptions BOOLEAN NOT NULL DEFAULT FALSE,
  connects_to_action BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Content Quality Metrics
```sql
-- Track content effectiveness
CREATE TABLE content_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  
  -- Brand alignment scores
  truth_over_comfort_score INTEGER CHECK (truth_over_comfort_score >= 1 AND truth_over_comfort_score <= 10),
  clarity_over_politeness_score INTEGER CHECK (clarity_over_politeness_score >= 1 AND clarity_over_politeness_score <= 10),
  action_over_consumption_score INTEGER CHECK (action_over_consumption_score >= 1 AND action_over_consumption_score <= 10),
  evidence_over_opinion_score INTEGER CHECK (evidence_over_opinion_score >= 1 AND evidence_over_opinion_score <= 10),
  systems_thinking_score INTEGER CHECK (systems_thinking_score >= 1 AND systems_thinking_score <= 10),
  
  -- User outcome tracking
  completion_rate DECIMAL(5,2),
  action_taken_rate DECIMAL(5,2),
  knowledge_retention_score INTEGER,
  civic_engagement_increase DECIMAL(5,2),
  
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### RLS Policies for Content
```sql
-- Content should be accessible but editing requires proper validation
CREATE POLICY "Public content viewing" ON content_base 
  FOR SELECT USING (true);

CREATE POLICY "Fact-checked content editing" ON content_base 
  FOR UPDATE USING (
    brand_voice_validated = true AND 
    fact_checked_at IS NOT NULL AND
    credibility_score >= 70
  );
```

---

## Content Generation Standards

### AI-Assisted Content Generation
When building content generation features:

#### Prompt Engineering Standards
```typescript
interface ContentGenerationPrompt {
  // REQUIRED: CivicSense brand voice injection
  brand_voice_primer: string // "You are generating civic education that politicians don't want people to have..."
  
  // REQUIRED: Power dynamics focus
  power_analysis_requirement: string // "Reveal how power actually flows, not how it's supposed to work..."
  
  // REQUIRED: Action orientation
  action_requirement: string // "Every piece of content must lead to specific citizen actions..."
  
  // REQUIRED: Source validation
  source_requirement: string // "All claims must be verifiable through primary sources..."
  
  // Content type specific requirements
  content_type: 'quiz' | 'topic' | 'news_analysis' | 'public_figure'
  specific_requirements: Record<string, string>
  
  // Quality filters
  avoid_patterns: string[] // ["both sides", "some experts", "it's complicated without explanation"]
  required_patterns: string[] // ["Here's what they don't want you to know", "This is how power actually works"]
}
```

#### Content Validation Pipeline
```typescript
class ContentValidator {
  // REQUIRED: Brand voice validation
  validateBrandVoice(content: GeneratedContent): BrandVoiceScore {
    return {
      uses_active_voice: this.detectActiveVoice(content.text),
      names_specific_actors: this.detectSpecificNaming(content.text),
      provides_uncomfortable_truths: this.detectUncomfortableTruths(content.text),
      connects_to_action: this.detectActionableSteps(content.text),
      challenges_assumptions: this.detectAssumptionChallenges(content.text)
    }
  }
  
  // REQUIRED: Power dynamics validation  
  validatePowerDynamics(content: GeneratedContent): PowerDynamicsScore {
    return {
      reveals_hidden_power: this.detectHiddenPowerRevealed(content.text),
      names_decision_makers: this.detectDecisionMakerNaming(content.text),
      follows_money: this.detectFinancialAnalysis(content.text),
      exposes_process_gaps: this.detectProcessGapExposure(content.text)
    }
  }
  
  // REQUIRED: Source validation
  validateSources(content: GeneratedContent): SourceValidationResult {
    return {
      has_primary_sources: content.sources.some(s => s.type === 'primary'),
      credible_sources: content.sources.filter(s => s.credibility_score >= 70).length,
      source_diversity: this.calculateSourceDiversity(content.sources),
      fact_checkable_claims: this.extractFactCheckableClaims(content.text)
    }
  }
}
```

### Content Enhancement Rules
```typescript
// REQUIRED: All generated content must be enhanced for CivicSense brand
interface ContentEnhancement {
  // Add uncomfortable truths
  addUncomfortableTruths(content: string): string
  
  // Convert passive to active voice
  activatePassiveConstructions(content: string): string
  
  // Add specific naming
  addSpecificInstitutions(content: string): string
  
  // Connect to citizen action
  addActionableSteps(content: string): string
  
  // Challenge assumptions
  addAssumptionChallenges(content: string): string
  
  // Reveal power dynamics
  addPowerDynamicsAnalysis(content: string): string
}
```

---

## Quality Validation Rules

### Automated Content Quality Checks
```typescript
interface ContentQualityCheck {
  // REQUIRED: Brand voice alignment
  brandVoiceChecks: {
    usesActiveVoice: boolean
    avoidsPassiveObfuscation: boolean
    namesSpeicificActors: boolean
    providesClearActions: boolean
    challengesAssumptions: boolean
  }
  
  // REQUIRED: Educational effectiveness
  educationalChecks: {
    buildsKnowledgeForAction: boolean
    connectsToPersonalConsequences: boolean
    revealsSystemicPatterns: boolean
    empowersRatherThanOverwhelms: boolean
  }
  
  // REQUIRED: Factual accuracy
  accuracyChecks: {
    hasVerifiableClaims: boolean
    citesPrimarySources: boolean
    distinguishesFactFromAnalysis: boolean
    includesConflictDisclosure: boolean
  }
  
  // REQUIRED: Accessibility without dumbing down
  accessibilityChecks: {
    readabilityScore: number // 8th-10th grade level
    usesConcreteExamples: boolean
    structuredForScanning: boolean
    multipleEntryPoints: boolean
  }
}
```

### Content Scoring Algorithm
```typescript
class ContentScorer {
  calculateOverallScore(content: Content): ContentScore {
    const brandVoiceScore = this.scoreBrandVoice(content) * 0.3
    const educationalScore = this.scoreEducationalValue(content) * 0.25
    const accuracyScore = this.scoreAccuracy(content) * 0.25
    const actionabilityScore = this.scoreActionability(content) * 0.2
    
    return {
      overall: brandVoiceScore + educationalScore + accuracyScore + actionabilityScore,
      breakdown: {
        brandVoice: brandVoiceScore,
        educational: educationalScore,
        accuracy: accuracyScore,
        actionability: actionabilityScore
      }
    }
  }
  
  // Content must score >= 70 to be published
  meetsPublicationStandard(score: ContentScore): boolean {
    return score.overall >= 70 && 
           score.breakdown.brandVoice >= 70 &&
           score.breakdown.accuracy >= 80
  }
}
```

---

## API Development Guidelines

### Content API Endpoints
When building content-related APIs:

#### Content Creation Endpoints
```typescript
// REQUIRED: All content creation must include validation
POST /api/content/create
{
  content: ContentInput,
  validation: {
    brand_voice_check: boolean,
    fact_check_required: boolean,
    power_dynamics_analysis: boolean,
    action_steps_included: boolean
  }
}

// REQUIRED: Content must be validated before activation
PATCH /api/content/{id}/validate
{
  validation_type: 'brand_voice' | 'fact_check' | 'power_dynamics' | 'final_approval',
  validator_id: string,
  validation_notes: string,
  approved: boolean
}

// REQUIRED: Track content effectiveness
POST /api/content/{id}/track-engagement
{
  user_id: string,
  engagement_type: 'viewed' | 'completed' | 'action_taken' | 'shared',
  action_details?: string,
  civic_engagement_increase?: number
}
```

#### Content Quality Endpoints
```typescript
// REQUIRED: Real-time content scoring
GET /api/content/{id}/quality-score
Response: {
  overall_score: number,
  brand_voice_score: number,
  educational_value: number,
  accuracy_score: number,
  actionability_score: number,
  meets_publication_standard: boolean
}

// REQUIRED: Content improvement suggestions
GET /api/content/{id}/improvement-suggestions
Response: {
  brand_voice_improvements: string[],
  power_dynamics_enhancements: string[],
  action_step_additions: string[],
  source_validation_needs: string[]
}
```

### Content Retrieval Standards
```typescript
// REQUIRED: Content must include power dynamics context
interface ContentResponse {
  id: string
  content: ContentData
  
  // REQUIRED: Power context
  power_dynamics: {
    institutions_involved: string[]
    decision_makers: string[]
    hidden_stakeholders: string[]
    citizen_leverage_points: string[]
  }
  
  // REQUIRED: Action guidance
  citizen_actions: {
    immediate_steps: string[]
    long_term_strategy: string[]
    coalition_opportunities: string[]
    monitoring_tools: string[]
  }
  
  // REQUIRED: Source validation
  source_quality: {
    credibility_score: number
    primary_source_count: number
    fact_check_status: 'verified' | 'pending' | 'disputed'
    last_fact_check: string
  }
}
```

---

## Frontend Content Display

### Component Development Standards
When building content display components:

#### Content Presentation Requirements
```typescript
interface ContentDisplayProps {
  content: Content
  
  // REQUIRED: Emphasize uncomfortable truths
  highlightUncomfortableTruths: boolean
  
  // REQUIRED: Make power dynamics visible
  showPowerDynamics: boolean
  
  // REQUIRED: Promote action over consumption
  emphasizeActionSteps: boolean
  
  // REQUIRED: Show source credibility
  displaySourceValidation: boolean
}

// REQUIRED: Content components must include action CTAs
const ContentDisplay: React.FC<ContentDisplayProps> = ({ content }) => {
  return (
    <div className="content-display">
      {/* REQUIRED: Lead with stakes and uncomfortable truth */}
      <UncomfortableTruthHeader truth={content.uncomfortable_truth} />
      
      {/* REQUIRED: Show how power actually works */}
      <PowerDynamicsVisualization dynamics={content.power_dynamics} />
      
      {/* Main content with active voice emphasis */}
      <ContentBody content={content.body} emphasizeActiveVoice />
      
      {/* REQUIRED: Action steps prominently displayed */}
      <ActionStepsCallout steps={content.action_steps} />
      
      {/* REQUIRED: Source credibility indicators */}
      <SourceValidationDisplay sources={content.sources} />
    </div>
  )
}
```

#### User Engagement Tracking
```typescript
// REQUIRED: Track civic engagement, not just content consumption
interface EngagementTracking {
  // Consumption metrics (lower priority)
  views: number
  time_spent: number
  completion_rate: number
  
  // Civic action metrics (higher priority)  
  actions_taken: number
  civic_contacts_made: number
  knowledge_applied: number
  misconceptions_corrected: number
  
  // System understanding metrics
  power_dynamics_understood: boolean
  can_identify_leverage_points: boolean
  connects_local_to_systemic: boolean
}
```

### Content Enhancement UI
```typescript
// REQUIRED: UI for content validation and improvement
const ContentEditor: React.FC = () => {
  return (
    <div className="content-editor">
      {/* REQUIRED: Brand voice validation panel */}
      <BrandVoiceValidator 
        content={content}
        checkActiveVoice
        checkSpecificNaming
        checkUncomfortableTruths
        checkActionability
      />
      
      {/* REQUIRED: Power dynamics analysis */}
      <PowerDynamicsAnalyzer
        content={content}
        identifyHiddenPower
        mapDecisionMakers
        revealFinancialInterests
      />
      
      {/* REQUIRED: Source validation */}
      <SourceValidator
        sources={content.sources}
        requirePrimarySources
        checkCredibility
        validateClaims
      />
      
      {/* REQUIRED: Action step generator */}
      <ActionStepGenerator
        content={content}
        generateImmediateActions
        createStrategicPlans
        identifyCoalitionOpportunities
      />
    </div>
  )
}
```

---

## Content Workflow Automation

### Automated Content Pipeline
```typescript
// REQUIRED: All content must go through CivicSense validation pipeline
class ContentPipeline {
  async processContent(rawContent: RawContent): Promise<ProcessedContent> {
    // 1. REQUIRED: Brand voice transformation
    const brandAligned = await this.alignWithBrandVoice(rawContent)
    
    // 2. REQUIRED: Power dynamics analysis injection
    const powerAnalyzed = await this.addPowerDynamicsAnalysis(brandAligned)
    
    // 3. REQUIRED: Action step generation
    const actionable = await this.generateActionSteps(powerAnalyzed)
    
    // 4. REQUIRED: Source validation
    const sourceValidated = await this.validateSources(actionable)
    
    // 5. REQUIRED: Quality scoring
    const scored = await this.scoreContent(sourceValidated)
    
    // 6. REQUIRED: Publication readiness check
    if (!this.meetsPublicationStandards(scored)) {
      throw new Error('Content does not meet CivicSense standards')
    }
    
    return scored
  }
  
  // REQUIRED: Continuous content quality improvement
  async improveExistingContent(contentId: string): Promise<void> {
    const content = await this.getContent(contentId)
    const qualityScore = await this.scoreContent(content)
    
    if (qualityScore.overall < 80) {
      const improvements = await this.generateImprovements(content, qualityScore)
      await this.applyImprovements(contentId, improvements)
    }
  }
}
```

### Content Monitoring and Alerts
```typescript
// REQUIRED: Monitor content effectiveness and flag issues
class ContentMonitor {
  // Alert when content doesn't meet CivicSense standards
  monitorContentQuality(): void {
    setInterval(async () => {
      const lowQualityContent = await this.findLowQualityContent()
      
      for (const content of lowQualityContent) {
        await this.alertContentTeam({
          contentId: content.id,
          issues: this.identifyIssues(content),
          suggestedImprovements: this.generateImprovements(content)
        })
      }
    }, 24 * 60 * 60 * 1000) // Daily monitoring
  }
  
  // Track civic engagement outcomes
  trackCivicImpact(): void {
    setInterval(async () => {
      const engagementMetrics = await this.getCivicEngagementMetrics()
      
      if (engagementMetrics.actions_taken_rate < 0.1) {
        await this.alertLowActionableContent()
      }
      
      if (engagementMetrics.misconceptions_corrected < 100) {
        await this.alertIneffectiveEducation()
      }
    }, 7 * 24 * 60 * 60 * 1000) // Weekly monitoring
  }
}
```

---

## Module Export Management Rule

### Always Export Public Functions, Types, and Classes

**Problem**: As modules grow, it's easy to forget to export new functions, types, and classes, leading to import errors and broken functionality.

**Solution**: Follow these patterns for consistent module exports:

#### 1. Export-First Development
When creating new functions, types, or classes, immediately add them to the module exports:

```typescript
// ✅ Good: Export immediately when creating
export function newFunction() {
  // implementation
}

export interface NewInterface {
  // properties
}

export class NewClass {
  // implementation
}

// ✅ Good: Grouped exports at bottom for overview
export {
  existingFunction,
  anotherFunction,
  SomeClass,
  type SomeType
}
```

#### 2. Export Validation Checklist
Before committing changes to shared modules (especially `lib/` files):

- [ ] All new public functions are exported
- [ ] All new interfaces/types that are used externally are exported  
- [ ] All new classes that are instantiated externally are exported
- [ ] Export statements are organized (grouped at end or inline)
- [ ] No internal/private functions are accidentally exported

#### 3. Module Structure Pattern
For complex modules like `lib/multiplayer.ts`, organize exports in sections:

```typescript
// =============================================================================
// TYPES & INTERFACES (Export inline)
// =============================================================================
export interface PublicInterface {}
export type PublicType = string

// =============================================================================
// CLASSES (Export inline)
// =============================================================================
export class PublicClass {}

// =============================================================================
// FUNCTIONS (Export inline or grouped)
// =============================================================================
export function publicFunction() {}

// =============================================================================
// HOOKS (Export inline)
// =============================================================================
export function useCustomHook() {}

// =============================================================================
// CONSTANTS (Export inline)
// =============================================================================
export const PUBLIC_CONSTANT = 'value'

// =============================================================================
// GROUPED EXPORTS (Optional - for existing code)
// =============================================================================
export {
  legacyFunction1,
  legacyFunction2,
  type LegacyType
}
```

#### 4. Import Testing Pattern
When adding exports, immediately test imports in a consuming file:

```typescript
// Test import in component or another module
import { 
  newFunction, 
  NewInterface, 
  NewClass 
} from '@/lib/module-name'

// Verify TypeScript doesn't complain
```

#### 5. Common Export Mistakes to Avoid

**❌ Don't**: Forget to export interfaces used as props
```typescript
interface ComponentProps {} // Not exported but used externally
export function Component(props: ComponentProps) {}
```

**✅ Do**: Export interfaces used externally
```typescript
export interface ComponentProps {}
export function Component(props: ComponentProps) {}
```

**❌ Don't**: Export internal utilities
```typescript
export function internalHelper() {} // Should be private
```

**✅ Do**: Keep internal functions private
```typescript
function internalHelper() {} // Private utility
export function publicAPI() {
  return internalHelper()
}
```

#### 6. Module Dependencies
When a module grows large, consider splitting it but maintain backward compatibility:

```typescript
// Original module re-exports from split modules
export * from './module-section-a'
export * from './module-section-b'
export { legacyFunction } from './legacy-functions'
```

This rule helps prevent the "export not found" errors that break functionality as the codebase scales.

**Remember: Every line of code should advance our mission of transforming passive observers into confident, effective participants in democracy. We're building civic education that politicians don't want people to have.** 