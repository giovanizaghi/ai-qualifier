Technical Assignment: Software Engineer
Overview
Your task is to build a fully functional, production-ready prototype called “The AI Qualifier.
”
This app should allow users to generate an Ideal Customer Profile (ICP) for their company and
then qualify other companies based on that ICP — using your own design and code
architecture.
The goal of this challenge is not to finish fast, but to demonstrate your ability to think,
structure, and build:
●
●
●
●
●
●
solid architecture
clear code organization
effective use of AI APIs
database and data-modeling decisions
authentication & deployment
good developer ergonomics (CI/CD, documentation, etc.)
Stack (required)
●
●
●
●
Frontend: Next.js
Backend: Node.js (server in the same Next.js app or separate—your call)
Database: PostgreSQL (you may use Supabase)
AI: OpenAI API (key will be provided)
Core flow
1. Authentication
●
●
The system should include a simple authentication flow.
Once logged in, the user should be taken through a short onboarding flow.
2. Company onboarding
●
●
Ask the user for their company domain (e.g., windmillgrowth.com).
After submission, your app should:
○
○
○
Analyze or scrape the domain.
Understand what the company does and summarize it.
Generate an AI-based Ideal Customer Profile (ICP) that describes who their
best customers might be.
3. ICP generation
The generated ICP should be structured and detailed, containing elements such as:
●
●
●
●
A title and description
3–5 buyer personas, each with roles, departments, and key pain points
Company size, revenue range, and industries
Geographic regions and funding stages
(You can design your own schema for how this data is stored or represented.)
4. Prospect qualification
●
After an ICP is generated, allow the user to enter a list of domains (comma-separated).
●
●
For each domain:
○
Analyze or extract signals about the company.
○
Compare them against the ICP.
○
Return a qualification score and short explanation of why it does or doesn’t fit.
Save all relevant data (e.g., inputs, outputs, logs) in your system.
5. Output / results
●
Provide a simple, functional interface (or API) to:
○
View the generated ICP
○
See a list of qualified prospects
○
Inspect reasoning and data for each qualification run
You can design the UI, API, and user flow however you think best fits this purpose.
What we’ll evaluate
1. Architecture & Reasoning
How well you structure the system end-to-end — backend, frontend (if any), database,
and API design.
2. Code Quality & Reliability
Clean, readable, maintainable code. Clear logic separation. Error handling.
3. AI Integration
How you design and use the LLM (prompt quality, data prep, post-processing, error
handling).
4. Data Modeling
How you represent users, companies, ICPs, and qualification results.
5. Deployment & CI/CD
Show that you can deploy and make the system reproducible (any platform you like).
CI/CD setup, migrations, tests, or automation earn bonus points.
6. Documentation & Developer Experience
README clarity, local setup instructions, reasoning behind design choices.
7. Creativity & Extensions
If you add thoughtful features — dashboards, retries, background jobs, queues,
semantic search, analytics, or observability — we’ll notice.
Deliverables
●
●
●
A working application hosted live.
A public or private GitHub repository containing:
○
All source code
○
Setup instructions
○
Environment variable example file
○
Short document describing:
■ Your architecture
■ Key technical decisions and trade-offs
■ What you’d do next if you had more time
A short Loom/video walkthrough (≤ 5 min) of your system and reasoning.
Guidelines
●
●
●
●
You can use any stack you’re most comfortable with, but we prefer you to use the stack
mentioned above.
You can structure the project however you see fit (monolith, micro-services, etc.).
You may use any external tools or APIs (OpenAI key will be provided).
Keep things simple, but make them clean, modular, and production-minded.
Open AI API Key (Limited with $10 budget, if needed more - your efficiency will be evaluated):
●
API Key.
sk-proj-F3wgOsD1nF6obY0qgdYOtZC8hYaAb0ZeJopBS-bNSoe-hPC65gtdn4cS0F5av5
FFgNAMOMsiUPT3BlbkFJ85GE
_
lUQVy5LJAC8aRkicNo6oSz
6QGP0cx-
kcWwYIDGs
_
_
zXFPnDIC4V4MKhLnkq6HdGF9OGIA
Rules:
●
●
●
Expected to finish the task in 72 hours from receiving it via email. If you need more time,
let us know.
You are expected to use AI - but to make sure the code is good enough and production
ready.
Do not spend more than 8-10 hours on the task. Shouldn’t take more than that.