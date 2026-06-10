Write a devlog entry for the current session and update CLAUDE.md. Use this when the user says they are done or ending the session.

## Time tracking

The devlog records session duration. Since the AI has no clock, time must come from the user:

- If the user hasn't provided an end time, ask for it before proceeding
- If the user mentioned stepping away during the session, ask for the total pause duration if not already given
- Calculate duration as: (end time − start time) − (sum of all pauses)

## Steps

### 1. Devlog entry
Append a new dated entry to `/docs/devlog.md` (newest first):

```
## YYYY-MM-DD — ~N hours

**Completed:**
- Short bullet describing what shipped

**Next up:** One-line summary of what to tackle next
```

Rules:
- **Completed** bullets are high-level; skip internal refactors and tooling noise unless they unblock something
- **Next up** is a single line, not a list — the most important thing to tackle next

### 2. ✅ Completed list
If a major deliverable shipped this session, append a high-level bullet to `/docs/completed.md` (feature or system level, not implementation detail).

### 3. 📋 Planned list in CLAUDE.md
If anything completed this session was previously listed under `## 📋 Planned` in `CLAUDE.md`, remove it.
