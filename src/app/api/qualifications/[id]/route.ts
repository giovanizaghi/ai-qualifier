import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Validation schema for updating qualification
const qualificationUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  shortDescription: z.string().optional(),
  category: z.enum([
    "ARTIFICIAL_INTELLIGENCE",
    "MACHINE_LEARNING", 
    "DATA_SCIENCE",
    "SOFTWARE_ENGINEERING",
    "CLOUD_COMPUTING",
    "CYBERSECURITY",
    "BLOCKCHAIN",
    "MOBILE_DEVELOPMENT",
    "WEB_DEVELOPMENT",
    "DEVOPS",
    "PRODUCT_MANAGEMENT",
    "UX_UI_DESIGN",
    "BUSINESS_ANALYSIS",
    "PROJECT_MANAGEMENT",
    "DIGITAL_MARKETING",
    "OTHER"
  ]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  prerequisites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  totalQuestions: z.number().min(1).optional(),
  timeLimit: z.number().min(1).optional(),
  allowRetakes: z.boolean().optional(),
  retakeCooldown: z.number().min(0).optional(),
  learningObjectives: z.array(z.string()).optional(),
  syllabus: z.any().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  version: z.string().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/qualifications/[id] - Get single qualification
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const includeAssessments = searchParams.get('includeAssessments') === 'true'
    const includeProgress = searchParams.get('includeProgress') === 'true'

    const qualification = await prisma.qualification.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        slug: true,
        category: true,
        difficulty: true,
        estimatedDuration: true,
        prerequisites: true,
        tags: true,
        passingScore: true,
        totalQuestions: true,
        timeLimit: true,
        allowRetakes: true,
        retakeCooldown: true,
        learningObjectives: true,
        syllabus: true,
        isActive: true,
        isPublished: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assessments: true,
            questions: true,
            qualificationProgress: true
          }
        },
        assessments: {
          select: {
            id: true,
            title: true,
            description: true,
            questionCount: true,
            timeLimit: true,
            isActive: true
          },
          where: {
            isActive: true
          }
        }
      }
    })

    if (!qualification) {
      return NextResponse.json(
        { 
          success: false,
          error: "Qualification not found" 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: qualification
    })

  } catch (error) {
    console.error("Error fetching qualification:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// PUT /api/qualifications/[id] - Update qualification
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
    const validatedData = qualificationUpdateSchema.parse(body)

    // Check if qualification exists
    const existingQualification = await prisma.qualification.findUnique({
      where: { id }
    })

    if (!existingQualification) {
      return NextResponse.json(
        { 
          success: false,
          error: "Qualification not found" 
        },
        { status: 404 }
      )
    }

    // Update qualification
    const qualification = await prisma.qualification.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        slug: true,
        category: true,
        difficulty: true,
        estimatedDuration: true,
        prerequisites: true,
        tags: true,
        passingScore: true,
        totalQuestions: true,
        timeLimit: true,
        allowRetakes: true,
        retakeCooldown: true,
        learningObjectives: true,
        syllabus: true,
        isActive: true,
        isPublished: true,
        version: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "Qualification updated successfully",
      data: qualification
    })

  } catch (error) {
    console.error("Error updating qualification:", error)
    
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

// DELETE /api/qualifications/[id] - Delete qualification
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

    // Check if qualification exists and has dependencies
    const qualification = await prisma.qualification.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assessments: true,
            questions: true,
            qualificationProgress: true
          }
        }
      }
    })

    if (!qualification) {
      return NextResponse.json(
        { 
          success: false,
          error: "Qualification not found" 
        },
        { status: 404 }
      )
    }

    // Check if qualification has dependencies
    const hasDependencies = 
      qualification._count.assessments > 0 ||
      qualification._count.questions > 0 ||
      qualification._count.qualificationProgress > 0

    if (hasDependencies) {
      return NextResponse.json(
        { 
          success: false,
          error: "Cannot delete qualification with existing assessments, questions, or progress records. Please remove dependencies first." 
        },
        { status: 400 }
      )
    }

    // Delete qualification
    await prisma.qualification.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Qualification deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting qualification:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}