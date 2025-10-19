import { NextRequest, NextResponse } from 'next/server';
import { UserTestingFramework } from '@/lib/user-testing-framework';

// GET /api/uat/reports - Generate comprehensive UAT report
export async function GET(request: NextRequest) {
  try {
    const report = await UserTestingFramework.generateUATReport();

    return NextResponse.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating UAT report:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to generate UAT report' },
      { status: 500 }
    );
  }
}