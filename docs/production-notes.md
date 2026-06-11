# Production Considerations

Things that would need to be addressed before this app moves beyond a portfolio project. Added to as shortcuts are consciously taken.

---

## Railway: Set Environment Variables via CLI, Not UI

**The problem:** Railway's web UI has a persistent bug where variables added or edited through the dashboard appear in the list but silently fail to inject into the running container. `env | grep VAR_NAME` returns nothing despite the variable showing in the UI. Happens on redeploy too.

**The fix:** Always set variables via the CLI:

```bash
railway variables set KEY=value
```

This writes directly to Railway's API and reliably propagates on next deploy. The UI is fine for reading/confirming what's set, but not for writing.

**Debugging a missing variable:** Open the Railway console for the service and run `env` — if the variable isn't in the output, it didn't inject regardless of what the UI shows.

---

## Rate Limiting (AI chat)

**Current approach:** Daily message cap enforced by a DB count query in the view before each request (`AIMessage.objects.filter(conversation__user=..., role=USER, created_at__date=today).count()`). Hardcoded at 20 messages/user/day. Resets on calendar day in UTC.

**Why it's acceptable now:** Zero extra dependencies, easy to understand, works fine at low traffic.

**What to change for production:**
- Use DRF's built-in throttling classes (`UserRateThrottle`, `AnonRateThrottle`) backed by Redis — they handle sliding windows, don't add a DB query per request, and emit proper `Retry-After` headers.
- Make the limit configurable per user tier (free vs. paid) rather than hardcoded in a view constant.
- Add a rate limiting layer at the infrastructure level (Nginx rate limiting, Cloudflare, or an API gateway) as defense-in-depth so enforcement doesn't depend solely on application code.
- Expose remaining daily quota in the API response so the frontend can show a "N messages remaining today" indicator without a separate request.
- The current approach counts against UTC calendar days; production should respect the user's timezone (stored in `UserProfile.timezone`) or at minimum document the reset boundary clearly in the UI.

---

## Canvas Zoom (`PlacementCanvas`)

**Current approach:** Zoom is implemented by scaling the SVG's CSS width (`zoom * 100%`) inside a fixed-height `overflow-auto` container. Preset levels (1×, 1.5×, 2×, 3×) are offered as buttons above the canvas. `toSVGPoint` uses `getScreenCTM().inverse()` so drag and resize coordinates auto-correct through the CSS scale — no changes to interaction math were needed.

**Why it's acceptable now:** Minimal change, zero coordinate logic touched, scrollbars are a familiar UX.

**What to change for production:**
- Replace scrollable overflow with viewBox-based zoom + pan: shrink the `viewBox` to show a smaller region at higher resolution, and track a pan offset so the user can navigate anywhere on the canvas without scrollbars.
- Add a pointer wheel handler (`onWheel`) on the SVG for scroll-to-zoom, and a pinch gesture handler for touch devices.
- Pan on the background conflicts with click-to-place — resolve with a modifier key (Space + drag = pan) or a dedicated pan mode toggle in the toolbar.
- `toSVGPoint` still works for viewBox zoom since it's coordinate-system-agnostic — the same zero-change property holds.
