# Dev Log

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
