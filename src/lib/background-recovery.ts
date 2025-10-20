import { prisma } from './prisma';

/**
 * Recover stuck qualification runs
 * Marks runs that have been processing for too long as FAILED
 */
export async function recoverStuckRuns(timeoutMinutes: number = 30) {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  try {
    // First, log ALL active runs for debugging
    const allActiveRuns = await prisma.qualificationRun.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
      select: {
        id: true,
        status: true,
        totalProspects: true,
        completed: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (allActiveRuns.length > 0) {
      console.log(`[Recovery] Found ${allActiveRuns.length} active run(s) in database:`);
      allActiveRuns.forEach((run: typeof allActiveRuns[number]) => {
        const ageMinutes = Math.round((Date.now() - new Date(run.createdAt).getTime()) / 1000 / 60);
        console.log(`  - ${run.id}: ${run.status}, ${run.completed}/${run.totalProspects}, age: ${ageMinutes}min`);
      });
    }

    // Find stuck runs (older than timeout)
    const stuckRuns = await prisma.qualificationRun.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
        createdAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        status: true,
        totalProspects: true,
        completed: true,
        createdAt: true,
      },
    });

    if (stuckRuns.length === 0) {
      console.log(`[Recovery] No runs older than ${timeoutMinutes} minutes found`);
      return { recovered: 0, runs: [] };
    }

    console.log(`[Recovery] Found ${stuckRuns.length} stuck runs (older than ${timeoutMinutes} minutes)`);

    // Mark them as failed
    const updatePromises = stuckRuns.map((run: typeof stuckRuns[number]) =>
      prisma.qualificationRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      })
    );

    await Promise.all(updatePromises);

    console.log(`[Recovery] Marked ${stuckRuns.length} runs as FAILED`);

    return {
      recovered: stuckRuns.length,
      runs: stuckRuns,
    };
  } catch (error) {
    console.error('[Recovery] Error recovering stuck runs:', error);
    throw error;
  }
}

/**
 * Get all stuck runs without marking them as failed
 * Useful for monitoring
 */
export async function getStuckRuns(timeoutMinutes: number = 30) {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const stuckRuns = await prisma.qualificationRun.findMany({
    where: {
      status: {
        in: ['PENDING', 'PROCESSING'],
      },
      createdAt: {
        lt: cutoffTime,
      },
    },
    include: {
      icp: {
        select: {
          title: true,
          company: {
            select: {
              name: true,
              domain: true,
            },
          },
        },
      },
    },
  });

  return stuckRuns;
}

/**
 * Resume a specific qualification run
 * WARNING: This will re-process ALL prospects, including already completed ones
 * Only use if you have a proper idempotency mechanism
 */
export async function resumeQualificationRun(runId: string) {
  const run = await prisma.qualificationRun.findUnique({
    where: { id: runId },
    include: {
      icp: true,
      results: true,
    },
  });

  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }

  if (run.status === 'COMPLETED') {
    throw new Error(`Run ${runId} is already completed`);
  }

  // This is just a placeholder - actual implementation would require
  // reconstructing the ICP data and domains list, which we don't store
  throw new Error('Resume functionality not implemented - data not available');
}
