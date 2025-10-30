import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { analyzeCompanyDomain } from '@/lib/domain-analyzer';
import { generateICP } from '@/lib/icp-generator';
import { prisma } from '@/lib/prisma';

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
    const existingUserCompany = await prisma.company.findFirst({
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

    if (existingUserCompany) {
      return NextResponse.json(
        { 
          error: 'Company already exists for this user',
          company: existingUserCompany,
        },
        { status: 409 }
      );
    }

    // Check if company already exists globally (analyzed by any user)
    const existingGlobalCompany = await prisma.company.findFirst({
      where: {
        domain: domain.toLowerCase(),
      },
      include: {
        icps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingGlobalCompany) {
      // Company already analyzed by another user - create a copy for this user
      console.log(`[API] Company ${domain} already exists, creating copy for user ${session.user.id}`);
      
      const userCompanyCopy = await prisma.company.create({
        data: {
          userId: session.user.id,
          domain: domain.toLowerCase(),
          name: existingGlobalCompany.name,
          description: existingGlobalCompany.description,
          industry: existingGlobalCompany.industry,
          size: existingGlobalCompany.size,
          websiteData: existingGlobalCompany.websiteData as any,
          aiAnalysis: existingGlobalCompany.aiAnalysis as any,
          icps: {
            create: existingGlobalCompany.icps.map(icp => ({
              title: icp.title,
              description: icp.description,
              buyerPersonas: icp.buyerPersonas as any,
              companySize: icp.companySize as any,
              industries: icp.industries,
              geographicRegions: icp.geographicRegions,
              fundingStages: icp.fundingStages,
              generatedBy: icp.generatedBy,
              prompt: icp.prompt,
            }))
          },
        },
        include: {
          icps: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      console.log(`[API] Company copy created for user: ${userCompanyCopy.id}`);

      return NextResponse.json(
        {
          success: true,
          company: userCompanyCopy,
          icp: userCompanyCopy.icps[0],
          reused: true, // Flag to indicate this was reused data
        },
        { status: 201 }
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
