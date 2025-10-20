#!/usr/bin/env tsx
/**
 * Recovery Script for Stuck Qualification Runs
 * 
 * Usage:
 *   npm run recover-stuck-runs
 *   npm run recover-stuck-runs -- --timeout 60
 *   npm run recover-stuck-runs -- --check-only
 */

import { recoverStuckRuns, getStuckRuns } from '../src/lib/background-recovery';

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  const timeoutArg = args.find((arg) => arg.startsWith('--timeout='));
  const timeout = timeoutArg ? parseInt(timeoutArg.split('=')[1], 10) : 30;

  console.log('='.repeat(60));
  console.log('Stuck Qualification Runs Recovery');
  console.log('='.repeat(60));
  console.log(`Timeout: ${timeout} minutes`);
  console.log(`Mode: ${checkOnly ? 'CHECK ONLY' : 'RECOVER'}`);
  console.log('='.repeat(60));
  console.log('');

  if (checkOnly) {
    // Just check for stuck runs
    const stuckRuns = await getStuckRuns(timeout);

    if (stuckRuns.length === 0) {
      console.log('✅ No stuck runs found!');
      return;
    }

    console.log(`⚠️  Found ${stuckRuns.length} stuck run(s):\n`);

    stuckRuns.forEach((run: typeof stuckRuns[number], index: number) => {
      const stuckForMinutes = Math.round(
        (Date.now() - new Date(run.createdAt).getTime()) / 1000 / 60
      );
      
      console.log(`${index + 1}. Run ID: ${run.id}`);
      console.log(`   Status: ${run.status}`);
      console.log(`   Progress: ${run.completed}/${run.totalProspects}`);
      console.log(`   ICP: ${run.icp.title}`);
      console.log(`   Company: ${run.icp.company.name || run.icp.company.domain}`);
      console.log(`   Created: ${run.createdAt}`);
      console.log(`   Stuck for: ${stuckForMinutes} minutes`);
      console.log('');
    });

    console.log('To recover these runs, run without --check-only flag');
  } else {
    // Recover stuck runs
    const result = await recoverStuckRuns(timeout);

    if (result.recovered === 0) {
      console.log('✅ No stuck runs found!');
      return;
    }

    console.log(`✅ Recovered ${result.recovered} stuck run(s):\n`);

    result.runs.forEach((run: typeof result.runs[number], index: number) => {
      console.log(`${index + 1}. Run ID: ${run.id}`);
      console.log(`   Status: ${run.status} → FAILED`);
      console.log(`   Progress: ${run.completed}/${run.totalProspects}`);
      console.log(`   Created: ${run.createdAt}`);
      console.log('');
    });

    console.log('All stuck runs have been marked as FAILED ✅');
  }
}

main()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
