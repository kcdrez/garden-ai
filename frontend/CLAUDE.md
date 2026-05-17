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
  /api          → API layer (client.ts, auth.ts, gardens.ts, beds.ts, plants.ts)
  /auth         → Token storage and auth utilities
  /components   → Feature-based component folders; layout-level components at root
    /beds       → BedItem.tsx, BedDialog.tsx
    /gardens    → GardenItem.tsx, EditGardenDialog.tsx
    /plants     → PlantPicker.tsx, UserPlantDialog.tsx
    /ui         → shadcn UI primitives (button, card, form, dropdown-menu, etc.) plus custom utilities:
                  form-fields.tsx — TextField, TextAreaField, NativeSelectField wrappers
                  query-state.tsx — QueryState, LoadingSpinner
    NavBar.tsx  → layout component, not feature-specific
  /lib          → Utilities (utils.ts, errors.ts, dates.ts)
  /pages        → Feature-based page folders
    /auth       → Login.tsx, Register.tsx
    /beds       → BedDetail.tsx
    /gardens    → Gardens.tsx, GardenDetail.tsx
  /schemas      → Zod form schemas (auth.ts, gardens.ts, beds.ts, plants.ts) — one file per domain
  /types        → TypeScript types (gardens.ts — Garden, GardenBed; plants.ts — Plant, UserPlant, PlantCategory)
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
- Feature-based structure preferred over type-based structure — components and pages are grouped by domain (`/beds`, `/gardens`, `/plants`), not by kind (`/dialogs`, `/cards`). The `/ui` folder is the exception: it holds generic design-system primitives only.
- For complex custom inputs that don't fit `TextField`/`TextAreaField`/`NativeSelectField` (e.g. `PlantPicker`), use `useController` from RHF directly and render label + error manually — same visual pattern as FormItem/FormLabel/FormMessage but without the FormControl wrapper
- Clickable entity cards (e.g. `BedItem`) use an `onClick` on the card with an early return guard — `if ((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper], [role="menu"], button')) return;` — so dropdown triggers and buttons inside the card still work without navigating
- UI should assume backend may return empty arrays or partial data
- Use `QueryState` from `@/components/ui/query-state` to handle loading/error/empty states inline — avoids repeating the four-branch conditional render pattern. `LoadingSpinner` is also exported for page-level early returns.
- Custom CSS animations: add `@keyframes` to `index.css`, then register via `--animate-<name>: <keyframe-name> <duration> <easing> <iteration>` inside the `@theme inline` block — this exposes it as an `animate-<name>` Tailwind utility class.

---

# 🔮 Planned UI Improvements

- **Skeleton cards** — replace the `LoadingSpinner` inside `QueryState` with per-entity skeleton placeholders (pulsing gray card shapes) for list/grid loading states. Use a generic skeleton (title bar + 2–3 lines, `animate-pulse`) rather than an exact match of the real card — avoids needing to update the skeleton every time card fields change. Revisit once card structures stabilise.
