# Daily Kernel

AI-powered daily news briefing app. Daily Kernel fetches the latest news, uses Claude to analyze and summarize stories, and delivers a concise, intelligent briefing tailored to your interests.

## Features

- **AI-Powered Summaries** - Claude analyzes and distills news articles into clear, concise briefings
- **Real-Time News Search** - Powered by Brave Search API for up-to-date coverage
- **Topic Customization** - Follow the topics and categories that matter to you
- **Daily Briefings** - Get a curated digest of the most important stories each day
- **Authentication** - Secure user accounts with Supabase Auth and JWT
- **PWA Support** - Installable progressive web app with offline-ready manifest
- **Modern UI** - Clean, responsive interface built with Tailwind CSS v4

## Tech Stack

- **Next.js 15** - React framework with App Router and server components
- **Supabase** - PostgreSQL database, authentication, and row-level security
- **Tailwind CSS v4** - Utility-first CSS framework
- **Claude API (Anthropic)** - AI-powered news analysis and summarization
- **Brave Search API** - Real-time news fetching
- **TypeScript** - End-to-end type safety
- **Vercel** - Production deployment platform

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project
- An [Anthropic API key](https://console.anthropic.com/)
- A [Brave Search API key](https://brave.com/search/api/)

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Run the migration SQL in `supabase/migrations/` against your database via the Supabase SQL Editor
3. Enable Row Level Security (RLS) on all tables

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
BRAVE_SEARCH_API_KEY=your-brave-search-api-key
JWT_SECRET=generate-a-random-secret-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Vercel Deployment

1. Push your repository to GitHub
2. Connect the repo in the [Vercel dashboard](https://vercel.com/)
3. Add all environment variables from `.env.example` to the Vercel project settings
4. Deploy - Vercel auto-detects Next.js and handles the build

## Supabase Setup

1. **Create project** - Sign up at [supabase.com](https://supabase.com/) and create a new project
2. **Run migrations** - Open the SQL Editor in your Supabase dashboard and execute the migration files from `supabase/migrations/`
3. **Enable RLS** - Ensure Row Level Security is enabled on all tables to protect user data
4. **Copy keys** - Get your project URL, anon key, and service role key from Settings > API

## API Key Setup

### Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys and generate a new key

### Brave Search API Key

1. Go to [brave.com/search/api](https://brave.com/search/api/)
2. Sign up for the Free plan (up to 2,000 queries/month) or a paid plan
3. Copy your API key from the dashboard

## License

MIT
