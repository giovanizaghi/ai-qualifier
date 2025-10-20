import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

// POST /api/qualifications/[id]/enroll - Enroll user in qualification
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required"
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if qualification exists
    const qualification = await prisma.qualification.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!qualification) {
      return NextResponse.json(
        {
          success: false,
          error: "Qualification not found"
        },
        { status: 404 }
      );
    }

    // Check if user already enrolled
    const existingProgress = await prisma.qualificationProgress.findFirst({
      where: {
        qualificationId: id,
        userId: session.user.id
      }
    });
    if (existingProgress) {
      return NextResponse.json({
        success: true,
        message: "Already enrolled",
        data: existingProgress
      });
    }

    // Create progress record
    const progress = await prisma.qualificationProgress.create({
      data: {
        qualificationId: id,
        userId: session.user.id,
        status: "IN_PROGRESS",
        completionPercentage: 0,
        studyTimeMinutes: 0,
        attempts: 0,
        completedTopics: [],
      }
    });

    return NextResponse.json({
      success: true,
      message: "Enrolled successfully",
      data: progress
    });
  } catch (error) {
    console.error("Error enrolling in qualification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
