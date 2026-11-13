// =============================================================================
// adwaid-view Application Core
// Single source of truth for frontend state, tabs, mode, and shortcuts
// =============================================================================

import {
  readMarkdownFile,
  writeMarkdownFile,
  renameMarkdownFile,
  getFileMtime,
  getCliFileArgs,
  openFileDialog,
  saveFileDialog,
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow
} from './ipc.js';

import {
  initMarkdownRenderer,
  renderMarkdown,
  setupSplitResizer,
  setupScrollSync
} from './renderer.js';

// =============================================================================
// 1. APPLICATION STATE
// =============================================================================
const state = {
  docs: [
    {
      id: 'doc-' + Date.now(),
      title: 'untitled-1.md',
      filePath: null,
      mtime: 0,
      content: '# untitled-1\n\n',
      dirty: false
    }
  ],
  activeId: null,
  mode: 'edit', // 'edit' | 'split' | 'preview'
  theme: localStorage.getItem('adwaid-theme') || 'dark',
  splitRatio: 50,
  renamingId: null,
  untitledCounter: 1
};

state.activeId = state.docs[0].id;

// =============================================================================
// 2. DOM REFERENCES
// =============================================================================
const htmlEl = document.documentElement;
const titlebarActiveFile = document.getElementById('titlebar-active-file');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');
const themeLabel = document.getElementById('theme-label');

const winMinBtn = document.getElementById('window-minimize-btn');
const winMaxBtn = document.getElementById('window-maximize-btn');
const winCloseBtn = document.getElementById('window-close-btn');

const fileMenuBtn = document.getElementById('file-menu-btn');
const fileDropdown = document.getElementById('file-dropdown');
const newFileBtn = document.getElementById('new-file-btn');
const modeMenuBtn = document.getElementById('mode-menu-btn');
const modeDropdown = document.getElementById('mode-dropdown');
const modeCurrentLabel = document.getElementById('mode-current-label');

const tabBar = document.getElementById('tab-bar');
const workspace = document.getElementById('workspace');
const editorPane = document.getElementById('editor-pane');
const previewPane = document.getElementById('preview-pane');
const splitResizer = document.getElementById('split-resizer');
const editorEl = document.getElementById('markdown-editor');
const previewEl = document.getElementById('markdown-preview');

const cursorStatsEl = document.getElementById('cursor-stats');
const wordStatsEl = document.getElementById('word-stats');
const saveStatusDot = document.getElementById('save-status-dot');
const saveStatusText = document.getElementById('save-status-text');
const toastEl = document.getElementById('toast');

// Modal DOM References
const confirmModal = document.getElementById('confirm-modal');
const confirmMsg = document.getElementById('confirm-message');
const confirmSaveBtn = document.getElementById('confirm-save-btn');
const confirmDiscardBtn = document.getElementById('confirm-discard-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

// =============================================================================
// 3. TOAST & STATS HELPERS
// =============================================================================
let toastTimeout = null;
export function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('opacity-0', 'translate-y-2');
  toastEl.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('opacity-100', 'translate-y-0');
    toastEl.classList.add('opacity-0', 'translate-y-2');
  }, 2200);
}

function getActiveDoc() {
  return state.docs.find((d) => d.id === state.activeId) || state.docs[0];
}

