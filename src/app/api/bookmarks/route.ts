import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/bookmarks - Get user's bookmarks
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        qualification: {
          select: {
            id: true,
            title: true,
            description: true,
            shortDescription: true,
            category: true,
            difficulty: true,
            estimatedDuration: true,
            totalQuestions: true,
            passingScore: true,
            tags: true,
            isActive: true,
            isPublished: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      bookmarks
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookmarks - Add bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { qualificationId } = await request.json();

    if (!qualificationId) {
      return NextResponse.json(
        { error: 'Qualification ID is required' },
        { status: 400 }
      );
    }

    // Check if qualification exists and is active
    const qualification = await prisma.qualification.findFirst({
      where: {
        id: qualificationId,
        isActive: true,
        isPublished: true
      }
    });

    if (!qualification) {
      return NextResponse.json(
        { error: 'Qualification not found or not available' },
        { status: 404 }
      );
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_qualificationId: {
          userId: session.user.id,
          qualificationId
        }
      }
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Qualification already bookmarked' },
        { status: 409 }
      );
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        qualificationId
      },
      include: {
        qualification: {
          select: {
            id: true,
            title: true,
            description: true,
            shortDescription: true,
            category: true,
            difficulty: true,
            estimatedDuration: true,
            totalQuestions: true,
            passingScore: true,
            tags: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      bookmark
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}