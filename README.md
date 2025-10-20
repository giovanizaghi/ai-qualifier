# ICP Qualifier - AI-Powered Lead Qualification

An intelligent lead qualification platform that analyzes your company to generate an Ideal Customer Profile (ICP), then qualifies prospects against it using AI.

## 🎯 What It Does

1. **Analyze Your Company** - Enter your domain, and AI analyzes your business
2. **Generate ICP** - Creates a detailed Ideal Customer Profile with buyer personas, target industries, company sizes, and more
3. **Qualify Prospects** - Batch analyze prospect domains and score them against your ICP
4. **Get Insights** - See detailed scoring, fit analysis, matched criteria, and gaps

## ✨ Features

- 🤖 **AI-Powered Analysis** - Uses OpenAI GPT-4o-mini for intelligent domain analysis and qualification
- 🎯 **ICP Generation** - Automatically creates structured buyer personas and target criteria
- 📊 **Prospect Scoring** - Scores prospects 0-100 with detailed reasoning
- 🔍 **Domain Intelligence** - Web scraping and content analysis for accurate insights
- 🔐 **Secure Authentication** - NextAuth.js with email/password and OAuth support
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- ⚡ **Real-time Feedback** - Loading states, progress tracking, and toast notifications
- 🛡️ **Production Ready** - Rate limiting, error handling, input validation, and security measures

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/giovanizaghi/ai-qualifier.git
   cd ai-qualifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_qualifier"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"
   
   # OpenAI
   OPENAI_API_KEY="sk-proj-..."
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📖 Usage

### 1. Onboarding
- Sign up for an account
- Enter your company's domain
- AI analyzes your website and generates an ICP

### 2. Qualify Prospects
- Go to "Qualify Prospects"
- Enter a list of prospect domains (one per line)
- Click "Analyze Prospects"
- View results with scores and detailed insights

### 3. View Results
- See fit level (Excellent, Good, Fair, Poor)
- Review matched criteria (what fits your ICP)
- Identify gaps (what doesn't match)
- Read AI-generated reasoning

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4o-mini
- **Web Scraping**: Cheerio
- **UI**: 
  - React 19
  - Tailwind CSS
  - Radix UI components
  - Lucide icons
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner toast library
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── companies/      # Company analysis endpoints
│   │   └── qualify/        # Qualification endpoints
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Main dashboard
│   ├── onboarding/         # New user flow
│   └── qualify/            # Qualification pages
├── components/
│   ├── company/            # Company & ICP components
│   ├── qualify/            # Qualification components
│   ├── shared/             # Loading/error components
│   └── ui/                 # Base UI components
├── lib/
│   ├── api-error-handler.ts    # Error handling utilities
│   ├── domain-analyzer.ts      # Domain scraping & analysis
│   ├── icp-generator.ts        # ICP generation with AI
│   ├── openai-client.ts        # OpenAI API client
│   ├── prospect-qualifier.ts   # Prospect qualification logic
│   ├── toast.ts                # Toast notification utilities
│   └── validation.ts           # Input validation & rate limiting
├── types/
│   └── index.ts            # TypeScript type definitions
└── middleware.ts           # Route protection

prisma/
└── schema.prisma           # Database schema
```

## 🔑 Environment Variables

See `.env.example` for a complete list of environment variables with descriptions.

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret key
- `NEXTAUTH_URL` - Your application URL
- `OPENAI_API_KEY` - OpenAI API key for AI features

**Optional**:
- Rate limiting configuration
- OpenAI model settings
- OAuth provider credentials
- Error tracking (Sentry)
- Analytics integration

## 🧪 Development

### Database Commands

```bash
# Push schema changes
npm run db:push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database (warning: deletes all data)
npx prisma db push --force-reset
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📊 API Endpoints

### Companies
- `POST /api/companies/analyze` - Analyze a company domain and generate ICP
- `GET /api/companies` - List user's companies
- `GET /api/companies/[id]` - Get company and ICP details

### Qualification
- `POST /api/qualify` - Create a qualification run for multiple prospects
- `GET /api/qualify/[runId]` - Get qualification run status
- `GET /api/qualify/[runId]/results` - Get detailed prospect results

## 🛡️ Security Features

- Input validation with Zod schemas
- Domain sanitization to prevent XSS
- Rate limiting (5 req/min for analysis, 3 req/min for qualification)
- Protected API routes with authentication
- Error handling without exposing sensitive data
- SQL injection prevention with Prisma ORM

## 📚 Documentation

Comprehensive documentation available in the `/docs` folder:

- `IMPLEMENTATION-PLAN.md` - Complete implementation roadmap
- `PHASE-{1-6}-COMPLETE.md` - Detailed phase completion docs
- `STATUS.md` - Current project status
- `API-CLEANUP-COMPLETE.md` - API structure documentation

## 🤝 Contributing

This is currently a portfolio/demonstration project. Feel free to fork and adapt for your own use.

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with Next.js and React
- AI powered by OpenAI
- UI components from Radix UI
- Icons from Lucide