function updateStats() {
  const text = editorEl.value || '';
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  wordStatsEl.textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}`;

  const cursorPos = editorEl.selectionStart || 0;
  const textBefore = text.slice(0, cursorPos);
  const lines = textBefore.split('\n');
  const lineNum = lines.length;
  const colNum = lines[lines.length - 1].length + 1;
  cursorStatsEl.textContent = `Ln ${lineNum}, Col ${colNum}`;
}

function updateSaveIndicator(doc) {
  if (!doc) return;
  if (doc.dirty) {
    saveStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
    saveStatusText.textContent = 'Unsaved';
  } else {
    saveStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
    saveStatusText.textContent = 'Saved';
  }
}

// =============================================================================
// 4. TAB RENDERING & DRAG-AND-DROP REORDERING
// =============================================================================
function renderTabs() {
  tabBar.innerHTML = '';

  state.docs.forEach((doc) => {
    const isActive = doc.id === state.activeId;
    const tab = document.createElement('div');
    tab.className = `browser-tab px-3 flex items-center gap-2 text-[12.5px] max-w-[210px] ${isActive ? 'active' : ''}`;
    tab.title = `${doc.title} (Double-click to rename, drag to reorder)`;
    tab.draggable = true;
    tab.dataset.tabId = doc.id;

    // Drag-and-drop tab reordering
    tab.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', doc.id);
      e.dataTransfer.effectAllowed = 'move';
      tab.classList.add('opacity-60');
    });

    tab.addEventListener('dragend', () => {
      tab.classList.remove('opacity-60');
    });

    tab.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    tab.addEventListener('drop', (e) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== doc.id) {
        const sourceIdx = state.docs.findIndex((d) => d.id === sourceId);
        const targetIdx = state.docs.findIndex((d) => d.id === doc.id);
        if (sourceIdx !== -1 && targetIdx !== -1) {
          const [moved] = state.docs.splice(sourceIdx, 1);
          state.docs.splice(targetIdx, 0, moved);
          renderTabs();
        }
      }
    });

    // File icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'shrink-0 opacity-65';
    iconSpan.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.5 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9.5 2z"/>
        <path d="M9.5 2v3.5H13"/>
      </svg>
    `;
    tab.appendChild(iconSpan);

    // Tab Title / Rename Input
    if (state.renamingId === doc.id) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = doc.title;
      input.className = 'w-28 px-1 py-0.5 text-[12.5px] rounded outline-none border';
      input.style.backgroundColor = 'var(--bg-surface)';
      input.style.color = 'var(--text-primary)';
      input.style.borderColor = 'var(--accent)';

      const commitRename = async () => {
        let nextName = input.value.trim();
        if (nextName) {
          if (!nextName.includes('.')) nextName += '.md';
          if (doc.filePath) {
            try {
              const newPath = await renameMarkdownFile(doc.filePath, nextName);
              doc.filePath = newPath;
              doc.title = nextName;
              showToast(`Renamed to ${nextName}`);
            } catch (err) {
              console.error('Rename error:', err);
              showToast(`Rename failed: ${err}`);
            }
          } else {
            doc.title = nextName;
          }
        }
        state.renamingId = null;
        renderTabs();
        syncActiveDocumentUI();
      };

      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') {
          state.renamingId = null;
          renderTabs();
        }
      });
      input.addEventListener('blur', commitRename);
      tab.appendChild(input);

      setTimeout(() => {
        input.focus();
        const dotIndex = input.value.lastIndexOf('.');
        input.setSelectionRange(0, dotIndex > 0 ? dotIndex : input.value.length);
      }, 10);
    } else {
      const titleSpan = document.createElement('span');
      titleSpan.className = 'truncate';
      titleSpan.textContent = doc.title;
      tab.appendChild(titleSpan);
    }

    // Unsaved dot
    if (doc.dirty) {
      const dot = document.createElement('span');
      dot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0';
      dot.title = 'Unsaved changes';
      tab.appendChild(dot);
    }

    // Close button (×)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn w-4 h-4 flex items-center justify-center shrink-0 ml-0.5';
    closeBtn.title = 'Close Tab';
    closeBtn.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M3 3l6 6M9 3l-6 6"/>
      </svg>
    `;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(doc.id);
    });
    tab.appendChild(closeBtn);

    // Tab Click
    tab.addEventListener('click', () => {
      if (state.activeId !== doc.id) {
        state.activeId = doc.id;
        renderTabs();
        syncActiveDocumentUI();
      }
    });

    // Double-click to rename
    tab.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      state.renamingId = doc.id;
      renderTabs();
    });

    tabBar.appendChild(tab);
  });

  // Browser style '+' button
  const addTabBtn = document.createElement('button');
  addTabBtn.className = 'menu-btn w-7 h-7 mb-0.5 ml-0.5 flex items-center justify-center shrink-0';
  addTabBtn.title = 'New Tab (Ctrl+N)';
  addTabBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M8 3.5v9M3.5 8h9"/>
    </svg>
  `;
  addTabBtn.addEventListener('click', createNewTab);
  tabBar.appendChild(addTabBtn);
}

