---
name: start-issue
description: Mandatory starting workflow for adwaid-view. Creates a fully detailed GitHub issue with problem statement, detailed description, acceptance criteria, and definition of done before any code is written.
---

# Start Issue Skill (`start-issue`)

## Purpose
This skill enforces the mandatory policy for `adwaid-view`: **No feature, bug fix, or refactor may be implemented without first creating a comprehensive GitHub issue.**

## When to Use
- Whenever the user requests a new feature, enhancement, bug fix, or UI modification.
- PROACTIVELY execute this skill before modifying any code or beginning tasks.

## Mandatory Rules
1. **Never write code before the issue is created.** You must not edit files, create branches, or run scaffolding until the issue exists on GitHub.
2. **Assignee:** Always assign the issue to `@me` (`adhu1155`).
3. **Structured Format:** Every issue must contain:
   - **Problem Statement / Context:** Why is this needed? What problem does it solve?
   - **Detailed Description:** Precise breakdown of UI chrome, interactions, IPC commands, and files to touch.
   - **Acceptance Criteria:** Concrete, verifiable checkboxes.
   - **Definition of Done (DoD):** Verification protocol, testing on Fedora 45/Wayland, branch promotion steps (`dev` ➔ `test` ➔ `main`), and explicit user verification.

## Issue Template & Execution Command

```bash
gh issue create \
  --title "<type>: <concise title>" \
  --assignee "@me" \
  --label "<enhancement|bug|documentation>" \
  --body "### Problem Statement
<Clear explanation of the problem, friction point, or user need>

---

### Detailed Description
<Breakdown of the feature or fix:
- UI / visual changes adhering to the 3-tier chrome and full-width canvas
- Rust IPC commands and backend changes
- Frontend modules affected>

---

### Acceptance Criteria
- [ ] <Criterion 1>
- [ ] <Criterion 2>
- [ ] <Criterion 3>
- [ ] Works 100% offline without external CDN/network dependencies
- [ ] Preserves all existing keyboard shortcuts and window controls

---

### Definition of Done (DoD)
- [ ] Implemented on the \`dev\` branch
- [ ] Verified locally via \`cargo check\` and live testing on Fedora 45 / Wayland
- [ ] Merged from \`dev\` into \`test\` branch
- [ ] Verified by the user on the \`test\` branch and approved
- [ ] Merged from \`test\` into \`main\` only after explicit user approval"
```

## Post-Creation Protocol
1. Report the created issue URL to the user.
2. Confirm readiness to begin development on the `dev` branch.
3. Wait for the user's go-ahead if they requested not to start immediately.
