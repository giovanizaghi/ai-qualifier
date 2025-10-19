import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/bookmarks/[qualificationId] - Remove bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: { qualificationId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { qualificationId } = params;

    if (!qualificationId) {
      return NextResponse.json(
        { error: 'Qualification ID is required' },
        { status: 400 }
      );
    }

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_qualificationId: {
          userId: session.user.id,
          qualificationId
        }
      }
    });

    if (!existingBookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    // Delete bookmark
    await prisma.bookmark.delete({
      where: {
        userId_qualificationId: {
          userId: session.user.id,
          qualificationId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}