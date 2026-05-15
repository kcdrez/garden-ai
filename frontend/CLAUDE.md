# Frontend — Agent Context

---

# 🏗️ Tech Stack

- React (TypeScript)
- Vite
- React Router v6 (`createBrowserRouter` data API) for routing
- TanStack Query (React Query) for server state management
- Axios for API calls (with auth interceptor)
- React Hook Form + Zod for forms and validation
- shadcn/ui (base-nova style, `@base-ui/react`) for UI components
- Lucide React for icons
- Tailwind CSS v4 for styling
- ESLint + Prettier for linting/formatting

---

# 🧰 Tooling

- ESLint + Prettier — linting and formatting; must pass before commit
- shadcn CLI — `npx shadcn add <component>` to add UI components
  - **Gotcha:** generated files import from `"src/lib/utils"` — always fix to `"@/lib/utils"` after generating

---

# 📁 Structure

/src
  /api          → API layer (client.ts, auth.ts, gardens.ts, ...)
  /auth         → Token storage and auth utilities
  /components   → Shared components (NavBar, GardenItem, etc.)
    /ui         → shadcn UI primitives (button, card, form, dropdown-menu, etc.)
  /lib          → Utilities (utils.ts, errors.ts, dates.ts)
  /pages        → Page-level components (Login, Gardens, ...)
  /types        → TypeScript types
  router.tsx    → Route definitions (createBrowserRouter)
  main.tsx      → App entry point (QueryClientProvider, RouterProvider, dark mode init)

---

# 🧫 Testing

Testing is a planned learning goal. As features mature, add:
- **Unit tests:** Vitest + React Testing Library (natural fit with Vite)
  - Test components in isolation — user interactions, conditional rendering, form validation
  - Do not test implementation details; test behaviour from the user's perspective
- **E2e tests:** Playwright (see root CLAUDE.md — spans full stack)

---

# 🎯 Conventions

- All imports use the `@/` alias (maps to `src/`) — never use `../` relative imports
- API calls go through the `api/` layer — never call Axios directly from components
- Server state (API data) is managed via TanStack Query — do not use `useState` + `useEffect` for fetching
- Mutations call `queryClient.invalidateQueries` on success rather than manually updating local state
- Route protection is handled by loader functions in `router.tsx`, not component-level auth checks
- Dark mode is controlled via the `.dark` class on `<html>`, persisted in `localStorage` under the key `theme`
- Form validation uses React Hook Form + Zod with `mode: 'onChange'` so submit buttons disable until the form is valid
- Feature-based structure preferred over type-based structure
- UI should assume backend may return empty arrays or partial data
