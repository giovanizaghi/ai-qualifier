#!/usr/bin/env tsx
/**
 * Enhanced Recovery Script for Qualification Runs
 * 
 * This script provides comprehensive run state management functionality
 * including recovery, health monitoring, and cleanup operations.
 * 
 * Usage:
 *   npm run recover-stuck-runs
 *   npm run recover-stuck-runs -- --timeout 60
 *   npm run recover-stuck-runs -- --check-only
 *   npm run recover-stuck-runs -- --action cleanup --days 30
 *   npm run recover-stuck-runs -- --action stats
 */

import { getRunManager } from '../src/lib/qualification-run-manager';

interface ScriptOptions {
  action: 'recover' | 'checkTimeouts' | 'cleanup' | 'stats' | 'health';
  timeoutMinutes?: number;
  checkIntervalMinutes?: number;
  maxRetries?: number;
  olderThanDays?: number;
  checkOnly?: boolean;
  verbose?: boolean;
}

async function parseArgs(): Promise<ScriptOptions> {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    action: 'recover',
    timeoutMinutes: 30,
    checkIntervalMinutes: 5,
    maxRetries: 2,
    olderThanDays: 30,
    checkOnly: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--action':
        if (nextArg && ['recover', 'checkTimeouts', 'cleanup', 'stats', 'health'].includes(nextArg)) {
          options.action = nextArg as any;
          i++;
        }
        break;
      case '--timeout':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          options.timeoutMinutes = parseInt(nextArg);
          i++;
        }
        break;
      case '--check-interval':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          options.checkIntervalMinutes = parseInt(nextArg);
          i++;
        }
        break;
      case '--max-retries':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          options.maxRetries = parseInt(nextArg);
          i++;
        }
        break;
      case '--days':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          options.olderThanDays = parseInt(nextArg);
          i++;
        }
        break;
      case '--check-only':
        options.checkOnly = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Enhanced Qualification Run Recovery Script

USAGE:
  npm run recover-stuck-runs [OPTIONS]

ACTIONS:
  --action recover         Recover stuck qualification runs (default)
  --action checkTimeouts   Check for and handle timed out runs  
  --action cleanup         Clean up old completed/failed runs
  --action stats          Show run manager statistics
  --action health         Show health status of active runs

OPTIONS:
  --timeout <minutes>      Timeout for stuck runs (default: 30)
  --check-interval <mins>  Check interval for run manager (default: 5)
  --max-retries <count>    Maximum retry attempts (default: 2)
  --days <days>           Days for cleanup action (default: 30)
  --check-only            Only check status, don't make changes
  --verbose               Verbose output
  --help                  Show this help

EXAMPLES:
  npm run recover-stuck-runs
  npm run recover-stuck-runs -- --action health --verbose
  npm run recover-stuck-runs -- --action cleanup --days 7
  npm run recover-stuck-runs -- --timeout 60 --check-only
  npm run recover-stuck-runs -- --action stats
