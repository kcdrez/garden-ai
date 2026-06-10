# Garden AI — Agent Context File

This file provides project-wide context. Stack, conventions, and tooling details live in the directory-level files:

- Frontend: `/frontend/CLAUDE.md`
- Backend: `/backend/CLAUDE.md`
- Production considerations: `/docs/production-notes.md` — shortcuts consciously taken for the portfolio context, and what would need to change for a real production app

---

# 📓 Dev Log

The dev log lives at `/docs/devlog.md`. It is the canonical record of what was built and what's next.

## Intention

A lightweight session journal — one entry per work session, focused on what shipped. Not a design doc or a bug tracker; just enough signal for an AI agent (or the developer) to orient quickly at the start of the next session.

## Format

```
## YYYY-MM-DD — ~N hours

**Completed:**
- Short bullet describing what shipped

**Next up:** One-line summary of what to tackle next
```

## Time tracking

The devlog records session duration. Since the AI has no clock, time must come from the user:

- **Session start** — if the user doesn't mention a start time, ask before doing anything else
- **Session end** — if the user doesn't provide an end time when wrapping up, ask before writing the devlog entry
- **Pauses** — if the user mentions stepping away (lunch, break, etc.), ask for the pause time if not given; when they return, ask for the resume time; subtract all pauses from the total when calculating duration
- Calculate duration as: (end time − start time) − (sum of all pauses)

## Consumption (start of session)

At the start of every session, read the most recent devlog entry before doing anything else. Use it to:

- Understand what was just finished so you don't re-explain or redo it
- Pick up the **Next up** item as the default starting point if the user hasn't given a specific direction
- Cross-reference against the ✅ Completed list below if something seems missing

## Adding a new entry (end of session)

When the user says they are done or ending the session, do all of the following:

1. **Devlog** — append a new dated entry to `/docs/devlog.md` (newest first). Rules:
   - **Completed** bullets are high-level; skip internal refactors and tooling noise unless they unblock something
   - **Next up** is a single line, not a list — the most important thing to tackle next
2. **✅ Completed list** — if a major deliverable shipped this session, add it as a high-level bullet (feature or system, not implementation detail)
3. **📋 Planned list** — if anything completed this session was previously in the planned list, remove it

---

# 🧠 Project Overview

Garden AI is a full-stack web application for managing and visualizing home garden layouts and plant data.

The long-term goal is to evolve into a system that can:

- manage garden layouts
- track plant growth and placement
- provide gardening recommendations (potential AI features later)

## Purpose & Context

This is primarily a **portfolio project** built to deepen experience across the full stack and support a job search. It may grow into something more, but learning and demonstrable depth are the primary goals.

**The developer brings:**

- 10+ years of frontend experience (primarily Vue)
- ~1.5 years of Django backend experience
- Little to no DevOps experience

**Learning goals for this project:**

- React (TypeScript) — applying existing frontend expertise in a new ecosystem
- Full-stack development — owning the entire feature lifecycle end-to-end
- DevOps — hands-on experience with deployment, CI/CD, and cloud infrastructure (Vercel + AWS)

**Implications for AI agents:**

- React patterns and idioms are a learning surface — prefer explaining non-obvious choices rather than just implementing them
- Django patterns may be familiar but assume React/TypeScript idioms are being actively learned
- DevOps tooling should be introduced gradually with clear rationale; don't assume prior AWS/CI knowledge

---

# 📁 Repository Structure

/frontend → React application (see /frontend/CLAUDE.md)
/backend → Django REST API (see /backend/CLAUDE.md)
/docs → Optional documentation
/CLAUDE.md → This file

---

# 🔐 Authentication

- Backend uses SimpleJWT for token-based auth
- Frontend stores tokens in localStorage and attaches via Axios interceptor
- All `/api/*` routes except auth endpoints require authentication
- Route protection is enforced via loader functions in the frontend router

---

# 🌱 Core Domain Model

