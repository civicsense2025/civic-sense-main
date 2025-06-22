"use client"

import { Header } from "@/components/header"
import { Container, Stack, Text } from "@/components/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle, Shield, Users, BookOpen, Database, Cog, Mail, ExternalLink } from "lucide-react"
import { isDocumentationSectionEnabled } from "@/lib/comprehensive-feature-flags"
import { cn } from "@/lib/utils"

interface FeatureSection {
  title: string
  description: string
  emoji: string
  features: {
    title: string
    description: string
    badge?: string
  }[]
}

const sections: FeatureSection[] = [
  {
    title: "Security & Compliance",
    description: "Built from the ground up to meet educational privacy requirements and industry security standards.",
    emoji: "🔒",
    features: [
      {
        title: "FERPA Compliant",
        description: "Complete compliance with Family Educational Rights and Privacy Act requirements for student data protection.",
        badge: "Required"
      },
      {
        title: "COPPA Safe Harbor",
        description: "Enhanced protections for students under 13 with parental consent workflows and restricted data collection.",
        badge: "Under 13"
      },
      {
        title: "SOC 2 Type II Certified",
        description: "Independent security audit verification with annual renewals and continuous monitoring.",
        badge: "Verified"
      },
      {
        title: "Data Encryption",
        description: "AES-256 encryption at rest and TLS 1.2+ in transit for all student and educational data.",
        badge: "Military Grade"
      },
      {
        title: "SDPC National Data Privacy Agreement",
        description: "Signed Student Data Privacy Consortium agreement with transparent data practices.",
        badge: "Industry Standard"
      }
    ]
  },
  {
    title: "Teacher Controls & Learning Pods",
    description: "Comprehensive classroom management tools that put educators in complete control of the learning experience.",
    emoji: "👩‍🏫",
    features: [
      {
        title: "Content Filtering",
        description: "Age-appropriate content with district-level controls for topics, difficulty levels, and discussion moderation.",
        badge: "Customizable"
      },
      {
        title: "Real-time Monitoring",
        description: "Live view of student progress, quiz attempts, and discussion participation with detailed analytics.",
        badge: "Live Updates"
      },
      {
        title: "Parental Oversight",
        description: "Optional parent/guardian access to view their child's progress and participate in learning pods.",
        badge: "Family Friendly"
      },
      {
        title: "Discussion Moderation",
        description: "Teacher-moderated discussions with chat controls, content flags, and automatic inappropriate content detection.",
        badge: "AI Assisted"
      },
      {
        title: "Assignment Integration",
        description: "Create, assign, and grade civic learning activities directly within your existing workflow.",
        badge: "Seamless"
      }
    ]
  },
  {
    title: "Google Classroom Integration",
    description: "Seamless integration with Google Workspace for Education and Google Classroom workflows.",
    emoji: "🏫",
    features: [
      {
        title: "Automatic Roster Sync",
        description: "Students and teachers sync automatically from Google Classroom with real-time updates.",
        badge: "No Setup"
      },
      {
        title: "Grade Passback",
        description: "Quiz scores and assignment grades sync directly to your Google Classroom gradebook.",
        badge: "Automatic"
      },
      {
        title: "Single Sign-On",
        description: "Students log in with their school Google accounts - no separate passwords to manage.",
        badge: "SSO Ready"
      },
      {
        title: "Assignment Creation",
        description: "Create Google Classroom assignments that link directly to CivicSense learning activities.",
        badge: "One Click"
      },
      {
        title: "Class Organization",
        description: "Google Classroom courses automatically become learning pods with proper permissions.",
        badge: "Organized"
      }
    ]
  }
]

const dataCollection = [
  {
    category: "Educational Records",
    items: ["Student name", "Grade level", "School email", "Quiz scores", "Progress tracking"],
    purpose: "Deliver personalized civic education and track academic progress",
    retention: "Deleted 30 days after course completion or account termination"
  },
  {
    category: "Usage Analytics", 
    items: ["Time spent learning", "Question difficulty preferences", "Topic engagement"],
    purpose: "Improve educational effectiveness and identify learning patterns",
    retention: "Anonymized after 12 months, aggregated data retained for research"
  },
  {
    category: "Security Logs",
    items: ["Login timestamps", "IP addresses (hashed)", "Device information"],
    purpose: "Maintain platform security and investigate potential issues",
    retention: "Purged after 12 months, no personally identifiable information stored"
  }
]

