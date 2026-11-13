# Implementation Plan & Roadmap: `adwaid-view`

## 1. Completed Milestones (100% Complete)

### Phase 0: Repository Harnessing & Infrastructure
- [x] **Repository Harnessing:** Complete directory structure created (`src/`, `src/styles/`, `src/js/`, `src/vendor/`, `src-tauri/`).
- [x] **Offline Dependencies Vendored:** Bundled `marked.min.js` and custom offline CSS utility classes (zero external CDNs).
- [x] **Prototype Porting:** `slate-editor.html` ported to `src/index.html` with `"adwaid-view"` branding and frameless window controls. Original prototype moved to `archive/slate-editor.html`.
- [x] **Toolchain & System Libraries:**
  - `rustc 1.94.1`, `cargo 1.94.1`, `cargo-tauri 2.12.4` installed and linked in `~/.local/bin`.
  - Fedora 45 system headers installed: `webkit2gtk4.1-devel`, `librsvg2-devel`, `libappindicator-gtk3-devel`, `@development-tools`.
- [x] **Rust IPC Backend (`src-tauri/`):**
  - Typed Tauri commands: `read_markdown_file`, `write_markdown_file`, `rename_markdown_file`, `get_file_mtime`, `minimize_window`, `toggle_maximize_window`, `close_window`, `get_cli_file_args`.
  - Tauri permissions and capability schema configured in `src-tauri/capabilities/default.json`.

### Phase 1: Core Functional Polish
- [x] **Unsaved Changes Prompt (Close Tab & Window Guard):**
  - Native-styled in-app confirmation modal (`#confirm-modal`) rendered with theme CSS tokens.
  - Intercepts tab closing (`Ctrl+W`, `menu-close-tab`, or tab `×` button) and window closing when `dirty === true`.
  - Options: `Save` (saves to disk before closing), `Don't Save` (discards buffer and closes), `Cancel` (aborts action).
- [x] **Split-Mode Synchronized Scrolling:**
  - Bidirectional proportional scroll sync in `src/js/renderer.js` using mutual scroll lock latching to avoid feedback loops.
- [x] **Browser-Style Tab Drag-to-Reorder & Horizontal Scroll:**
  - HTML5 drag-and-drop tab reordering within `state.docs`.
  - Horizontal mouse-wheel scrolling enabled on the tab strip.
- [x] **External File Modification Detection:**
  - Window focus event checks `mtime` using `getFileMtime`. Auto-reloads clean files and alerts on modified dirty files.
- [x] **Native Window Controls Fix:**
  - Handled via direct Rust IPC commands bypassing WebKitGTK/Wayland JS capability restrictions.

### Phase 2: User Visual Assets Integration
- [x] `adwaid_view_icon.svg` integrated into `src/assets/logo.svg` for the in-app 32px Title Bar.
- [x] Master icon (`512x512`) and desktop scaled icons (`256x256`, `128x128`, `32x32`, `icon.ico`, and `icon.svg`) generated into `src-tauri/icons/`.

### Phase 3: Linux Desktop Integration & Fedora 45 Packaging
- [x] **XDG `.desktop` file:** Generated `adwaid-view.desktop` with MIME types: `text/markdown`, `text/x-markdown`, `text/plain`.
- [x] **Fedora 45 RPM Bundle Verified:**
  - `cargo tauri build --bundles rpm` executed successfully.
  - Package created at `src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm` (3.61 MiB).
  - Contains `/usr/bin/adwaid-view`, desktop entry, and all hicolor app icon resolutions.
- [x] **Initial GitHub Release Published:** `v0.1.0` published with release notes for Fedora, Ubuntu, Arch, and portable Linux.

### Phase 4: CI/CD & Automated Pull Request Validation
- [x] **Automated CI Workflow (`.github/workflows/ci.yml`):**
  - Runs on PRs to `test` and `main`, plus direct pushes.
  - Verifies code compilation (`cargo check`), linter checks (`cargo clippy`), and builds the native RPM package to catch regressions early.