Field definitions live in `models.py` and serializers — read the code directly. What follows are design decisions and non-obvious constraints that aren't visible from the code.

**Ownership** is enforced at the queryset level — users only see and modify their own gardens.

**User** has a `UserProfile` (auto-created via post_save signal) that stores `timezone`. Frontend sends browser timezone on login/register.

**Garden** `timezone` field _(planned)_ — IANA timezone name (e.g. "America/Denver"); when present, use this instead of the user's timezone for observation dates since the garden's physical location is the correct reference point.

**Garden** `orientation` field — integer (0–315, multiples of 45); the compass direction that "up" on the canvas layout corresponds to in the real world. 0 = north is up (standard), 90 = east is up, etc. Displayed as a compass rose above the garden canvas; editable via the create form ("Top of layout faces") and by clicking the compass rose.

**GardenBed** `facing` field _(planned deprecation)_ — currently a string choice (N/NE/E/SE/S/SW/W/NW) describing the direction the bed faces for sun/shade reasoning. This is conceptually the same information as `Garden.orientation` but tracked separately and in a different format, which means they can conflict. The intended end state is to replace `GardenBed.facing` with a numeric `GardenBed.orientation` field (same degrees format as `Garden.orientation`) and derive sun/shade reasoning from canvas position + garden orientation rather than a manually-declared field. Removing `facing` requires: migration + data conversion, updates to `GardenBedSerializer`, `BedFormFields`, `BedDetails`, and `ai/context_builder.py` (which currently calls `bed.get_facing_display()`). Do not remove until all those callsites are updated.

**Plant catalog** is a global shared catalog (54 plants, seeded via data migration). All users reference the same entries. A hybrid global + user-created catalog is deferred unless needed.

**PlantPlacement / BedPlacement — grid convention:** the grid always uses square feet as the cell unit regardless of the bed/garden's display unit. Dimensions are converted to feet at render time (`in ÷ 12`, `cm ÷ 30.48`, `m × 3.28084`) and rounded up. Grid resolution is fixed at 1 ft × 1 ft per cell but the schema doesn't encode this — `x`, `y`, `width`, `height` are plain integers whose meaning is set by the rendering layer, so future sub-foot resolution requires only a data migration and renderer update.

**PlantPlacement** is decoupled from `UserPlant` so a plant can exist without a placement. Moving a `UserPlant` to a new bed (PATCH `bed`) automatically deletes its existing `PlantPlacement` — the plant arrives in the new bed unplaced.

**Resize protection:** resizing a garden is blocked if any `BedPlacement` would go out of bounds; resizing a bed is blocked if any `PlantPlacement` would go out of bounds. Errors surface as `non_field_errors`.

**UserPlant ↔ organism cardinality:** 1 UserPlant = 1 plant = 1 PlantPlacement. A gardener planting 4 onions creates 4 UserPlant records — intentional so each plant has its own observation timeline (disease, harvest, etc.). A `quantity` field was considered and rejected for mature plants because it prevents per-plant health tracking; quantity is only appropriate for bulk seed starting where individual tracking isn't needed yet. Sub-foot canvas resolution (e.g., a 4-inch onion smaller than 1×1 ft on the grid) is deferred — the schema supports it but the renderer currently treats 1 unit = 1 ft minimum.

**Planned models** (design context only — fields in code when built):

- `Season` — groups planting by growing year; needed for crop rotation logic
- `PlantVariety` — distinguishes cultivars from species; field on UserPlant (simpler) vs separate model (needed for AI/catalog features) — decide before building
- `HarvestLog` — measurement record; may fold into `Observation` with a type field or stand alone
- `Task` — reminders with due date + completed flag; notification side handled by Celery
- `Photo` — image attachments; `GenericForeignKey` vs explicit nullable FKs — decide when building
- `AIConversation` — prompt/response log per user

---

# 🌐 API Conventions

