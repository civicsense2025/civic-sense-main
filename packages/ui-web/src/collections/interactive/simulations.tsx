import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Slider } from '../ui/slider'
import { Separator } from '../ui/separator'
import { Settings, Users, GitBranch, RotateCcw, Play } from 'lucide-react'
import type { 
  SimulationConfig, 
  RolePlayConfig, 
  DecisionTreeConfig,
  CompletionCallback 
} from './types'

// Simulation Component
export function Simulation({ config, onComplete }: { config: SimulationConfig; onComplete: CompletionCallback }) {
  const [variables, setVariables] = useState<Record<string, number>>(
    Object.fromEntries(config.variables.map(v => [v.name, v.default]))
  )
  const [hasRun, setHasRun] = useState(false)
  const [outcome, setOutcome] = useState<string>('')

  const handleVariableChange = (name: string, value: number[]) => {
    setVariables(prev => ({ ...prev, [name]: value[0] }))
    setHasRun(false) // Reset outcome when variables change
  }

  const runSimulation = () => {
    // Simple outcome calculation based on variables
    try {
      // This would normally use the config.outcome_function
      // For now, we'll create a simple example outcome
      const total = Object.values(variables).reduce((sum, val) => sum + val, 0)
      const average = total / Object.values(variables).length
      
      let result = ''
      if (average < 30) {
        result = 'Low impact: Current settings result in minimal change.'
      } else if (average < 70) {
        result = 'Moderate impact: Some positive changes are visible.'
      } else {
        result = 'High impact: Significant positive outcomes achieved!'
      }
      
      setOutcome(result)
      setHasRun(true)
      onComplete(true, { variables, outcome: result })
    } catch (error) {
      setOutcome('Error calculating outcome. Please check your inputs.')
      setHasRun(true)
    }
  }

  const resetSimulation = () => {
    setVariables(Object.fromEntries(config.variables.map(v => [v.name, v.default])))
    setHasRun(false)
    setOutcome('')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Settings className="h-5 w-5 inline mr-2" />
            Policy Simulation
          </CardTitle>
          <Button variant="outline" size="sm" onClick={resetSimulation}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Scenario</h3>
          <p className="text-gray-700">{config.scenario}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Adjust Variables</h4>
          
          {config.variables.map((variable) => (
            <div key={variable.name} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {variable.name}
                </label>
                <span className="text-sm text-gray-600">
                  {variables[variable.name]}
                </span>
              </div>
              
              <Slider
                min={variable.min}
                max={variable.max}
                step={variable.step}
                value={[variables[variable.name]]}
                onValueChange={(value) => handleVariableChange(variable.name, value)}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>{variable.min}</span>
                <span>{variable.max}</span>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={runSimulation} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Run Simulation
        </Button>

        {hasRun && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Simulation Results</h4>
            <p className="text-blue-800">{outcome}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Role Play Component
export function RolePlay({ config, onComplete }: { config: RolePlayConfig; onComplete: CompletionCallback }) {
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [decisions, setDecisions] = useState<Record<number, string[]>>({})
  const [isComplete, setIsComplete] = useState(false)

  const handleRoleSelect = (roleIndex: number) => {
    setSelectedRole(roleIndex)
  }

  const handleDecision = (decision: string) => {
    if (selectedRole === null) return

    setDecisions(prev => ({
      ...prev,
      [currentRound]: [...(prev[currentRound] || []), decision]
    }))

    if (currentRound < config.rounds) {
      setCurrentRound(prev => prev + 1)
    } else {
      setIsComplete(true)
      onComplete(true, { role: selectedRole, decisions })
    }
  }

  const currentRole = selectedRole !== null ? config.roles[selectedRole] : null
  const progress = (currentRound / config.rounds) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Users className="h-5 w-5 inline mr-2" />
          Role Playing Exercise
        </CardTitle>
        {selectedRole !== null && (
          <Progress value={progress} className="h-2" />
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Scenario</h3>
          <p className="text-gray-700">{config.scenario}</p>
        </div>

        {selectedRole === null ? (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Choose Your Role</h4>
            
            <div className="grid gap-3">
              {config.roles.map((role, index) => (
                <button
                  key={index}
                  onClick={() => handleRoleSelect(index)}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h5 className="font-medium text-gray-900 mb-2">{role.name}</h5>
                  <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Objectives:</p>
                    {role.objectives.map((objective, objIndex) => (
                      <p key={objIndex} className="text-xs text-gray-600">
                        • {objective}
                      </p>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : !isComplete ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{currentRole?.name}</Badge>
                <span className="text-sm text-gray-600">Round {currentRound} of {config.rounds}</span>
              </div>
              <p className="text-sm text-blue-800">{currentRole?.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                What action do you take this round?
              </h4>
              
              <div className="space-y-2">
                {currentRole?.objectives.map((objective, index) => (
                  <button
                    key={index}
                    onClick={() => handleDecision(objective)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{objective}</p>
                  </button>
                ))}
                
                {/* Generic options */}
                <button
                  onClick={() => handleDecision('Negotiate with other stakeholders')}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    Negotiate with other stakeholders
                  </p>
                </button>
                
                <button
                  onClick={() => handleDecision('Gather more information')}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    Gather more information
                  </p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Role Play Complete!</h4>
              <p className="text-sm text-green-800">
                You played as {currentRole?.name} for {config.rounds} rounds.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Decisions</h4>
              {Object.entries(decisions).map(([round, roundDecisions]) => (
                <div key={round} className="mb-2">
                  <p className="text-sm font-medium text-gray-700">Round {round}:</p>
                  {roundDecisions.map((decision, index) => (
                    <p key={index} className="text-sm text-gray-600 ml-4">• {decision}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Decision Tree Component
export function DecisionTree({ config, onComplete }: { config: DecisionTreeConfig; onComplete: CompletionCallback }) {
  const [currentQuestion, setCurrentQuestion] = useState(config.root_question)
  const [path, setPath] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [finalOutcome, setFinalOutcome] = useState<string>('')

  const handleChoice = (option: any) => {
    const newPath = [...path, option.text]
    setPath(newPath)

    if (option.final_outcome) {
      setFinalOutcome(option.final_outcome)
      setIsComplete(true)
      onComplete(true, { path: newPath, outcome: option.final_outcome })
    } else if (option.next_question) {
      setCurrentQuestion(option.next_question)
    } else {
      // Default outcome if no specific outcome provided
      setFinalOutcome(option.consequence)
      setIsComplete(true)
      onComplete(true, { path: newPath, outcome: option.consequence })
    }
  }

  const restart = () => {
    setCurrentQuestion(config.root_question)
    setPath([])
    setIsComplete(false)
    setFinalOutcome('')
  }

  // Find current options
  const currentOptions = config.options

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <GitBranch className="h-5 w-5 inline mr-2" />
            Decision Path
          </CardTitle>
          {path.length > 0 && (
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Path Breadcrumb */}
        {path.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Your path:</p>
            <div className="flex flex-wrap gap-1">
              {path.map((step, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {step}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!isComplete ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Decision Point
              </h3>
              <p className="text-gray-700">{currentQuestion}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Choose your response:</h4>
              
              {currentOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(option)}
                  className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900 mb-1">{option.text}</p>
                  <p className="text-sm text-gray-600">{option.consequence}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Final Outcome</h4>
              <p className="text-blue-800">{finalOutcome}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Reflection
              </h4>
              <p className="text-sm text-gray-600">
                Consider how different choices might have led to different outcomes. 
                Real policy decisions often have complex consequences that aren't immediately apparent.
              </p>
            </div>

            <Button onClick={restart} variant="outline" className="w-full">
              Try Different Path
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 