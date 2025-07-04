# CivicSense Source Diversity Guide

## Problem Statement
Users noticed the carousel was showing mostly "center" and "lean left" sources, indicating insufficient political diversity in our source analysis fallback database.

## Solution: Balanced Source Database

### Current Distribution Target
Based on AllSides Media Bias Chart, we should aim for:

- **Far Left**: 5% (activist publications)
- **Left**: 15% (progressive publications)  
- **Lean Left**: 25% (mainstream liberal media)
- **Center**: 20% (balanced reporting)
- **Lean Right**: 25% (mainstream conservative media)
- **Right**: 15% (conservative publications)
- **Far Right**: 5% (activist publications)

### Recently Added Sources (January 2025)

#### Conservative/Right-Leaning
- `dailywire.com` (right) - Popular conservative news
- `nationalreview.com` (right) - Intellectual conservative magazine
- `breitbart.com` (right) - Conservative news aggregator  
- `townhall.com` (right) - Conservative commentary
- `nypost.com` (lean_right) - NYC tabloid with conservative editorial
- `washingtonexaminer.com` (lean_right) - Conservative newspaper
- `washingtontimes.com` (lean_right) - Conservative daily
- `economist.com` (lean_right) - Business/economics focus
- `realclearpolitics.com` (lean_right) - Political news aggregator
- `reason.com` (lean_right) - Libertarian magazine

#### Liberal/Left-Leaning  
- `huffpost.com` (left) - Progressive news aggregator
- `salon.com` (left) - Liberal commentary and news
- `motherjones.com` (left) - Progressive investigative journalism
- `thenation.com` (left) - Progressive magazine
- `theintercept.com` (left) - Investigative journalism
- `vox.com` (lean_left) - Explanatory journalism
- `slate.com` (lean_left) - Liberal commentary
- `theguardian.com` (lean_left) - International perspective
- `theatlantic.com` (lean_left) - Long-form journalism
- `propublica.org` (lean_left) - Investigative nonprofit

#### True Center
- `csmonitor.com` (center) - Christian Science Monitor
- `axios.com` (center) - Smart brevity news
- `allsides.com` (center) - Media bias analysis

### How to Add New Sources

1. **Research the source** using:
   - AllSides Media Bias Chart
   - Media Bias/Fact Check ratings
   - Ad Fontes Media Interactive Media Bias Chart

2. **Determine ratings**:
   - `overallCredibility`: 0.0-1.0 based on factual accuracy
   - `overallBias`: Political lean based on editorial stance
   - `factualRating`: Factual accuracy level

3. **Add to fallback database** in `source-analysis-service.ts`

### Missing Source Categories to Add

#### High Priority - Conservative Balance
- `foxnews.com` (right) - Major conservative TV network
- `oann.com` (right) - One America News  
- `newsmax.com` (right) - Conservative news network
- `theblaze.com` (right) - Glenn Beck's network
- `redstate.com` (right) - Conservative blog network
- `pjmedia.com` (right) - Conservative commentary

#### High Priority - Liberal Balance  
- `democracynow.org` (left) - Independent news program
- `commondreams.org` (left) - Progressive news
- `truthout.org` (left) - Progressive journalism
- `thinkprogress.org` (left) - Progressive news (if still active)

#### Regional/Local Sources
- Local newspaper websites from different regions
- State-specific news sources
- International perspectives (BBC, Al Jazeera, etc.)

#### Specialized Sources
- `thehill.com` (center) - Capitol Hill focused
- `politico.com` (center) - Political news and analysis
- `rollcall.com` (center) - Congressional coverage
- `governing.com` (center) - State/local government

### Quality Control Guidelines

**Minimum Credibility Thresholds:**
- All sources: ≥ 0.50 credibility
- Recommended sources: ≥ 0.65 credibility  
- Highly recommended: ≥ 0.80 credibility

**Factual Rating Standards:**
- Include sources with 'mixed' ratings for diversity
- Prioritize 'mostly_factual' and above for main recommendations
- Include explanatory text for lower-rated sources

### Monitoring Source Balance

Run this analysis periodically to check political balance:

```javascript
// Count sources by bias in the fallback database
const biasDistribution = {};
Object.values(knownDefaults).forEach(source => {
  biasDistribution[source.overallBias] = (biasDistribution[source.overallBias] || 0) + 1;
});
console.log('Current bias distribution:', biasDistribution);
```

### User Education Strategy

When showing sources with different bias ratings:
1. **Always show the bias rating clearly**
2. **Explain what the rating means**
3. **Encourage cross-reference reading**
4. **Highlight when sources agree across political spectrum**
5. **Show how to identify bias in reporting**

This ensures users become **harder to manipulate, more difficult to ignore, and impossible to fool** - core to CivicSense's democratic mission.

---

*Last updated: January 2025 - Based on AllSides Media Bias Chart v8.0* 