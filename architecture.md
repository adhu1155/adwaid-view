# Architecture Specification: `adwaid-view`

## 1. Project Overview & Scope

`adwaid-view` is a lightweight, distraction-free, Linux-only desktop Markdown editor and viewer built specifically for **Fedora 45** (Wayland & XWayland).

### Design Reference
The visual layout, spacing, color tokens, typography, and interaction model are defined by the reference UI prototype (`slate-editor.html`), adapted for native desktop windowing and local filesystem I/O under the application name **`adwaid-view`**.

### Strict Functional Scope (v1.0)
Only the explicitly specified features are included in this architecture:
1. **No Left Sidebar:** Zero file trees, outline panels, or activity bars.
2. **Full-Width Canvas:** Content spans `100%` of the viewport width with clean edge padding (`24px 28px`) and zero artificial center column limits.
3. **Top-to-Bottom Chrome Hierarchy:**
   - **Title Bar (`32px`):** App icon, `adwaid-view` title, active filename indicator, Light/Dark theme toggle, and custom native window controls (Minimize, Maximize/Restore, Close).
   - **Action Menu Bar (`38px`):** `File` dropdown (`Open`, `Save`, `Save As`, `Rename`, `Close Tab`), `New` tab button, `Mode` dropdown (`Edit`, `Split`, `Preview`), and right-aligned live cursor position (`Ln, Col`), word count, and save status indicator.
   - **Browser-Style Tab Bar (`36px`):** Open file tabs connected seamlessly into the active canvas, unsaved dot indicators, double-click inline rename, close (`×`) button, and `+` new tab button.
4. **Local Filesystem Integration:** Native Linux file picker, direct disk read/write for `.md` / `.markdown` / `.txt` files, and CLI file argument support (`adwaid-view path/to/file.md`).

---

## 2. Technology Stack & Fedora 45 Runtime

To preserve the exact HTML/CSS/JS UI design while maintaining native Linux performance, low memory usage (~35 MB RSS), and crisp Wayland rendering on **Fedora 45**, `adwaid-view` uses **Tauri v2** (Rust backend + WebKitGTK frontend).

| Layer | Technology | Rationale for Fedora 45 |
| :--- | :--- | :--- |
| **Desktop Shell & IPC** | **Tauri v2** (Rust) | Native GTK3 / WebKitGTK integration; zero Chromium bloat; native `.rpm` bundling. |
| **Web Engine** | `webkit2gtk-4.1` | Pre-packaged in Fedora 45 repositories with hardware-accelerated Wayland compositing. |
| **Frontend UI** | Vanilla ES2022 + CSS Variables | Direct 1:1 port of the reference HTML/CSS design; zero framework overhead or build lag. |
| **Markdown Parser** | `marked` (bundled locally) | Fast GFM (tables, task lists, fenced code blocks) rendering with offline local assets (no CDN dependency). |
| **Native Dialogs & FS** | `tauri-plugin-dialog` + `tauri-plugin-fs` | Native XDG Desktop Portal file dialogs (works seamlessly on GNOME/KDE/Sway on Fedora 45). |

### Fedora 45 System Dependencies
```bash
sudo dnf install -y \
  webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  @development-tools
```

---

## 3. Repository Directory Structure

