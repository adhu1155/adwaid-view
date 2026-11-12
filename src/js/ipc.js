// =============================================================================
// adwaid-view IPC Layer
// Interfacing with Tauri v2 Rust Backend & Native Linux Dialogs
// =============================================================================

function isTauri() {
  return typeof window !== 'undefined' && Boolean(window.__TAURI__?.core?.invoke);
}

/**
 * Invoke a Rust command registered in Tauri
 */
async function invoke(cmd, args = {}) {
  if (isTauri()) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  console.warn(`[IPC fallback] ${cmd}`, args);
  throw new Error('Tauri IPC not available');
}

/**
 * Read UTF-8 Markdown file from Linux disk
 * @param {string} path Absolute Linux file path
 * @returns {Promise<{ path: string, title: string, content: string }>}
 */
export async function readMarkdownFile(path) {
  return await invoke('read_markdown_file', { path });
}

/**
 * Atomically write UTF-8 Markdown file to Linux disk
 * @param {string} path Absolute Linux file path
 * @param {string} content Markdown file content
 * @returns {Promise<number>} New mtime timestamp (seconds)
 */
export async function writeMarkdownFile(path, content) {
  return await invoke('write_markdown_file', { path, content });
}

/**
 * Get file modification time on Linux disk
 * @param {string} path Absolute Linux file path
 * @returns {Promise<number>} File mtime timestamp (seconds)
 */
export async function getFileMtime(path) {
  return await invoke('get_file_mtime', { path });
}

/**
 * Rename Markdown file on disk in same parent directory
 * @param {string} oldPath Old absolute Linux path
 * @param {string} newName New file name (e.g. "notes-v2.md")
 * @returns {Promise<string>} New absolute file path
 */
export async function renameMarkdownFile(oldPath, newName) {
  return await invoke('rename_markdown_file', { oldPath, newName });
}

/**
 * Retrieve any Markdown file paths passed via CLI argument
 * e.g.: `adwaid-view ~/notes.md`
 * @returns {Promise<string[]>}
 */
export async function getCliFileArgs() {
  if (!isTauri()) return [];
  try {
    return await invoke('get_cli_file_args');
  } catch (err) {
    console.error('Failed to get CLI file args:', err);
    return [];
  }
}

/**
 * Open native Linux file picker via XDG Desktop Portal
 * @param {boolean} multiple Allow multiple file selection
 * @returns {Promise<string[] | string | null>}
 */
export async function openFileDialog({ multiple = true } = {}) {
  if (window.__TAURI__?.dialog?.open) {
    return await window.__TAURI__.dialog.open({
      multiple,
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] }]
    });
  }
  // Standalone web fallback
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt,text/markdown,text/plain';
    input.multiple = multiple;
    input.onchange = (e) => {
      resolve(e.target.files);
    };
    input.click();
  });
}

/**
 * Open native Linux Save As file picker via XDG Desktop Portal
 * @param {string} defaultName Suggested filename
 * @returns {Promise<string | null>}
 */
export async function saveFileDialog(defaultName = 'untitled.md') {
  if (window.__TAURI__?.dialog?.save) {
    return await window.__TAURI__.dialog.save({
      defaultPath: defaultName,
      filters: [{ name: 'Markdown File', extensions: ['md', 'markdown', 'txt'] }]
    });
  }
  return null;
}

/**
 * Window Controls for frameless window
 */
export async function minimizeWindow() {
  if (window.__TAURI__?.window?.getCurrentWindow) {
    return await window.__TAURI__.window.getCurrentWindow().minimize();
  }
}

export async function toggleMaximizeWindow() {
  if (window.__TAURI__?.window?.getCurrentWindow) {
    return await window.__TAURI__.window.getCurrentWindow().toggleMaximize();
  }
}

export async function closeWindow() {
  if (window.__TAURI__?.window?.getCurrentWindow) {
    return await window.__TAURI__.window.getCurrentWindow().close();
  }
}
