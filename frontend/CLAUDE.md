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

- ESLint + Prettier — linting and formatting; config in `eslint.config.js`; rules include `react-hooks`, `react-refresh`, `@typescript-eslint` (no-explicit-any, consistent-type-imports, no-unused-vars), and `no-console`; must pass before commit
- shadcn CLI — `npx shadcn add <component>` to add UI components
  - **Gotcha:** generated files import from `"src/lib/utils"` — always fix to `"@/lib/utils"` after generating

---

# 📁 Structure

/src
  /api          → API layer (client.ts, auth.ts, gardens.ts, beds.ts, plants.ts)
  /auth         → Token storage and auth utilities
  /components   → Feature-based component folders; layout-level components at root
    /beds       → BedItem.tsx, BedDialog.tsx
    /gardens    → GardenItem.tsx, GardenDialog.tsx (handles both create and edit; `garden` prop optional)
    /plants     → PlantPicker.tsx, UserPlantDialog.tsx
    /ui         → shadcn UI primitives (button, card, form, dropdown-menu, etc.) plus custom utilities:
                  form-fields.tsx — TextField, TextAreaField, NativeSelectField wrappers
                  query-state.tsx — QueryState, LoadingSpinner
    /shared     → cross-domain components used by multiple feature folders (e.g. PlacementGrid.tsx)
    NavBar.tsx  → layout component, not feature-specific
  /lib          → Utilities (utils.ts, errors.ts, dates.ts, zod.ts — shared Zod validators `posInt`/`optPosInt`; routes.ts — route path helpers; queryKeys.ts — React Query key factories; mutations.ts — `makeOptimisticMutation` helper)
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

Unit tests use Vitest + React Testing Library. Run with `npm run test:run`; coverage enforced in CI via `npm run coverage` (85% statements/functions/lines floor, 80% branches floor). Test files are colocated with the component or page they cover.

Conventions:
- Test user-facing behaviour (renders, interactions, form validation, loading/error states) — not implementation details
- Mock heavy child components (grids, dialogs, timelines, pickers) to keep tests focused on the component under test
- Mock `@/components/ui/sheet` in edit form tests so form fields render and are accessible in jsdom
- Mock `useConfirm` as `vi.fn()` in tests that cover delete flows; assert on both the confirm-accepted and confirm-cancelled paths
- Edit form stub pattern for header tests: `({ open }) => open ? <div role="dialog" aria-label="Edit X Form" /> : null`
- `NumberField` (type="number") inputs have ARIA role `spinbutton`, not `textbox` — use `getByRole('spinbutton', { name: /label/i })` to query them; `toHaveValue()` returns a number, not a string

E2e tests: Playwright — planned, not yet implemented (see root CLAUDE.md).

---

# 🎯 Conventions

