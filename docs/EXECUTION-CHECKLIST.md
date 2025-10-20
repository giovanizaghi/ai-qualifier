# Quick Execution Checklist - ICP Qualifier
**Start Time**: _____________ | **Target**: 4 hours

---

## ⚡ Phase 1: Cleanup & Schema (30 min)

### Delete Old Code (10 min)
```bash
cd /Volumes/Sandisk\ Extreme/Projects/ai-qualifier

# Remove wrong pages
rm -rf src/app/assessments
rm -rf src/app/qualifications  
rm -rf src/app/profile

# Remove wrong APIs
rm -rf src/app/api/assessments
rm -rf src/app/api/qualifications
rm -rf src/app/api/questions
rm -rf src/app/api/assessment-results
rm -rf src/app/api/progress

# Remove wrong components
rm -rf src/components/assessment
rm -rf src/components/qualifications

# Remove wrong lib files
rm src/lib/assessment-engine.ts
rm src/lib/scoring-algorithms.ts
rm src/lib/question-*.ts
rm src/lib/adaptive-selection.ts
rm src/lib/criteria-service.ts
rm src/lib/levels-service.ts
rm src/lib/dashboard-service.ts
```

- [ ] Files deleted
- [ ] Verified app still runs

### Update Schema (20 min)
- [ ] Replace `prisma/schema.prisma` with new ICP schema (from plan)
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`
- [ ] Test: No errors

---

## ⚡ Phase 2: Install Dependencies (5 min)

```bash
npm install openai cheerio @types/cheerio
```

- [ ] Installed
- [ ] No conflicts

---

## ⚡ Phase 3: Core Services (45 min)

### OpenAI Client (10 min)
**File**: `src/lib/openai-client.ts`
- [ ] Create OpenAI client singleton
- [ ] Export helper functions
- [ ] Test connection

### Domain Analyzer (15 min)
**File**: `src/lib/domain-analyzer.ts`
- [ ] Function to fetch website
- [ ] Extract metadata (title, description)
- [ ] Extract main content
- [ ] Return structured data
- [ ] Test with a real domain

### ICP Generator (10 min)
**File**: `src/lib/icp-generator.ts`
- [ ] Build prompt with company data
- [ ] Call OpenAI API
- [ ] Parse response to structured format
- [ ] Test with sample data

### Prospect Qualifier (10 min)
**File**: `src/lib/prospect-qualifier.ts`
- [ ] Analyze prospect domain
- [ ] Build comparison prompt
- [ ] Get score + reasoning from AI
- [ ] Return structured result
- [ ] Test with sample

---

## ⚡ Phase 4: API Routes (45 min)

### Company Analysis API (15 min)
**File**: `src/app/api/companies/analyze/route.ts`
- [ ] POST endpoint
- [ ] Validate domain input
- [ ] Call domain analyzer
- [ ] Generate ICP
- [ ] Save to database
- [ ] Return company + ICP

### Companies List API (5 min)
**File**: `src/app/api/companies/route.ts`
- [ ] GET endpoint
- [ ] Fetch user's companies
- [ ] Return with ICPs

### Qualification API (15 min)
**File**: `src/app/api/qualify/route.ts`
- [ ] POST endpoint
- [ ] Parse domains list
- [ ] Create qualification run
- [ ] Process each prospect
- [ ] Save results
- [ ] Return run + results

### Results API (10 min)
**File**: `src/app/api/qualify/[runId]/route.ts`
- [ ] GET endpoint
- [ ] Fetch run with results
- [ ] Return formatted data

**Test all APIs with Postman/curl**
- [ ] Company analysis works
- [ ] Qualification works
- [ ] Results fetch works

---

## ⚡ Phase 5: Frontend - Onboarding (30 min)

### Onboarding Page (30 min)
**File**: `src/app/onboarding/page.tsx`
- [ ] Create page structure
- [ ] Domain input form
- [ ] Submit handler (call API)
- [ ] Loading state during analysis
- [ ] Show generated ICP
- [ ] Redirect to dashboard
- [ ] Error handling

**Components needed:**
- [ ] `src/components/onboarding/domain-form.tsx`
- [ ] `src/components/onboarding/icp-preview.tsx`

---

## ⚡ Phase 6: Frontend - Dashboard (20 min)

### Dashboard Update (20 min)
**File**: `src/app/dashboard/page.tsx`
- [ ] Fetch user's company
- [ ] Display company info
- [ ] Display ICP summary
- [ ] "Qualify Prospects" button → /qualify
- [ ] Handle no company (redirect to onboarding)

**Components needed:**
- [ ] `src/components/dashboard/company-overview.tsx`
- [ ] `src/components/dashboard/icp-card.tsx`

---

## ⚡ Phase 7: Frontend - Qualification (40 min)

### Qualification Input Page (15 min)
**File**: `src/app/qualify/page.tsx`
- [ ] Fetch user's ICP
- [ ] Textarea for domains (comma-separated)
- [ ] Parse domains
- [ ] Submit button
- [ ] Call qualification API
- [ ] Redirect to results

### Results Page (25 min)
**File**: `src/app/qualify/[runId]/page.tsx`
- [ ] Fetch qualification results
- [ ] Display run status
- [ ] List prospects with:
  - [ ] Company name
  - [ ] Domain
  - [ ] Score (0-100)
  - [ ] Fit level badge (Excellent/Good/Fair/Poor)
  - [ ] Reasoning (expandable)
- [ ] Sort by score
- [ ] Loading states
- [ ] Error states

**Components needed:**
- [ ] `src/components/qualify/prospect-card.tsx`
- [ ] `src/components/qualify/score-badge.tsx`

---

## ⚡ Phase 8: Polish (30 min)

### Error Handling (10 min)
- [ ] API error responses
- [ ] Frontend error boundaries
- [ ] Toast notifications (sonner)

### Loading States (10 min)
- [ ] Skeleton loaders
- [ ] Progress indicators
- [ ] Disable buttons during processing

### Validation (10 min)
- [ ] Domain format validation
- [ ] Empty input handling
- [ ] Max domains limit (e.g., 10)

---

## ⚡ Phase 9: Testing & Fixes (30 min)

### End-to-End Test
- [ ] Sign up new user
- [ ] Complete onboarding
- [ ] Enter company domain
- [ ] View generated ICP
- [ ] Qualify 3-5 prospects
- [ ] View results
- [ ] Check database has all data

### Bug Fixes
- [ ] Fix any errors found
- [ ] Check mobile responsive
- [ ] Verify all links work

---

## ⚡ Phase 10: Documentation (20 min)

### Update README (15 min)
- [ ] Project description (ICP qualifier)
- [ ] Features list
- [ ] Setup instructions
- [ ] Environment variables
- [ ] How to run locally

### Create Architecture Doc (5 min)
**File**: `ARCHITECTURE.md`
- [ ] System overview
- [ ] Database schema
- [ ] AI integration strategy
- [ ] Key decisions
- [ ] Trade-offs
- [ ] Future improvements

---

## ⚡ Phase 11: Deployment (20 min)

### Deploy to Vercel/Railway
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Deploy database (Supabase/Railway)
- [ ] Test production app
- [ ] Fix any deployment issues

---

## ⚡ Phase 12: Video Recording (15 min)

### Loom Video (≤5 min)
- [ ] Show login
- [ ] Onboarding with real company
- [ ] View ICP
- [ ] Qualify prospects
- [ ] Show results with reasoning
- [ ] Quick code walkthrough

---

## 📊 Time Tracking

| Phase | Planned | Actual | Status |
|-------|---------|--------|--------|
| Cleanup & Schema | 30 min | ___ | ⬜ |
| Dependencies | 5 min | ___ | ⬜ |
| Core Services | 45 min | ___ | ⬜ |
| API Routes | 45 min | ___ | ⬜ |
| Onboarding | 30 min | ___ | ⬜ |
| Dashboard | 20 min | ___ | ⬜ |
| Qualification | 40 min | ___ | ⬜ |
| Polish | 30 min | ___ | ⬜ |
| Testing | 30 min | ___ | ⬜ |
| Documentation | 20 min | ___ | ⬜ |
| Deployment | 20 min | ___ | ⬜ |
| Video | 15 min | ___ | ⬜ |
| **TOTAL** | **4h 30m** | ___ | |

---

## 🎯 Success Metrics

- [ ] User can complete full flow without errors
- [ ] ICP generation takes <30s
- [ ] Prospect qualification takes <10s per domain
- [ ] All data persists correctly
- [ ] Mobile responsive
- [ ] Deployed and accessible
- [ ] Video walkthrough complete

---

## 🚨 Emergency Shortcuts (If Running Out of Time)

### Must Have:
1. Onboarding → ICP generation
2. Qualify → Results
3. Basic UI (can be ugly)

### Can Skip:
- ❌ Dashboard polish
- ❌ Advanced error handling
- ❌ Background jobs
- ❌ Export features
- ❌ Analytics

### Quick Wins:
- Use placeholder data if scraping fails
- Simplify UI to basic forms
- Skip authentication if needed (demo mode)
- Mock some AI responses for speed

---

**START NOW!** ⚡
