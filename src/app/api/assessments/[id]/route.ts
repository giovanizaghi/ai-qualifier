import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Validation schema for updating assessment
const assessmentUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  questionCount: z.number().min(1).optional(),
  timeLimit: z.number().min(1).optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeAnswers: z.boolean().optional(),
  showResults: z.boolean().optional(),
  questionCategories: z.any().optional(),
  difficultyMix: z.any().optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/assessments/[id] - Get single assessment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      select: {
        id: true,
        qualificationId: true,
        title: true,
        description: true,
        questionCount: true,
        timeLimit: true,
        randomizeQuestions: true,
        randomizeAnswers: true,
        showResults: true,
        questionCategories: true,
        difficultyMix: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        qualification: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            difficulty: true,
            passingScore: true,
            estimatedDuration: true,
            learningObjectives: true
          }
        },
        _count: {
          select: {
            results: true
          }
        }
      }
    })

    if (!assessment) {
      return NextResponse.json(
        { 
          success: false,
          error: "Assessment not found" 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: assessment
    })

  } catch (error) {
    console.error("Error fetching assessment:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// PUT /api/assessments/[id] - Update assessment
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Authentication required" 
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = assessmentUpdateSchema.parse(body)

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id }
    })

    if (!existingAssessment) {
      return NextResponse.json(
        { 
          success: false,
          error: "Assessment not found" 
        },
        { status: 404 }
      )
    }

    // Update assessment
    const assessment = await prisma.assessment.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        qualificationId: true,
        title: true,
        description: true,
        questionCount: true,
        timeLimit: true,
        randomizeQuestions: true,
        randomizeAnswers: true,
        showResults: true,
        questionCategories: true,
        difficultyMix: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        qualification: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully",
      data: assessment
    })

  } catch (error) {
    console.error("Error updating assessment:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/assessments/[id] - Delete assessment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Authentication required" 
        },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if assessment exists and has results
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            results: true
          }
        }
      }
    })

    if (!assessment) {
      return NextResponse.json(
        { 
          success: false,
          error: "Assessment not found" 
        },
        { status: 404 }
      )
    }

    // Check if assessment has results
    if (assessment._count.results > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Cannot delete assessment with existing results. Please archive instead." 
        },
        { status: 400 }
      )
    }

    // Delete assessment
    await prisma.assessment.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting assessment:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}