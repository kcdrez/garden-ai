Run a full pre-commit quality check on the current branch changes. Work through each step in order. Do not stop early unless a step produces a hard blocker.

## Steps

### 1. Code Review
Review the current diff for correctness bugs, reuse/simplification opportunities, and obvious inefficiencies. Report findings as a concise bulleted list grouped by file. Note severity (high / medium / low) for each finding.

### 2. Frontend Unit Tests
Run `cd frontend && npm run test:run` and report the result. If any tests fail, identify the failing tests and their error messages.

### 3. Backend Unit Tests
Run `docker compose exec backend python manage.py test gardens.tests plants.tests ai.tests users.tests` and report the result. If any tests fail, identify the failing tests and their error messages.

### 4. Playwright E2E Tests
Run `cd e2e && npm test` and report the result. If any tests fail, identify which tests failed and why.

### 5. Fix Low-Effort Issues
Without changing any logic or behaviour, fix any issues that are safe to auto-correct:
- TypeScript type errors or unused imports
- ESLint errors (`cd frontend && npx eslint src --max-warnings 0`)
- Ruff lint errors (`cd backend && ruff check .`)

Report what was fixed and what was left for manual review.

### 6. Security Review
Review the diff for common security issues: exposed secrets, SQL injection, XSS, insecure direct object references, missing auth checks, or overly permissive CORS/headers. Report findings with severity (critical / high / medium / low). If nothing is found, say so explicitly.

## Output Format
End with a summary table:

| Step | Status | Notes |
|------|--------|-------|
| Code review | ✅ / ⚠️ / ❌ | brief note |
| FE tests | ✅ / ❌ | N passed |
| BE tests | ✅ / ❌ | N passed |
| E2E tests | ✅ / ❌ | N passed |
| Auto-fixes | ✅ / ℹ️ | what changed |
| Security | ✅ / ⚠️ | brief note |
