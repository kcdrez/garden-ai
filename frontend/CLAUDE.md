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
  /api          → API layer (client.ts, auth.ts, gardens.ts, beds.ts)
  /auth         → Token storage and auth utilities
  /components   → Shared components (NavBar, GardenItem, BedItem, BedDialog, EditGardenDialog, ...)
    /ui         → shadcn UI primitives (button, card, form, dropdown-menu, etc.)
  /lib          → Utilities (utils.ts, errors.ts, dates.ts)
  /pages        → Page-level components (Login, Gardens, GardenDetail)
  /schemas      → Zod form schemas (auth.ts, gardens.ts, beds.ts) — one file per domain
  /types        → TypeScript types (gardens.ts — Garden, GardenBed, BedUnit, BedFacing, BED_UNITS, BED_FACINGS)
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
- `QueryClient` is configured with `staleTime: Infinity` — data is never considered stale automatically; mutations are the only trigger for refetch via `invalidateQueries`
- Route protection is handled by loader functions in `router.tsx`, not component-level auth checks
- Dark mode is controlled via the `.dark` class on `<html>`, persisted in `localStorage` under the key `theme`
- Form validation uses React Hook Form + Zod with `mode: 'onChange'` so submit buttons disable until the form is valid
- Zod schemas live in `src/schemas/` (one file per domain), not inline in components — export a named schema (e.g. `bedSchema`) and its inferred type (e.g. `BedFormValues`)
- `FormMessage` always renders (never returns null) with `min-h-[1.25rem]` to reserve space and prevent layout shift when errors appear
- Integer/numeric inputs use `inputMode="numeric"` (not `type="number"`) and store their value as a **string** in RHF — use `{...field}` directly, validate with `.refine()` in the schema, and convert to numbers with `parseInt` only at submit time. Do NOT store numbers in RHF state for text-based inputs — controlled inputs break when the value transitions through `undefined`
- Optional enum selects use an empty string as the "none" state and `onChange` converts `''` → `undefined` before calling `field.onChange`
- Use `TextField`, `TextAreaField`, and `NativeSelectField` from `@/components/ui/form-fields` to avoid repeating `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` boilerplate. Each accepts `control`, `name`, `label` plus the props of the underlying element. `NativeSelectField` takes an `optional` prop that activates the `value ?? ''` / `onChange → undefined` pattern for optional enum fields.
- A single dialog component handles both create and edit when the form shape is identical (e.g. `BedDialog` — `bed` prop present = edit mode, absent = create mode)
- Feature-based structure preferred over type-based structure
- UI should assume backend may return empty arrays or partial data
