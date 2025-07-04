'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  FileText, 
  Users, 
  Calendar, 
  AlertCircle, 
  ExternalLink,
  Share2,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Building,
  Vote
} from 'lucide-react';

interface CongressionalBillDetailProps {
  bill: any; // In production, use proper types
}

export function CongressionalBillDetail({ bill }: CongressionalBillDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate bill progress through Congress
  const progressStages = [
    { key: 'introduced', label: 'Introduced', completed: true },
    { key: 'committee', label: 'Committee', completed: bill.current_status.includes('committee') },
    { key: 'floor', label: 'Floor Vote', completed: bill.current_status.includes('passed') },
    { key: 'other_chamber', label: 'Other Chamber', completed: false },
    { key: 'president', label: 'President', completed: bill.current_status.includes('law') },
  ];
  
  const progressPercentage = (progressStages.filter(s => s.completed).length / progressStages.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {bill.short_title || bill.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="font-medium">
                  {bill.bill_type.toUpperCase()} {bill.bill_number}
                </span>
                <span>•</span>
                <span>{bill.congress_number}th Congress</span>
                <span>•</span>
                <Badge variant={bill.current_status.includes('law') ? 'default' : 'secondary'}>
                  {bill.current_status}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Legislative Progress</span>
              <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="mb-3" />
            <div className="flex justify-between text-xs text-gray-600">
              {progressStages.map((stage) => (
                <span 
                  key={stage.key}
                  className={stage.completed ? 'font-medium text-gray-900' : ''}
                >
                  {stage.label}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* CivicSense Analysis Alert */}
        {bill.bill_content_analysis?.[0] && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">CivicSense Analysis</AlertTitle>
            <AlertDescription className="mt-2 text-blue-800">
              <p className="mb-3">
                {bill.bill_content_analysis[0].plain_english_summary}
              </p>
              {bill.bill_content_analysis[0].uncomfortable_truths?.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Uncomfortable Truths:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {bill.bill_content_analysis[0].uncomfortable_truths.map((truth: string, idx: number) => (
                      <li key={idx}>{truth}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="cosponsors">Cosponsors</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sponsor Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Primary Sponsor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bill.primary_sponsor && (
                      <Link 
                        href={`/public-figures/${bill.primary_sponsor.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="h-16 w-16">
                          {bill.primary_sponsor.official_photo_url ? (
                            <AvatarImage 
                              src={bill.primary_sponsor.official_photo_url} 
                              alt={bill.primary_sponsor.display_name} 
                            />
                          ) : (
                            <AvatarFallback>
                              {bill.primary_sponsor.display_name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-lg">
                            {bill.primary_sponsor.display_name}
                          </p>
                          <p className="text-gray-600">
                            {bill.primary_sponsor.party_affiliation} - {bill.primary_sponsor.current_state}
                            {bill.primary_sponsor.congress_member_type === 'representative' && 
                              ` District ${bill.primary_sponsor.current_district}`}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Subjects */}
                {(bill.primary_subjects?.length > 0 || bill.secondary_subjects?.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Policy Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bill.primary_subjects?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-600 mb-2">Primary Subject</p>
                          <div className="flex flex-wrap gap-2">
                            {bill.primary_subjects.map((subject: any) => (
                              <Badge key={subject.id} variant="default">
                                {subject.subject_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {bill.secondary_subjects?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Related Subjects</p>
                          <div className="flex flex-wrap gap-2">
                            {bill.secondary_subjects.map((subject: any) => (
                              <Badge key={subject.id} variant="secondary">
                                {subject.subject_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Summary */}
                {bill.bill_summaries?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Official Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        {bill.bill_summaries[0].summary_text}
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Last updated: {format(new Date(bill.bill_summaries[0].action_date), 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Key Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Key Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Introduced</p>
                      <p className="text-sm">{format(new Date(bill.introduced_date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Action</p>
                      <p className="text-sm">{format(new Date(bill.last_action_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Cosponsor Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Cosponsor Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Cosponsors</span>
                        <span className="font-medium">{bill.cosponsor_counts.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Democrats</span>
                        <span className="text-blue-600 font-medium">{bill.cosponsor_counts.democrat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Republicans</span>
                        <span className="text-red-600 font-medium">{bill.cosponsor_counts.republican}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Independents</span>
                        <span className="text-purple-600 font-medium">{bill.cosponsor_counts.independent}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Bills */}
                {bill.bill_relationships?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Related Bills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {bill.bill_relationships.map((rel: any) => (
                          <Link
                            key={rel.id}
                            href={`/congress/bills/${rel.related_bill.id}`}
                            className="block p-2 rounded hover:bg-gray-50"
                          >
                            <p className="font-medium text-sm">
                              {rel.related_bill.bill_type.toUpperCase()} {rel.related_bill.bill_number}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {rel.related_bill.title}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* External Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">External Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a 
                      href={bill.congress_gov_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Building className="h-4 w-4" />
                      View on Congress.gov
                    </a>
                    {bill.govtrack_url && (
                      <a 
                        href={bill.govtrack_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on GovTrack
                      </a>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Legislative Actions</CardTitle>
                <CardDescription>
                  Track the bill's journey through Congress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bill.bill_actions?.map((action: any) => (
                    <div key={action.id} className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{action.action_text}</p>
                          {action.ai_interpretation && (
                            <p className="text-sm text-gray-600 mt-1">
                              {action.ai_interpretation}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(action.action_date), 'MMMM d, yyyy')}
                            {action.chamber && ` • ${action.chamber}`}
                          </p>
                        </div>
                        {action.significance_score > 7 && (
                          <Badge variant="default" className="ml-2">
                            Important
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cosponsors Tab */}
          <TabsContent value="cosponsors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bill Cosponsors ({bill.bill_cosponsors?.length || 0})</CardTitle>
                <CardDescription>
                  Members of Congress supporting this legislation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bill.bill_cosponsors?.map((cosponsor: any) => (
                    <Link
                      key={cosponsor.id}
                      href={`/public-figures/${cosponsor.cosponsor.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <Avatar>
                        {cosponsor.cosponsor.official_photo_url ? (
                          <AvatarImage 
                            src={cosponsor.cosponsor.official_photo_url} 
                            alt={cosponsor.cosponsor.display_name} 
                          />
                        ) : (
                          <AvatarFallback>
                            {cosponsor.cosponsor.display_name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {cosponsor.cosponsor.display_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {cosponsor.cosponsor.party_affiliation} - {cosponsor.cosponsor.current_state}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {format(new Date(cosponsor.date_cosponsored), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {bill.bill_content_analysis?.[0] ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Power Dynamics Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bill.bill_content_analysis[0].power_dynamics && (
                      <div className="space-y-4">
                        {Object.entries(bill.bill_content_analysis[0].power_dynamics).map(([key, value]) => (
                          <div key={key}>
                            <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-600">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What You Can Do</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bill.bill_content_analysis[0].action_items && (
                      <ol className="list-decimal list-inside space-y-2">
                        {bill.bill_content_analysis[0].action_items.map((action: string, idx: number) => (
                          <li key={idx} className="text-sm">{action}</li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    CivicSense analysis is being generated for this bill.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Votes Tab */}
          <TabsContent value="votes" className="space-y-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No votes have been recorded for this bill yet.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 