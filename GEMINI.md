# `GEMINI.md` — Workspace Instructions for `adwaid-view`

## 1. Project Identity & Context
- **Application Name:** `adwaid-view`
- **Target Platform:** Linux only — specifically **Fedora 45** (GNOME/KDE/Sway on Wayland & XWayland).
- **Architecture Reference:** `architecture.md` (single source of truth for stack, directory layout, IPC contracts, and build targets).
- **UI Design Reference:** The downloaded HTML prototype file (`slate-editor.html` or user-placed `.html` design file in the repository root).

---

## 2. Initial Run: Repository Harnessing Protocol
When running in this repository for the **first time** (before the Tauri project structure exists), execute the following harnessing sequence before writing application features:

1. **Inspect Workspace & Locate Reference Assets:**
   - Scan the workspace root for `architecture.md` and the downloaded HTML UI prototype (`slate-editor.html` or equivalent `.html` file).
   - Verify whether `src-tauri/` and `src/` already exist. If missing, treat this session as **Initial Bootstrap**.
2. **Verify Fedora 45 Toolchain & System Libraries:**
   - Check for `rustc`, `cargo`, and `cargo-tauri` (`cargo tauri --version`). If `cargo-tauri` is missing, install via `cargo install tauri-cli --version "^2.0.0"`.
   - Verify Fedora 45 WebKitGTK & GTK development headers (`rpm -q webkit2gtk4.1-devel librsvg2-devel libappindicator-gtk3-devel`). If any are missing, output or run the `dnf install` command specified in `architecture.md` Section 2.
3. **Scaffold & Harness the Repository Layout:**
   - Initialize the directory tree defined in `architecture.md` Section 3 (`src/`, `src/styles/`, `src/js/`, `src/vendor/`, `src-tauri/`).
   - **Extract & Port the UI Prototype:** Decompose the downloaded HTML design reference into:
     - `src/index.html` (replacing `"Slate"` branding with `"adwaid-view"`, removing external CDN `<script>` tags, and linking local CSS/JS).
     - `src/styles/main.css` (preserving exact Light/Dark CSS custom properties, `32px` titlebar, `38px` menu bar, `36px` browser-style tab strip, and full-width editor/preview styling).
     - `src/js/app.js`, `src/js/ipc.js`, and `src/js/renderer.js`.
   - **Vendor Offline Dependencies:** Download or vendor `marked.min.js` into `src/vendor/marked.min.js` and generate local utility CSS so the app runs 100% offline with zero network calls.
   - **Configure Frameless Window & Rust IPC:** Generate `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` (`"decorations": false`, product name `"adwaid-view"`), `src-tauri/src/main.rs`, and `src-tauri/src/lib.rs` implementing `read_markdown_file`, `write_markdown_file`, `rename_markdown_file`, and `get_cli_file_args`.
4. **Smoke Test & Update Living Docs:**
   - Run `cargo check` inside `src-tauri/` to confirm clean compilation on Fedora 45.
   - Archive or move the raw reference `.html` file if superseded, and update `GEMINI.md` (Section 6) to mark initial harnessing complete.

---

## 3. Strict Product & UI Guardrails (Do Not Violate)
- **No Left Sidebar:** Never add a file tree, folder explorer, outline drawer, or left activity bar.
- **Full-Width Canvas:** Editor and Preview panes must occupy `100%` of the available window width (`padding: 24px 28px`). Never wrap content in a narrow centered container (`max-width: 768px`, etc.).
- **Exact Top Chrome Order:**
  1. `32px` Title Bar (`adwaid-view` title, active file name, Light/Dark toggle, custom Minimize/Maximize/Close buttons with `data-tauri-drag-region`).
  2. `38px` Menu Bar (`File` dropdown, `New` button, `Mode` dropdown displaying active mode inside the button itself — **do not** add extra mode pills next to the menu tools — plus right-aligned cursor stats, word count, and save status).
  3. `36px` Browser-Style Tab Strip (connected active tab, unsaved dot, double-click inline rename, close `×`, and `+` button).
- **Scope Discipline:** Do not introduce unrequested features (e.g., cloud sync, AI chat panels, WYSIWYG rich-text toolbars, plugin marketplaces, or multi-window session managers) unless explicitly requested by the user.

---

## 4. Coding & Platform Standards
- **Frontend:** Vanilla ES2022 modules + semantic CSS variables. No React, Vue, Svelte, or heavy bundler pipelines.
- **Backend (Rust):** Keep Tauri commands minimal, synchronous/fast, and strictly scoped to local `.md` / `.markdown` / `.txt` file operations and CLI argument inspection.
- **Fedora 45 / Wayland:** Ensure native XDG Desktop Portal file dialogs work via `tauri-plugin-dialog` and preserve clean WebKitGTK rendering under Wayland.

---

## 5. Self-Maintenance Rule (Keep Docs Updated)
Whenever you modify the project structure, add or change Tauri IPC commands, alter keyboard shortcuts, or adjust build/packaging steps:
1. **Update `architecture.md`** so the technical specification matches the actual codebase.
2. **Update `GEMINI.md`** (especially Section 6 below) so future sessions have accurate workspace state, build commands, and conventions.

---

## 6. Current Repository State
- **Bootstrap Status:** `COMPLETED` (Initial harness executed: directory tree, offline vendored assets, ported UI prototype, Tauri v2 backend, frameless windowing, and permissions configured).
- **Core Features Status:** `COMPLETED`
  - Unsaved changes confirmation guard on tab/window close.
  - Split-mode bidirectional synchronized scrolling.
  - Browser-style tab drag-to-reorder and horizontal wheel scroll.
  - External file change detection on window focus (`get_file_mtime`).
  - Custom branding and icons generated from `adwaid_view_icon.svg` into `src/assets/logo.svg` and `src-tauri/icons/`.
  - Linux desktop entry `adwaid-view.desktop` with Markdown MIME associations.
- **Toolchain Status:**
  - `rustc 1.94.1`, `cargo 1.94.1` linked into `~/.local/bin/`.
  - `cargo-tauri 2.12.4` installed into `~/.local/bin/cargo-tauri`.
  - Node `v22.23.1` and `npm 10.9.8` available.
  - Fedora 45 system libraries (`webkit2gtk4.1-devel`, `librsvg2-devel`, `libappindicator-gtk3-devel`, `@development-tools`) **installed and verified**.
  - `cargo check --manifest-path src-tauri/Cargo.toml` compiled cleanly with zero errors.
  - `cargo tauri build --bundles rpm` verified: generated `adwaid-view-0.1.0-1.x86_64.rpm` (3.61 MiB).
- **Distribution & Release Status:**
  - Initial release `v0.1.0` published on GitHub: `https://github.com/adhu1155/adwaid-view/releases/tag/v0.1.0`.
  - Automated release workflow configured: `.github/workflows/release.yml` (triggers on `v*` tag pushes).
- **Verified Build Commands:**
  - Development run: `cargo tauri dev`
  - Release binary & RPM package: `cargo tauri build --bundles rpm`