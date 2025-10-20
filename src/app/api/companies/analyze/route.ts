import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeCompanyDomain } from '@/lib/domain-analyzer';
import { generateICP } from '@/lib/icp-generator';
import { z } from 'zod';

// Request validation schema
const analyzeRequestSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

/**
 * POST /api/companies/analyze
 * Analyze a company domain and generate its ICP
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = analyzeRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { domain } = validationResult.data;

    // Check if company already exists for this user
    const existingCompany = await prisma.company.findFirst({
      where: {
        domain: domain.toLowerCase(),
        userId: session.user.id,
      },
      include: {
        icps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        { 
          error: 'Company already exists',
          company: existingCompany,
        },
        { status: 409 }
      );
    }

    // Step 1: Analyze the company domain
    console.log(`[API] Analyzing domain: ${domain}`);
    const { scrapedData, aiAnalysis } = await analyzeCompanyDomain(domain);

    // Step 2: Generate ICP from company analysis
    console.log(`[API] Generating ICP for: ${aiAnalysis.companyName}`);
    const icpData = await generateICP(aiAnalysis, domain);

    // Step 3: Save to database
    const company = await prisma.company.create({
      data: {
        userId: session.user.id,
        domain: domain.toLowerCase(),
        name: aiAnalysis.companyName,
        description: aiAnalysis.description,
        industry: aiAnalysis.industry,
        size: aiAnalysis.companySize,
        websiteData: scrapedData as any,
        aiAnalysis: aiAnalysis as any,
        icps: {
          create: {
            title: icpData.title,
            description: icpData.description,
            buyerPersonas: icpData.buyerPersonas as any,
            companySize: icpData.companySize as any,
            industries: icpData.industries,
            geographicRegions: icpData.geographicRegions,
            fundingStages: icpData.fundingStages,
            generatedBy: 'gpt-4o-mini',
            prompt: `Generated ICP for ${aiAnalysis.companyName} based on domain analysis`,
          },
        },
      },
      include: {
        icps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`[API] Company and ICP created: ${company.id}`);

    return NextResponse.json(
      {
        success: true,
        company,
        icp: company.icps[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error analyzing company:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
