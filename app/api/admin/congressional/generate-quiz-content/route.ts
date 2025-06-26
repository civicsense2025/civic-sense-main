import { NextRequest, NextResponse } from 'next/server'
import { CongressionalDocumentQuizGenerator } from '@/lib/services/congressional-document-quiz-generator'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    const body = await request.json()
    const {
      process_bills = true,
      process_hearings = true,
      process_committee_docs = true,
      congress_number = 119,
      max_documents = 50
    } = body

    console.log(`🧠 Starting quiz content generation for ${congress_number}th Congress...`)
    console.log(`Settings: Bills: ${process_bills}, Hearings: ${process_hearings}, Committee Docs: ${process_committee_docs}`)

    const quizGenerator = new CongressionalDocumentQuizGenerator()
    const supabase = await createClient()

    const results = {
      total_documents_processed: 0,
      topics_generated: 0,
      questions_generated: 0,
      bills_processed: 0,
      hearings_processed: 0,
      committee_docs_processed: 0,
      errors: [] as string[]
    }

    // Process Bills if requested
    if (process_bills) {
      console.log(`📋 Processing bills from ${congress_number}th Congress...`)
      
      const { data: bills, error: billsError } = await supabase
        .from('congressional_bills')
        .select('*')
        .eq('congress_number', congress_number)
        .limit(Math.floor(max_documents / 3))
        .order('introduced_date', { ascending: false })

      if (billsError) {
        console.error('Error fetching bills:', billsError)
        results.errors.push(`Bills fetch error: ${billsError.message}`)
      } else if (bills && bills.length > 0) {
        for (const bill of bills) {
          try {
            const quizResult = await quizGenerator.generateQuizFromBill(bill)
            
            if (quizResult.success) {
              results.bills_processed++
              results.total_documents_processed++
              if (quizResult.topicGenerated) results.topics_generated++
              results.questions_generated += quizResult.questionsGenerated || 0
            } else {
              results.errors.push(`Bill ${bill.bill_number}: ${quizResult.error}`)
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            results.errors.push(`Bill ${bill.bill_number}: ${errorMessage}`)
          }
        }
      }
    }

    // Process Hearings if requested
    if (process_hearings) {
      console.log(`🎤 Processing hearings from ${congress_number}th Congress...`)
      
      const { data: hearings, error: hearingsError } = await supabase
        .from('congressional_hearings')
        .select('*')
        .eq('congress_number', congress_number)
        .limit(Math.floor(max_documents / 3))
        .order('hearing_date', { ascending: false })

      if (hearingsError) {
        console.error('Error fetching hearings:', hearingsError)
        results.errors.push(`Hearings fetch error: ${hearingsError.message}`)
      } else if (hearings && hearings.length > 0) {
        for (const hearing of hearings) {
          try {
            const quizResult = await quizGenerator.generateQuizFromHearing(hearing)
            
            if (quizResult.success) {
              results.hearings_processed++
              results.total_documents_processed++
              if (quizResult.topicGenerated) results.topics_generated++
              results.questions_generated += quizResult.questionsGenerated || 0
            } else {
              results.errors.push(`Hearing ${hearing.title}: ${quizResult.error}`)
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            results.errors.push(`Hearing ${hearing.title}: ${errorMessage}`)
          }
        }
      }
    }

    // Process Committee Documents if requested
    if (process_committee_docs) {
      console.log(`📄 Processing committee documents from ${congress_number}th Congress...`)
      
      const { data: committeeDocs, error: committeeError } = await supabase
        .from('congressional_committee_documents')
        .select('*')
        .eq('congress_number', congress_number)
        .limit(Math.floor(max_documents / 3))
        .order('published_date', { ascending: false })

      if (committeeError) {
        console.error('Error fetching committee docs:', committeeError)
        results.errors.push(`Committee docs fetch error: ${committeeError.message}`)
      } else if (committeeDocs && committeeDocs.length > 0) {
        for (const doc of committeeDocs) {
          try {
            const quizResult = await quizGenerator.generateQuizFromCommitteeDocument(doc)
            
            if (quizResult.success) {
              results.committee_docs_processed++
              results.total_documents_processed++
              if (quizResult.topicGenerated) results.topics_generated++
              results.questions_generated += quizResult.questionsGenerated || 0
            } else {
              results.errors.push(`Committee Doc ${doc.title}: ${quizResult.error}`)
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            results.errors.push(`Committee Doc ${doc.title}: ${errorMessage}`)
          }
        }
      }
    }

    // Update generation statistics
    await quizGenerator.updateGenerationStats({
      congress_number,
      total_documents_processed: results.total_documents_processed,
      topics_generated: results.topics_generated,
      questions_generated: results.questions_generated,
      bills_processed: results.bills_processed,
      hearings_processed: results.hearings_processed,
      committee_docs_processed: results.committee_docs_processed
    })

    console.log(`✨ Quiz content generation completed:`, results)

    return NextResponse.json({
      success: true,
      results: {
        congress_number,
        ...results,
        summary: `Generated ${results.topics_generated} topics and ${results.questions_generated} questions from ${results.total_documents_processed} documents`
      }
    })

  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 