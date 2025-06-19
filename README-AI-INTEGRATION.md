# CivicSense AI Integration System

*Unified quality enforcement for all AI components*

## 🎯 What This System Does

This system ensures that **every AI agent** across CivicSense - from survey optimizers to content generators to question validators - follows the **exact same quality standards** and produces content that lives up to our brand promise: **"civic education that politicians don't want you to have."**

## 🔥 Key Features

### ✅ **Zero Quality Deviation**
- Every AI output must score **70+ overall** on our quality rubric
- **Uncomfortable truths** detected in every piece of content  
- **Power dynamics analysis** revealing who actually makes decisions
- **3+ specific civic action steps** with contact information
- **Primary source verification** with web search integration

### ✅ **Brand Voice Enforcement**  
- **Active voice** naming specific actors and institutions
- **Truth over comfort** - call lies "lies", corruption "corruption"
- **Action over consumption** - every piece drives civic engagement
- **Systems thinking** - show root causes, not just symptoms

### ✅ **Comprehensive Monitoring**
- Quality metrics tracked across all AI agents
- Real-time alerts when quality drops below thresholds  
- Agent performance comparison and optimization
- Content review workflow with publication recommendations

## 🚀 How to Use

### 1. Basic Usage (Existing Components)
Your existing AI components now automatically enforce quality standards:

```typescript
// BEFORE: Inconsistent AI calls
const response = await fetch('/api/admin/generate-quiz', { ... })

// AFTER: Quality-enforced with monitoring
import { createContentGenerator } from '@/lib/ai/integration-examples'

const generator = createContentGenerator()
const result = await generator.generateQuizFromNews(article, settings)
// ✅ Automatic quality enforcement
// ✅ Brand voice validation  
// ✅ Fact-checking with web search
// ✅ Civic action step generation
```

### 2. Creating New AI Agents
All new AI agents must extend the base class:

```typescript
import { CivicSenseAIAgent } from '@/lib/ai/civic-sense-ai-agent'

export class MyNewAIAgent extends CivicSenseAIAgent {
  readonly agentType = 'my-agent' as const

  // REQUIRED: Implement these methods
  protected async generateInitialContent(input: any): Promise<string> {
    // Your AI logic here
  }

  protected async enforceUncomfortableTruth(content: string): Promise<string> {
    // Add uncomfortable truths politicians don't want known
  }

  protected async addPowerDynamicsAnalysis(content: string): Promise<string> {
    // Reveal who actually makes decisions vs. who appears to
  }

  protected async ensureActionableSteps(content: string): Promise<string> {
    // Add specific civic actions with contact info
  }

  protected async callAI(prompt: string): Promise<string> {
    // Your AI provider integration
  }
}
```

## ⚡ Quality Enforcement Pipeline

Every AI output goes through this **mandatory** quality pipeline:

### 1. **Initial Generation**
- Use shared prompt templates with brand voice enforcement
- AI generates initial content using agent-specific logic

### 2. **Quality Assessment** 
- Content scored on 100-point rubric
- Check for uncomfortable truths, power dynamics, civic actions
- Verify factual claims with web search

### 3. **Enhancement Loop**
If quality standards not met:
- **Add uncomfortable truths** politicians don't want known
- **Enhance power dynamics** showing who actually decides  
- **Generate civic actions** with specific contact information
- **Verify sources** with primary documents

### 4. **Final Validation**
- Ensure 70+ overall quality score
- Confirm uncomfortable truth detected
- Validate 3+ actionable civic steps
- Check 2+ primary sources cited

### 5. **Publication Decision**
- **Publish**: High quality (85+ score)
- **Enhance**: Good quality (70-84 score) 
- **Revise**: Significant issues (50-69 score)
- **Reject**: Critical problems (<50 score)

## 🎯 Quality Standards Enforced

### Content Quality Rubric (100 Points)
- **Brand Voice Boldness** (30 pts) - Uncomfortable truths, active voice, power analysis
- **Power Dynamics Exposure** (25 pts) - Who actually decides vs. who appears to
- **Civic Engagement** (20 pts) - Specific actions with contact information
- **Factual Accuracy** (15 pts) - Verified with primary sources
- **Educational Value** (10 pts) - Builds civic agency and strategic thinking

### Minimum Publication Standards
- ✅ 70+ overall quality score
- ✅ Uncomfortable truth detected
- ✅ 3+ specific civic action steps  
- ✅ 2+ primary sources verified
- ✅ Active voice naming specific actors
- ✅ Power dynamics analysis included

## 📊 Monitoring & Analytics

### Real-time Quality Metrics
- **Overall Quality Trends** - Average scores across all agents
- **Agent Performance** - Individual AI agent effectiveness  
- **Content Standards** - Uncomfortable truths, power dynamics, civic actions
- **Source Verification** - Fact-checking success rates

### Automated Alerts
- 🚨 **Quality Below Threshold** - When average drops below 70
- ⚠️ **Missing Uncomfortable Truths** - Brand voice enforcement failing
- 📊 **Low Source Verification** - Fact-checking needs improvement  
- 🎯 **Insufficient Civic Actions** - Engagement opportunities missed

## 🚀 Getting Started

1. **Read the migration guide** (`.cursor/rules/ai-migration-guide.mdc`)
2. **Update your first component** (start with survey optimizer)  
3. **Test quality enforcement** (run the test script)
4. **Monitor performance** (add the quality dashboard)
5. **Gradually migrate** all AI components

## 🎯 Success Criteria

You'll know the integration is successful when:

✅ **Quality Consistency**: All AI outputs score 70+ with uncomfortable truths detected  
✅ **Brand Voice Alignment**: Content sounds distinctly like CivicSense  
✅ **Power Dynamics**: Every piece reveals who actually makes decisions  
✅ **Civic Action**: Specific, actionable steps with contact information  
✅ **Source Verification**: Primary sources support all claims  
✅ **Monitoring Active**: Quality trends tracked and reported  

---

## The Bottom Line

**This system ensures every AI agent produces content that lives up to our promise: "civic education that politicians don't want you to have."**

No AI agent operates outside these standards. No content gets published without meeting the rubric. No exceptions.

*Every piece of AI-generated content advances our mission of transforming passive observers into confident, effective participants in democracy by revealing how power actually works.* 