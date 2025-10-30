# AI Qualifier - Final Steps to Complete

**Date**: October 20, 2025  
**Status**: Ready for testing, CI/CD, and deployment

---

## Phase 7: Unit Testing Setup (30 minutes)

### Setup Jest + Testing Library
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Install TypeScript support for Jest
npm install --save-dev @types/jest ts-jest
```

### Create Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Basic Test Examples
```typescript
// src/lib/__tests__/validation.test.ts
import { isValidDomain, sanitizeDomain } from '../validation'

describe('Domain Validation', () => {
  test('validates correct domains', () => {
    expect(isValidDomain('example.com')).toBe(true)
    expect(isValidDomain('sub.example.co.uk')).toBe(true)
  })

  test('sanitizes domains correctly', () => {
    expect(sanitizeDomain('https://www.example.com/path')).toBe('example.com')
  })
})

// src/components/__tests__/ScoreBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { ScoreBadge } from '../qualify/score-badge'

describe('ScoreBadge', () => {
  test('renders excellent score correctly', () => {
    render(<ScoreBadge score={85} />)
    expect(screen.getByText('EXCELLENT')).toBeInTheDocument()
  })
})
```

### Add Test Scripts
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Phase 8: CI/CD with Vercel (20 minutes)

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret", 
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

### Quick Deployment Steps
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login and link project
vercel login
vercel link

# 3. Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET  
vercel env add OPENAI_API_KEY
vercel env add NEXTAUTH_URL

# 4. Deploy
vercel --prod
```

---

## Phase 9: Final Validation (10 minutes)

### Pre-deployment Checklist
- [ ] Tests pass locally: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] OpenAI API key valid

### Post-deployment Testing
- [ ] Authentication flow works
- [ ] Company analysis completes
- [ ] ICP generation successful  
- [ ] Prospect qualification functional
- [ ] All pages load correctly

---

## Simplified Implementation

**Total Time**: ~1 hour for basic passing tests and CI/CD

### Minimum Viable Tests (15 minutes)
```typescript
// Just test core utilities - enough to pass CI
- Domain validation functions
- Score calculation utilities  
- Basic component rendering
```

### Basic CI/CD (30 minutes)
```yaml
# Minimal workflow that just builds and deploys
- Install dependencies
- Run basic tests
- Build Next.js app
- Deploy to Vercel on main branch
```

### Vercel Setup (15 minutes)
```bash
# One-command deploy with environment setup
vercel --prod
```

---

## Phase 10: Fix Real-time Updates (15 minutes)

### Issue: Qualification Results Not Updating in Real-time
The qualification page currently requires manual refresh to see results. Here's how to fix it:

### Enhanced Real-time Polling
```typescript
// src/components/qualify/qualification-results.tsx - Enhanced polling
useEffect(() => {
  if (run.status !== "PROCESSING" && run.status !== "PENDING") return;

  const pollInterval = setInterval(async () => {
    try {
      console.log(`Polling run ${run.id} - Current status: ${run.status}, Completed: ${run.completed}/${run.totalProspects}`);
      
      // Fetch updated run data with results
      const response = await fetch(`/api/qualify/${run.id}`, {
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const updatedRun = data.run;
      
      console.log(`Poll response - Status: ${updatedRun.status}, Completed: ${updatedRun.completed}/${updatedRun.totalProspects}`);
      
      // Always update the run state with fresh data
      setRun(updatedRun);
      
      // Stop polling when done
      if (updatedRun.status === "COMPLETED" || updatedRun.status === "FAILED") {
        console.log(`Stopping polling - Final status: ${updatedRun.status}`);
        setPolling(false);
      }
      
    } catch (error) {
      console.error("Polling error:", error);
      // Continue polling even on error, but reduce frequency
      setTimeout(() => {}, 1000);
    }
  }, 3000); // Poll every 3 seconds

  return () => {
    console.log(`Cleaning up polling for run ${run.id}`);
    clearInterval(pollInterval);
  };
}, [run.id, polling]); // Remove run.completed and run.status from deps
```

### Add Real-time Progress Notifications
```typescript
// Add toast notifications for progress updates
import { toast } from "sonner";

useEffect(() => {
  if (run.status === "PROCESSING" && run.completed > 0) {
    const progress = Math.round((run.completed / run.totalProspects) * 100);
    toast.info(`Progress: ${run.completed}/${run.totalProspects} prospects analyzed (${progress}%)`),
    {
      id: `progress-${run.id}`, // Prevent duplicate toasts
      duration: 2000,
    };
  }
  
  if (run.status === "COMPLETED") {
    toast.success(`Qualification completed! ${run.totalProspects} prospects analyzed`);
  }
  
  if (run.status === "FAILED") {
    toast.error("Qualification failed. Please try again.");
  }
}, [run.status, run.completed, run.totalProspects, run.id]);
```

### Background Job Processing (Future Enhancement)
```typescript
// src/lib/background-jobs.ts - For production scale
import Bull from 'bull';

const qualificationQueue = new Bull('qualification', process.env.REDIS_URL);

// Process qualification jobs
qualificationQueue.process(async (job) => {
  const { runId, icpData, domains } = job.data;
  
  // Update progress callback
  const updateProgress = (completed: number, total: number) => {
    job.progress(Math.round((completed / total) * 100));
  };
  
  // Run qualification with progress updates
  const results = await qualifyProspects(domains, icpData, updateProgress);
  
  // Save results to database
  await saveQualificationResults(runId, results);
  
  return { runId, completed: results.length };
});

// Add job to queue instead of synchronous processing
export async function queueQualification(runId: string, icpData: any, domains: string[]) {
  return qualificationQueue.add('qualify', {
    runId,
    icpData, 
    domains
  }, {
    attempts: 3,
    backoff: 'exponential',
    delay: 1000
  });
}
```

### WebSocket Alternative (Real-time Updates)
```typescript
// src/lib/websocket-client.ts - For instant updates
export function useQualificationUpdates(runId: string) {
  const [run, setRun] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/qualify/${runId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'progress') {
        setRun(prev => ({ ...prev, completed: update.completed }));
      }
      if (update.type === 'result') {
        setRun(prev => ({ 
          ...prev, 
          results: [...prev.results, update.result] 
        }));
      }
    };
    
    return () => ws.close();
  }, [runId]);
  
  return run;
}
```

---

## Critical Missing Deliverables

### 1. **Live Deployment** ❌ REQUIRED
- Deploy to Vercel (configured above)
- Test live application

### 2. **Video Walkthrough** ❌ REQUIRED  
- 5-minute Loom recording
- Demo full user flow
- Explain architecture decisions

### 3. **Fix Real-time Updates** ⚠️ QUICK FIX
- Enhanced polling with better error handling
- Progress notifications for better UX
- Consider background jobs for scale

The technical implementation is complete and excellent. These final steps add basic testing, automation, and real-time functionality to meet all requirements.
