# Production Considerations

Things that would need to be addressed before this app moves beyond a portfolio project. Added to as shortcuts are consciously taken.

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