// Mouse-wheel horizontal scrolling on tab strip
tabBar?.addEventListener(
  'wheel',
  (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      tabBar.scrollLeft += e.deltaY;
    }
  },
  { passive: false }
);

function syncActiveDocumentUI() {
  const doc = getActiveDoc();
  if (!doc) return;
  titlebarActiveFile.textContent = `— ${doc.title}`;
  editorEl.value = doc.content;
  updateStats();
  updateSaveIndicator(doc);
  if (state.mode === 'split' || state.mode === 'preview') {
    renderMarkdown(previewEl, doc.content);
  }
}

// =============================================================================
// 5. MODE SWITCHING
// =============================================================================
export function setMode(newMode) {
  state.mode = newMode;
  const labels = { edit: 'Edit', split: 'Split', preview: 'Preview' };
  modeCurrentLabel.textContent = labels[newMode];

  if (newMode === 'edit') {
    editorPane.classList.remove('hidden');
    editorPane.style.width = '100%';
    splitResizer.classList.add('hidden');
    previewPane.classList.add('hidden');
    editorEl.focus();
  } else if (newMode === 'split') {
    editorPane.classList.remove('hidden');
    splitResizer.classList.remove('hidden');
    previewPane.classList.remove('hidden');
    editorPane.style.width = `${state.splitRatio}%`;
    previewPane.style.width = `${100 - state.splitRatio}%`;
    renderMarkdown(previewEl, editorEl.value);
  } else if (newMode === 'preview') {
    editorPane.classList.add('hidden');
    splitResizer.classList.add('hidden');
    previewPane.classList.remove('hidden');
    previewPane.style.width = '100%';
    renderMarkdown(previewEl, editorEl.value);
  }

  document.querySelectorAll('.mode-option').forEach((btn) => {
    const check = btn.querySelector('.mode-check');
    if (btn.dataset.mode === newMode) {
      check.classList.remove('opacity-0');
    } else {
      check.classList.add('opacity-0');
    }
  });
}

export function cycleMode() {
  const order = ['edit', 'split', 'preview'];
  const next = order[(order.indexOf(state.mode) + 1) % order.length];
  setMode(next);
  showToast(`Mode: ${next.charAt(0).toUpperCase() + next.slice(1)}`);
}

// =============================================================================
// 6. UNSAVED CHANGES GUARD & DOCUMENT LIFECYCLE
// =============================================================================
function promptUnsavedChanges(doc) {
  return new Promise((resolve) => {
    if (!confirmModal) {
      const proceed = window.confirm(`Save changes to "${doc.title}" before closing?`);
      return resolve(proceed ? 'save' : 'discard');
    }

    confirmMsg.textContent = `Do you want to save the changes to "${doc.title}" before closing?`;
    confirmModal.classList.remove('hidden');

    const cleanup = () => {
      confirmModal.classList.add('hidden');
      confirmSaveBtn.removeEventListener('click', onSave);
      confirmDiscardBtn.removeEventListener('click', onDiscard);
      confirmCancelBtn.removeEventListener('click', onCancel);
    };

    const onSave = () => {
      cleanup();
      resolve('save');
    };
    const onDiscard = () => {
      cleanup();
      resolve('discard');
    };
    const onCancel = () => {
      cleanup();
      resolve('cancel');
    };

    confirmSaveBtn.addEventListener('click', onSave);
    confirmDiscardBtn.addEventListener('click', onDiscard);
    confirmCancelBtn.addEventListener('click', onCancel);
  });
}

export function createNewTab() {
  const id = 'doc-' + Date.now();
  state.untitledCounter++;
  const title = `untitled-${state.untitledCounter}.md`;
  state.docs.push({
    id,
    title,
    filePath: null,
    mtime: 0,
    dirty: false,
    content: `# ${title.replace('.md', '')}\n\n`
  });
  state.activeId = id;
  renderTabs();
  syncActiveDocumentUI();
  if (state.mode === 'preview') setMode('edit');
  editorEl.focus();
  editorEl.setSelectionRange(editorEl.value.length, editorEl.value.length);
}

