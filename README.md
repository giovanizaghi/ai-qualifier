# AI Qualifier - Assessment Platform

A Next.js-based assessment platform for AI and technology qualifications.

## Features

- User authentication with NextAuth.js
- Assessment taking interface with multiple question types
- Results tracking and progress monitoring
- Responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

Build for production:

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 15
- **Authentication**: NextAuth.js v5
- **Database**: PostgreSQL with Prisma ORM
- **UI**: React 19, Tailwind CSS, Radix UI
- **Forms**: React Hook Form with Zod validation
- **TypeScript**: Full type safety

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── assessments/    # Assessment pages
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   ├── profile/        # User profile
│   └── qualifications/ # Qualifications pages
├── components/         # React components
├── lib/               # Utility functions
└── types/             # TypeScript types

prisma/
└── schema.prisma      # Database schema
```

## License

MIT
