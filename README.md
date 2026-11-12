# adwaid-view

<div align="center">
  <img src="./src-tauri/icons/128x128.png" alt="adwaid-view icon" width="96" height="96" />
  <p><strong>A distraction-free, full-width Linux desktop Markdown editor & viewer built with Tauri v2 and WebKitGTK.</strong></p>
  <p><em>Optimized specifically for Fedora Linux (Wayland & XWayland).</em></p>
</div>

---

## Highlights & Features

- **No Left Sidebar:** Zero file trees, outline panels, or activity bars. Your writing takes 100% of the canvas.
- **Full-Width Canvas:** Markdown text and tables breathe across the full window width (`24px 28px` padding) without artificial column constraints.
- **Top Chrome Hierarchy:**
  - **`32px` Title Bar:** Custom frameless window controls (`Minimize`, `Maximize/Restore`, `Close`), active document name, theme toggle, and native Wayland/X11 dragging via `data-tauri-drag-region`.
  - **`38px` Menu & Stats Bar:** `File` dropdown (`Open`, `Save`, `Save As`, `Rename`, `Close Tab`), `New` tab button, `Mode` dropdown (`Edit`, `Split`, `Preview`), and live cursor stats (`Ln, Col`), word count, and save status.
  - **`36px` Browser-Style Tab Strip:** Connected active tabs, unsaved indicators (amber dot), double-click inline renaming (`F2`), close (`×`), and drag-and-drop tab reordering.
- **Three Viewing Modes (`Ctrl + E`):**
  - **Edit:** Full-width raw monospace Markdown editor with custom indentation.
  - **Split:** Side-by-side editing and preview with a draggable 1px divider and proportional bidirectional synchronized scrolling.
  - **Preview:** Full-width rendered GitHub Flavored Markdown (tables, task lists, code blocks, blockquotes).
- **Unsaved Changes Guard:** In-app confirmation modal prevents accidental data loss when closing tabs or the application.
- **External File Modification Detection:** Automatically reloads unmodified buffers when files change on disk and warns on dirty buffer conflicts.
- **100% Offline Execution:** Bundles `marked.min.js` and local styling with zero external CDN dependencies.
- **Lightweight:** Native GTK3 / WebKitGTK backend with low memory footprint (~35 MB RSS) and zero Chromium overhead.

---

## System Requirements (Fedora 45 / Linux)

To run or build `adwaid-view` from source on Fedora Linux:

```bash
sudo dnf install -y \
  webkit2gtk4.1-devel \
  librsvg2-devel \
  libappindicator-gtk3-devel \
  openssl-devel \
  @development-tools
```

---

## Getting Started

### Prerequisites
- **Rust toolchain:** `rustc` and `cargo` (`>= 1.80`)
- **Tauri CLI v2:** `cargo install tauri-cli --version "^2.0.0"` or via `cargo-binstall tauri-cli`
- **Node.js:** `>= 18` (optional, for script runners)

### Development Run
Launch `adwaid-view` in development mode with live reload:
```bash
cargo tauri dev
```

### Production Build & Fedora RPM Package
To compile an optimized release binary and generate a native Fedora RPM installer:
```bash
cargo tauri build --bundles rpm
```

The resulting packages will be generated at:
- **Standalone Release Binary:** `src-tauri/target/release/adwaid-view`
- **Fedora RPM Package:** `src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm`

To install the RPM locally:
```bash
sudo dnf install ./src-tauri/target/release/bundle/rpm/adwaid-view-0.1.0-1.x86_64.rpm
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | Create a new Markdown tab |
| `Ctrl + O` | Open local Markdown file(s) via native Linux dialog |
| `Ctrl + S` | Save active tab to disk (prompts Save As if untitled) |
| `Ctrl + Shift + S` | Save active tab to a new file path (`Save As`) |
| `Ctrl + E` | Cycle viewing mode (`Edit` → `Split` → `Preview`) |
| `Ctrl + W` | Close active tab (prompts if unsaved changes exist) |
| `Ctrl + Tab` / `Ctrl + Shift + Tab` | Switch to next / previous open tab |
| `F2` | Rename active tab inline |
| `Tab` (in editor) | Insert 2 spaces without losing editor focus |

---

## CLI Usage

You can launch `adwaid-view` directly from your terminal and open one or multiple Markdown files:

```bash
adwaid-view README.md notes.md ~/docs/architecture.md
```

---

## Architecture

- **`architecture.md`**: Complete architectural specification (Tauri v2 IPC contracts, directory layout, vertical layout anatomy).
- **`src/`**: Pure Vanilla ES2022 frontend, semantic CSS custom properties, and vendored offline Markdown renderer.
- **`src-tauri/`**: Native Rust application shell implementing file system IPC commands, frameless window management, and native XDG Desktop Portal file pickers.

---

## License

MIT License. Designed and crafted for Linux.
