# Garden AI — Frontend

React + TypeScript application for the Garden AI project.

**Stack:** React 19 · TypeScript · Vite · TanStack Query · React Router v6 · Tailwind CSS v4 · shadcn/ui

---

## Running with Docker (recommended)

See the [root README](../README.md) for Docker setup. The frontend starts automatically as part of `docker compose up -d` and is available at `http://localhost:5173`.

---

## Running without Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The frontend expects the Django backend running at `http://127.0.0.1:8000`.

---

## Useful commands

```bash
npm run dev       # start dev server
npm run build     # production build
npm run lint      # lint
npm run lint:fix  # lint with autofix
```

---

## Tech stack

- React 19 + TypeScript
- Vite — dev server and bundler
- React Router v6 — client-side routing (data API with loaders)
- TanStack Query — server state and caching
- Axios — HTTP client with JWT interceptor
- React Hook Form + Zod — forms and validation
- shadcn/ui (`@base-ui/react`) — UI component primitives
- Tailwind CSS v4 — utility-first styling
- Lucide React — icons
- ESLint + Prettier — linting and formatting (enforced on commit via Husky)