- Follow the ESLint rules configured in `eslint.config.js` — new code should introduce zero errors and zero warnings; treat warnings as errors-in-waiting, not acceptable noise; if a rule fires on intentional code, disable it inline with `// eslint-disable-next-line <rule>` and a comment explaining why
- All imports use the `@/` alias (maps to `src/`) — never use `../` relative imports
- API calls go through the `api/` layer — never call Axios directly from components
- Server state (API data) is managed via TanStack Query — do not use `useState` + `useEffect` for fetching
- Mutations call `queryClient.invalidateQueries` on success rather than manually updating local state
- `QueryClient` is configured with `staleTime: Infinity` — data is never considered stale automatically; mutations are the only trigger for refetch via `invalidateQueries`
- Route protection is handled by loader functions in `router.tsx`, not component-level auth checks
- Dark mode is controlled via the `.dark` class on `<html>`, persisted in `localStorage` under the key stored in `THEME_STORAGE_KEY` (exported from `src/hooks/useTheme.ts`); use the `useTheme()` hook to read/toggle — never access `localStorage` or `document.documentElement` directly from components
- Form validation uses React Hook Form + Zod with `mode: 'onChange'` so submit buttons disable until the form is valid
- Zod schemas live in `src/schemas/` (one file per domain), not inline in components — export a named schema (e.g. `bedSchema`) and its inferred type (e.g. `BedFormValues`)
- `FormMessage` always renders (never returns null) with `min-h-[1.25rem]` to reserve space and prevent layout shift when errors appear
- Integer/numeric inputs use `NumberField` from `@/components/ui/form-fields`, which sets `type="number"` and blocks non-integer keystrokes. Values are still stored as **strings** in RHF — validate with `posInt`/`optPosInt` from `@/lib/zod` and convert to numbers with `parseInt` only at submit time. Do NOT store numbers in RHF state — controlled inputs break when the value transitions through `undefined`
- Optional enum selects use an empty string as the "none" state and `onChange` converts `''` → `undefined` before calling `field.onChange`
- Use `TextField`, `NumberField`, `TextAreaField`, and `NativeSelectField` from `@/components/ui/form-fields` to avoid repeating `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` boilerplate. Each accepts `control`, `name`, `label` plus the props of the underlying element. `NativeSelectField` takes an `optional` prop that activates the `value ?? ''` / `onChange → undefined` pattern for optional enum fields. `NumberField` uses `type="number"` internally and blocks `e`, `E`, `+`, `-`, `.` via `onKeyDown` — use it for all positive-integer inputs instead of `TextField` with `inputMode="numeric"`.
- A single dialog component handles both create and edit when the form shape is identical (e.g. `BedDialog` — `bed` prop present = edit mode, absent = create mode); this applies to list-card edits only — detail pages use the EditForm pattern below
- The create dialog and edit sheet for the same entity share a `<EntityFormFields>` component (e.g. `GardenFormFields`, `BedFormFields`, `UserPlantFormFields`) that renders fields only — no `<Form>` wrapper, no footer, no mutation logic. Each consumer wraps them with its own `<Form>`, footer, and mutation. The fields component accepts `control: Control<EntityFormValues>` and any extra data needed for pickers (e.g. `gardens?: Garden[]` for the optional garden picker in `BedFormFields`).
- Detail pages follow a three-layer split: `<EntityDetail>` owns queries and layout; `<EntityDetailHeader>` owns delete mutation, confirm, navigate, edit open state, metadata display, and renders `<EntityEditForm>`; `<EntityEditForm>` owns form state, update mutation, and the Sheet. Name edit form components after what they do (`GardenEditForm`), not the presentation (`GardenEditSheet`), so the name stays accurate if the Sheet is replaced. Use `useDialogFormReset` in edit form components to reset on open even though they use Sheet not Dialog — the hook is presentation-agnostic.
- Feature-based structure preferred over type-based structure — components and pages are grouped by domain (`/beds`, `/gardens`, `/plants`), not by kind (`/dialogs`, `/cards`). The `/ui` folder is the exception: it holds generic design-system primitives only.
- For complex custom inputs that don't fit `TextField`/`TextAreaField`/`NativeSelectField` (e.g. `PlantPicker`), use `useController` from RHF directly and render label + error manually — same visual pattern as FormItem/FormLabel/FormMessage but without the FormControl wrapper
- Clickable entity cards (e.g. `BedItem`) use an `onClick` on the card with an early return guard — `if ((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper], [role="menu"], button')) return;` — so dropdown triggers and buttons inside the card still work without navigating
- Dialogs must be rendered as **siblings** of their triggering card, never as children — React portal events bubble through the React tree (not the DOM), so a dialog inside a clickable card's JSX will fire the card's `onClick` on every interaction inside the dialog. Wrap card + dialog in a fragment and place them side by side
- For destructive actions (delete), use `useConfirm` from `@/hooks/useConfirm` — call `const ok = await confirm({ title, description })` and only fire the mutation if `ok` is true. `ConfirmProvider` is mounted once in `main.tsx`; no per-component dialog state or JSX needed. Extract the handler as a named `async function handleDelete()` rather than inlining it in the JSX prop.
- All API response fields are camelCase (converted by the backend's `djangorestframework-camel-case`). TypeScript types, Zod schemas, and API payloads all use camelCase — never snake_case at the frontend boundary
- The Axios client (`api/client.ts`) includes a response interceptor that silently refreshes the JWT access token on 401 using the stored refresh token, then retries the original request. If the refresh fails, tokens are cleared and the user is redirected to `/login`. The refresh call uses raw `axios` (not the `api` instance) to avoid re-triggering the interceptor.
- UI should assume backend may return empty arrays or partial data
- Use `QueryState` from `@/components/ui/query-state` to handle loading/error/empty states inline — avoids repeating the four-branch conditional render pattern. `LoadingSpinner` is also exported for page-level early returns.
- Custom CSS animations: add `@keyframes` to `index.css`, then register via `--animate-<name>: <keyframe-name> <duration> <easing> <iteration>` inside the `@theme inline` block — this exposes it as an `animate-<name>` Tailwind utility class.
- Avoid "Meta" as a suffix in component or function names unless it specifically refers to HTML meta tags or document metadata. Prefer plain English alternatives: `BedDetails` not `BedMeta`, `bedHasDetails` not `bedHasMeta`. "Meta" reads as technical jargon and requires a mental translation step that "Details" or "Info" does not.
- All navigation paths go through `src/lib/routes.ts` — never hardcode path strings in components. Add a new helper to `routes.ts` when adding a new route, then reference it everywhere via `routes.<name>(params)`. The `router.tsx` route definitions are the only place path strings are allowed.
- All React Query cache keys go through `src/lib/queryKeys.ts` — never hardcode key arrays in components or hooks. Add a new factory when introducing a new entity or query shape. The pattern mirrors `routes.ts`: a single source of truth prevents cache mismatches between `useQuery` and `invalidateQueries` callsites.
- Optimistic mutations use `makeOptimisticMutation` from `src/lib/mutations.ts` — spread its return value into `useMutation` alongside `mutationFn`. Signature: `makeOptimisticMutation(queryClient, queryKey, getItemId, applyUpdate, onExtraError?)`. Handles snapshot/patch/rollback/invalidate automatically; `getItemId` extracts the matching id from mutation vars (e.g. `(vars) => vars.placementId`).
- Use `useDialogFormReset(form, open, getDefaultValues)` from `src/hooks/useDialogFormReset.ts` to reset dialog forms when they open — never use a raw `useEffect` for this. Pass `getDefaultValues` as a function (not inline) to avoid stale closure issues.
- API payload types and form schema types are kept separate — form schemas (in `src/schemas/`) may include UI-only fields like `gardenId`/`bedId` for pickers; API payload types (in `src/types/`) contain only the fields sent over the wire. Never use a form schema type as an API function parameter type.
- Optional fields on TypeScript types for API responses use `T | null` (not `?: T | null`) — DRF always includes the key in the response, it's just potentially null. `?: T` implies the key might be absent, which is incorrect for serializer-defined fields.

---

# 🔮 Planned UI Improvements

- **Placement base type** — `PlantPlacement` and `BedPlacement` share 7 of 9 fields (`id`, `x`, `y`, `width`, `height`, `createdAt`, `updatedAt`); extract a `BasePlacement` type to a shared location and derive both from it; `GridPlacement` in `PlacementGrid.tsx` becomes a `Pick` of it; also fix `PlantPlacement` using `interface` while `BedPlacement` uses `type`.
- **Skeleton cards** — replace the `LoadingSpinner` inside `QueryState` with per-entity skeleton placeholders (pulsing gray card shapes) for list/grid loading states. Use a generic skeleton (title bar + 2–3 lines, `animate-pulse`) rather than an exact match of the real card — avoids needing to update the skeleton every time card fields change. Revisit once card structures stabilise.
- **`components/plants/` sub-folder structure** — 26 files flat is unwieldy; reorganize into: `detail/` (PlantDetailHeader, PlantEditForm, PlantTimeline, ObservationList, ObservationForm), `dialogs/` (UserPlantDialog, UserPlantForm, MovePlantDialog, PlacePlantDialog), `list/` (PlantItem, PlantListSection), `shared/` (PlantPicker, StatusBadge, StatusChips). Pure mechanical move — no logic changes, but touches imports across the codebase.
- **`PlacementCanvas` SRP split** — `DraggableItem` currently owns move drag state, resize drag state, hover state, item rendering (via `renderItem`), the menu trigger button, and the resize handle button. Candidate split: extract button rendering into a `PlacementItemControls` sub-component (owns the two button rects, dots, and corner bracket path) and keep `DraggableItem` focused on drag/resize interaction and hit-testing. Only worth doing if button complexity grows further.
