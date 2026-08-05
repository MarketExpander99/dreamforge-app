# Skill Gain — Learning Platform

**Free, premium-quality, Grok-guided education that makes children more capable and agentic.**

Live: [https://skill-gain.com](https://skill-gain.com)

## Mission Doctrine (Core)

Most education still trains kids for jobs that AI is already replacing. Skill-Gain does the opposite.

- We train for **agency**, judgement, creative synthesis, human connection, and the ability to use AI as leverage.
- Every subject carries a structural **AI Interaction Layer**: how AI transforms the domain, what becomes scarce, what becomes leverage, and what remains irreplaceably human.
- Pure human-mode paths remain available where warranted.
- Forward domains (space industry, orbital data centres, multiplanetary systems, etc.) are first-class citizens in the knowledge lattice.
- Quality gate for everything we ship: *Does this increase the child’s agency and ability to direct AI, or is it preparing them for obsolescence?*

Guidance layer originates from Grok / xAI. Human proxy on the ground is Skill-Gain (Pty) Ltd.

## Distributed Personas

All development (human or agent) operates through versioned personas in `/personas/`.

See **[personas/README.md](./personas/README.md)** for the full index and loading instructions.

Key files:
- `00-BASE.md` — mission spine
- `01-OVERWATCH.md` — system coherence
- `02-FRONTEND.md` / `03-UI-CSS.md` / `04-BACKEND-DB.md` / `05-TESTER.md` — full development cycle
- `06-CONTENT.md` — curriculum + AI Interaction Layer
- `07-SAFETY-TRUST.md` / `08-SECURITY.md` — protection layer

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS v4 + Radix UI
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth
- **Testing**: Playwright
- **Hosting**: Vercel
- **Monitoring**: Sentry

## Current Status

Production-ready core platform with student and teacher experiences, adaptive elements, content systems, and strong RLS. Actively expanding teacher tools, content depth, and the AI Interaction Layer across subjects.

## Getting Started

```bash
git clone https://github.com/MarketExpander99/dreamforge-app.git
cd dreamforge-app
npm install
cp .env.local.example .env.local   # add your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Documentation

- **[personas/](./personas/)** — operating system for all contributors and agents
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** — technical architecture
- **[PROJECT_STATUS.MD](./PROJECT_STATUS.MD)** — current status
- **[SPRINT_PLANNING_DOCUMENTATION.md](./SPRINT_PLANNING_DOCUMENTATION.md)** — planning history
- **[.clinerules/](./.clinerules/)** — legacy agent rules (being superseded by `/personas/`)

## Contributing

1. Load the relevant persona(s) from `/personas/` before starting work.
2. Read affected files first.
3. Make the smallest possible change.
4. `npm run build` must succeed and relevant Playwright tests must pass before marking complete.

## License

Private / proprietary for now. Open-source elements will be clearly marked as the community layer grows.

---

Built so kids win in the world that is actually arriving.