- Base URL: `/api/`, auth endpoints at `/api/auth/*`
- All JSON field names are camelCase — converted automatically by `djangorestframework-camel-case`; Django serializers and models stay snake_case
- Timestamps in ISO 8601 format
- JWT access tokens expire in 5 minutes; the frontend silently refreshes on 401 and retries the original request
- Endpoint URLs and response shapes live in `urls.py` and serializers — read the code directly

---

# 🚧 Current Focus

> "Vertical Slice Development" — build full features end-to-end, avoid infrastructure work unless blocking, prioritize visible functionality over abstraction.

---

# 🏁 MVP Definition

The MVP is considered complete when:

- Users can create accounts and log in
- Users can manage gardens, beds, and plants
- AI recommendations are functional
- App is deployed publicly with HTTPS
- CI/CD pipeline is functional
- Dockerized local development works

---

# 🚫 Non-Goals

These are explicitly out of scope, at least initially:

- Kubernetes
- Microservices architecture
- Multi-tenant / enterprise support
- Complex AI agents or autonomous systems
- Real-time multiplayer collaboration
- Marketplace or ecommerce functionality

---

# ❌ Do NOT Do (for AI agents)

- Do not introduce new frameworks without explicit instruction
- Do not refactor architecture prematurely
- Do not add complex abstractions (CQRS, service layers, etc.)
- Do not add authentication complexity unless required
- Do not optimize prematurely

---

# ✅ Preferred AI Behavior

