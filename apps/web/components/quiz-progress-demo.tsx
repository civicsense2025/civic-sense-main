"use client"

import { QuizProgressIndicator, QuizXPIndicator, QuizAchievementIndicator } from "./quiz-progress-indicator"

export function QuizProgressDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Quiz Progress Indicators</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Different ways to show daily quiz progress
        </p>
      </div>

      {/* Compact Version */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. Compact Progress Bar</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Perfect for navigation bars and headers. Shows progress with a mini progress bar.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <QuizProgressIndicator
            current={2}
            limit={3}
            variant="compact"
          />
        </div>
      </div>

      {/* Detailed Version */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2. Detailed Stats Card</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Comprehensive view with started, completed, and remaining counts. Great for dashboards.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <QuizProgressIndicator
            current={2}
            limit={3}
            variant="detailed"
            showStreak={true}
            streak={5}
            completedToday={1}
          />
        </div>
      </div>

      {/* Circular Version */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">3. Circular Progress</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Clean circular indicator. Perfect for compact spaces and modern UIs.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex justify-center">
          <QuizProgressIndicator
            current={2}
            limit={3}
            variant="circular"
          />
        </div>
      </div>

      {/* Streak Version */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">4. Streak-Focused (Currently Used)</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Combines dot progress with streak indicator. Great for gamification.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <QuizProgressIndicator
            current={2}
            limit={3}
            variant="streak"
            showStreak={true}
            streak={7}
          />
        </div>
      </div>

      {/* Minimal Version */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">5. Minimal Dots</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ultra-minimal dot indicators. Perfect for very compact spaces.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <QuizProgressIndicator
            current={2}
            limit={3}
            variant="minimal"
          />
        </div>
      </div>

      {/* Gaming XP Style */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">6. Gaming XP Bar</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Gaming-inspired XP bar with gradient effects. Great for engagement.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <QuizXPIndicator
            currentXP={200}
            nextLevelXP={500}
          />
        </div>
      </div>

      {/* Achievement Style */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">7. Achievement Style</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Achievement-focused with completion status. Great for goal tracking.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
          <QuizAchievementIndicator
            achievements={2}
          />
          <QuizAchievementIndicator
            achievements={4}
          />
        </div>
      </div>

      {/* Different States */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">8. Different States</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          How indicators look at different progress levels.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Just Started (0/3)</p>
            <QuizProgressIndicator current={0} limit={3} variant="streak" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">In Progress (1/3)</p>
            <QuizProgressIndicator current={1} limit={3} variant="streak" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Almost Done (2/3)</p>
            <QuizProgressIndicator current={2} limit={3} variant="streak" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Limit Reached (3/3)</p>
            <QuizProgressIndicator current={3} limit={3} variant="streak" />
          </div>
        </div>
      </div>

      {/* Premium vs Free */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">9. Premium vs Free Limits</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          How the indicators adapt to different user tiers.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Free User (2/3)</p>
            <QuizProgressIndicator 
              current={2} 
              limit={3} 
              variant="compact" 
              isPremium={false}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Premium User (5/20)</p>
            <QuizProgressIndicator 
              current={5} 
              limit={20} 
              variant="compact" 
              isPremium={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 