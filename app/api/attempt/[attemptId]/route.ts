import { quizDatabase } from "@/lib/quiz-database"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params
    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 })
    }

    const details = await quizDatabase.getQuizAttemptDetails(attemptId)
    if (!details.attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    return NextResponse.json(details, { status: 200 })
  } catch (error) {
    console.error("API /attempt/:id error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 