`);
}

async function showStats(runManager: any, verbose: boolean): Promise<void> {
  console.log('\n📊 Run Manager Statistics:');
  console.log('=' .repeat(50));

  try {
    const stats = await runManager.getStats();
    
    console.log(`Active Runs:          ${stats.activeRuns}`);
    console.log(`  - Pending:          ${stats.pendingRuns}`);
    console.log(`  - Processing:       ${stats.processingRuns}`);
    console.log(`Recently Completed:   ${stats.recentlyCompleted} (last 24h)`);
    console.log(`Recently Failed:      ${stats.recentlyFailed} (last 24h)`);
    
    if (verbose) {
      console.log('\nConfiguration:');
      console.log(`  - Timeout:          ${stats.config.timeoutMinutes} minutes`);
      console.log(`  - Check Interval:   ${stats.config.checkIntervalMinutes} minutes`);
      console.log(`  - Max Retries:      ${stats.config.maxRetries}`);
    }

    // Calculate success rate
    const totalRecent = stats.recentlyCompleted + stats.recentlyFailed;
    const successRate = totalRecent > 0 ? (stats.recentlyCompleted / totalRecent * 100).toFixed(1) : 'N/A';
    console.log(`Success Rate (24h):   ${successRate}%`);

  } catch (error) {
    console.error('❌ Error getting stats:', error);
  }
}

async function showHealth(runManager: any, verbose: boolean): Promise<void> {
  console.log('\n🏥 Active Run Health Status:');
  console.log('=' .repeat(50));

  try {
    const healthStatuses = await runManager.getRunHealthStatus();
    
    if (healthStatuses.length === 0) {
      console.log('✅ No active runs');
      return;
    }

    console.log(`Found ${healthStatuses.length} active run(s):\n`);

    for (const health of healthStatuses) {
      const statusIcon = health.isStuck ? '🔴' : 
                        health.progress > 80 ? '🟢' : 
                        health.progress > 40 ? '🟡' : '🟠';
      
      console.log(`${statusIcon} Run ${health.runId.slice(0, 8)}...`);
      console.log(`   Status:    ${health.status}`);
      console.log(`   Progress:  ${health.progress.toFixed(1)}% (${health.completed}/${health.totalProspects})`);
      console.log(`   Age:       ${health.ageMinutes} minutes`);
      console.log(`   Stuck:     ${health.isStuck ? 'YES' : 'No'}`);
      
      if (health.estimatedTimeRemaining) {
        console.log(`   ETA:       ~${health.estimatedTimeRemaining} minutes`);
      }
      
      if (verbose && health.lastActivity) {
        console.log(`   Last Activity: ${health.lastActivity.toISOString()}`);
      }
      
      console.log('');
    }

    // Summary
    const stuckCount = healthStatuses.filter((h: any) => h.isStuck).length;
    const avgProgress = healthStatuses.reduce((sum: number, h: any) => sum + h.progress, 0) / healthStatuses.length;
    
    console.log(`Summary: ${stuckCount} stuck, ${avgProgress.toFixed(1)}% average progress`);

  } catch (error) {
    console.error('❌ Error getting health status:', error);
  }
}

async function performRecovery(runManager: any, checkOnly: boolean): Promise<void> {
  console.log('\n🔄 Performing comprehensive stuck run recovery...');
  
  if (checkOnly) {
    console.log('ℹ️ CHECK-ONLY mode: No changes will be made\n');
  }

  try {
    if (checkOnly) {
      // Just show what would be recovered
      const healthStatuses = await runManager.getRunHealthStatus();
      const stuckRuns = healthStatuses.filter((h: any) => h.isStuck);
      
      console.log(`Found ${stuckRuns.length} stuck runs that would be recovered:`);
      stuckRuns.forEach((run: any) => {
        console.log(`  - ${run.runId}: ${run.ageMinutes} minutes old, ${run.progress.toFixed(1)}% complete`);
      });
    } else {
      const result = await runManager.recoverStuckRuns();
      
      console.log('\n📋 Recovery Results:');
      console.log(`  Recovered:  ${result.recovered}`);
      console.log(`  Failed:     ${result.failed}`);
      console.log(`  Resumed:    ${result.resumed}`);
      
      if (result.details.length > 0) {
        console.log('\nDetails:');
        result.details.forEach((detail: any) => {
          const icon = detail.action === 'recovered' ? '✅' : 
                      detail.action === 'resumed' ? '🔄' : '❌';
          console.log(`  ${icon} ${detail.runId}: ${detail.reason}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error during recovery:', error);
  }
}

async function checkTimeouts(runManager: any, checkOnly: boolean): Promise<void> {
  console.log('\n⏰ Checking for timed out runs...');
  
  if (checkOnly) {
    console.log('ℹ️ CHECK-ONLY mode: No changes will be made\n');
  }

  try {
    if (checkOnly) {
      // Just show health status
      await showHealth(runManager, false);
    } else {
      const result = await runManager.checkTimeouts();
      
      console.log('\n📋 Timeout Check Results:');
      console.log(`  Recovered:  ${result.recovered}`);
      console.log(`  Failed:     ${result.failed}`);
      console.log(`  Resumed:    ${result.resumed}`);
      
      if (result.details.length > 0) {
        console.log('\nDetails:');
        result.details.forEach((detail: any) => {
          const icon = detail.action === 'recovered' ? '✅' : 
                      detail.action === 'resumed' ? '🔄' : '❌';
          console.log(`  ${icon} ${detail.runId}: ${detail.reason}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error checking timeouts:', error);
  }
}

async function performCleanup(runManager: any, olderThanDays: number, checkOnly: boolean): Promise<void> {
  console.log(`\n🧹 Cleaning up runs older than ${olderThanDays} days...`);
  
  if (checkOnly) {
    console.log('ℹ️ CHECK-ONLY mode: No changes will be made\n');
    // In a real implementation, you might query to show what would be deleted
    console.log('Would delete old completed/failed qualification runs');
    return;
  }

  try {
    const deletedCount = await runManager.cleanup(olderThanDays);
    console.log(`✅ Cleaned up ${deletedCount} old runs`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function main(): Promise<void> {
  try {
    const options = await parseArgs();
    
    console.log('🚀 Enhanced Qualification Run Recovery Script');
    console.log('=' .repeat(50));
    console.log(`Action: ${options.action}`);
    
    if (options.verbose) {
      console.log(`Config: timeout=${options.timeoutMinutes}min, interval=${options.checkIntervalMinutes}min, retries=${options.maxRetries}`);
    }

    // Initialize run manager with custom configuration
    const runManager = getRunManager({
      timeoutMinutes: options.timeoutMinutes,
      checkIntervalMinutes: options.checkIntervalMinutes,
      maxRetries: options.maxRetries,
    });

    switch (options.action) {
      case 'recover':
        await performRecovery(runManager, options.checkOnly || false);
        break;

      case 'checkTimeouts':
        await checkTimeouts(runManager, options.checkOnly || false);
        break;

      case 'cleanup':
        await performCleanup(runManager, options.olderThanDays || 30, options.checkOnly || false);
        break;

      case 'stats':
        await showStats(runManager, options.verbose || false);
        break;

      case 'health':
        await showHealth(runManager, options.verbose || false);
        break;

      default:
        console.error(`❌ Unknown action: ${options.action}`);
        printHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Script Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });