# AssetFlow (Hackathon Project)

**AssetFlow** is an Enterprise Asset & Resource Management System designed to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources.

This project was built during an 8-hour hackathon.

## Tech Stack

- **Monorepo:** [Nx](https://nx.dev/)
- **Frontend:** Next.js (React), Tailwind CSS v4
- **Backend:** Node.js, Express.js

## Project Structure

- `/frontend` - Next.js application
- `/backend` - Express.js API
- `package.json` - Root workspace configuration and shared scripts

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development servers (Frontend on port 3000, Backend on port 4000):
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both projects for production
- `npm run format` - Format the codebase using Prettier (includes Tailwind auto-sorting)
