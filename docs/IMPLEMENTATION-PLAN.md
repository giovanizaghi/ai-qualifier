# ICP Qualifier - Complete Implementation Plan
**Challenge Duration**: 72 hours | **Time Already Spent**: 8 hours | **Remaining**: ~2-3 hours for core features

---

## 🎯 What We're Actually Building

An **ICP (Ideal Customer Profile) Qualifier Tool** that:
1. Analyzes a company's domain to generate their ICP using AI
2. Qualifies prospect companies against that ICP
3. Scores and explains fit for each prospect

---

## ✅ What We Can Reuse (30 minutes saved)

### Keep As-Is:
- ✅ **Authentication system** (NextAuth.js setup)
- ✅ **User model** (with accounts, sessions)
- ✅ **Project structure** (Next.js 15, TypeScript, Tailwind)
- ✅ **UI components** (Radix UI, forms, buttons, etc.)
- ✅ **Environment setup** (ESLint, Prettier, TypeScript config)

### Repurpose:
- 🔄 Dashboard → ICP Management Dashboard
- 🔄 Some UI components for results display

---

## 🗑️ What Must Go (10 minutes)

### Delete These Completely:
```bash
# Remove wrong domain models
src/app/assessments/
src/app/qualifications/
src/app/profile/

# Remove wrong API routes
src/app/api/assessments/
src/app/api/qualifications/
src/app/api/questions/
src/app/api/assessment-results/
src/app/api/progress/

# Remove related components
src/components/assessment/
src/components/qualifications/

# Remove related lib files
src/lib/assessment-engine.ts
src/lib/scoring-algorithms.ts
src/lib/question-*.ts
src/lib/adaptive-selection.ts
src/lib/criteria-service.ts
src/lib/levels-service.ts
```

---

## 🏗️ Phase 1: Database Schema (30 minutes) ✅ COMPLETED

**Status**: ✅ Complete
**Completion Time**: ~30 minutes
**Documentation**: See `docs/PHASE-1-COMPLETE.md`

### Accomplishments:

✅ **Removed old assessment models** (Qualification, Assessment, Question, etc.)
✅ **Implemented new ICP Qualifier schema**:
- Company model (domain, websiteData, aiAnalysis)
- ICP model (buyer personas, company size, industries, regions)
- QualificationRun model (batch processing)
- ProspectQualification model (individual results)

✅ **Added new enums**: RunStatus, ProspectStatus, FitLevel
✅ **Database migration successful** via `prisma db push`
✅ **Prisma Client generated** and verified
✅ **Schema tested** - all models working correctly

### New Schema Design:

```prisma
// Keep: User, Account, Session, VerificationToken

// NEW: Company Profile
model Company {
  id          String   @id @default(cuid())
  userId      String   // Owner
  domain      String   @unique
  name        String?
  description String?  @db.Text
  industry    String?
  size        String?
  
  // Scraped/Analyzed Data (JSON)
  websiteData Json?    // Raw scraped data
  aiAnalysis  Json?    // AI summary
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
  icps        ICP[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("companies")
}

// NEW: Ideal Customer Profile
model ICP {
  id          String   @id @default(cuid())
  companyId   String
  
  title       String
  description String   @db.Text
  
  // Structured ICP Data
  buyerPersonas     Json  // Array of personas with roles, pain points
  companySize       Json  // Min/max employees, revenue ranges
  industries        String[]
  geographicRegions String[]
  fundingStages     String[]
  
  // AI Generation Details
  generatedBy String?  // AI model used
  prompt      String?  @db.Text
  
  // Relations
  company     Company  @relation(fields: [companyId], references: [id])
  qualifications QualificationRun[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("icps")
}

// NEW: Qualification Run (batch of prospects)
model QualificationRun {
  id          String   @id @default(cuid())
  icpId       String
  userId      String
  
  status      RunStatus @default(PENDING)
  totalProspects Int   @default(0)
  completed   Int      @default(0)
  
  // Relations
  icp         ICP      @relation(fields: [icpId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  results     ProspectQualification[]
  
  createdAt   DateTime @default(now())
  completedAt DateTime?
  
  @@map("qualification_runs")
}

// NEW: Prospect Qualification Result
model ProspectQualification {
  id              String   @id @default(cuid())
  runId           String
  
  domain          String
  companyName     String?
  
  // Analysis Data
  companyData     Json?    // Scraped/analyzed data
  
  // Qualification Results
  score           Float    // 0-100
  fitLevel        FitLevel // EXCELLENT, GOOD, FAIR, POOR
  reasoning       String   @db.Text
  matchedCriteria Json     // What matched from ICP
  gaps            Json     // What didn't match
  
  // Processing
  status          ProspectStatus @default(PENDING)
  error           String?  @db.Text
  
  // Relations
  run             QualificationRun @relation(fields: [runId], references: [id])
  
  createdAt       DateTime @default(now())
  analyzedAt      DateTime?
  
  @@map("prospect_qualifications")
}

// Update User model to add relations
model User {
  // ... existing fields ...
  companies           Company[]
  qualificationRuns   QualificationRun[]
  
  // Remove: assessmentResults, qualificationProgress
}

enum RunStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum ProspectStatus {
  PENDING
  ANALYZING
  COMPLETED
  FAILED
}

enum FitLevel {
  EXCELLENT  // 80-100
  GOOD       // 60-79
  FAIR       // 40-59
  POOR       // 0-39
}
```

