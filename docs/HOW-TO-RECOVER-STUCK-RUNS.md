# How to Handle Stuck Qualification Runs

## Quick Answer

**No, background tasks do NOT continue after server restart.** When you stop the server, all running qualification tasks are lost. The database records remain in "PROCESSING" status, creating "stuck runs".

## What You're Seeing

When you restart the server and see the notification:
- ✅ The notification is working correctly
- ⚠️ But the background task is NOT actually running
- ❌ The run is "stuck" - it will never complete on its own

## Solutions

### 🔧 Option 1: Use the Recovery Script (Recommended)

#### Check for stuck runs:
```bash
npm run recover-stuck-runs -- --check-only
```

Output:
```
⚠️  Found 2 stuck run(s):

1. Run ID: cmgz47wkm0005on6t8hxo4b9a
   Status: PROCESSING
   Progress: 3/10
   ICP: E-commerce SaaS Companies
   Company: Stripe
   Created: 2025-10-20T10:00:00Z
   Stuck for: 45 minutes
```

#### Recover (mark as failed):
```bash
npm run recover-stuck-runs
```

Output:
```
✅ Recovered 2 stuck run(s):

1. Run ID: cmgz47wkm0005on6t8hxo4b9a
   Status: PROCESSING → FAILED
   Progress: 3/10
   Created: 2025-10-20T10:00:00Z

All stuck runs have been marked as FAILED ✅
```

#### Custom timeout:
```bash
# Mark runs stuck for more than 60 minutes as failed
npm run recover-stuck-runs -- --timeout=60
```

### 🌐 Option 2: Use the API Endpoint

#### Check for stuck runs:
```bash
curl http://localhost:3000/api/qualify/recovery?timeout=30
```

Response:
```json
{
  "success": true,
  "count": 2,
  "runs": [
    {
      "id": "cmgz47wkm0005on6t8hxo4b9a",
      "status": "PROCESSING",
      "totalProspects": 10,
      "completed": 3,
      "createdAt": "2025-10-20T10:00:00Z",
      "icp": {
        "title": "E-commerce SaaS Companies",
        "company": {
          "name": "Stripe",
          "domain": "stripe.com"
        }
      },
      "stuckFor": 45
    }
  ]
}
```

#### Recover stuck runs:
```bash
curl -X POST http://localhost:3000/api/qualify/recovery \
  -H "Content-Type: application/json" \
  -d '{"timeout": 30}'
```

Response:
```json
{
  "success": true,
  "message": "Recovered 2 stuck runs",
  "recovered": 2,
  "runs": [...]
}
```

### 💾 Option 3: Direct Database Query

```sql
-- Check for stuck runs
SELECT 
  id, 
  status, 
  totalProspects,
  completed,
  createdAt,
  EXTRACT(EPOCH FROM (NOW() - createdAt)) / 60 as stuck_for_minutes
FROM qualification_runs
WHERE status IN ('PENDING', 'PROCESSING')
  AND createdAt < NOW() - INTERVAL '30 minutes';

-- Mark as failed
UPDATE qualification_runs
SET 
  status = 'FAILED',
  completedAt = NOW()
WHERE status IN ('PENDING', 'PROCESSING')
  AND createdAt < NOW() - INTERVAL '30 minutes';
```

## Prevention Tips

### For Development:

1. **Don't restart during qualification**
   - Let qualifications complete before restarting
   - Check active runs before stopping server

2. **Use smaller batches**
   - Test with 1-3 domains instead of 10+
   - Faster completion = less likely to be interrupted

3. **Monitor the console**
   - Watch for "Background completed" messages
   - Wait for completion before restarting

4. **Clear stuck runs regularly**
   ```bash
   npm run recover-stuck-runs
   ```

### For Production:

You **MUST** implement a proper background job queue. See options:

1. **BullMQ + Redis** (Recommended)
   - Most robust solution
   - Persists across restarts
   - Scalable

2. **Inngest** (Easiest)
   - Serverless solution
   - No infrastructure needed
   - Free tier available

3. **Trigger.dev** (Great DX)
   - Simple setup
   - Built-in monitoring
   - Good for small teams

See `docs/BACKGROUND-TASKS-PERSISTENCE.md` for full implementation details.

## Files Created

1. ✅ `src/lib/background-recovery.ts` - Recovery utilities
2. ✅ `src/app/api/qualify/recovery/route.ts` - API endpoint
3. ✅ `scripts/recover-stuck-runs.ts` - CLI script
4. ✅ `docs/BACKGROUND-TASKS-PERSISTENCE.md` - Full documentation
5. ✅ `docs/HOW-TO-RECOVER-STUCK-RUNS.md` - This guide

## Quick Reference

| Command | What it does |
|---------|--------------|
| `npm run recover-stuck-runs -- --check-only` | Check for stuck runs |
| `npm run recover-stuck-runs` | Recover all stuck runs (>30 min) |
| `npm run recover-stuck-runs -- --timeout=60` | Recover runs stuck >60 min |
| `curl /api/qualify/recovery` | Check via API |
| `curl -X POST /api/qualify/recovery` | Recover via API |

## When to Recover

Recover stuck runs when:
- ✅ Server was restarted during qualification
- ✅ Qualification taking longer than expected (>30 min)
- ✅ Notification shows old run that's not progressing
- ✅ Before starting new qualifications (clean slate)

## What Happens When You Recover

1. Finds runs in PROCESSING/PENDING status for >30 min (default)
2. Marks them as FAILED
3. Sets completedAt timestamp
4. They disappear from active run notifier
5. User can see them in history as failed

## Important Notes

⚠️ **Recovered runs cannot be resumed** - The original data (domains, ICP) is not stored in a way that allows resumption. Users must re-run the qualification.

✅ **Progress is saved** - Any prospects that completed before the crash are saved in the database.

❌ **Incomplete prospects are lost** - Prospects being processed when the server stopped are not saved.

## Example Workflow

```bash
# 1. Start server
npm run dev

# 2. Start a qualification
# (via UI: /qualify)

# 3. Server crashes or you restart
# Ctrl+C

# 4. Restart server
npm run dev

# 5. You see old notification for stuck run

# 6. Check what's stuck
npm run recover-stuck-runs -- --check-only

# 7. Recover stuck runs
npm run recover-stuck-runs

# 8. Notification disappears
# ✅ Clean state!
```

---

**Date**: October 20, 2025
**TL;DR**: Background tasks stop on server restart. Use `npm run recover-stuck-runs` to clean up.
