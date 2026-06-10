Stage, commit, and push the current changes. Follow conventional commits format.

## Steps

### 1. Understand the changes
Run `git status` and `git diff` to understand what changed. Use this to write the commit message.

### 2. Check for sensitive files
Before staging, warn the user and stop if any of the following are about to be staged: `.env`, `*.pem`, `*.key`, `credentials.*`, `secrets.*`. Ask the user to handle these manually.

### 3. Stage all changes
Run `git add .`

### 4. Write the commit message
Follow the conventional commits format used in this project:

```
<type>(<optional scope>): <short description>

<optional body>
```

Types: `feat` (new feature), `fix` (bug fix), `refactor` (no behaviour change), `test` (tests only), `docs` (docs only), `chore` (tooling/config), `style` (formatting).

Rules:
- Subject line under 72 characters
- Lowercase, no trailing period
- Body only if needed for context
- Co-Authored-By line: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

### 5. Commit
Run `git commit -m "<message>"` with the message from step 4.

### 6. Push
Run `git push`.

### 7. Report
Print the commit hash and message.