export async function closeTab(id) {
  const doc = state.docs.find((d) => d.id === id);
  if (!doc) return;

  if (doc.dirty) {
    const action = await promptUnsavedChanges(doc);
    if (action === 'cancel') return;
    if (action === 'save') {
      state.activeId = id;
      syncActiveDocumentUI();
      await saveFileAction(false);
      if (doc.dirty) {
        // Save was cancelled or failed; abort closing
        return;
      }
    }
  }

  const idx = state.docs.findIndex((d) => d.id === id);
  if (idx === -1) return;

  state.docs.splice(idx, 1);

  if (state.docs.length === 0) {
    state.untitledCounter = 0;
    createNewTab();
    return;
  }

  if (state.activeId === id) {
    const nextDoc = state.docs[Math.min(idx, state.docs.length - 1)];
    state.activeId = nextDoc.id;
  }

  renderTabs();
  syncActiveDocumentUI();
}

export async function openFileAction() {
  try {
    const selected = await openFileDialog({ multiple: true });
    if (!selected) return;

    const paths = Array.isArray(selected) ? selected : [selected];
    const hadSingleUntouchedTab =
      state.docs.length === 1 &&
      !state.docs[0].filePath &&
      !state.docs[0].dirty &&
      state.docs[0].content === '# untitled-1\n\n';

    let openedAny = false;
    for (const item of paths) {
      if (typeof item === 'string') {
        const existing = state.docs.find((d) => d.filePath === item);
        if (existing) {
          state.activeId = existing.id;
          openedAny = true;
          continue;
        }
        const filePayload = await readMarkdownFile(item);
        const id = 'doc-' + Date.now() + Math.random().toString(36).substring(2, 6);
        state.docs.push({
          id,
          title: filePayload.title,
          filePath: filePayload.path,
          mtime: filePayload.mtime || 0,
          dirty: false,
          content: filePayload.content
        });
        state.activeId = id;
        openedAny = true;
      } else if (item instanceof File) {
        // Browser fallback
        const content = await item.text();
        const id = 'doc-' + Date.now();
        state.docs.push({
          id,
          title: item.name,
          filePath: item.path || null,
          mtime: 0,
          dirty: false,
          content
        });
        state.activeId = id;
        openedAny = true;
      }
    }

    if (hadSingleUntouchedTab && openedAny && state.docs.length > 1) {
      state.docs.shift();
    }

    renderTabs();
    syncActiveDocumentUI();
    if (openedAny) {
      setMode('preview');
    }
    showToast('File(s) opened');
  } catch (err) {
    console.error('Open file error:', err);
    showToast(`Open failed: ${err}`);
  }
}

export function exportPdfAction() {
  const doc = getActiveDoc();
  if (!doc) return;
  renderMarkdown(previewEl, doc.content);
  window.print();
}

export async function saveFileAction(forceSaveAs = false) {
  const doc = getActiveDoc();
  if (!doc) return;

  let targetPath = doc.filePath;

  if (!targetPath || forceSaveAs) {
    try {
      const chosen = await saveFileDialog(doc.title || 'untitled.md');
      if (!chosen) return; // User cancelled
      targetPath = chosen;
      doc.filePath = targetPath;
      const parts = targetPath.split(/[/\\]/);
      doc.title = parts[parts.length - 1] || doc.title;
    } catch (err) {
      console.error('Save dialog error:', err);
      // Web fallback download
      const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.title || 'document.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      doc.dirty = false;
      renderTabs();
      updateSaveIndicator(doc);
      showToast(`Downloaded ${doc.title}`);
      return;
    }
  }

  try {
    const newMtime = await writeMarkdownFile(targetPath, doc.content);
    doc.mtime = newMtime;
    doc.dirty = false;
    renderTabs();
    syncActiveDocumentUI();
    showToast(`Saved ${doc.title}`);
  } catch (err) {
    console.error('Write file error:', err);
    showToast(`Save failed: ${err}`);
  }
}

// =============================================================================
// 7. THEME TOGGLE
// =============================================================================
function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('adwaid-theme', theme);
  if (theme === 'dark') {
    htmlEl.classList.add('dark');
    iconSun.classList.remove('hidden');
    iconMoon.classList.add('hidden');
    themeLabel.textContent = 'Light';
  } else {
    htmlEl.classList.remove('dark');
    iconSun.classList.add('hidden');
    iconMoon.classList.remove('hidden');
    themeLabel.textContent = 'Dark';
  }
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
}