- Prefer small, incremental changes
- Preserve existing patterns unless broken
- Prioritize working end-to-end features
- Ask before introducing new dependencies
- Assume simplicity over scalability unless stated otherwise
- Follow the single responsibility principle — components and functions should do one thing; whenever a component or function is found to violate SRP (whether it's growing, being refactored, or just noticed), do NOT silently proceed — flag it, explain why it violates SRP, then ask the user whether to split it now or document it as a planned improvement; never perform an SRP-motivated refactor without explicit user confirmation

---

# 🌿 Features

## ✅ Completed

> High-level deliverables only. Implementation detail lives in the code and git history.

- User authentication — registration, login/logout, JWT tokens, silent refresh, protected routes
- Dark mode toggle — persisted to localStorage, synced with OS preference
- Full garden CRUD — list, detail page, create, edit, delete; responsive card grid
- Full garden bed CRUD — nested under gardens; detail page with metadata, layout grid, and plant list
- Full plant management — add/edit/delete plants per bed; move between beds; plant detail page (`/plants/:plantId`) with full timeline
- Plant catalog — global seeded catalog of 41 plants; searchable/filterable picker UI
- Observation timeline — per-plant event log (status changes, transplants, harvest, pest, weather, disease, general); auto-logged on status change and bed move
- Visual canvas layouts — `BedGrid` for placing plants in a bed; `GardenGrid` for placing beds in a garden; shared `PlacementCanvas` SVG component; freeform drag-and-drop via pointer capture with items positioned in feet coordinates; click-to-place dialog fallback; migrated from prior grid-based `@dnd-kit/core` system
- All-entity flat list pages — `/beds` and `/plants` with full CRUD actions
- Dockerized local dev — frontend, backend, PostgreSQL via `docker compose up -d`
- Deployed to production — frontend on Vercel, backend + DB on Railway
- Backend tests — 86 tests at 99% coverage across all apps (gardens, plants, users); CI via GitHub Actions blocks merges on failure and enforces a 90% coverage floor
- Frontend unit tests — Vitest + React Testing Library; CI enforces 85% statements/functions/lines and 80% branches; tests colocated with components
- CI lint + type check gates — `ruff` (backend) and `eslint` + `tsc` (frontend) run on every PR via GitHub Actions
- Inline editing on detail pages — edit forms open in a slide-in Sheet drawer on Garden, Bed, and Plant detail pages; no page layout shift; `MovePlantDialog` retained as a dialog
- Observation editing — inline edit form in the timeline; edits `observed_date` and `note`; type is locked (delete and re-add for misclicks); note is editable on all types including `status_change` and `transplant`
- Forgot password — email-based reset flow; Resend SMTP (kcdrez.com domain); login accepts username or email; full test coverage
- Plant UX improvements — bulk create (quantity spinner, N records per submit), add-new-plant wizard step in placement dialog, observation date bug fixed (auto-logged observation uses `startDate` instead of today)
- Canvas context menu — `...` hover button on placement items in `BedGrid` and `GardenGrid`; BedGrid: Edit/Move/Delete (deleteUserPlant with confirm); GardenGrid: Go to bed / Remove from layout; SVG button with virtual anchor pattern (menu rendered outside SVG, positioned via `getBoundingClientRect`)
- User profile page — `/profile` with inline edit form (first name, last name, email, timezone); backend `UserProfileSerializer` combines `User` + `UserProfile` fields in one endpoint; NavBar account dropdown links to it
- AI integration — OpenAI-powered chat at garden/bed/plant scope; `AIConversation` + `AIMessage` models; context builder serializes garden hierarchy into system prompt; conversation history (last 20 msgs); global floating chat widget with per-entity history and markdown rendering
- AI agentic actions — chat widget can execute real writes: `add_plant_to_bed` (bed scope) and `change_plant_status` (bed + plant scope); OpenAI tool call loop in `ai_service.py`; all tool execution scoped to `request.user`; context includes entity IDs and full plant catalog; confirmation chip shown in chat after action; queries invalidated automatically on success
- Clone a plant — duplicate a `UserPlant` (same bed, catalog entry, status, start date, notes); backend `clone` action on `UserPlantViewSet`; available from canvas context menu, bed plant list, all-plants list, and plant detail page; `usePlantActions` hook centralises clone/delete/edit/move logic shared by `PlantItem` and `PlantDetailHeader`
- Canvas context menu hit area fix — SVG `<g>` wrapper on the `...` button was creating a bounding-box hit area larger than the visible circle; fixed by removing the wrapper and conditionally rendering flat sibling circles with no explicit `pointer-events`
- Canvas garden features — `GardenFeaturePlacement` model; 15 object types (shed, bench, arbor, trellis, fence, compost, rain barrel, cold frame, fountain, bird bath, pot, tomato cage, row cover, custom rect/circle); image assets in `src/assets/garden_objects/`; amber solid-stroke rect/circle rendering; drag/resize with optimistic snap-back; `PlaceOnCanvasDialog` and `PlaceOnBedCanvasDialog` wizards with choose step; "Add Feature" standalone buttons on both canvases; Delete with confirmation; keyboard shortcut `Del` consistent with beds/plants
- Bed detail refactor — `PlantListSection` removed; bed detail page is canvas-only; `PlantObservationsSheet` (Sheet wrapping `PlantTimeline`) opens from canvas context menu "Observations" item preserving spatial context; canvas menu extended with View Details, Observations, Remove from Bed, and Clone (auto-places clone adjacent to source at `x + width`, clamped by backend); unplaced plants section promoted with `h2` heading, zero state message, "Create Plant" button, and per-chip actions menu (Edit / Clone / Move to Another Bed / Delete)
- Resize plant on canvas — drag handle in bottom-right corner of each placed item; dragging resizes the placement live and commits on release; plant visual is an ellipse that fills the bounding box; `lostpointercapture` handles out-of-window release; backend PATCH already supported width/height
- Observation list on `/plants` — "Observations" action in `CardActionsMenu` opens `PlantObservationsSheet` per plant without navigating away from the list
- Plant canvas icons — `plantEmoji()` maps 41 catalog plants to emoji with category fallbacks; `plantImage()` supports custom PNG assets (drop in `src/assets/garden_icons/`, add to `PLANT_IMAGES` in `src/lib/plants.ts`); Ideogram prompt and priority list of shared-emoji plants documented in the file; tomato and squash done
- Sort order for gardens and beds — dropdown on AllGardens, GardenDetail, and AllBeds with Name A–Z/Z–A, Date Created Newest/Oldest, and Custom drag order; `useSortedList` hook with localStorage persistence; `SortableGrid<T>` generic component owns all DnD boilerplate (DndContext + SortableContext + SortableCard); `@dnd-kit/sortable` added
- E2E tests — Playwright against the full Docker stack (frontend + backend + DB); 18 tests covering auth, gardens, beds, and plants (create/edit/delete/place on canvas/observe); setup project replaces `globalSetup` so VS Code extension triggers seed + auth before individual tests; CI runs on every PR and merge to `main`
- Semantic versioning — FE and BE version numbers auto-incremented on merge to `main` via `semantic-release` and conventional commits; FE version from `package.json` via Vite env var, BE from `VERSION` file at `/api/version/`; both displayed in the app footer
- AI rate limiting — 20 messages/user/day enforced via DB count in `AIConversationViewSet.message`; returns 429 with `detail` message; frontend detects 429 and disables input with a specific message; resets on UTC calendar day
- Companion planting indicators — `CompanionPlanting` model (beneficial/harmful, canonical pair ordering via check constraint); 75-pair curated seed data rated ≥4/5 confidence; `companion-hints` endpoint scoped to plants in the current bed; colored rings on BedGrid (green/red/gradient); compatibility summary panel below canvas; cache invalidation on plant create/clone/delete
- Planting calendar — `/calendar` Gantt-style timeline; year picker; plants grouped by bed with clickable links; bars segmented by lifecycle phase (status_change observations); event dots (harvest, transplant, pest, disease, weather, note, removed); today line; `GET /api/calendar/` endpoint; `startDate` auto-synced from earliest status_change observation via Django signal + data migration; `STATUS_COLOR_CONFIG` single source of truth for pill and bar colors
- Canvas multi-select — Shift/Cmd+click to toggle items; group drag moves all selected together; group delete with single confirm; "N selected" toolbar; marching ants animation on selection ring; selection ring and resize handle color fixed (`var(--primary)` instead of broken `hsl(var(--primary))`)
- Canvas `?` shortcut overlay — `CanvasShortcutsDialog` component; `?` key + help button; canvas UX fixes: companion indicator on container circle stroke, nudge 0.1ft, drag auto-selects
- Canvas zoom — `PlacementCanvas` has zoom controls (0.5×, 0.75×, 1×, 1.5×, 2×, 3×) defaulting to 0.75×; SVG CSS-scales inside an `overflow-x-auto` container; buttons stay constant pixel size via `hs / zoom`; production-grade alternative (viewBox pan+zoom) documented in `/docs/production-notes.md`
- Canvas UX polish — "Remove From Layout" label (consistent MinusCircleIcon, Title Case) in both grids; zoom persists to localStorage per canvas via `storageKey` prop; hover tooltip (SVG `<title>`) via `getItemLabel` prop; bed context menu in `GardenGrid` extended with Edit and Delete
- Garden detail refactor — canvas-only layout matching BedDetail; "Garden Beds" card grid and sort removed; "Add Bed" + "Unplaced Beds" h2 promoted into `GardenGrid`; garden dimensions shown in header; "Layout" sub-header added
- Canvas + form UX polish — variety text label inside plant ellipse on bed canvas (variety-only, icon shifts up, letterSpacing 0); `StatusPicker` pill component replaces status dropdown in all plant forms; `PlantPicker` shows plant image/emoji in list rows and selected badge; zoom levels updated to `[0.25, 0.5, 1, 2, 3]` with smart bed-area default; BedGrid edit split from create (edit → `PlantEditForm` sheet); "Clone" renamed "Duplicate" everywhere; status UI bug fixed (frozen state in BedGrid + `setQueryData` in `StatusChips`); start date defaults to today in create form
- Resize beds on garden canvas — drag handle on `GardenGrid` bed tiles updates bed dimensions directly (PATCH bed) via optimistic mutation; `GardenBed` dimensions changed to `FloatField` to allow sub-unit precision (e.g. 3.7 ft); resize error (e.g. plants out of bounds) surfaces inline and clears on next success; `fromFeet` added to `beds.ts`
- PlaceBedDialog "Create new bed" wizard — wizard step matching `PlacePlantDialog`; uses `quickBedSchema` (name, length, width, unit); `useBedPlacementActions.createPlacement` accepts optional `onSuccess` callback; dialog auto-closes after placement
- Canvas selection model — replaced hover-triggered SVG controls (`PlacementItemControls` removed) with click-to-select; floating HTML toolbar shows `primary` items inline (icon + label) and overflow in a `···` dropdown; `primary?: boolean` flag on `CanvasMenuItem`; deselects on background or outside-container click; toolbar snaps to item's new position after drag; 6px drag threshold prevents accidental drags; resize handle is a BR corner circle on the selection ring (sized `Math.min(0.05 / zoom, shortestDimension * 0.125)`)
- Canvas keyboard shortcuts — Delete/Backspace removes selected item; Arrow nudges 0.25ft, Shift+Arrow nudges 1ft (full grid cell); Escape deselects; Tab/Shift+Tab cycles items in visual order (top-to-bottom then left-to-right); `=`/`+`/`-` zoom in/out; single-key menu shortcuts (e/r/v/o/d/m for plants, e/r/v for beds) with `shortcut?` field on `CanvasMenuItem`; shortcut hints in toolbar and overflow dropdown; overflow menu bug fixed (Radix portal clicks were dismissed before firing)
- Canvas undo/redo — `Ctrl+Z/Y` (also Ctrl+Shift+Z) undoes and redoes move and resize actions on both bed and garden canvases; `useUndoHistory` ref-based stack with `push`/`undo`/`redo`; group drags pushed as a single batch command via `onGroupMoveEnd` prop on `PlacementCanvas`; create/delete not tracked (require re-POST to recover an ID); 10 unit tests
- North orientation + item rotation — `Garden.orientation` (0–315°, 45° steps); compass rose pill above garden canvas (sticky, centered, debounced click); `rotation` field on all three placement types; SVG rotate transform on canvas items; `[`/`]` shortcuts; sticky navbar; `--spacing-navbar` CSS token; `GardenBed.facing` deprecation documented

## 📋 Planned

### UI / Branding _(deferred — functionality first)_

- Branding pass — define a color palette, typography scale, and visual identity; the app is currently unstyled beyond Tailwind defaults; revisit once core functionality is stable

### Canvas Enhancements

- **Canvas rotation remaining** — `BedPlacement`, `PlantPlacement`, and `GardenFeaturePlacement` have a `rotation` field (0–359°); items rotate visually on the canvas via SVG transform; resize is disabled when an item is rotated (resize + rotation coordinate math is deferred); `[`/`]` keyboard shortcuts rotate 45° steps; undo/redo not yet wired for rotation (only move/resize are tracked)
- **Multi-select (remaining)** — rubber-band drag to select a region; group resize; group clone; these were deferred from the initial multi-select implementation
- **`useDebounce` hook + arrow key nudge batching** — extract a generic `useDebounce(fn, delay)` hook into `src/hooks/`; use it for compass orientation clicks (currently uses inline `useRef` + `setTimeout`) and arrow key nudges (`usePlacementKeyboard`); nudge debouncing requires deciding whether rapid keypresses should collapse into one undo step (debounced) or remain one step per press (current) — resolve before wiring

### Authentication & Accounts

- Social login (Google, Facebook, etc.) via `django-allauth` + `dj-rest-auth` — add alongside existing username/password auth, not as a replacement

### Garden Organization (core)

- Visual garden layout management
- Customizable garden dimensions and grids
- Drag-and-drop garden design interface
- Garden templates and presets
- Export/import garden plans

### Plants

- Add plants to garden layouts
- Plant spacing guidance
- Plant growth and lifecycle tracking
- Seed starting and transplant planning
- Seasonal planting schedules
- **Garden-level plant placement (potted/container plants)** — allow placing a plant directly on the garden canvas without assigning it to a bed; use case: potted plants that move around the garden and don't belong to a fixed bed; design decision: (a) a special "container" bed type that acts as a moveable single-plant bed on the garden grid, or (b) a `UserPlant` with a nullable `bed` field and a new `GardenPlantPlacement` model attached directly to the garden — option (a) is lower schema impact but a conceptual hack; option (b) is cleaner but requires loosening the current bed-required constraint throughout the stack

### Demo & Portfolio

- **Demo seed data** — rich multi-season fixture (2–3 years of planting history across multiple beds) to showcase the calendar, crop rotation, and companion planting features; management command so it only runs on demand, never in CI or on a fresh dev DB

### Bug Fixes (tracked)

### Deployment & Infrastructure

- Serve static/media files via S3
- Advanced AWS: RDS (managed PostgreSQL), ElastiCache (Redis), ECS/Fargate (containerized backend)
- **Preview environments per PR** — Vercel already creates a frontend preview URL per PR, but it points at prod backend so it only works for pure UI changes; full preview requires Railway PR Environments (ephemeral backend + DB per PR) wired together via a GitHub Action that sets `VITE_API_URL` on the Vercel preview to point at the Railway PR environment URL; needed for any PR that crosses the stack (new model, migration, endpoint, or serializer field)

### Tracking & Journaling

- Garden notes and journaling
- **Harvest log** — deferred to design; harvest observations already work as freeform notes; structured quantity/unit data would require a separate `HarvestLog` model (not folding into `Observation` to avoid partial columns); revisit when yield aggregation is needed
- Yield estimation and tracking
- Image uploads for plant/garden tracking
- Progress photo timelines
- **Print/export garden layout** — export the canvas as PNG or PDF for printing and taking outside

### Garden Health

- Crop rotation tracking and recommendations — `Season` model (planned) groups plantings by year; flag beds where the same plant family is being repeated
- Pest and disease tracking
- Soil and nutrient tracking
- Fertilizing schedules and reminders
- Watering and irrigation planning
- Sunlight and shade mapping

### Planning & Reminders

- **Season / year view** — group plantings by growing year via the `Season` model (already planned); lets users see what was in each bed in prior years; foundation for crop rotation warnings
- Task management and reminders
- Notification system for gardening tasks
- Frost date awareness and seasonal guidance
- **Weather-aware observations** — when logging an observation, optionally attach current weather for the garden's location automatically (temperature, conditions); low-friction way to build a weather + plant health correlation log
- Integration with external plant/weather data sources

### Discovery & Sharing

- Smart search and filtering
- Sharing gardens with other users
- Data visualization dashboards
- Garden analytics and historical trends

### Mobile App

- Port to iOS and Android using React Native (shared ecosystem with existing React codebase)
- Shared API layer and TypeScript types between web and mobile
- Native-feeling navigation and gestures
- Push notifications for gardening reminders and tasks
- Camera integration for plant/garden photo capture
- Offline-first support with sync when reconnected
- **Migrate plant emoji to backend** — currently a frontend-only `plantName → emoji` map in `src/lib/plants.ts`; move to an `emoji` field on the `Plant` model (data migration) so mobile clients get it from the API without a separate mapping

### AI Integration

- **Expand agentic tools** — add more safe write actions: log an observation, delete a plant (with confirmation), move a plant to another bed; extend to garden scope (add plant to a named bed)
- AI-powered garden recommendations
- AI-powered plant compatibility analysis
- AI-powered troubleshooting and diagnostics
- AI-powered layout optimization
- Vector search / RAG for plant knowledge retrieval

### Admin & Infrastructure

- Admin dashboard and moderation tools
- Role-based permissions
- Offline-friendly support
