import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'general', 'content']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  rating: z.number().min(1).max(5).optional(),
  email: z.string().email().optional().or(z.literal('')),
  context: z.object({
    page: z.string().optional(),
    userAgent: z.string().optional(),
    qualification: z.string().optional(),
    assessment: z.string().optional(),
  }).optional()
});

// Map string values to enum values
const mapToEnumValues = (data: any) => ({
  ...data,
  type: data.type.toUpperCase(),
  priority: data.priority?.toUpperCase() || 'MEDIUM'
});

// GET /api/feedback - Get feedback (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may want to implement proper role checking)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [feedback, total] = await Promise.all([
      (prisma as any).feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      (prisma as any).feedback.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    
    // Validate request body
    const validatedData = feedbackSchema.parse(body);
    const enumData = mapToEnumValues(validatedData);

    // Create feedback entry
    const feedback = await (prisma as any).feedback.create({
      data: {
        type: enumData.type,
        priority: enumData.priority,
        title: enumData.title,
        description: enumData.description,
        rating: enumData.rating,
        email: enumData.email || null,
        context: enumData.context || null,
        userId: session?.user?.id || null,
        status: 'OPEN',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      }
    });

    // TODO: Send notification to admin team
    // TODO: Auto-categorize feedback using AI if needed

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        type: feedback.type,
        title: feedback.title,
        status: feedback.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}