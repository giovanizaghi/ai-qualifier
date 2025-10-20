# Background Task Persistence - Important Information

## ⚠️ Current Behavior: Tasks Do NOT Persist Across Server Restarts

### What Happens Now:

When you **stop the server** (Ctrl+C or restart):
- ❌ **All running background tasks are killed immediately**
- ❌ **In-progress qualifications are LOST**
- ❌ **The run will remain stuck in "PROCESSING" status**
- ❌ **No results will be saved**
- ❌ **The process does not resume when server restarts**

### Why This Happens:

The current implementation uses **in-memory background processing**:

```typescript
// In src/app/api/qualify/route.ts
processQualification(run.id, icpData, domains).catch((error) => {
  console.error(`[API] Error processing qualification run ${run.id}:`, error);
});
```

This is a **fire-and-forget async function** that runs in the Node.js process memory. When the server stops, the entire process is terminated, and all running tasks are lost.

### What You're Seeing:

If the notification appeared when you restarted the server, it means:
1. ✅ The run record exists in the database with status "PROCESSING"
2. ✅ The notifier correctly detects it as an active run
3. ❌ BUT the actual background processing stopped when you killed the server
4. ❌ The run is now "stuck" - it will never complete

## 🔍 How to Check for Stuck Runs

### Query the Database:
```sql
SELECT id, status, totalProspects, completed, createdAt
FROM qualification_runs
WHERE status IN ('PENDING', 'PROCESSING')
ORDER BY createdAt DESC;
```

### Signs of a Stuck Run:
- Status is "PROCESSING" but no new results are being added
- `completed` count stopped increasing
- No background logs in server output
- Run was created before the last server restart

## 🛠️ How to Fix Stuck Runs

### Option 1: Mark as Failed ✅ IMPLEMENTED

**Automatic recovery is now active!** Every time you restart the server, stuck runs are automatically marked as failed.

**How it works**:
- Runs on server startup via `src/instrumentation.ts`
- Finds runs older than 5 minutes
- Marks them as FAILED
- Logs actions taken

**Configuration**: Edit timeout in `src/instrumentation.ts`:
```typescript
const result = await recoverStuckRuns(5); // 5 minutes
```

**See**: `docs/OPTION-1-IMPLEMENTATION-COMPLETE.md` for full details.

**Manual methods still available**:

```bash
# CLI script
npm run recover-stuck-runs

# Or SQL directly
UPDATE qualification_runs
SET status = 'FAILED',
    completedAt = NOW()
WHERE status = 'PROCESSING'
  AND createdAt < NOW() - INTERVAL '10 minutes';
```

### Option 2: Resume Processing (Not Implemented)
We would need to implement a recovery mechanism (see Production Solutions below).

## 🚀 Production Solutions

To make background tasks persist across server restarts, you need a **proper background job queue**:

### Recommended Solutions:

#### 1. **BullMQ + Redis** (Recommended)
```bash
npm install bullmq ioredis
```

**Pros:**
- ✅ Persists jobs in Redis
- ✅ Automatic retry on failure
- ✅ Job progress tracking
- ✅ Survives server restarts
- ✅ Scalable (multiple workers)
- ✅ Built-in UI for monitoring

**Implementation:**
```typescript
// Create queue
const qualificationQueue = new Queue('qualifications', {
  connection: redis
});

// Add job
await qualificationQueue.add('qualify', {
  runId,
  icpData,
  domains
});

// Worker processes jobs
const worker = new Worker('qualifications', async (job) => {
  await processQualification(job.data.runId, job.data.icpData, job.data.domains);
});
```

#### 2. **Vercel Background Functions** (For Vercel hosting)
```typescript
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';
```

**Limitations:**
- ⏱️ Max 5 minutes (Pro plan) or 1 minute (Hobby)
- 💰 Extra cost
- ❌ Still doesn't persist across deployments

#### 3. **Inngest** (Serverless Background Jobs)
```bash
npm install inngest
```

**Pros:**
- ✅ Serverless (no Redis needed)
- ✅ Automatic retries
- ✅ Survives restarts
- ✅ Free tier available

#### 4. **Trigger.dev** (Background Jobs as Code)
```bash
npm install @trigger.dev/sdk
```

**Pros:**
- ✅ Simple setup
- ✅ Great DX
- ✅ Built-in monitoring
- ✅ Free tier

### 2. Startup Recovery Script

Add a recovery mechanism when server starts:

```typescript
// src/lib/background-recovery.ts
export async function recoverStuckRuns() {
  const stuckRuns = await prisma.qualificationRun.findMany({
    where: {
      status: 'PROCESSING',
      // Created more than 10 minutes ago
      createdAt: {
        lt: new Date(Date.now() - 10 * 60 * 1000)
      }
    }
  });

  for (const run of stuckRuns) {
    console.log(`[Recovery] Marking stuck run ${run.id} as FAILED`);
    await prisma.qualificationRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date()
      }
    });
  }
}
```

Call on server start:
```typescript
// src/app/layout.tsx or instrumentation.ts
if (typeof window === 'undefined') {
  recoverStuckRuns().catch(console.error);
}
```

## 📊 Current Architecture

```
┌─────────────────┐
│  POST /qualify  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Create DB Record        │
│ status: PROCESSING      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Fire async function     │
│ processQualification()  │
│ (runs in memory)        │
└────────┬────────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
    ✅ Success         ❌ Server Restart
    Updates DB         → Task LOST
                       → Run STUCK
```

## 🎯 Recommended Immediate Action

### For Development:
1. **Accept the limitation**: Tasks won't survive restarts
2. **Don't restart server** while qualifications are running
3. **Check for stuck runs** periodically and mark them as failed

### For Production:
1. **Implement BullMQ + Redis** (most robust)
2. **Or use Inngest/Trigger.dev** (easier setup)
3. **Add recovery script** to mark old stuck runs as failed
4. **Add monitoring** to alert on stuck runs

## 🔧 Quick Fix: Add Timeout and Recovery

Add this to your code:

```typescript
// src/app/api/qualify/route.ts

// Set a timeout for stuck runs
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

setTimeout(async () => {
  const run = await prisma.qualificationRun.findUnique({
    where: { id: run.id }
  });
  
  if (run?.status === 'PROCESSING') {
    await prisma.qualificationRun.update({
      where: { id: run.id },
      data: { 
        status: 'FAILED',
        completedAt: new Date()
      }
    });
  }
}, TIMEOUT_MS);
```

**Note**: This timeout will also be lost on server restart!

## ✅ What Works Now

- ✅ Background processing **while server is running**
- ✅ Progress updates to database
- ✅ Notifier shows active runs
- ✅ Results are saved as they complete

## ❌ What Doesn't Work

- ❌ Tasks don't survive server restart
- ❌ No automatic recovery
- ❌ No retry mechanism
- ❌ No monitoring/alerting
- ❌ Can't scale to multiple server instances

## 📝 Summary

**Current State**: 
- Background tasks run **only while the server is up**
- Restarting the server **kills all running tasks**
- Stuck runs remain in "PROCESSING" state indefinitely

**For Development**:
- This is **acceptable** - just don't restart during qualifications
- Manually mark stuck runs as failed when needed

**For Production**:
- You **MUST** implement a proper job queue (BullMQ, Inngest, etc.)
- Add recovery mechanisms
- Monitor for stuck runs

---

**Date**: October 20, 2025
**Status**: ⚠️ Background tasks are NOT persistent across restarts