```text
adwaid-view/
├── architecture.md               # This architectural specification
├── package.json                  # Minimal scripts for Tauri CLI & local asset bundling
├── scripts/
│   ├── agy-auto.py               # Transparent interactive PTY wrapper with automatic 503 retry injection
│   └── agy-retry.sh              # Auto-retry helper with 5m countdown on 503 capacity errors
├── src/                          # Frontend (WebKitGTK webview root)
│   ├── index.html                # Main UI shell (ported from reference HTML design)
│   ├── assets/
│   │   └── logo.svg              # In-app Title Bar vector logo
│   ├── styles/
│   │   └── main.css              # CSS custom properties (Light/Dark), tab strip, full-width editor/preview
│   ├── js/
│   │   ├── app.js                # State store, tab lifecycle, mode switching, keyboard shortcuts
│   │   ├── ipc.js                # Tauri invoke() wrappers for file open/save/window controls
│   │   └── renderer.js           # Offline marked.js wrapper & split-pane resizer
│   └── vendor/
│       └── marked.min.js         # Local copy of marked.js for 100% offline execution
└── src-tauri/                    # Native Linux Rust backend
    ├── Cargo.toml                # Rust dependencies (tauri, tauri-plugin-dialog, tauri-plugin-fs)
    ├── tauri.conf.json           # Frameless window config, app identifier, RPM bundler settings
    ├── build.rs                  # Tauri build script
    ├── icons/                    # Linux hicolor PNG/SVG application icons
    └── src/
        ├── main.rs               # Binary entrypoint & CLI file path argument parser
        └── lib.rs                # Tauri command handlers (read_md_file, write_md_file, rename_md_file)
```

---

## 4. UI & Component Architecture

### 4.1 Vertical Layout Anatomy
The viewport is locked to `100vw × 100vh` (`overflow: hidden`) using a vertical flex column (`flex-direction: column`):

