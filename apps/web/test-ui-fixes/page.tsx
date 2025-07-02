"use client"

import { Progress } from "@civicsense/ui-web/components/ui/progress"
import { Checkbox } from "@civicsense/ui-web/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@civicsense/ui-web/components/ui/radio-group"
import { Label } from "@civicsense/ui-web/components/ui/label"
import { Separator } from "@civicsense/ui-web/components/ui/separator"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { Badge } from "@civicsense/ui-web/components/ui/badge"
import { useState } from "react"

export default function TestUIFixesPage() {
  const [progress, setProgress] = useState(45)
  const [checked, setChecked] = useState(false)
  const [radioValue, setRadioValue] = useState("option1")

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            UI Elements Test Page
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Testing that circles stay circular, progress bars are thin, and separators are thin
          </p>
        </div>

        {/* Progress Bars */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Progress Bars (Should be thin)
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label>Default Progress Bar</Label>
              <Progress value={progress} className="w-full" />
            </div>
            
            <div>
              <Label>Custom thin Progress Bar</Label>
              <Progress value={75} className="h-1 w-full" />
            </div>
            
            <div>
              <Label>Medium Progress Bar</Label>
              <Progress value={60} className="h-2 w-full" />
            </div>
            
            <Button 
              onClick={() => setProgress(Math.random() * 100)}
              className="mt-4"
            >
              Randomize Progress
            </Button>
          </div>
        </section>

        <Separator />

        {/* Checkboxes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Checkboxes (Should be square)
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="checkbox1" 
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
              />
              <Label htmlFor="checkbox1">Standard checkbox</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="checkbox2" />
              <Label htmlFor="checkbox2">Another checkbox</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="checkbox3" defaultChecked />
              <Label htmlFor="checkbox3">Checked checkbox</Label>
            </div>
          </div>
        </section>

        <Separator />

        {/* Radio Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Radio Buttons (Should be circular)
          </h2>
          
          <RadioGroup value={radioValue} onValueChange={setRadioValue}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="r1" />
              <Label htmlFor="r1">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option2" id="r2" />
              <Label htmlFor="r2">Option 2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option3" id="r3" />
              <Label htmlFor="r3">Option 3</Label>
            </div>
          </RadioGroup>
        </section>

        <Separator />

        {/* Circular Elements */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Circular Elements (Should stay circular)
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
              B
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold">
              C
            </div>
            <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-lg font-bold">
              D
            </div>
          </div>
        </section>

        <Separator />

        {/* Separators */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Separators (Should be thin lines)
          </h2>
          
          <div className="space-y-4">
            <p>Text above separator</p>
            <Separator />
            <p>Text below separator</p>
            
            <div className="flex items-center space-x-4">
              <span>Left text</span>
              <Separator orientation="vertical" className="h-8" />
              <span>Right text</span>
            </div>
          </div>
        </section>

                  {/* Badges Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Badges (Should be pill-shaped with Space Mono font)
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
                <Badge variant="destructive">Destructive Badge</Badge>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">🔥 trending</Badge>
                <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">intermediate</Badge>
                <Badge className="bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400">✓ Featured</Badge>
                <Badge className="bg-red-600 text-white">Breaking</Badge>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  ⭐ FEATURED
                </Badge>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  🔥 trending
                </Badge>
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Civil Rights
                </Badge>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All badges should be horizontal pill shapes, not circles. They should use Space Mono font.
              </p>
              
              {/* Notification Badge Test */}
              <div className="flex items-center gap-4 mt-6">
                <p className="text-sm font-medium">Notification Badge Test:</p>
                <div className="relative inline-block">
                  <Button variant="outline">
                    Pods
                  </Button>
                  <Badge className="notification-badge absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white border-0">
                    3
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">← Should be a perfect circle</p>
              </div>
            </div>
          </section>

        <Separator />

        {/* Test various sized buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Button Sizes (Should maintain aspect ratios)
          </h2>
          
          <div className="flex items-center space-x-4">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" className="rounded-full">
              ✓
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
} 