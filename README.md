<div align="center">
  <img src="./src-tauri/icons/128x128.png" alt="adwaid-view logo" width="96" height="96" />
  <h1>adwaid-view</h1>
  <p><strong>A distraction-free, full-width desktop Markdown viewer and editor for Linux.</strong></p>

  [![Latest Release](https://img.shields.io/github/v/release/adhu1155/adwaid-view?color=blue&label=Release&logo=github)](https://github.com/adhu1155/adwaid-view/releases/latest)
  [![Platform](https://img.shields.io/badge/Platform-Linux%20(Wayland%20%26%20X11)-informational?logo=linux)](https://github.com/adhu1155/adwaid-view/releases/latest)
  [![Memory Footprint](https://img.shields.io/badge/Memory-~35%20MB%20RAM-brightgreen)](https://github.com/adhu1155/adwaid-view)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## The Story Behind adwaid-view

A lot of my work happens in Markdown files. Project notes, documentation, ideas, things I want to remember. Over time, I found myself opening `.md` files more often than almost anything else.

At some point, I wanted a simple Linux app to read and edit them. I tried a few, but nothing quite felt right. Some offered far more than I needed, while others made the simplest thing, reading a document, feel like an afterthought.

So I decided to build one myself.

That's how **adwaid-view** came to life. I wanted a comfortable, full-width reading experience, a simple editor, browser-style tabs and the freedom to switch between Preview, Edit and Split modes without getting lost in menus or settings.

No accounts, no cloud dependencies, no unnecessary complexity. Just a little application built around something I use every day.

**Use Markdown on Linux? Give adwaid-view a try!** Check out the project on [GitHub](https://github.com/adhu1155/adwaid-view), explore it, and let me know what you think. Suggestions, feedback and contributions are always welcome. I'd love to make this better with the community.

---

## Core Experience

- **100% Full-Width Canvas:** No artificial 700px margins or sidebar drawers. Tables, code blocks, and architectural notes breathe across your entire display.
- **Preview-First Reading:** Opens existing Markdown files directly in a clean GitHub Flavored Markdown (GFM) presentation, switching effortlessly between Edit, Split, and Preview modes (`Ctrl + E`).
- **Tabbed Workflow:** Familiar browser-style tabs for seamless multi-document editing without the overhead of project vaults or workspaces.
- **Native & Featherlight:** Native WebKitGTK and Tauri v2 integration on Wayland and X11, launching in milliseconds with an ultra-low **~35 MB RAM** footprint.
- **Private & Local:** Works entirely offline. Your documents live exclusively on your filesystem with zero telemetry or background network calls.

---

## ⚡ Installation

Ready-to-use packages are available for 64-bit Linux — no compilation required.

### Fedora / RHEL / AlmaLinux
Install the native RPM package with a single command:
```bash
sudo dnf install https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-0.1.0-1.x86_64.rpm
```
*(To update later: `sudo dnf reinstall https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-0.1.0-1.x86_64.rpm`)*

### Ubuntu / Debian / Linux Mint / Pop!_OS
```bash
# Ensure WebKitGTK runtime is present
sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-0 librsvg2-common

# Download and run portable binary
wget https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-v0.1.0-x86_64.tar.gz
tar -xzf adwaid-view-v0.1.0-x86_64.tar.gz
./adwaid-view
```

### Arch Linux / Manjaro
```bash
sudo pacman -S --needed webkit2gtk-4.1 librsvg
curl -sL https://github.com/adhu1155/adwaid-view/releases/download/v0.1.0/adwaid-view-v0.1.0-x86_64.tar.gz | tar -xz
./adwaid-view
```

### Portable Binary (Any 64-bit Linux)
Download **`adwaid-view-v0.1.0-x86_64.tar.gz`** from [Releases](https://github.com/adhu1155/adwaid-view/releases/latest), extract, and execute `./adwaid-view`.

---

## ⌨️ Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + N`** | New document tab |
| **`Ctrl + O`** | Open local Markdown file(s) |
| **`Ctrl + S`** | Save active document |
| **`Ctrl + Shift + S`** | Save As new file |
| **`Ctrl + E`** | Cycle view (`Preview` → `Edit` → `Split`) |
| **`Ctrl + W`** | Close tab |
| **`Ctrl + Tab`** | Next tab |
| **`F2`** | Rename active tab inline |

---

## 💻 CLI & Desktop Integration

Open any file directly from your terminal:
```bash
adwaid-view notes.md architecture.md
```

`adwaid-view` registers as a system MIME handler for `.md`, `.markdown`, and `.txt` files — right-click any Markdown document in GNOME Files, KDE Dolphin, or Thunar and select **"Open with adwaid-view"**.

---

## Community & Feedback

Found a bug, have an idea, or want to contribute?
- **Issues & Suggestions:** [Open an Issue](https://github.com/adhu1155/adwaid-view/issues)
- **License:** Open source under the [MIT License](LICENSE).
