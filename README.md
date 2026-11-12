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

Markdown quietly became my default language for thought.

Not because anyone told me to, but because plain text just *works*. No proprietary formatting containers, no rigid word processors, no files that render unpredictably on someone else's machine. Over time, `.md` files became the home where I draft ideas, keep project notes, document systems, and think out loud.

Yet finding the right Linux tool to read and write those files was surprisingly frustrating.

On one side were the heavyweights — apps packed with complex sidebar trees, endless plugin settings, graph views, and background sync engines. Impressive pieces of software, but opening them just to read a document or capture a thought felt overwhelming. The tool quickly got in the way of the writing.

On the other side were bare-bones minimalist viewers. While lightweight, their interfaces often felt like an afterthought: clunky navigation, strained typography, or cramped narrow columns that suffocated wide tables and code blocks.

I didn't want an all-in-one workspace suite, nor did I want a crude text box. I wanted something that felt *just right*:
- A **full-width canvas** that gives 100% of your screen to your words, tables, and diagrams.
- A **reading view by default** when opening existing documents, with instant switching to edit or synchronized split view.
- Clean **browser-style tabs** to manage open documents without navigating complex project directories.
- A native desktop citizen built specifically for Linux that opens instantly and stays out of the way.

So I built **adwaid-view** — an editor and viewer crafted just the way I wanted it to be.

If that sounds like what you've been looking for, give it a spin, make it yours, and share your thoughts.

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