// =============================================================================
// 8. EVENT LISTENERS & SHORTCUTS
// =============================================================================
function closeAllDropdowns() {
  fileDropdown?.classList.add('hidden');
  modeDropdown?.classList.add('hidden');
  fileMenuBtn?.classList.remove('active');
  modeMenuBtn?.classList.remove('active');
}

fileMenuBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = fileDropdown.classList.contains('hidden');
  closeAllDropdowns();
  if (isHidden) {
    fileDropdown.classList.remove('hidden');
    fileMenuBtn.classList.add('active');
  }
});

modeMenuBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = modeDropdown.classList.contains('hidden');
  closeAllDropdowns();
  if (isHidden) {
    modeDropdown.classList.remove('hidden');
    modeMenuBtn.classList.add('active');
  }
});

document.addEventListener('click', closeAllDropdowns);

document.getElementById('menu-open-file')?.addEventListener('click', () => {
  closeAllDropdowns();
  openFileAction();
});

document.getElementById('menu-save-file')?.addEventListener('click', () => {
  closeAllDropdowns();
  saveFileAction(false);
});

document.getElementById('menu-save-as-file')?.addEventListener('click', () => {
  closeAllDropdowns();
  saveFileAction(true);
});

document.getElementById('menu-rename-file')?.addEventListener('click', () => {
  closeAllDropdowns();
  state.renamingId = state.activeId;
  renderTabs();
});

document.getElementById('menu-export-pdf')?.addEventListener('click', () => {
  closeAllDropdowns();
  exportPdfAction();
});

document.getElementById('menu-close-tab')?.addEventListener('click', () => {
  closeAllDropdowns();
  closeTab(state.activeId);
});

document.querySelectorAll('.mode-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    closeAllDropdowns();
    setMode(btn.dataset.mode);
  });
});

newFileBtn?.addEventListener('click', createNewTab);
themeToggleBtn?.addEventListener('click', toggleTheme);

// Frameless Window Controls
winMinBtn?.addEventListener('click', () => minimizeWindow());
winMaxBtn?.addEventListener('click', () => toggleMaximizeWindow());
winCloseBtn?.addEventListener('click', async () => {
  // Check if any tab is dirty
  const dirtyDocs = state.docs.filter((d) => d.dirty);
  if (dirtyDocs.length > 0) {
    const action = await promptUnsavedChanges(dirtyDocs[0]);
    if (action === 'cancel') return;
    if (action === 'save') {
      await saveFileAction(false);
    }
  }
  closeWindow();
});

// Editor Input & Tab Insertion
editorEl?.addEventListener('input', () => {
  const doc = getActiveDoc();
  if (!doc) return;
  doc.content = editorEl.value;
  if (!doc.dirty) {
    doc.dirty = true;
    renderTabs();
    updateSaveIndicator(doc);
  }
  updateStats();
  if (state.mode === 'split') {
    renderMarkdown(previewEl, doc.content);
  }
});

editorEl?.addEventListener('click', updateStats);
editorEl?.addEventListener('keyup', updateStats);

editorEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editorEl.selectionStart;
    const end = editorEl.selectionEnd;
    editorEl.value = editorEl.value.substring(0, start) + '  ' + editorEl.value.substring(end);
    editorEl.selectionStart = editorEl.selectionEnd = start + 2;
    editorEl.dispatchEvent(new Event('input'));
  }
});

// Global Shortcuts
window.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveFileAction(true);
  } else if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveFileAction(false);
  } else if (mod && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    openFileAction();
  } else if (mod && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    createNewTab();
  } else if (mod && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    cycleMode();
  } else if (mod && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    exportPdfAction();
  } else if (mod && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    closeTab(state.activeId);
  } else if (e.key === 'F2') {
    e.preventDefault();
    state.renamingId = state.activeId;
    renderTabs();
  } else if (mod && e.key === 'Tab') {
    e.preventDefault();
    const currentIndex = state.docs.findIndex((d) => d.id === state.activeId);
    if (currentIndex !== -1) {
      const step = e.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + step + state.docs.length) % state.docs.length;
      state.activeId = state.docs[nextIndex].id;
      renderTabs();
      syncActiveDocumentUI();
    }
  }
});

