/**
 * NoteBloom Application Controller
 * Manages state, views, text formatting toolbar, modals, and auto-saving.
 * Designed as a clean static single-page app (no hovering widget windows, no dragging/resizing).
 */

(function () {
  // Elements Cache
  let deskEl, dashboardEl, widgetEl, widgetHeaderEl, widgetTitleEl,
      editorEl, wordCounterEl, saveDotEl, saveTextEl, searchBarEl, notebookGridEl,
      settingsModalEl, toggleAutosaveEl, fontSelectEl, fontSizeSelectEl, textColorSelectEl, pageLayoutSelectEl;

  // App State
  let state = {
    notebooks: [],
    activeNotebook: null,
    searchQuery: '',
    isAutoSaveEnabled: true,
    currentTheme: 'lavender-dream',
    saveTimeout: null
  };

  // Calculator State
  let calcExpression = '';
  let calcInput = '0';
  let calcIsOff = false;

  // Cover design pools to assign randomly to new notebooks
  const COVER_CLASSES = ['cover-lavender', 'cover-pink', 'cover-violet', 'cover-emerald', 'cover-blue', 'cover-orange'];
  const CUTE_FLOWERS = ['🌸', '✨', '🌼', '🌷', '🌿', '🎀', '💜', '💖', '🧸', '🍧'];

  // Document Ready Initialization
  window.addEventListener('DOMContentLoaded', async () => {
    // Cache DOM Elements
    deskEl = document.getElementById('desk');
    dashboardEl = document.getElementById('dashboard');
    widgetEl = document.getElementById('notes-widget');
    widgetHeaderEl = document.getElementById('widget-header');
    widgetTitleEl = document.getElementById('widget-title');
    editorEl = document.getElementById('notes-editor');
    wordCounterEl = document.getElementById('word-counter');
    saveDotEl = document.getElementById('save-dot');
    saveTextEl = document.getElementById('save-text');
    searchBarEl = document.getElementById('search-bar');
    notebookGridEl = document.getElementById('notebook-grid');
    settingsModalEl = document.getElementById('settings-modal');
    toggleAutosaveEl = document.getElementById('toggle-autosave');
    fontSelectEl = document.getElementById('font-family');
    fontSizeSelectEl = document.getElementById('font-size');
    textColorSelectEl = document.getElementById('text-color');
    pageLayoutSelectEl = document.getElementById('page-layout');

    try {
      // 1. Init Database
      await window.NoteBloomDB.init();

      // 2. Load Global Settings
      const savedTheme = await window.NoteBloomDB.getSetting('theme', 'lavender-dream');
      const savedAutosave = await window.NoteBloomDB.getSetting('autosave', true);
      
      state.currentTheme = savedTheme;
      state.isAutoSaveEnabled = savedAutosave;

      // Apply Settings to DOM
      applyTheme(state.currentTheme);
      toggleAutosaveEl.checked = state.isAutoSaveEnabled;
      updateSaveStatusIndicator();

      // 3. Init Editor
      window.NoteBloomEditor.init(editorEl, wordCounterEl);

      // 4. Load Notebooks
      await refreshNotebooks();

      // 4.5. Initialize Retro Calculator
      initCalculator();

      // 5. Setup UI Event Listeners
      setupEventListeners();

    } catch (err) {
      console.error('Error during app initialization:', err);
    }
  });

  // --- Core Actions ---

  /**
   * Refreshes the notebook list from DB and re-renders the dashboard shelf.
   */
  async function refreshNotebooks() {
    state.notebooks = await window.NoteBloomDB.getAllNotebooks();
    renderNotebookShelf();
  }

  /**
   * Renders the notebook shelf based on list & search filtering.
   */
  function renderNotebookShelf() {
    // Clear all except the first "create notebook" card
    const cards = notebookGridEl.querySelectorAll('.notebook-card');
    cards.forEach(card => card.remove());

    const query = state.searchQuery.toLowerCase().trim();

    // Filter notebooks
    const filtered = state.notebooks.filter(nb => {
      if (!query) return true;
      const titleMatch = nb.name.toLowerCase().includes(query);
      
      // Strip HTML to search plain note content
      const plainText = (nb.content || '').replace(/<[^>]*>/g, ' ').toLowerCase();
      const contentMatch = plainText.includes(query);
      
      // Store flag for rendering indicator
      nb._searchContentMatch = !titleMatch && contentMatch;
      
      return titleMatch || contentMatch;
    });

    // Generate Notebook cards
    filtered.forEach(nb => {
      const card = document.createElement('div');
      card.className = 'notebook-card';
      card.dataset.id = nb.id;

      const dateStr = new Date(nb.lastEdited).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      card.innerHTML = `
        <div class="notebook-cover-wrapper ${nb.coverClass || 'cover-lavender'}">
          <div class="notebook-cover-flower">${nb.flowerIcon || '🌸'}</div>
          <div class="notebook-cover-label">${escapeHtml(nb.name)}</div>
        </div>
        <div class="notebook-info">
          <div class="notebook-name">${escapeHtml(nb.name)}</div>
          <div class="notebook-date">${dateStr}</div>
          ${nb._searchContentMatch ? '<div class="notebook-date" style="color: var(--primary); font-weight: 500;">Matches note content</div>' : ''}
          <div class="notebook-actions-row">
            <button class="btn-card-action btn-rename" title="Rename Notebook">Rename</button>
            <button class="btn-card-action btn-delete" title="Delete Notebook">Delete</button>
          </div>
        </div>
      `;

      // Card click event
      card.addEventListener('click', (e) => {
        // Prevent opening if clicking card action buttons
        if (e.target.closest('.notebook-actions-row')) return;
        openNotebook(nb.id);
      });

      // Rename Click
      card.querySelector('.btn-rename').addEventListener('click', (e) => {
        e.stopPropagation();
        renameNotebookPrompt(nb);
      });

      // Delete Click
      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNotebookPrompt(nb);
      });

      notebookGridEl.appendChild(card);
    });
  }

  /**
   * Triggers the opening of a notebook and switches to notes page view.
   */
  async function openNotebook(id) {
    const notebook = await window.NoteBloomDB.getNotebook(id);
    if (!notebook) return;

    state.activeNotebook = notebook;
    
    // Set text contents & style settings
    editorEl.innerHTML = notebook.content || '';
    
    // Ensure all saved image containers have draggable enabled and child images disabled
    editorEl.querySelectorAll('.resizable-image-container').forEach(container => {
      container.setAttribute('draggable', 'true');
      const img = container.querySelector('img');
      if (img) img.setAttribute('draggable', 'false');
    });

    applyPageStyle(notebook.pageStyle || 'blank');
    
    // Update toolbar configurations
    widgetTitleEl.innerText = notebook.name;
    pageLayoutSelectEl.value = notebook.pageStyle || 'blank';
    
    // Calculate word counter
    window.NoteBloomEditor.updateWordCount();

    // Toggle views (hide dashboard, show notes workspace)
    dashboardEl.classList.add('hidden');
    widgetEl.classList.remove('hidden');
    
    // Restore if minimized
    if (widgetEl.classList.contains('minimized')) {
      restoreWidget();
    }
  }

  /**
   * Closes the active notebook workspace and returns to Dashboard.
   */
  async function closeActiveNotebook() {
    if (state.activeNotebook) {
      // Force instant save before closing
      clearTimeout(state.saveTimeout);
      await saveActiveNotebookImmediately();
    }
    
    // Ensure we restore maximize state if closing
    if (deskEl.classList.contains('maximized')) {
      deskEl.classList.remove('maximized');
      widgetEl.classList.remove('maximized');
      const svgMax = document.getElementById('svg-max');
      const svgRestore = document.getElementById('svg-restore');
      if (svgMax) svgMax.classList.remove('hidden');
      if (svgRestore) svgRestore.classList.add('hidden');
    }
    
    widgetEl.classList.add('hidden');
    dashboardEl.classList.remove('hidden');
    state.activeNotebook = null;
    await refreshNotebooks();
  }

  /**
   * Auto-save debounce hook.
   */
  function triggerAutoSave() {
    if (!state.activeNotebook) return;
    
    updateSaveStatusIndicator('saving');

    // Debounce save request
    clearTimeout(state.saveTimeout);
    
    if (state.isAutoSaveEnabled) {
      state.saveTimeout = setTimeout(async () => {
        await saveActiveNotebookImmediately();
      }, 600); // 600ms debounce
    } else {
      updateSaveStatusIndicator('manual');
    }
  }

  /**
   * Saves active notebook content immediately to IndexedDB.
   */
  async function saveActiveNotebookImmediately() {
    if (!state.activeNotebook) return;

    state.activeNotebook.content = editorEl.innerHTML;
    state.activeNotebook.name = widgetTitleEl.innerText;
    
    try {
      await window.NoteBloomDB.saveNotebook(state.activeNotebook);
      updateSaveStatusIndicator('saved');
    } catch (err) {
      console.error('Error auto-saving:', err);
      updateSaveStatusIndicator('error');
    }
  }

  /**
   * Applies the Page Grid Styles (blank, ruled, grid, dots) to editor.
   */
  function applyPageStyle(styleName) {
    // Reset styles
    editorEl.classList.remove('style-blank', 'style-ruled', 'style-grid', 'style-dot-grid');
    editorEl.classList.add(`style-${styleName}`);
    
    if (state.activeNotebook) {
      state.activeNotebook.pageStyle = styleName;
      triggerAutoSave();
    }
  }

  /**
   * Applies global color theme class to document body.
   */
  function applyTheme(themeName) {
    document.body.className = ''; // Reset
    if (themeName !== 'lavender-dream') {
      document.body.classList.add(`theme-${themeName}`);
    }
    
    // Save to settings db
    window.NoteBloomDB.saveSetting('theme', themeName);

    // Update settings modal theme buttons
    const buttons = settingsModalEl.querySelectorAll('.theme-opt-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
  }

  // --- UI Prompts ---

  /**
   * Triggers the New Notebook Prompt modal.
   */
  function createNotebookPrompt() {
    showPrompt({
      title: 'Create Notebook',
      label: 'Notebook Name',
      placeholder: 'write anything you like ',
      value: '',
      onConfirm: async (name) => {
        const coverClass = COVER_CLASSES[Math.floor(Math.random() * COVER_CLASSES.length)];
        const flowerIcon = CUTE_FLOWERS[Math.floor(Math.random() * CUTE_FLOWERS.length)];

        const newNb = {
          name: name,
          content: '',
          pageStyle: 'blank',
          coverClass: coverClass,
          flowerIcon: flowerIcon
        };

        const id = await window.NoteBloomDB.saveNotebook(newNb);
        await refreshNotebooks();
        openNotebook(id); 
      }
    });
  }

 
  function renameNotebookPrompt(nb) {
    showPrompt({
      title: 'Rename Notebook',
      label: 'New Title',
      placeholder: nb.name,
      value: nb.name,
      onConfirm: async (newName) => {
        nb.name = newName;
        await window.NoteBloomDB.saveNotebook(nb);
        
        // If it's the active notebook, sync header
        if (state.activeNotebook && state.activeNotebook.id === nb.id) {
          widgetTitleEl.innerText = newName;
        }

        await refreshNotebooks();
      }
    });
  }

  /**
   * Triggers Deletion Confirmation Modal.
   */
  function deleteNotebookPrompt(nb) {
    showDeleteConfirm({
      notebookName: nb.name,
      onConfirm: async () => {
        await window.NoteBloomDB.deleteNotebook(nb.id);
        
        // If it was open, close it
        if (state.activeNotebook && state.activeNotebook.id === nb.id) {
          widgetEl.classList.add('hidden');
          dashboardEl.classList.remove('hidden');
          state.activeNotebook = null;
        }

        await refreshNotebooks();
      }
    });
  }

  // --- Widget Window States ---

  /**
   * Minimizes the notes workspace to a docked bottom status bar.
   */
  function minimizeWidget() {
    widgetEl.classList.add('minimized');
    widgetEl.classList.remove('maximized');
    deskEl.classList.remove('maximized'); // Ensure parent is not fullscreen
    dashboardEl.classList.remove('hidden'); // Show dashboard underneath
    
    const svgMax = document.getElementById('svg-max');
    const svgRestore = document.getElementById('svg-restore');
    if (svgMax) svgMax.classList.remove('hidden');
    if (svgRestore) svgRestore.classList.add('hidden');
  }

  /**
   * Restores minimized notes workspace to normal size.
   */
  function restoreWidget() {
    widgetEl.classList.remove('minimized');
    dashboardEl.classList.add('hidden'); // Hide dashboard
  }

  /**
   * Maximizes/restores the notes workspace viewport by toggling parent desk size.
   */
  function toggleMaximizeWidget() {
    if (widgetEl.classList.contains('minimized')) return;

    const isMax = deskEl.classList.toggle('maximized');
    widgetEl.classList.toggle('maximized', isMax);
    
    const svgMax = document.getElementById('svg-max');
    const svgRestore = document.getElementById('svg-restore');

    if (isMax) {
      if (svgMax) svgMax.classList.add('hidden');
      if (svgRestore) svgRestore.classList.remove('hidden');
    } else {
      if (svgMax) svgMax.classList.remove('hidden');
      if (svgRestore) svgRestore.classList.add('hidden');
    }
  }

  // --- Helper Layout Setups ---

  /**
   * Sets up all click event bindings.
   */
  function setupEventListeners() {
    // Prevent focus loss on toolbar button mousedown
    const preventFocusLoss = (btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
      }
    };
    preventFocusLoss('btn-bold');
    preventFocusLoss('btn-italic');
    preventFocusLoss('btn-underline');
    preventFocusLoss('btn-calculator');

    // 1. Dashboard Events
    document.getElementById('create-notebook-card').addEventListener('click', createNotebookPrompt);
    
    searchBarEl.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderNotebookShelf();
    });

    // 2. Navigation / Window Controls
    document.getElementById('btn-close').addEventListener('click', closeActiveNotebook);
    document.getElementById('btn-minimize').addEventListener('click', minimizeWidget);
    document.getElementById('btn-maximize').addEventListener('click', toggleMaximizeWidget);
    document.getElementById('btn-calculator').addEventListener('click', toggleCalculatorDrawer);

    // Global shortcut Ctrl+Alt+C to toggle calculator
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.code === 'KeyC') {
        e.preventDefault();
        toggleCalculatorDrawer();
      }
    });

    // Click on minimized header restores it
    widgetHeaderEl.addEventListener('click', (e) => {
      if (e.target.closest('#btn-close') || e.target.closest('#btn-minimize') || e.target.closest('#btn-maximize')) return;
      if (widgetEl.classList.contains('minimized')) {
        restoreWidget();
      }
    });

    // 3. Formatting Toolbar Actions
    fontSelectEl.addEventListener('change', (e) => {
      window.NoteBloomEditor.format('fontName', e.target.value);
      updateFormattingButtonStates();
    });

    fontSizeSelectEl.addEventListener('change', (e) => {
      window.NoteBloomEditor.format('fontSize', e.target.value);
      updateFormattingButtonStates();
    });

    document.getElementById('btn-bold').addEventListener('click', () => {
      window.NoteBloomEditor.format('bold');
      updateFormattingButtonStates();
    });

    document.getElementById('btn-italic').addEventListener('click', () => {
      window.NoteBloomEditor.format('italic');
      updateFormattingButtonStates();
    });

    document.getElementById('btn-underline').addEventListener('click', () => {
      window.NoteBloomEditor.format('underline');
      updateFormattingButtonStates();
    });

    // Static Dropdown Text Color Changes
    textColorSelectEl.addEventListener('change', (e) => {
      window.NoteBloomEditor.format('foreColor', e.target.value);
      updateFormattingButtonStates();
    });

    // Page Layout Dropdown Changes
    pageLayoutSelectEl.addEventListener('change', (e) => {
      applyPageStyle(e.target.value);
    });

    // Sync button styling indicators when selection changes in editor
    editorEl.addEventListener('click', updateFormattingButtonStates);
    editorEl.addEventListener('keyup', updateFormattingButtonStates);

    // Save changes when editor dispatches change event
    editorEl.addEventListener('editorChange', () => {
      triggerAutoSave();
    });

    // 4. Settings Modal Handlers
    document.getElementById('btn-settings').addEventListener('click', () => {
      settingsModalEl.classList.add('active');
    });

    document.getElementById('btn-settings-close').addEventListener('click', () => {
      settingsModalEl.classList.remove('active');
    });

    document.getElementById('btn-settings-save').addEventListener('click', () => {
      settingsModalEl.classList.remove('active');
    });

    // Theme selector options clicks
    const themeButtons = settingsModalEl.querySelectorAll('.theme-opt-btn');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        state.currentTheme = theme;
        applyTheme(theme);
      });
    });

    // Auto-save toggle switch check
    toggleAutosaveEl.addEventListener('change', (e) => {
      state.isAutoSaveEnabled = e.target.checked;
      window.NoteBloomDB.saveSetting('autosave', state.isAutoSaveEnabled);
      updateSaveStatusIndicator();
      if (state.isAutoSaveEnabled && state.activeNotebook) {
        triggerAutoSave();
      }
    });
  }

  /**
   * Query the formatting state of the text cursor selection to update button active classes.
   */
  function updateFormattingButtonStates() {
    try {
      // Bold state
      const isBold = document.queryCommandState('bold');
      document.getElementById('btn-bold').classList.toggle('active', isBold);

      // Italic state
      const isItalic = document.queryCommandState('italic');
      document.getElementById('btn-italic').classList.toggle('active', isItalic);

      // Underline state
      const isUnderline = document.queryCommandState('underline');
      document.getElementById('btn-underline').classList.toggle('active', isUnderline);

      // Select input values
      const fontVal = document.queryCommandValue('fontName');
      const activeFont = fontVal && typeof fontVal === 'string' ? fontVal.replace(/['"]/g, '') : '';
      if (activeFont) {
        for (let i = 0; i < fontSelectEl.options.length; i++) {
          const optVal = fontSelectEl.options[i].value.replace(/['"]/g, '');
          if (optVal.includes(activeFont)) {
            fontSelectEl.selectedIndex = i;
            break;
          }
        }
      }

      const activeSize = document.queryCommandValue('fontSize');
      if (activeSize) {
        fontSizeSelectEl.value = activeSize;
      }

      // Text Color Dropdown Synchronization
      const activeColor = document.queryCommandValue('foreColor');
      if (activeColor) {
        textColorSelectEl.value = rgbToHex(activeColor);
      }
    } catch (e) {
      console.warn('Formatting state sync skipped:', e);
    }
  }

  /**
   * Convert rgb(r, g, b) values to hex string to sync dropdown.
   */
  function rgbToHex(rgb) {
    if (!rgb) return '#2b2b2b';
    if (typeof rgb !== 'string') return '#2b2b2b';
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#2b2b2b';
    
    const hex = (x) => ("0" + parseInt(x).toString(16)).slice(-2);
    return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }

  /**
   * Sets the visual Auto-save indicator.
   * @param {string} mode - 'saved' | 'saving' | 'manual' | 'error'
   */
  function updateSaveStatusIndicator(mode) {
    if (!mode) {
      mode = state.isAutoSaveEnabled ? 'saved' : 'manual';
    }

    saveDotEl.className = 'save-indicator-dot'; // Reset
    
    switch (mode) {
      case 'saved':
        saveDotEl.classList.remove('saving', 'disabled');
        saveTextEl.innerText = 'All changes saved';
        break;
      case 'saving':
        saveDotEl.classList.add('saving');
        saveTextEl.innerText = 'Saving...';
        break;
      case 'manual':
        saveDotEl.classList.add('disabled');
        saveTextEl.innerText = 'Auto-save disabled (changes local only)';
        break;
      case 'error':
        saveDotEl.style.backgroundColor = '#ef4444';
        saveTextEl.innerText = 'Save error!';
        break;
    }
  }

  /**
   * Custom Prompt wrapper helper.
   */
  function showPrompt({ title, label, placeholder, value, onConfirm }) {
    const modal = document.getElementById('prompt-modal');
    const titleEl = document.getElementById('prompt-title');
    const labelEl = document.getElementById('prompt-label');
    const inputEl = document.getElementById('prompt-input');
    const confirmBtn = document.getElementById('btn-prompt-confirm');
    const cancelBtn = document.getElementById('btn-prompt-cancel');
    const closeBtn = document.getElementById('btn-prompt-close');

    titleEl.innerText = title;
    labelEl.innerText = label;
    inputEl.placeholder = placeholder || '';
    inputEl.value = value || '';

    const cleanUp = () => {
      modal.classList.remove('active');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
      const val = inputEl.value.trim();
      if (newNameNotEmpty(val)) {
        onConfirm(val);
        cleanUp();
      }
    };

    cancelBtn.onclick = cleanUp;
    closeBtn.onclick = cleanUp;

    // Handle Enter and Escape key in prompt
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter') confirmBtn.click();
      if (e.key === 'Escape') cleanUp();
    };

    modal.classList.add('active');
    setTimeout(() => inputEl.focus(), 150);
  }

  /**
   * Custom Delete confirmation overlay.
   */
  function showDeleteConfirm({ notebookName, onConfirm }) {
    const modal = document.getElementById('delete-modal');
    const nameEl = document.getElementById('delete-notebook-name');
    const confirmBtn = document.getElementById('btn-delete-confirm');
    const cancelBtn = document.getElementById('btn-delete-cancel');
    const closeBtn = document.getElementById('btn-delete-close');

    nameEl.innerText = `"${notebookName}"`;

    const cleanUp = () => {
      modal.classList.remove('active');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
      onConfirm();
      cleanUp();
    };

    cancelBtn.onclick = cleanUp;
    closeBtn.onclick = cleanUp;

    modal.classList.add('active');
  }

  // --- Calculator functions ---

  function initCalculator() {
    const calcContainerEl = calcContainer();
    if (!calcContainerEl) return;

    // Attach click listeners to all calc buttons
    const buttons = calcContainerEl.querySelectorAll('.calc-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val;
        handleCalculatorInput(val);
      });
      // Prevent losing editor selection/focus when clicking calculator buttons
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
    });
    
    updateCalculatorDisplay();
  }

  function handleCalculatorInput(val) {
    const screenEl = calcContainer().querySelector('.calc-screen');

    // 1. OFF Switch Handler
    if (val === 'OFF') {
      calcIsOff = !calcIsOff;
      if (calcIsOff) {
        screenEl.classList.add('screen-off');
      } else {
        screenEl.classList.remove('screen-off');
        calcExpression = '';
        calcInput = '0';
        updateCalculatorDisplay();
      }
      return;
    }

    if (calcIsOff) return; // Do nothing if screen is off

    switch (val) {
      case 'C':
        calcExpression = '';
        calcInput = '0';
        break;
      case 'CE':
        calcInput = '0';
        break;
      case 'backspace':
        if (calcInput.length > 1) {
          calcInput = calcInput.slice(0, -1);
        } else {
          calcInput = '0';
        }
        break;
      case 'insert':
        insertCalcValueIntoEditor();
        break;
      case 'sqrt':
        try {
          const valNum = parseFloat(calcInput);
          if (valNum >= 0) {
            calcInput = parseFloat(Math.sqrt(valNum).toFixed(10)).toString();
          } else {
            calcInput = 'Error';
          }
        } catch (e) {
          calcInput = 'Error';
        }
        break;
      case '%':
        try {
          const valNum = parseFloat(calcInput);
          calcInput = parseFloat((valNum / 100).toFixed(10)).toString();
        } catch (e) {
          calcInput = 'Error';
        }
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        if (calcInput !== 'Error') {
          if (calcExpression && !calcInput) {
            calcExpression = calcExpression.slice(0, -1) + val;
          } else {
            calcExpression += calcInput + val;
            calcInput = '';
          }
        }
        break;
      case '=':
        if (calcExpression && calcInput && calcInput !== 'Error') {
          const fullExpr = calcExpression + calcInput;
          try {
            const sanitized = fullExpr.replace(/\s+/g, '');
            if (/^[0-9\.\+\-\*\/]+$/.test(sanitized)) {
              const result = new Function(`return (${sanitized})`)();
              if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                calcInput = parseFloat(result.toFixed(10)).toString();
                calcExpression = '';
              } else {
                calcInput = 'Error';
              }
            } else {
              calcInput = 'Error';
            }
          } catch (e) {
            calcInput = 'Error';
          }
        }
        break;
      default:
        if (calcInput === '0' || calcInput === 'Error') {
          if (val === '.') {
            calcInput = '0.';
          } else {
            calcInput = val;
          }
        } else {
          if (val === '.' && calcInput.includes('.')) {
            break;
          }
          calcInput += val;
        }
        break;
    }

    updateCalculatorDisplay();
  }

  function updateCalculatorDisplay() {
    const exprEl = document.getElementById('calc-expr');
    const displayEl = document.getElementById('calc-display');
    if (!exprEl || !displayEl) return;

    let visualExpr = calcExpression.replace(/\*/g, ' x ').replace(/\//g, ' ÷ ');
    exprEl.innerText = visualExpr;
    displayEl.innerText = calcInput || '0';
  }

  function calcContainer() {
    return document.getElementById('calculator-drawer');
  }

  function insertCalcValueIntoEditor() {
    const val = document.getElementById('calc-display').innerText;
    if (val === 'Error' || calcIsOff) return;
    
    editorEl.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(val);
      range.insertNode(textNode);
      
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      const event = new CustomEvent('editorChange', { bubbles: true });
      editorEl.dispatchEvent(event);
    }
  }

  function toggleCalculatorDrawer() {
    const drawer = calcContainer();
    const btn = document.getElementById('btn-calculator');
    if (!drawer || !btn) return;
    const isHidden = drawer.classList.toggle('hidden');
    btn.classList.toggle('active', !isHidden);
  }

  // --- Utility functions ---

  function newNameNotEmpty(name) {
    return name && name.length > 0;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(err => console.error("Service Worker registration failed:", err));
    });
  }

})();