```text
+-----------------------------------------------------------------------------------+
| [Icon] adwaid-view — notes.md                        [Dark/Light]  [ - ] [ □ ] [×] |  <- 32px Title Bar (data-tauri-drag-region)
+-----------------------------------------------------------------------------------+
| [File v]  [+ New]  [Mode: Edit v]                     Ln 14, Col 8 | 412 words ●  |  <- 38px Menu & Status Bar
+-----------------------------------------------------------------------------------+
| [ notes.md × ] [ readme.md × ] [ + ]                                              |  <- 36px Browser Tab Strip
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  Full-Width Content Area (flex: 1, width: 100%, no left sidebar)                  |
|  - Edit Mode:    100% width monospace <textarea>                                  |
|  - Split Mode:   Draggable % <textarea> | 1px resizer | Draggable % <article>     |
|  - Preview Mode: 100% width rendered GFM HTML <article>                           |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 4.2 Custom Frameless Windowing (`tauri.conf.json`)
Because `adwaid-view` renders its own `32px` Title Bar:
- `"decorations": false` is configured on the main window in `tauri.conf.json`.
- The Title Bar container carries the `data-tauri-drag-region` attribute so dragging empty title bar space moves the window natively on Wayland/X11.
- The Minimize, Maximize/Restore, and Close buttons invoke Tauri's `getCurrentWindow()` APIs (`minimize()`, `toggleMaximize()`, `close()`).

---

## 5. Frontend State Schema

All open tabs and UI preferences are managed in a single deterministic in-memory state object (`app.js`):

```javascript
const state = {
  docs: [
    {
      id: "doc-1731400000000",
      title: "untitled-1.md",       // Display name shown in browser tab & title bar
      filePath: null,               // Absolute Linux path (e.g., "/home/user/docs/notes.md") or null if unsaved
      content: "",                  // Raw UTF-8 Markdown string
      dirty: false                  // True when buffer differs from last disk read/write
    }
  ],
  activeId: "doc-1731400000000",    // Currently focused tab ID
  mode: "edit",                     // "edit" | "split" | "preview"
  theme: "light",                   // "light" | "dark" (persisted in localStorage)
  splitRatio: 50,                   // Left-pane percentage (clamped 20..80) in "split" mode
  renamingId: null,                 // Tab ID currently in inline rename input state
  untitledCounter: 1                // Sequential counter for new untitled tabs
};
```

---

## 6. Rust Backend & IPC Contract (`src-tauri/src/lib.rs`)

### 6.1 Exposed Tauri Commands
The frontend communicates with Linux disk storage exclusively through typed Tauri commands:

| Command Name | Input Parameters | Return Type | Behavior |
| :--- | :--- | :--- | :--- |
| `read_markdown_file` | `path: String` | `Result<FilePayload, String>` | Reads UTF-8 file contents and extracts basename for tab title. |
| `write_markdown_file` | `path: String, content: String` | `Result<u64, String>` | Atomically writes UTF-8 Markdown content to `path` and returns new mtime. |
| `rename_markdown_file` | `old_path: String, new_name: String` | `Result<String, String>` | Renames file on disk in the same parent directory and returns the new path. |
| `get_file_mtime` | `path: String` | `Result<u64, String>` | Returns file last modified timestamp in UNIX epoch seconds. |
| `minimize_window` | *(none)* | `()` | Minimizes the native application window. |
| `toggle_maximize_window` | *(none)* | `()` | Toggles native window maximize / restore state. |
| `close_window` | *(none)* | `()` | Closes the native application window. |
| `get_cli_file_args` | *(none)* | `Vec<String>` | Returns any `.md` file paths passed when launching `adwaid-view` from terminal. |

### 6.2 Rust Payload Structs
```rust
#[derive(serde::Serialize)]
pub struct FilePayload {
    pub path: String,
    pub title: String,
    pub content: String,
    pub mtime: u64,
}
```

### 6.3 File Open & Save Flows
1. **Open (`Ctrl+O` or `File -> Open`):**
   - Frontend triggers `dialog.open({ multiple: true, filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }] })`.
   - For each selected path, if a tab with `doc.filePath === path` is already open, focus that tab; otherwise invoke `read_markdown_file(path)` and append a new tab.
2. **Save (`Ctrl+S` or `File -> Save`):**
   - If `doc.filePath !== null`: invoke `write_markdown_file(doc.filePath, doc.content)`, set `doc.dirty = false`, update status pill to `Saved`.
   - If `doc.filePath === null`: trigger `dialog.save({ defaultPath: doc.title, filters: [{ name: "Markdown", extensions: ["md"] }] })`, update `doc.filePath` and `doc.title`, then write to disk.
3. **Rename (`F2`, `File -> Rename`, or double-click tab):**
   - Switches tab label to an inline `<input>`.
   - On `Enter` or blur: if `doc.filePath` exists on disk, invokes `rename_markdown_file` to rename on disk; otherwise updates `doc.title` in memory.

---

## 7. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | Open a new blank Markdown tab |
| `Ctrl + O` | Open local Markdown file(s) via native Linux dialog |
| `Ctrl + S` | Save active tab to disk (triggers Save As if untitled) |
| `Ctrl + Shift + S` | Save active tab to a new path (`Save As`) |
| `Ctrl + E` | Cycle Mode (`Edit` → `Split` → `Preview`) |
| `Ctrl + W` | Close active tab |
| `Ctrl + Tab` / `Ctrl + Shift + Tab` | Switch to next / previous open tab |
| `F2` | Rename active tab inline |
| `Tab` (inside editor) | Insert 2 spaces without losing textarea focus |

---

## 8. Wayland & Fedora 45 Environment Notes

- **WebKitGTK DMA-BUF / Wayland Stability:** On certain Fedora 45 GPU driver configurations (NVIDIA/Mesa), WebKitGTK can occasionally exhibit blank frames under Wayland if hardware DMA-BUF rendering conflicts with the compositor. `src-tauri/src/main.rs` should conditionally preserve clean rendering defaults and allow standard `WEBKIT_DISABLE_DMABUF_RENDERER=1` fallback if needed.
- **Offline Self-Containment:** Unlike the browser prototype (which loaded Tailwind and Marked via CDN), the desktop build bundles `marked.min.js` and compiled/static CSS locally inside `src/` so `adwaid-view` launches instantaneously with zero network requests.

---

## 9. Build & Packaging for Fedora 45

### Development Run (via `agy` / Terminal)
```bash
cargo tauri dev
```

### Production Binary & Fedora `.rpm` Build
```bash
cargo tauri build --bundles rpm
```
- **Standalone Binary Output:** `src-tauri/target/release/adwaid-view` (can be copied directly to `/usr/local/bin/adwaid-view`).
- **Fedora RPM Output:** `src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm` (installable via `sudo dnf install ./adwaid-view-0.1.0-1.x86_64.rpm`).