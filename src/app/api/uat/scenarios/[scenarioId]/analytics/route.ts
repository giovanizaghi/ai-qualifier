import { NextRequest, NextResponse } from 'next/server';
import { UserTestingFramework } from '@/lib/user-testing-framework';

// GET /api/uat/scenarios/[scenarioId]/analytics - Get scenario analytics
export async function GET(request: NextRequest, { params }: { params: { scenarioId: string } }) {
  try {
    const { scenarioId } = params;
    
    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: 'Scenario ID is required' },
        { status: 400 }
      );
    }

    const analytics = await UserTestingFramework.getScenarioAnalytics(scenarioId);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting scenario analytics:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to get scenario analytics' },
      { status: 500 }
    );
  }
}