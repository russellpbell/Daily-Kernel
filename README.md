# Daily Kernel

Your AI-powered daily news briefing. Daily Kernel fetches the latest news, uses Claude to analyze and summarize stories, and delivers a concise, intelligent briefing tailored to your interests.

## Features

- **AI-Powered Summaries** - Claude analyzes and distills news articles into clear, concise briefings
- **Real-Time News Search** - Powered by Brave Search API for up-to-date coverage
- **Topic Customization** - Follow the topics and categories that matter to you
- **Daily Briefings** - Get a curated digest of the most important stories each day
- **Clean Interface** - Modern, responsive frontend built with Vite and TypeScript
- **Fast API Backend** - Python backend with FastAPI and async support

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Brave Search API key](https://brave.com/search/api/)

### 1. Clone and configure

```bash
git clone <repo-url> daily-kernel
cd daily-kernel
cp .env.example .env
```

Edit `.env` and add your API keys:

```
ANTHROPIC_API_KEY=your-api-key-here
BRAVE_SEARCH_API_KEY=your-brave-search-api-key-here
SECRET_KEY=generate-a-random-secret-key
```

### 2. Install dependencies

```bash
make install
```

### 3. Run in development mode

Start the backend and frontend in separate terminals:

```bash
# Terminal 1
make dev-backend

# Terminal 2
make dev-frontend
```

The backend API will be available at `http://localhost:8000` and the frontend dev server will proxy API requests to it.

## Docker Deployment

Build and run with Docker Compose:

```bash
cp .env.example .env
# Edit .env with your API keys

docker compose up -d
```

The application will be available at `http://localhost:8000`.

To rebuild after changes:

```bash
docker compose up -d --build
```

## Architecture

```
Daily-Kernel/
├── backend/            # Python FastAPI backend
│   ├── app/
│   │   └── main.py     # Application entry point and routes
│   └── requirements.txt
├── frontend/           # TypeScript + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── data/               # SQLite database (created at runtime)
├── Dockerfile          # Multi-stage production build
├── docker-compose.yml  # Container orchestration
├── Makefile            # Development shortcuts
└── .env.example        # Environment variable template
```

### Backend

- **FastAPI** serves the REST API and static frontend assets in production
- **Anthropic SDK** communicates with Claude for news analysis and summarization
- **Brave Search API** fetches real-time news articles
- **SQLite** stores briefings and user preferences

### Frontend

- **Vite** for fast development and optimized production builds
- **TypeScript** for type-safe client code
- Built assets are served by the backend in production

## API Key Setup

### Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys and generate a new key
4. Add it to your `.env` file as `ANTHROPIC_API_KEY`

### Brave Search API Key

1. Go to [brave.com/search/api](https://brave.com/search/api/)
2. Sign up for the Free plan (up to 2,000 queries/month) or a paid plan
3. Copy your API key from the dashboard
4. Add it to your `.env` file as `BRAVE_SEARCH_API_KEY`

## Screenshots

<!-- Add screenshots here -->

*Screenshots coming soon.*

## License

MIT
