# Implementation Plan & Handover: `adwaid-view`

## 1. Completed Milestones (100% Complete)

### Phase 0: Repository Harnessing & Infrastructure
- [x] **Repository Harnessing:** Complete directory structure created (`src/`, `src/styles/`, `src/js/`, `src/vendor/`, `src-tauri/`).
- [x] **Offline Dependencies Vendored:** Bundled `marked.min.js` and custom offline CSS utility classes (no external CDNs).
- [x] **Prototype Porting:** `slate-editor.html` ported to `src/index.html` with `"adwaid-view"` branding and frameless window controls. Original prototype moved to `archive/slate-editor.html`.
- [x] **Toolchain & System Libraries:**
  - `rustc 1.94.1`, `cargo 1.94.1`, `cargo-tauri 2.12.4` installed and linked in `~/.local/bin`.
  - Fedora 45 system headers installed: `webkit2gtk4.1-devel`, `librsvg2-devel`, `libappindicator-gtk3-devel`, `@development-tools`.
- [x] **Rust IPC Backend (`src-tauri/`):**
  - Typed Tauri commands: `read_markdown_file`, `write_markdown_file`, `rename_markdown_file`, `get_file_mtime`, `get_cli_file_args`.
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

### Phase 2: User Visual Assets Integration
- [x] `adwaid_view_icon.svg` integrated into `src/assets/logo.svg` for the in-app 32px Title Bar.
- [x] Master icon (`512x512`) and desktop scaled icons (`256x256`, `128x128`, `32x32`, `icon.ico`, and `icon.svg`) generated into `src-tauri/icons/`.

### Phase 3: Linux Desktop Integration & Fedora 45 Packaging
- [x] **XDG `.desktop` file:** Generated `adwaid-view.desktop` with MIME types: `text/markdown`, `text/x-markdown`, `text/plain`.
- [x] **Fedora 45 RPM Bundle Verified:**
  - `cargo tauri build --bundles rpm` executed successfully.
  - Package created at `src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm` (3.61 MiB).
  - Contains `/usr/bin/adwaid-view`, desktop entry, and all hicolor app icon resolutions.

---

## 2. Verified Commands for Testing & Deployment
- **Development live run:** `cargo tauri dev`
- **Standalone binary output:** `src-tauri/target/release/adwaid-view`
- **Fedora RPM package:** `src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm`
  - Install locally via: `sudo dnf install ./src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm`