- [x] **Automated Release Workflow (`.github/workflows/release.yml`):**
  - Triggers on `v*` tag pushes to automatically compile the application, package the `.rpm` and standalone `.tar.gz`, and publish GitHub Releases.

---

## 2. Next-in-Line Feature Roadmap (Phase 5)

Strictly abiding by the **no-left-sidebar, full-width canvas, 3-tier chrome** product guardrails:

### Feature 1: In-Editor Find & Replace (`Ctrl + F` / `Ctrl + H`)
- **UI:** A non-intrusive floating search panel positioned at the top-right of the editor canvas (similar to modern browsers).
- **Functionality:**
  - Incremental search highlighting occurrences in `#markdown-editor`.
  - Next / Previous match navigation (`Enter`, `Shift + Enter`).
  - Replace / Replace All inputs (`Ctrl + H`).
  - Match count indicator (e.g. `3 of 12 matches`).
- **Files to touch:** `src/index.html` (search bar markup), `src/styles/main.css`, `src/js/app.js`.

### Feature 2: Recent Files History in `File` Dropdown
- **UI:** A "Recent Files" submenu inside the 38px Menu Bar's `File` dropdown.
- **Functionality:**
  - Persists the last 6 opened file paths in `localStorage`.
  - Shows file basename and truncated directory path.
  - Clicking any recent file checks if already open in a tab (focuses tab) or opens it via `readMarkdownFile`.
  - Includes a "Clear Recent Files" option.
- **Files to touch:** `src/index.html`, `src/js/app.js`.

### Feature 3: Editor Zoom & Font Size Scaling (`Ctrl + +` / `Ctrl + -` / `Ctrl + 0`)
- **Functionality:**
  - Smoothly scales editor textarea font size and rendered preview font size.
  - Supports shortcuts: `Ctrl + +` (zoom in), `Ctrl + -` (zoom out), `Ctrl + 0` (reset to default 14.5px).
  - Persists chosen zoom level across sessions in `localStorage`.
- **Files to touch:** `src/styles/main.css`, `src/js/app.js`.

### Feature 4: Standalone HTML & PDF Export (`File -> Export as HTML / PDF`)
- **UI:** Added under `File` dropdown (`Export as HTML...`, `Export as PDF...` / `Ctrl + P`).
- **Functionality:**
  - **HTML Export:** Renders active tab's Markdown into clean, self-contained HTML embedding the active Light or Dark theme styling. Prompts file save dialog (`export.html`).
  - **PDF Export:** Configures print styles (`@media print`) and triggers native Linux print-to-PDF dialog for clean, high-resolution paginated output without UI chrome.
- **Files to touch:** `src/index.html`, `src/styles/main.css`, `src/js/app.js`, `src/js/ipc.js`.

### Feature 5: Performance Polish — High-Performance Split-Screen Scroll Synchronization
- **Issue:** Mouse scroll wheel rolling in split-screen mode exhibited stutter/lag due to bidirectional event feedback and layout thrashing.
- **Fix:** Implement hover-driven active pane latching (`mouseenter` / `touchstart`), passive scroll listeners (`{ passive: true }`), and `requestAnimationFrame` debouncing to decouple layout measurement from wheel ticks.
- **Files to touch:** `src/js/renderer.js`.

### Feature 6: Markdown Cheat Sheet / Help Modal (`F1`)
- **UI:** A quick, cleanly styled in-app cheat sheet modal showing common Markdown shortcuts (tables, headers, bold, links, code blocks, task lists).
- **Files to touch:** `src/index.html`, `src/styles/main.css`, `src/js/app.js`.

---

## 3. Git Workflow Reminder
```
dev  ──(feature/fix)──>  test  ──(validation & testing)──>  main (release)
```
- Work always begins on `dev`.
- Merge to `test` for verification (`cargo check`, `cargo tauri dev`, RPM packaging).
- Merge `test` into `main` for publishing releases.
