---
name: pr-review
description: Comprehensive pre-release review and promotion protocol for adwaid-view. Ensures issue acceptance criteria, documentation, and user verification are satisfied before promoting test to main.
---

# PR Review & Promotion Skill (`pr-review`)

## Purpose
Coordinates the final review and promotion from `test` into `main` after the user has personally tested and approved the changes.

## When to Use
- When the user gives explicit approval after testing on the `test` branch.
- Before committing or merging into `main`.

## Review Checklist
1. **User Approval Verified:** Has the user explicitly said the change works fine and is approved? (Mandatory: If not, stop and wait).
2. **Issue Acceptance Criteria:** Check off all items in the related GitHub issue.
3. **No Unwanted Artifacts:** Ensure no temporary debug logs (`console.log`), leftover files, or unrelated formatting diffs exist.
4. **Living Documentation Synchronized:**
   - Update `architecture.md` if IPC commands, schema, or directory layout changed.
   - Update `GEMINI.md` Section 8 (Current Repository State).
   - Update `plan.md` to mark features completed or adjusted.
   - Update `README.md` if user-facing features or shortcuts changed.

## Merge & Release Execution
```bash
# 1. Switch to main and merge test
git checkout main
git merge test

# 2. Return to dev for subsequent work
git checkout dev

# 3. Close the resolved GitHub issue
gh issue close <issue-number> --comment "Resolved and verified on test, merged into main."

# 4. Push only if user explicitly requested
# git push origin main test dev
```
