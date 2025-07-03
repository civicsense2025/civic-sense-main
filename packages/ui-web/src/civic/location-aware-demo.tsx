'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Phone, Mail, Globe, MapPin, Users, AlertTriangle } from 'lucide-react'
import { locationCivicService, representativeContentService } from '@civicsense/shared/services/location-civic-apis'
import type { Representative, RepresentativeResults } from '@civicsense/shared/services/location-civic-apis'

/**
 * Demo component for CivicSense Location-Aware Civic Engagement
 * Shows how users can find their representatives and get action steps
 */
export function LocationAwareCivicDemo() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RepresentativeResults | null>(null)
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!address.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)
    setSelectedRep(null)

    try {
      const data = await locationCivicService.getAllRepresentatives(address)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find representatives')
    } finally {
      setLoading(false)
    }
  }

  const getActionSteps = (representative: Representative) => {
    return representativeContentService.generateActionSteps(representative, ['healthcare', 'climate change'])
  }

  const renderRepresentative = (rep: Representative) => (
    <Card key={rep.id} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{rep.name}</CardTitle>
            <CardDescription>{rep.office}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={rep.level === 'federal' ? 'default' : rep.level === 'state' ? 'secondary' : 'outline'}>
              {rep.level}
            </Badge>
            {rep.party && (
              <Badge variant="outline">{rep.party}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rep.district && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              District {rep.district}
            </div>
          )}
          
          <div className="flex gap-2">
            {rep.phone && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`tel:${rep.phone}`)}
              >
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            )}
            {rep.email && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`mailto:${rep.email}`)}
              >
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
            )}
            {rep.website && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(rep.website, '_blank')}
              >
                <Globe className="w-4 h-4 mr-1" />
                Website
              </Button>
            )}
          </div>

          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={() => setSelectedRep(rep)}
          >
            Get Action Steps
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderActionSteps = (rep: Representative) => {
    const steps = getActionSteps(rep)
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xl">Take Action: Contact {rep.name}</CardTitle>
          <CardDescription>
            Here's how to effectively influence {rep.name}'s position on issues you care about
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={step.impact === 'very_high' ? 'default' : 'secondary'}>
                    {step.impact.replace('_', ' ')} impact
                  </Badge>
                  <Badge variant="outline">
                    {step.difficulty}
                  </Badge>
                </div>
                
                <h4 className="font-semibold">{step.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                
                {step.contact && (
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                    Contact: {step.contact}
                  </p>
                )}
                
                {step.script && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View Call Script
                    </summary>
                    <pre className="text-xs bg-gray-50 p-3 rounded mt-2 whitespace-pre-wrap">
                      {step.script}
                    </pre>
                  </details>
                )}
                
                {step.template && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View Email Template
                    </summary>
                    <pre className="text-xs bg-gray-50 p-3 rounded mt-2 whitespace-pre-wrap">
                      {step.template}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">💡 CivicSense Pro Tips</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Phone calls are 10x more effective than emails</li>
              <li>• Be specific about what you want them to do</li>
              <li>• Share your personal story and local impact</li>
              <li>• Follow up within a week if you don't get a response</li>
              <li>• Public pressure works - attend town halls when possible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Find Your Representatives</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Connect your civic learning to real action. Enter your address to find your representatives 
          and get specific steps to influence their decisions.
        </p>
      </div>

      {/* Address Search */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who Represents You?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your address (e.g., 123 Main St, Austin, TX 78701)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !address.trim()}>
              {loading ? 'Searching...' : 'Find Reps'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Coverage Status */}
          <Card>
            <CardHeader>
              <CardTitle>Data Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Badge variant={results.coverage.federal === 'complete' ? 'default' : 'destructive'}>
                  Federal: {results.coverage.federal}
                </Badge>
                <Badge variant={results.coverage.state === 'complete' ? 'default' : 'destructive'}>
                  State: {results.coverage.state}
                </Badge>
                <Badge variant={results.coverage.local === 'complete' ? 'default' : 'destructive'}>
                  Local: {results.coverage.local}
                </Badge>
              </div>
              
              {results.errors.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">Data Issues:</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Federal Representatives */}
          {results.federal.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Federal Representatives</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.federal.map(renderRepresentative)}
              </div>
            </div>
          )}

          {/* State Representatives */}
          {results.state.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">State Representatives</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.state.map(renderRepresentative)}
              </div>
            </div>
          )}

          {/* Local Representatives */}
          {results.local.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Local Representatives</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.local.map(renderRepresentative)}
              </div>
            </div>
          )}

          {/* Local Lookup Guide */}
          {results.coverage.local === 'manual_lookup_required' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Local Officials Not Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 mb-4">
                  We couldn't automatically find your local representatives. Here's how to find them:
                </p>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• Visit your city/county website</li>
                  <li>• Check Ballotpedia.org for local election info</li>
                  <li>• Contact your local clerk's office</li>
                  <li>• Help us improve by reporting missing data</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Steps Modal */}
      {selectedRep && renderActionSteps(selectedRep)}
      
      {selectedRep && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setSelectedRep(null)}>
            ← Back to Representatives
          </Button>
        </div>
      )}
    </div>
  )
} 