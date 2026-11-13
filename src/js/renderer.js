// =============================================================================
// adwaid-view Markdown Renderer & Split Resizer
// =============================================================================

/**
 * Initialize marked.js with GitHub Flavored Markdown and line breaks
 */
export function initMarkdownRenderer() {
  if (typeof window.marked !== 'undefined') {
    window.marked.setOptions({
      gfm: true,
      breaks: true
    });
  }
}

/**
 * Render Markdown content into a container element
 * @param {HTMLElement} container
 * @param {string} markdown
 */
export function renderMarkdown(container, markdown = '') {
  if (!container) return;
  if (typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function') {
    container.innerHTML = window.marked.parse(markdown);
  } else {
    container.textContent = markdown;
  }
}

/**
 * Setup split-pane drag resizing between editor and preview
 * @param {Object} options
 * @param {HTMLElement} options.workspaceEl
 * @param {HTMLElement} options.editorPaneEl
 * @param {HTMLElement} options.previewPaneEl
 * @param {HTMLElement} options.resizerEl
 * @param {Function} options.onResize
 */
export function setupSplitResizer({ workspaceEl, editorPaneEl, previewPaneEl, resizerEl, onResize }) {
  let isDragging = false;

  resizerEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    resizerEl.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = workspaceEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = Math.max(20, Math.min(80, (offsetX / rect.width) * 100));

    editorPaneEl.style.width = `${percent}%`;
    previewPaneEl.style.width = `${100 - percent}%`;

    if (onResize) onResize(percent);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      resizerEl.classList.remove('dragging');
      document.body.style.cursor = '';
    }
  });
}

/**
 * Setup proportional synchronized scrolling between editor and preview in Split mode
 * @param {Object} options
 * @param {HTMLTextAreaElement} options.editorEl
 * @param {HTMLElement} options.previewEl
 * @param {() => boolean} options.isSplitMode
 */
export function setupScrollSync({ editorEl, previewEl, isSplitMode }) {
  let activePane = null; // 'editor' | 'preview'
  let editorRaf = null;
  let previewRaf = null;

  // Latch the active pane on pointer/wheel interaction to prevent feedback loops
  editorEl.addEventListener('mouseenter', () => { activePane = 'editor'; }, { passive: true });
  editorEl.addEventListener('mousemove', () => { activePane = 'editor'; }, { passive: true });
  editorEl.addEventListener('focus', () => { activePane = 'editor'; }, { passive: true });
  editorEl.addEventListener('touchstart', () => { activePane = 'editor'; }, { passive: true });

  previewEl.addEventListener('mouseenter', () => { activePane = 'preview'; }, { passive: true });
  previewEl.addEventListener('mousemove', () => { activePane = 'preview'; }, { passive: true });
  previewEl.addEventListener('touchstart', () => { activePane = 'preview'; }, { passive: true });

  editorEl.addEventListener(
    'scroll',
    () => {
      if (!isSplitMode()) return;
      if (activePane && activePane !== 'editor') return;

      if (editorRaf) cancelAnimationFrame(editorRaf);
      editorRaf = requestAnimationFrame(() => {
        const editorScrollable = editorEl.scrollHeight - editorEl.clientHeight;
        if (editorScrollable > 0) {
          const ratio = editorEl.scrollTop / editorScrollable;
          const previewScrollable = previewEl.scrollHeight - previewEl.clientHeight;
          previewEl.scrollTop = ratio * previewScrollable;
        }
      });
    },
    { passive: true }
  );

  previewEl.addEventListener(
    'scroll',
    () => {
      if (!isSplitMode()) return;
      if (activePane && activePane !== 'preview') return;

      if (previewRaf) cancelAnimationFrame(previewRaf);
      previewRaf = requestAnimationFrame(() => {
        const previewScrollable = previewEl.scrollHeight - previewEl.clientHeight;
        if (previewScrollable > 0) {
          const ratio = previewEl.scrollTop / previewScrollable;
          const editorScrollable = editorEl.scrollHeight - editorEl.clientHeight;
          editorEl.scrollTop = ratio * editorScrollable;
        }
      });
    },
    { passive: true }
  );
}