// Window focus external file change check
window.addEventListener('focus', async () => {
  for (const doc of state.docs) {
    if (doc.filePath) {
      try {
        const latestMtime = await getFileMtime(doc.filePath);
        if (doc.mtime && latestMtime > doc.mtime) {
          if (!doc.dirty) {
            const payload = await readMarkdownFile(doc.filePath);
            doc.content = payload.content;
            doc.mtime = payload.mtime || latestMtime;
            if (doc.id === state.activeId) {
              syncActiveDocumentUI();
            }
            showToast(`Reloaded ${doc.title} from disk`);
          } else {
            showToast(`${doc.title} was modified on disk`);
          }
        }
      } catch (err) {
        console.warn('External file watch check error:', err);
      }
    }
  }
});

// Window Drag & Drop for opening Markdown files from desktop
window.addEventListener('dragover', (e) => {
  if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
    e.preventDefault();
  }
});

window.addEventListener('drop', async (e) => {
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    if (e.target.closest('.tab-item')) return; // tab reordering handled separately
    e.preventDefault();

    const hadSingleUntouchedTab =
      state.docs.length === 1 &&
      !state.docs[0].filePath &&
      !state.docs[0].dirty &&
      state.docs[0].content === '# untitled-1\n\n';

    let openedAny = false;
    for (const file of e.dataTransfer.files) {
      if (file.path) {
        const existing = state.docs.find((d) => d.filePath === file.path);
        if (existing) {
          state.activeId = existing.id;
          openedAny = true;
          continue;
        }
        try {
          const filePayload = await readMarkdownFile(file.path);
          const id = 'doc-' + Date.now() + Math.random().toString(36).substring(2, 6);
          state.docs.push({
            id,
            title: filePayload.title,
            filePath: filePayload.path,
            mtime: filePayload.mtime || 0,
            dirty: false,
            content: filePayload.content
          });
          state.activeId = id;
          openedAny = true;
        } catch (err) {
          console.error(`Failed to read dropped file ${file.path}:`, err);
        }
      } else {
        const content = await file.text();
        const id = 'doc-' + Date.now();
        state.docs.push({
          id,
          title: file.name,
          filePath: null,
          mtime: 0,
          dirty: false,
          content
        });
        state.activeId = id;
        openedAny = true;
      }
    }

    if (hadSingleUntouchedTab && openedAny && state.docs.length > 1) {
      state.docs.shift();
    }

    if (openedAny) {
      renderTabs();
      syncActiveDocumentUI();
      setMode('preview');
      showToast('File(s) opened');
    }
  }
});

// =============================================================================
// 9. INITIALIZATION & CLI ARGS INSPECTION
// =============================================================================
async function init() {
  initMarkdownRenderer();
  applyTheme(state.theme);

  setupSplitResizer({
    workspaceEl: workspace,
    editorPaneEl: editorPane,
    previewPaneEl: previewPane,
    resizerEl: splitResizer,
    onResize: (percent) => {
      state.splitRatio = percent;
    }
  });

  setupScrollSync({
    editorEl,
    previewEl,
    isSplitMode: () => state.mode === 'split'
  });

  // Check CLI arguments for files passed on startup
  const cliArgs = await getCliFileArgs();
  let openedFromCli = false;
  if (cliArgs && cliArgs.length > 0) {
    state.docs = [];
    for (const filePath of cliArgs) {
      try {
        const filePayload = await readMarkdownFile(filePath);
        state.docs.push({
          id: 'doc-' + Date.now() + Math.random().toString(36).substring(2, 6),
          title: filePayload.title,
          filePath: filePayload.path,
          mtime: filePayload.mtime || 0,
          dirty: false,
          content: filePayload.content
        });
        openedFromCli = true;
      } catch (err) {
        console.error(`Failed to open CLI file ${filePath}:`, err);
      }
    }
    if (state.docs.length > 0) {
      state.activeId = state.docs[0].id;
    } else {
      createNewTab();
    }
  }

  renderTabs();
  syncActiveDocumentUI();
  if (openedFromCli) {
    setMode('preview');
  } else {
    setMode('edit');
  }
}

init();