**Action Items:**
- [ ] Replace `schema.prisma` with new schema
- [ ] Run `npx prisma db push`
- [ ] Generate Prisma client

---

## 🏗️ Phase 2: Core Services (45 minutes)

### 2.1 Domain Analysis Service (`src/lib/domain-analyzer.ts`)

```typescript
// Scrape/analyze company domain
export async function analyzeCompanyDomain(domain: string) {
  // 1. Fetch website data (Cheerio or Puppeteer)
  // 2. Extract: title, meta description, headings, content
  // 3. Return structured data
}
```

### 2.2 ICP Generation Service (`src/lib/icp-generator.ts`)

```typescript
// Generate ICP using OpenAI
export async function generateICP(companyData: any) {
  // 1. Build prompt with company data
  // 2. Call OpenAI API
  // 3. Parse structured ICP response
  // 4. Return ICP data
}
```

### 2.3 Prospect Qualification Service (`src/lib/prospect-qualifier.ts`)

```typescript
// Qualify prospect against ICP
export async function qualifyProspect(prospectDomain: string, icp: ICP) {
  // 1. Analyze prospect domain
  // 2. Compare against ICP using OpenAI
  // 3. Get score + reasoning
  // 4. Return qualification result
}
```

**Action Items:**
- [ ] Create `src/lib/domain-analyzer.ts`
- [ ] Create `src/lib/icp-generator.ts`
- [ ] Create `src/lib/prospect-qualifier.ts`
- [ ] Create `src/lib/openai-client.ts` (shared client)

---

## 🏗️ Phase 3: API Routes (45 minutes)

### 3.1 Company & ICP APIs

```typescript
// POST /api/companies/analyze
// - Input: { domain }
// - Analyze domain, save company, generate ICP
// - Return: { company, icp }

// GET /api/companies
// - List user's companies

// GET /api/companies/[id]
// - Get company + ICP details
```

### 3.2 Qualification APIs

```typescript
// POST /api/qualify
// - Input: { icpId, domains: string[] }
// - Create qualification run
// - Process prospects (background or sync)
// - Return: { runId, status }

// GET /api/qualify/[runId]
// - Get qualification run status + results

// GET /api/qualify/[runId]/results
// - Get detailed prospect results
```

**Action Items:**
- [ ] Create `src/app/api/companies/analyze/route.ts`
- [ ] Create `src/app/api/companies/route.ts`
- [ ] Create `src/app/api/qualify/route.ts`
- [ ] Create `src/app/api/qualify/[runId]/route.ts`
- [ ] Create `src/app/api/qualify/[runId]/results/route.ts`

---

## 🏗️ Phase 4: Frontend Pages (60 minutes)

### 4.1 Onboarding Flow

```
/onboarding
- Step 1: Welcome
- Step 2: Enter company domain
- Step 3: AI analyzing... (loading state)
- Step 4: Show generated ICP
- Step 5: Redirect to dashboard
```

**Files:**
- `src/app/onboarding/page.tsx`
- `src/components/onboarding/domain-input.tsx`
- `src/components/onboarding/icp-preview.tsx`

### 4.2 Dashboard

```
/dashboard
- Company overview card
- ICP summary
- Recent qualification runs
- CTA: "Qualify New Prospects"
```

**Files:**
- `src/app/dashboard/page.tsx` (repurpose existing)
- `src/components/dashboard/company-card.tsx`
- `src/components/dashboard/icp-summary.tsx`

### 4.3 Qualification Flow

```
/qualify
- Input: List of domains (textarea)
- Button: "Qualify Prospects"
- Redirect to results page

/qualify/[runId]
- Status indicator
- List of prospects with scores
- Color-coded fit levels
- Expandable reasoning for each
```

**Files:**
- `src/app/qualify/page.tsx`
- `src/app/qualify/[runId]/page.tsx`
- `src/components/qualify/domain-input.tsx`
- `src/components/qualify/prospect-card.tsx`
- `src/components/qualify/qualification-results.tsx`

---

## 🏗️ Phase 5: UI Components (30 minutes)

### Reusable Components:

