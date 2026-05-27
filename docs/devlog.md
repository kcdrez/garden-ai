# Dev Log

---

## 2026-05-27 — ~3 hours

**Completed:**
- Migrated from grid-based `PlacementGrid` (`@dnd-kit/core`) to freeform SVG `PlacementCanvas` — items positioned in feet coordinates, drag-and-drop via pointer capture, no grid snapping; replaces the old cell-based DnD system
- Context menu (`...` hover button) on canvas placement items — replaces the old X remove button
- BedGrid: Edit (opens UserPlantDialog), Move (opens MovePlantDialog), Delete (deleteUserPlant with confirm)
- GardenGrid: "Go to bed" (navigate to bed detail), "Remove from layout" (deleteBedPlacement)
- Fixed hover detection — transparent rect hitbox + always-in-DOM button prevents re-entry flicker
- Fixed Base UI incompatibility (`Menu.Trigger` has no `asChild`) via virtual anchor approach — SVG button is pure visual, menu rendered outside SVG positioned at click screen coordinates
- Updated BedGrid and GardenGrid tests; all tests passing

**Next up:** User profile — timezone, locale settings, first/last name

---

## 2026-05-26 — ~2 hours

**Completed:**
- Bulk plant creation — quantity spinner in add-plant dialog; backend creates N separate UserPlant records in a transaction; max 50
- Add new plant from placement dialog — wizard step in PlacePlantDialog; click a cell, create a plant, it's immediately placed; no round-tripping back to the bed
- Observation date bug fix — auto-logged status-change observation on UserPlant create now uses `startDate` if provided, falls back to today
- `NumberField` component — `type="number"` with blocked non-integer keystrokes (`e`, `E`, `+`, `-`, `.`); applied to all numeric inputs; documented in conventions
- `UserPlantForm` — self-contained create-mode form component shared by `UserPlantDialog` and `PlacePlantDialog`; eliminated duplicated form logic
- SRP documentation — updated CLAUDE.md to require flagging + user confirmation before any SRP-motivated refactor; documented `UserPlantDialog` split and `components/plants/` sub-folder restructure as planned improvements
- Test updates — new `UserPlantForm.test.tsx` (9 tests); updated `PlacePlantDialog` and `UserPlantDialog` tests for refactor; fixed pre-existing accessibility bug (missing `htmlFor`/`id` on garden/bed selects)

**Next up:** Research AI integration before building — review OpenAI API, decide on conversation model and backend approach

---

## 2026-05-25 — ~1 hour

