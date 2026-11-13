---
name: verify-test
description: Testing and verification protocol for adwaid-view on the test branch. Verifies builds, packages, and prepares changes for user hands-on testing before any merge to main.
---

# Verify Test Skill (`verify-test`)

## Purpose
Enforces the mandatory QA and testing stage of the `dev` ➔ `test` ➔ `main` pipeline. No code may reach `main` without passing validation on the `test` branch and receiving explicit user approval.

## When to Use
- When work on the `dev` branch is complete and ready for testing.
- Before proposing any merge to `main`.

## Verification Steps

### 1. Merge `dev` into `test`
```bash
git checkout test
git merge dev
```

### 2. Rust Compilation & Lint Check
```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
```

### 3. Verify Clean Git Diff
```bash
git diff --check
```

### 4. Smoke Test & Packaging Validation (if applicable)
```bash
# Live development test:
cargo tauri dev

# Package build:
cargo tauri build --bundles rpm
```

### 5. Request User Verification
Report the test results clearly to the user and request their hands-on verification:
> *"The changes have been merged into the `test` branch and passed compilation. Please test it locally (`cargo tauri dev` or install the test RPM). Once you verify it is working fine, I will merge to `main`."*

**RULE:** Never merge `test` into `main` without the user's explicit confirmation that they have tested it and it works fine.