```
src/components/
├── ui/ (keep existing Radix components)
├── company/
│   ├── company-analyzer.tsx
│   └── icp-display.tsx
├── qualify/
│   ├── domain-input.tsx
│   ├── prospect-card.tsx
│   └── score-badge.tsx
└── shared/
    ├── loading-states.tsx
    └── error-display.tsx
```

---

## 🏗️ Phase 6: Polish & Production (30 minutes)

### 6.1 Error Handling
- [ ] API error responses
- [ ] Frontend error boundaries
- [ ] Toast notifications

### 6.2 Loading States
- [ ] Analysis in progress
- [ ] Qualification processing
- [ ] Skeleton screens

### 6.3 Validation
- [ ] Domain validation (regex)
- [ ] Rate limiting checks
- [ ] Input sanitization

### 6.4 Environment Setup
- [ ] `.env.example` with all required vars
- [ ] OpenAI API key setup
- [ ] Database URL config

---

## 📋 Complete Task Checklist

### Hour 9 (Database & Core Setup) ✅ COMPLETED
- [x] Delete old models from schema
- [x] Add new ICP qualifier schema
- [x] Run migrations
- [x] Test database connection
- [x] Delete old route files (will do in cleanup)
- [x] Verify Prisma Client generation
- [x] Update prisma imports to use standard @prisma/client

### Hour 10 (Backend Services)
- [ ] Implement domain analyzer
- [ ] Implement ICP generator (OpenAI)
- [ ] Implement prospect qualifier
- [ ] Test OpenAI integration
- [ ] Create API routes

### Hour 11 (Frontend - Core)
- [ ] Build onboarding flow
- [ ] Update dashboard for ICP
- [ ] Create qualification input page
- [ ] Basic styling

### Hour 12 (Frontend - Results & Polish)
- [ ] Build results page
- [ ] Add loading states
- [ ] Error handling
- [ ] Polish UI/UX
- [ ] Test end-to-end flow

---

## 🚀 Quick Start Commands

```bash
# 1. Clean up old code (5 min)
rm -rf src/app/assessments src/app/qualifications src/app/profile
rm -rf src/app/api/assessments src/app/api/qualifications
rm -rf src/components/assessment src/components/qualifications

# 2. Update schema (5 min)
# Edit prisma/schema.prisma
npx prisma db push
npx prisma generate

# 3. Add OpenAI (2 min)
npm install openai cheerio

# 4. Set environment variables
# Add to .env.local:
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# 5. Start development
npm run dev
```

---

## 🎬 Implementation Order (Priority)

### Critical Path (Must Have):
1. ✅ Auth (already done)
2. 🔴 Schema migration
3. 🔴 Domain analyzer
4. 🔴 ICP generator
5. 🔴 Onboarding flow
6. 🔴 Qualification API
7. 🔴 Results display

### Nice to Have (If Time):
- Background job processing
- Caching
- Better scraping
- Analytics dashboard
- Export results

---

## 📝 Documentation Needs

### README Updates:
- Project purpose (ICP Qualifier)
- Setup instructions
- Environment variables
- API endpoints
- Architecture decisions

### Technical Doc:
- Database schema explanation
- AI prompt strategies
- Scraping approach
- Trade-offs made
- Future improvements

---

## ⏱️ Time Budget Breakdown

| Phase | Time | Description |
|-------|------|-------------|
| Cleanup | 10 min | Delete old code |
| Schema | 20 min | New database models |
| Services | 45 min | Domain analysis, ICP gen, qualification |
| API Routes | 45 min | REST endpoints |
| Onboarding | 30 min | Company domain input + ICP generation |
| Dashboard | 20 min | Repurpose existing |
| Qualification | 40 min | Input + results pages |
| Polish | 30 min | Loading, errors, validation |
| **Total** | **4 hours** | Core working prototype |

---

## 🎯 Success Criteria

### Must Work:
1. ✅ User can sign up/login
2. ✅ User enters company domain
3. ✅ System generates ICP using AI
4. ✅ User enters list of prospect domains
5. ✅ System qualifies each prospect
6. ✅ User sees scores + reasoning
7. ✅ All data saved to database

### Should Work:
- Error handling for invalid domains
- Loading states during AI processing
- Clean UI for results
- Mobile responsive

### Nice to Have:
- Background processing for long runs
- Export to CSV
- Filtering/sorting results
- Re-run qualification

---

## 🚨 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API slow | High | Add loading states, timeout handling |
| Domain scraping fails | Medium | Graceful fallback, error messages |
| Too many prospects | High | Limit batch size, add pagination |
| Time constraint | High | Focus on critical path only |

---

## 📦 Final Deliverables

1. ✅ Working app (deployed)
2. ✅ GitHub repo (clean, documented)
3. ✅ README with setup
4. ✅ Architecture doc
5. ✅ Video walkthrough (5 min)

---

**Status**: Ready to implement
**Next Step**: Start with Phase 1 (Database Schema)
**Estimated Completion**: 4 hours of focused work