**Completed:**
- Drag-and-drop placement for garden grid — unplaced beds drag from a panel onto the grid; placed beds can be repositioned by dragging; click-to-place dialog retained as fallback
- DnD UX improvements — bed footprint highlights green/red on hover cells; self-occupancy bug fixed (dragged bed's cells become valid drop targets); reposition blink fixed (single invalidation after delete+create)
- Decided to leave grid DnD as-is and not invest further — eventual plan is to replace the grid system with a freeform canvas layout

**Next up:** Research AI integration before building — review OpenAI API, decide on conversation model and backend approach

---

## 2026-05-25 — ~1.5 hours

**Completed:**
- Forgot password flow — email-based reset via Django's token generator; two new endpoints (`POST /api/auth/password/reset/` and `/api/auth/password/reset/confirm/`); `ForgotPassword` and `ResetPassword` pages; "Forgot password?" link on login
- Email sending via Resend — domain verified on kcdrez.com, SMTP configured in Railway; console backend for local dev with clean URL logging
- Email required on registration — backend serializer + frontend schema updated
- Login accepts email or username — custom `EmailOrUsernameBackend`; one field, works either way
- Bug fix: login 401 no longer triggers token refresh interceptor, error stays on screen
- Bug fix: "password reset" success banner clears on page refresh via history state replacement
- Sentence case pass on auth buttons — "Log in", "Create account", "Send reset link"
- Full test coverage — 29 backend tests, 438 frontend tests; all passing

**Next up:** User profile page — timezone, first/last name settings

---

## 2026-05-25 — ~1.25 hours

**Completed:**
- Frontend branch coverage raised from 85.1% → 90.23% — added tests across BedGrid, GardenGrid, GardenDialog, BedDialog, UserPlantDialog, MovePlantDialog, BedEditForm, GardenDetail, BedDetail, PlantDetail, and API layers
- CI coverage gates expanded — branches (85%), functions (90%), and lines (90%) now enforced alongside existing statements (90%) threshold

**Next up:** Forgot password — email-based reset flow (Django built-in reset views + SimpleJWT, requires email backend)

---

## 2026-05-25 — ~0.5 hours

**Completed:**
- Observation editing — backend PATCH endpoint (`observed_date` + `note` only, type locked); inline edit form in `ObservationList` with date + note fields side by side, save/cancel buttons right-aligned to match display mode; note shown for all observation types including `status_change`; 3 new backend tests

**Next up:** Raise frontend coverage floor — branches (78%) and functions (88%) are below the planned 90% gate

---

## 2026-05-24 — ~1.5 hours

**Completed:**
- Transplant tracking — new `Observation.Type.TRANSPLANT` choice, `_record_transplant` helper in `UserPlantSerializer.update()` auto-logs "Moved from X to Y" when a plant's bed changes; migration applied; `ObservationList` renders transplant entries with an arrow icon
- Fixed gunicorn hot-reload gap — identified that the dev backend runs gunicorn (not `runserver`), so Python file changes require a container restart to take effect
- Fixed observations cache race condition — included `gardenId`/`bedId` in the PlantTimeline observations query key so a bed change naturally triggers a fresh fetch with the correct URL instead of racing with stale data
- Unit tests — backend `test_move_plant_creates_transplant_observation`; frontend `ObservationList` transplant rendering test

**Next up:** Observation date editing — allow editing `observed_date` and `note` on any observation so events logged after the fact can be backdated accurately

---

## 2026-05-23–24 — ~2.5 hours

**Completed:**
- Frontend unit tests — 23 test files, 331 tests covering all components: `GardenItem`, `BedItem`, `PlantItem`, `PlacementGrid`, `BedGrid`, `GardenGrid`, `PlantTimeline`, `PlantPicker`, `PlantListSection`, `ObservationList`, `ObservationForm`, `StatusChips`, `StatusBadge`, `BedDetails`, `CardActionsMenu`, `QueryState`, all dialog components (`GardenDialog`, `BedDialog`, `UserPlantDialog`, `MovePlantDialog`, `PlacePlantDialog`, `PlaceBedDialog`), and `NavBar`
- Coverage reporting — `text-summary` reporter added to vitest config; CI enforces 90% statement floor via `npm run coverage`

**Next up:** Raise coverage floor to 90% across all metrics (branches at 78% and functions at 88% are the gaps), or move to frontend e2e tests with Playwright

---

## 2026-05-22 — ~2.5 hours

**Completed:**
- Plant detail page (`/plants/:plantId`) — full timeline, status chips, metadata card, edit/delete/move actions; completes the Garden → Bed → Plant hierarchy
- Backend unit tests — 35 tests across gardens, beds, plants, placements, and observations; `make test` and `make coverage` targets added
- GitHub Actions CI — backend tests run on every PR touching `backend/**`; branch ruleset blocks merges on failure
- CLAUDE.md cleanup — trimmed completed list, API contracts, and domain model field listings to reduce token usage

**Next up:** Frontend unit tests or CI/CD improvements — backend test coverage gaps (auth endpoints, observation endpoints) worth filling before moving to new features

---

## 2026-05-22 — ~0.5 hours

**Completed:**
- `useConfirm` hook — `ConfirmProvider` mounts one global dialog at the app root (`main.tsx`); `useConfirm()` returns `confirm(options) => Promise<boolean>`; callers `await confirm(...)` and act on the result — no per-component dialog state or JSX needed
- Confirmation on all destructive deletes — `GardenItem`, `BedItem`, `PlantItem`, `PlantListSection`, `GardenDetail` all use the hook; delete handlers extracted as named `handleDelete` functions per React convention

**Next up:** Dedicated plant detail page (`/plants/:plantId`) — full observation timeline and plant metadata on its own bookmarkable page; consistent with the Garden → Bed → Plant hierarchy

---

## 2026-05-22 — ~0.5 hours

**Completed:**
- `FormRootError` component — styled callout (border, background, `AlertCircleIcon`) replacing plain `<p>` root errors across all dialogs and auth pages
- Fixed `nonFieldErrors` camelCase bug in `errors.ts` — `non_field_errors` checks updated to match camelCase API responses; fallback no longer leaks field key names to the user
- Edit and delete actions on garden detail page — Edit opens `GardenDialog` pre-filled; Delete navigates back to `/gardens` on success; matches `BedDetail` button pattern
- "Add Bed" moved from header to "Garden Beds" section heading — consistent with how "Add Plant" sits in `PlantListSection` on the bed detail page
- Heading hierarchy fixed across all pages — `h1` for page titles, `h2` for section headings (was `h2`/`h3` with no `h1` anywhere)
- `h1` font size reduced from 56px to 36px (28px mobile) — previous size was designed for marketing hero sections, not app page titles

**Next up:** Confirmation dialog — reusable `ConfirmDialog` for all destructive delete actions (currently fire immediately on click)

---

## 2026-05-22 — ~2 hours

**Completed:**
- `PlacementGrid` generic UI component extracted to `components/ui/` — shared by `BedGrid` (plant placements) and new `GardenGrid` (bed placements); owns CSS grid rendering, cell iteration, multi-cell span, empty cell button, hover-to-remove overlay
- `BedGrid` refactored to thin data-fetching wrapper around `PlacementGrid`
- `BedPlacement` model, serializer, viewset, and URLs — `GET/POST /api/gardens/:id/bed-placements/`, `DELETE /api/gardens/:id/bed-placements/:id/`; bounds validation in serializer
- `GardenGrid` component — wraps `PlacementGrid`; computes bed footprint from dimensions at create time; shows bed name, dimensions, and plant count per cell
- `PlaceBedDialog` — two-section layout ("Select a bed" / "Won't fit here"); filters by bounds + overlap at clicked cell; shows dimensions inline per bed
- `GardenScopedMixin` extracted in `gardens/views.py` — shared by `GardenBedViewSet` and `BedPlacementViewSet`
- Multi-cell span fix — `gridTemplateRows` added to `PlacementGrid` so rows don't collapse when a span fills the whole row; explicit `gridColumnStart`/`gridRowStart` on all cells to prevent auto-placement drift
- Resize validation (BE) — `GardenSerializer.validate()` blocks resize if any `BedPlacement` would go out of bounds; `GardenBedSerializer.validate()` blocks resize if any `PlantPlacement` would go out of bounds; errors surface as `non_field_errors` → `form.setError('root')` in both dialogs

**Next up:** Revisit form root error display UI — padding and layout are functional but visually rough; see repro steps below

**Repro for form root error (resize validation):**
1. Create a garden with dimensions e.g. 10 × 10 ft
2. Place a bed in the layout (e.g. a 4 × 4 ft bed at position col 7, row 7)
3. Edit the garden and reduce width or length to e.g. 5 × 5 ft → error should appear
- Same pattern for bed → plant: place a plant on the bed grid, then shrink the bed so the plant goes out of bounds

---

## 2026-05-21 — ~4 hours

**Completed:**
- Full frontend code audit and cleanup — redundant code extracted, SRP enforced, naming standardized, type inconsistencies fixed:
  - `StatusBadge` component + `STATUS_CLASSES`/`statusLabel` centralized in `src/lib/plants.ts`
  - `groupByGarden` utility in `src/lib/beds.ts`; `getTodayISO()`/`formatObservationDate()` in `src/lib/dates.ts`
  - `BED_UNITS`/`BED_FACINGS` converted to `as const`; all enum types and Zod schemas derived from single source
  - `NativeSelectField` gains `onValueChange` prop + exported `selectClass`; all `<select>` elements in the app now use it
  - `BedDialog`/`UserPlantDialog` rewritten: `gardenId`/`bedId` in form schema, all pickers via `NativeSelectField`
  - `useDialogFormReset` custom hook — replaces `useEffect` reset pattern across all dialogs
  - `PlantTimeline` split into `StatusChips`, `ObservationList`, `ObservationForm` sub-components
  - `PlantListSection` component extracted from `BedDetail`; `BedDetail` simplified from ~212 to ~119 lines
  - `Login.tsx`/`Register.tsx` — both use `applyServerErrors`; `Register.tsx` was using manual `getDRFFieldErrors` loop
  - `types/gardens.ts` — `?: T | null` corrected to `T | null` (API always includes the field)
  - `useTheme` hook extracted from `NavBar`; `THEME_STORAGE_KEY` constant shared between `main.tsx` and hook
  - `UserPlantPayload` type in `types/plants.ts` — decouples API payload from form schema (was `Partial<UserPlantFormValues>`, which leaked `gardenId`/`bedId` into the wire type)
  - `MAX_SUNLIGHT_HOURS = 24` constant in `schemas/beds.ts`; `BedGrid` redundant placement branch simplified
- Full backend code audit and cleanup:
  - `UserProfile` → `BaseModel` — UUID primary key, `created_at`, `updated_at`; migration written manually (PostgreSQL identity column requires `DROP IDENTITY` + `gen_random_uuid()` USING clause)
  - Timezone validation — `ProfileSerializer.validate_timezone` rejects invalid IANA strings; `_apply_timezone` helper deduplicates login/register logic and silently ignores invalid browser-supplied timezones
  - N+1 queries eliminated — `annotate(bed_count, plant_count)` on garden/bed viewsets; `select_related("garden")` on bed viewsets; `select_related("plant", "bed__garden")` on plant viewsets
  - `BedScopedMixin` — `_get_bed()` consolidated from `UserPlantViewSet` and `PlantPlacementViewSet`
  - `TextChoices` — `Plant.Category`, `UserPlant.Status`, `Observation.Type` all converted; `Observation.Type.STATUS_CHANGE` replaces hardcoded `"status_change"` string in serializer
  - Ordering standardized — all entity lists use `name, -created_at`; observations remain chronological
  - URL kwargs standardized — all manual URL patterns use descriptive `_id` suffix names (`bed_id`, `plant_id`, `observation_id`, `placement_id`); `lookup_url_kwarg` set on each viewset

**Next up:** Garden-level bed layout view — `BedPlacement` model and grid UI (garden dimensions prerequisite already met)

---

## 2026-05-21 — ~3 hours

**Completed:**
- `Garden` model — `length`, `width`, `unit` fields added; `UNIT_CHOICES` moved to module level (shared by `Garden` and `GardenBed`)
- `GardenDialog` — merged `EditGardenDialog` into single create/edit component; inline form removed from gardens page
- "Add" button consistency — all three "all" pages now have a header row with an Add button; `BedDialog.gardenId` and `UserPlantDialog.gardenId/bedId` made optional with inline selectors
- `AllGardens.tsx` rename — `Gardens.tsx` → `AllGardens.tsx` for consistency; stale duplicate `pages/GardenDetail.tsx` deleted
- "Your X" headings — standardized across all pages and breadcrumbs (was a mix of "All" and "Your")
- Garden card — shows dimensions when set; created date removed
- `BedSingleIcon` on bed cards; `SproutIcon` on plant list rows
- `PlantItem` component — extracted from `AllPlants` page; owns its own edit/move/delete state
- `MovePlantDialog` refactor — split into `PickBedStep` and `CreateBedStep` internal components; each owns its own data fetching and mutations
- Portal click-through bug — `EditGardenDialog` (now `GardenDialog`) moved outside `Card` in `GardenItem` to prevent React portal event bubbling
- `BedGrid` loading fix — grid no longer renders as interactive while placements query is loading; prevents stale unplaced list
- Move plant placement bug — backend cascade-deletes `PlantPlacement` when `UserPlant.bed` changes; `placement_id` added to `UserPlant` API response; `MovePlantDialog` warns user when moving a placed plant; original bed's placements cache invalidated on move
- `bed_count` on `GardenSerializer`, `plant_count` on `GardenBedSerializer` — shown on garden and bed cards
- `AllBeds` — replaced inline card with `BedItem` (was missing icon, plant count, and details)
- `posInt`/`optPosInt` extracted to `src/lib/zod.ts`; `GardenPayload` derived from `Garden` type via `Partial<Pick<...>>`
- Dropdown menu items — `cursor-pointer` globally via `dropdown-menu.tsx`

**Next up:** Garden-level bed layout view — `BedPlacement` model and grid UI (garden dimensions prerequisite now met)

---

## 2026-05-20 — ~2 hours

**Completed:**
- `PlantPlacement` model — `OneToOneField` → `UserPlant`, FK → `GardenBed`, `x/y/width/height` integers; sq-ft grid normalization (convert bed unit at render time); migration applied to Docker DB
- `PlantPlacementSerializer` — bounds validation, user ownership check; `bed_grid_dimensions()` helper in serializers.py
- `PlantPlacementViewSet` — list, create, partial_update, destroy; ownership via `_get_bed()`; URL routes nested under bed (`/api/gardens/:id/beds/:bedId/placements/`)
- `BedGrid` component — inline CSS grid (96px cells), occupied cells show plant name with hover-to-remove, empty cells clickable to place; self-contained (owns placements query, create/delete mutations, `PlacePlantDialog`)
- `PlacePlantDialog` — lists unplaced plants in bed; click to place at selected cell
- `BedDetail` — "Layout" section always visible above plant list; passes only `gardenId`, `bedId`, `bed`, `userPlants` to `BedGrid`
- Docker migration hook — `PostToolUse` hook on Bash auto-runs `docker compose exec backend python manage.py migrate` after any `makemigrations` command; documented in `backend/CLAUDE.md`
- Design decisions documented — sq-ft grid normalization rationale, future sub-foot resolution migration path, `BedPlacement` planned model, organism cardinality problem deferred

**Next up:** Garden dimensions (`length`, `width`, `unit` on `Garden` model) as prerequisite for garden-level bed layout view

---

## 2026-05-20 — ~3 hours

**Completed:**
- `Observation` model — `user_plant` FK, `observed_date`, `type`, `note`, `previous_status`, `new_status`; ordered chronologically (`observed_date`, `created_at` ascending); `GET/POST /api/.../observations/` and `DELETE .../observations/:id/`
- Auto-observation on status change — creation moved to `UserPlantSerializer.create()`/`update()` so it has access to the user's timezone for local date derivation
- `UserProfile` model — `timezone` CharField, auto-created via `post_save` signal; `GET/PATCH /api/auth/profile/`; timezone sent by frontend as part of login and register payloads (no separate request)
- `dormant` and `fruiting` statuses added; `harvested` removed (harvest is now an observation event, not a status); `harvest` added as observation type
- `planted_date` renamed to `start_date` on `UserPlant` (label in dialog updated to "Start Date")
- `PlantTimeline` component — expandable per-plant on bed detail page; quick status chip row (click to change); chronological history list with type icons and alternating row shading; "Add Observation" inline form; all observations deletable on hover
- Manual `status_change` observations — `status_change` added to observation type dropdown; shows New Status select, hides Note field; allows correcting erroneous auto-generated entries with the right date
- Garden locale note added to CLAUDE.md — future enhancement to use garden timezone instead of user timezone for observation dates

**Next up:** Visual garden layout — drag-and-drop grid for bed planning

---

## 2026-05-18 — ~1.5 hours

**Completed:**
- Move plant between beds — PATCH `bed` field on `UserPlant`; backend `validate_bed` enforces target bed ownership; `moveUserPlant` API fn; `MovePlantDialog` two-step wizard (pick existing bed or create a new one inline, no stacked dialogs); `CardActionsMenu` extended with optional `onMove` prop; wired into `BedDetail` and `AllPlants`
- Full edit/delete/move actions on `AllPlants` page — previously a read-only list
- UI fixes: native `<select>` down arrow replaced with custom `ChevronDownIcon` via `appearance-none` in `NativeSelectField`; `DropdownMenu` popup alignment fixed by removing `w-(--anchor-width)` from popup class; move dialog bed buttons given visible `border-border` so they read as selectable items

**Next up:** CI/CD pipeline (GitHub Actions) — auto-deploy frontend to Vercel and backend to Railway on push to `main`

---

## 2026-05-17 — ~1 hour

**Completed:**
- Extracted `CardActionsMenu` to `components/ui/card-actions-menu.tsx` — shared edit/delete dropdown; replaces ~15 lines of repeated `DropdownMenu` boilerplate in `GardenItem` and `BedItem`
- Extracted `bedHasDetails` utility to `src/lib/beds.ts` — replaces 4 copies of the inline `bed.facing || bed.avgSunlightHours != null || bed.soilType || bed.notes` condition; accepts optional `includeNotes` param for the compact (no-notes) variant
- Renamed `BedMeta` component → `BedDetails` and `bedHasMeta` → `bedHasDetails` across all files

**Next up:** Move a plant from one bed to another (PATCH `bed` field on UserPlant)

---

## 2026-05-17 — ~3 hours

**Completed:**
- View all beds page (`/beds`) — flat list grouped by garden; query key `['beds', 'all']`
- View all plants page (`/plants`) — flat list with status badges and links to bed/garden
- "Beds" and "Plants" nav links added
- Backend: `GET /api/beds/` and `GET /api/userplants/` flat-list endpoints; added `gardenName` to `GardenBedSerializer` and `bedName`, `gardenId`, `gardenName` to `UserPlantSerializer`
- `BedMeta` shared component — facing, sunlight, soil type, notes icon rows; `showNotes` prop for compact view
- `formatDimensions` and `facingLabel` extracted to `src/lib/beds.ts`
- TanStack Query cache wiring — all write mutations invalidate by prefix (`['beds']`, `['plants', 'user']`); `initialData` seeding across GardenDetail, BedDetail so navigating AllBeds → garden → bed detail makes zero extra API calls
- Eliminated three redundant API calls on bed detail mount: garden fetch (use `bed.gardenName` instead), per-bed plants fetch (seed from `['plants', 'user', 'all']`), plant catalog fetch (add `enabled: open` to `UserPlantDialog`)

**Next up:** Refactor card boilerplate — GardenItem, BedItem, and AllBeds cards share repeated structure; extract a shared card pattern

---

## 2026-05-17 — ~2 hours

**Completed:**
- Docker + Docker Compose — frontend, backend, and PostgreSQL all run with `docker compose up -d`; hot reload works in both services via volume mounts; DB healthcheck ensures backend waits for Postgres before starting
- Fixed `requirements.txt` — `djangorestframework-simplejwt` was missing
- Updated all three READMEs with Docker workflow and accurate stack info
- Vercel deployment — frontend live with auto-deploy on push to `main`; `VITE_API_URL` env var replaces hardcoded localhost; `vercel.json` rewrite rule prevents React Router 404s on refresh
- Railway deployment — Django backend live at `garden-ai-production-6a57.up.railway.app`; managed Postgres on Railway; gunicorn + whitenoise for production serving; `dj-database-url` parses `DATABASE_URL` from Railway

**Next up:** User-facing features — move plant between beds, view all plants/beds across gardens

---

## 2026-05-16 — ~4 hours

**Completed:**
- Bed detail page at `/gardens/:id/beds/:bedId` — dedicated bookmarkable page per bed with full metadata and plant management
- Simplified bed cards on garden detail — clicking navigates to bed detail, edit/delete still accessible from dropdown
- Plant catalog picker — searchable by name, filterable by category pills, selected plant chip persists across filter switches
- Feature-based folder restructure for `/components` and `/pages`
- camelCase API responses via `djangorestframework-camel-case` — frontend types and schemas updated accordingly
- JWT token silent refresh on 401 — retries original request with new token, redirects to login if refresh fails
- PostgreSQL swap — replaced SQLite with PostgreSQL locally; environment variables managed via `python-decouple`
- Superuser setup via `DJANGO_SUPERUSER_*` env vars
- Garden cards made fully clickable (consistent with bed cards)
- `cursor: pointer` added globally for all buttons
- VS Code CSS linter warnings suppressed for Tailwind v4 at-rules

**Next up:** Docker + Docker Compose