const technicalSpecs = [
  {
    title: "Database Architecture",
    description: "Dedicated school schema with tenant isolation, row-level security policies, and compliance-ready audit trails.",
    icon: Database
  },
  {
    title: "Authentication & SSO",
    description: "Support for Google Workspace, Microsoft Entra ID, and Clever SSO with SAML 2.0 and OpenID Connect.",
    icon: Shield
  },
  {
    title: "Role-Based Access",
    description: "Granular permissions for district admins, principals, teachers, students, and parents with proper data isolation.",
    icon: Users
  },
  {
    title: "API Integration",
    description: "RESTful APIs for SIS integration, LMS connectivity, and custom district applications with rate limiting.",
    icon: Cog
  }
]

export default function SchoolsPage() {
  const isDocumentationEnabled = isDocumentationSectionEnabled()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="w-full">
        <Container className="max-w-6xl py-12 sm:py-16 lg:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl sm:text-5xl font-light text-foreground tracking-tight mb-6">
              CivicSense for Schools
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-3xl mx-auto mb-8">
              Secure, compliant civic education platform designed specifically for K-12 schools. 
              Complete teacher controls, Google Classroom integration, and FERPA/COPPA compliance built-in.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                FERPA Compliant
              </Badge>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                SOC 2 Certified
              </Badge>
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                Google Classroom Ready
              </Badge>
              <Badge className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                COPPA Safe Harbor
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <Link href="/test-classroom-setup">
                  Test Integration
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <Link href="mailto:schools@civicsense.com">
                  Schedule Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Feature Sections */}
          <Stack spacing="2xl">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border-b border-border pb-16 last:border-0 last:pb-0">
                <Stack spacing="xl">
                  {/* Section Header */}
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0 mt-1">
                      {section.emoji}
                    </div>
                    <Stack spacing="sm" className="flex-1">
                      <Text as="h2" size="2xl" weight="normal" className="text-foreground">
                        {section.title}
                      </Text>
                      <Text className="text-muted-foreground text-lg">
                        {section.description}
                      </Text>
                    </Stack>
                  </div>

                  {/* Features Grid */}
                  <div className="ml-0 sm:ml-16">
                    <div className="grid gap-6 md:grid-cols-2">
                      {section.features.map((feature, featureIndex) => (
                        <Card key={featureIndex} className="border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <Text size="lg" weight="medium" className="text-foreground">
                                {feature.title}
                              </Text>
                              {feature.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {feature.badge}
                                </Badge>
                              )}
                            </div>
                            <Text className="text-muted-foreground">
                              {feature.description}
                            </Text>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Stack>
              </div>
            ))}
          </Stack>

          {/* Data Collection & Privacy */}
          <Stack spacing="xl" className="mt-16">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0 mt-1">📊</div>
              <Stack spacing="sm" className="flex-1">
                <Text as="h2" size="2xl" weight="normal" className="text-foreground">
                  Data Collection & Privacy
                </Text>
                <Text className="text-muted-foreground text-lg">
                  Transparent data practices with minimal collection and clear retention policies.
                </Text>
              </Stack>
            </div>

            <div className="ml-0 sm:ml-16">
              <div className="space-y-6">
                {dataCollection.map((data, index) => (
                  <Card key={index} className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">{data.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Text size="sm" weight="medium" className="text-foreground mb-2">
                          Data Collected:
                        </Text>
                        <div className="flex flex-wrap gap-2">
                          {data.items.map((item, itemIndex) => (
                            <Badge key={itemIndex} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Text size="sm" weight="medium" className="text-foreground mb-1">
                          Purpose:
                        </Text>
                        <Text size="sm" className="text-muted-foreground">
                          {data.purpose}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" weight="medium" className="text-foreground mb-1">
                          Retention:
                        </Text>
                        <Text size="sm" className="text-muted-foreground">
                          {data.retention}
                        </Text>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Stack>

          {/* Technical Architecture */}
          <Stack spacing="xl" className="mt-16">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0 mt-1">⚙️</div>
              <Stack spacing="sm" className="flex-1">
                <Text as="h2" size="2xl" weight="normal" className="text-foreground">
                  Technical Architecture
                </Text>
                <Text className="text-muted-foreground text-lg">
                  Enterprise-grade infrastructure built for security, scalability, and compliance.
                </Text>
              </Stack>
            </div>

            <div className="ml-0 sm:ml-16">
              <div className="grid gap-6 md:grid-cols-2">
                {technicalSpecs.map((spec, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <spec.icon className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                        <Text size="lg" weight="medium" className="text-foreground">
                          {spec.title}
                        </Text>
                      </div>
                      <Text className="text-muted-foreground">
                        {spec.description}
                      </Text>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Stack>

          {/* Getting Started */}
          <Stack spacing="xl" className="mt-16">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0 mt-1">🚀</div>
              <Stack spacing="sm" className="flex-1">
                <Text as="h2" size="2xl" weight="normal" className="text-foreground">
                  Getting Started
                </Text>
                <Text className="text-muted-foreground text-lg">
                  Simple setup process designed for busy educators and IT teams.
                </Text>
              </Stack>
            </div>

            <div className="ml-0 sm:ml-16">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Text className="text-primary font-bold">1</Text>
                      </div>
                      <Text size="lg" weight="medium" className="text-foreground">
                        Test Integration
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      Verify your Google Classroom setup works with our test page.
                    </Text>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/test-classroom-setup">
                        Test Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Text className="text-primary font-bold">2</Text>
                      </div>
                      <Text size="lg" weight="medium" className="text-foreground">
                        Schedule Demo
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      30-minute demo showing teacher controls and student experience.
                    </Text>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="mailto:schools@civicsense.com">
                        Book Demo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Text className="text-primary font-bold">3</Text>
                      </div>
                      <Text size="lg" weight="medium" className="text-foreground">
                        Deploy & Train
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      We'll help set up your classes and train your teachers.
                    </Text>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="mailto:support@civicsense.com">
                        Get Support
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Stack>

          {/* Documentation & Support */}
          <Stack 
            spacing="xl" 
            className={cn(
              "mt-16 transition-opacity duration-300",
              !isDocumentationEnabled && "opacity-50 pointer-events-none select-none"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0 mt-1">📚</div>
              <Stack spacing="sm" className="flex-1">
                <Text as="h2" size="2xl" weight="normal" className="text-foreground">
                  Documentation & Support
                </Text>
                <Text className="text-muted-foreground text-lg">
                  Comprehensive resources for IT teams, teachers, and administrators.
                </Text>
                {!isDocumentationEnabled && (
                  <Badge variant="outline" className="w-fit">
                    Coming Soon
                  </Badge>
                )}
              </Stack>
            </div>

            <div className="ml-0 sm:ml-16">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <Text size="lg" weight="medium" className="text-foreground">
                        Security Documentation
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      SOC 2 reports, penetration testing results, and compliance certificates.
                    </Text>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="mailto:security@civicsense.com">
                        Request Access
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <Text size="lg" weight="medium" className="text-foreground">
                        Teacher Training
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      Video guides, best practices, and classroom management resources.
                    </Text>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="mailto:training@civicsense.com">
                        Access Materials
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="h-5 w-5 text-primary" />
                      <Text size="lg" weight="medium" className="text-foreground">
                        Implementation Support
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      Dedicated support team for setup, training, and ongoing assistance.
                    </Text>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="mailto:support@civicsense.com">
                        Get Help
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <Text size="lg" weight="medium" className="text-foreground">
                        Privacy & Legal
                      </Text>
                    </div>
                    <Text className="text-muted-foreground mb-4">
                      NDPA agreements, privacy policies, and data processing documentation.
                    </Text>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="mailto:legal@civicsense.com">
                        Legal Team
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Stack>

          {/* Call to Action */}
          <div className="text-center pt-16 border-t border-border mt-16">
            <Stack spacing="lg">
              <div className="space-y-4">
                <Text as="h2" size="2xl" weight="normal" className="text-foreground">
                  Ready to bring civic education to your school?
                </Text>
                <Text className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Join forward-thinking schools using CivicSense to prepare students for active civic participation 
                  with the security and compliance you need.
                </Text>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8" asChild>
                  <Link href="mailto:schools@civicsense.com">
                    Schedule School Demo
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8" asChild>
                  <Link href="/test-classroom-setup">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Integration
                  </Link>
                </Button>
              </div>

              <Text className="text-sm text-muted-foreground">
                Questions? Email us at{" "}
                <Link href="mailto:schools@civicsense.com" className="text-primary hover:underline">
                  schools@civicsense.com
                </Link>
              </Text>
            </Stack>
          </div>
        </Container>
      </main>
    </div>
  )
} 