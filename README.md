<div align="center">
  <img src="./src-tauri/icons/128x128.png" alt="adwaid-view logo - Distraction-free Linux Markdown Editor" width="100" height="100" />
  <h1>adwaid-view</h1>
  <p><strong>A Distraction-Free, Full-Width Desktop Markdown Editor & Viewer for Linux</strong></p>

  [![Latest Release](https://img.shields.io/github/v/release/adhu1155/adwaid-view?color=blue&label=Release&logo=github)](https://github.com/adhu1155/adwaid-view/releases/latest)
  [![Platform](https://img.shields.io/badge/Platform-Linux%20(Wayland%20%26%20X11)-informational?logo=linux)](https://github.com/adhu1155/adwaid-view/releases/latest)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Memory Usage](https://img.shields.io/badge/Memory%20Footprint-~35%20MB%20RAM-brightgreen)](https://github.com/adhu1155/adwaid-view)
</div>

---

**adwaid-view** is an ultra-fast, lightweight Linux desktop Markdown editor designed for focused writing and reading. Unlike traditional note apps cluttered with complex sidebars, heavy browser runtimes, or artificial narrow page margins, `adwaid-view` gives **100% of the screen** to your Markdown content with native Wayland and X11 desktop integration.

---

## ⚡ Quick Install

No coding or build tools required. Choose your Linux distribution below:

### 🔵 Fedora / RHEL / AlmaLinux
Install the native RPM package with a single terminal command:
```bash
sudo dnf install https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-0.1.0-1.x86_64.rpm
```
*(To update or reinstall: `sudo dnf reinstall https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-0.1.0-1.x86_64.rpm`)*

---

### 🟠 Ubuntu / Debian / Linux Mint / Pop!_OS
Download and run the standalone portable package:
```bash
# 1. Ensure runtime libraries are present
sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-0 librsvg2-common

# 2. Download and extract
wget https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-v0.1.0-x86_64.tar.gz
tar -xzf adwaid-view-v0.1.0-x86_64.tar.gz

# 3. Launch adwaid-view
./adwaid-view
```

---

### ⚪ Arch Linux / Manjaro / EndeavourOS
```bash
# 1. Install runtime dependencies
sudo pacman -S --needed webkit2gtk-4.1 librsvg

# 2. Download and extract
curl -sL https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-v0.1.0-x86_64.tar.gz | tar -xz

# 3. Launch adwaid-view
./adwaid-view
```

---

### 📦 Any 64-bit Linux (Portable / No Root Required)
1. Download **`adwaid-view-v0.1.0-x86_64.tar.gz`** from the [Releases page](https://github.com/adhu1155/adwaid-view/releases/latest).
2. Right-click and extract the archive (or `tar -xzf adwaid-view-v0.1.0-x86_64.tar.gz`).
3. Double-click the **`adwaid-view`** executable to start writing!

---

## 🌟 Why adwaid-view?

### 📐 100% Full-Width Canvas
No narrow centered columns or artificial 700px page limits. Tables, data sets, architectural diagrams, and wide code blocks breathe naturally across your entire widescreen monitor.

### 🚫 Zero Distractions (No Left Sidebar)
No file tree trees, outline drawers, or activity bars competing for your attention. When you open a file, your content is the only thing on screen.

### 🔄 Three Synchronized Viewing Modes (`Ctrl + E`)
- **Edit Mode:** Full-width raw monospace editor with 2-space tab indentation.
- **Split Mode:** Side-by-side editor and live preview with proportional bidirectional synchronized scrolling.
- **Preview Mode:** Beautiful, clean GitHub Flavored Markdown (GFM) formatting with styled tables, task checklists, and syntax-highlighted code blocks.

### 📑 Browser-Style Tabs
- Seamlessly manage multiple open Markdown files.
- Drag-and-drop tabs to reorder.
- Double-click any tab (or press `F2`) to rename directly on disk.
- Unsaved changes indicators (amber dot).
- Smooth horizontal mouse-wheel scrolling across the tab strip.

### 🛡️ Smart Data Protection
- **Unsaved Changes Guard:** Prevents accidental data loss when closing tabs or quitting the app with prompts to Save, Discard, or Cancel.
- **External File Sync:** Detects when an open file is modified on disk (by Git, scripts, or terminal editors) and reloads cleanly.

### 🔒 100% Offline & Private
- Zero cloud sync dependencies.
- Zero analytics, telemetry, or tracking.
- Fast offline Markdown parsing with zero external network requests.

### ⚡ Ultra-Lightweight & Fast
Built with Tauri v2 and native WebKitGTK. Starts up instantly and uses only **~35 MB of RAM** — over **10x lighter** than typical Electron-based Markdown apps.

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + N`** | Open a new blank Markdown tab |
| **`Ctrl + O`** | Open local file(s) via native file chooser |
| **`Ctrl + S`** | Save active tab to disk |
| **`Ctrl + Shift + S`** | Save As to a new file location |
| **`Ctrl + E`** | Cycle viewing mode (`Edit` → `Split` → `Preview`) |
| **`Ctrl + W`** | Close active tab (prompts if unsaved changes exist) |
| **`Ctrl + Tab`** / **`Ctrl + Shift + Tab`** | Switch to next / previous open tab |
| **`F2`** | Rename active tab inline on disk |
| **`Tab`** | Insert 2 spaces without losing editor focus |

---

## 💻 Terminal & File Manager Integration

Launch `adwaid-view` directly from your command line to open single or multiple Markdown documents:

```bash
# Open one or multiple files
adwaid-view README.md notes.md ~/Documents/meeting.md
```

Right-clicking any `.md`, `.markdown`, or `.txt` file in your desktop file manager (GNOME Files, KDE Dolphin, Thunar) allows you to select **"Open with adwaid-view"**.

---

<details>
<summary><strong>🛠️ For Developers & Building from Source</strong></summary>

<br />

If you wish to compile `adwaid-view` from source:

1. **Install Build Dependencies (Fedora):**
   ```bash
   sudo dnf install -y webkit2gtk4.1-devel librsvg2-devel libappindicator-gtk3-devel @development-tools
   ```
2. **Development Mode:**
   ```bash
   cargo tauri dev
   ```
3. **Build Native Binary & RPM Package:**
   ```bash
   cargo tauri build --bundles rpm
   ```

For detailed IPC commands, internal state schema, and architecture specifications, see [`architecture.md`](./architecture.md).

</details>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for the Linux desktop community.
