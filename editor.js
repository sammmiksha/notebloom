/**
 * NoteBloom Editor Manager
 * Handles rich text formatting, pasting screenshots, dragging/resizing images, and word counting.
 * Attached to window.NoteBloomEditor for browser compatibility.
 */

(function () {
  let isResizing = false;
  let isDraggingImage = false;
  let activeContainer = null;
  let startX, startY, startWidth, startHeight, aspectRatio;
  let dragStartX, dragStartY, startLeft, startTop;

  const NoteBloomEditor = {
    editor: null,
    wordCounter: null,

    /**
     * Initializes the editor module.
     * @param {HTMLElement} editorEl - The contenteditable editor div
     * @param {HTMLElement} wordCounterEl - The word count display span
     */
    init(editorEl, wordCounterEl) {
      this.editor = editorEl;
      this.wordCounter = wordCounterEl;

      // Register Event Listeners
      this.editor.addEventListener('paste', this.handlePaste.bind(this));
      this.editor.addEventListener('input', this.handleInput.bind(this));
      this.editor.addEventListener('mousedown', this.handleMouseDown.bind(this));

      // Global event listeners for drag-resize and image dragging
      window.addEventListener('mousemove', this.handleMouseMove.bind(this));
      window.addEventListener('mouseup', this.handleMouseUp.bind(this));

      // Global click to deselect images when clicking elsewhere
      document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.resizable-image-container')) {
          this.deselectAllImages();
        }
      });

      // Global keydown for deleting selected images
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const selected = this.editor.querySelector('.resizable-image-container.selected');
          if (selected) {
            e.preventDefault();
            selected.remove();
            this.handleInput(); // Trigger auto-save
          }
        }
      });

      // Initialize counter
      this.updateWordCount();
    },

    /**
     * Execute formatting command on text.
     * @param {string} command 
     * @param {string|null} value 
     */
    format(command, value = null) {
      document.execCommand(command, false, value);
      this.editor.focus();
      this.handleInput();
    },

    /**
     * Handles typing and formatting changes to trigger auto-save and updates.
     */
    handleInput() {
      this.updateWordCount();
      // Dispatch custom edit event for app.js auto-saver
      const event = new CustomEvent('editorChange', {
        bubbles: true,
        detail: { html: this.editor.innerHTML }
      });
      this.editor.dispatchEvent(event);
    },

    /**
     * Counts words in notes.
     */
    updateWordCount() {
      if (!this.editor || !this.wordCounter) return;
      const text = this.editor.innerText || '';
      
      // Clean and split string
      const words = text
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .filter(w => w.length > 0);

      const count = words.length;
      this.wordCounter.innerText = `${count} ${count === 1 ? 'word' : 'words'}`;
      this.adjustEditorHeight();
    },

    /**
     * Dynamically adjusts the editor's min-height based on any absolutely positioned image containers.
     * This ensures the notebook lined/grid background pattern extends to fit all dragged images.
     */
    adjustEditorHeight() {
      if (!this.editor) return;
      const containers = this.editor.querySelectorAll('.resizable-image-container');
      let maxBottom = 0;

      containers.forEach(container => {
        if (container.style.position === 'absolute') {
          const top = parseInt(container.style.top, 10) || 0;
          const height = container.clientHeight || parseInt(container.style.height, 10) || 0;
          const bottom = top + height;
          if (bottom > maxBottom) {
            maxBottom = bottom;
          }
        }
      });

      if (maxBottom > 0) {
        // Add 100px padding at the bottom of the editor for a comfortable scroll experience
        this.editor.style.minHeight = (maxBottom + 100) + 'px';
      } else {
        this.editor.style.minHeight = '';
      }
    },

    /**
     * Paste Event - intercepts pasted screenshots and converts to resizable images.
     */
    handlePaste(e) {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let hasImage = false;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          hasImage = true;
          e.preventDefault(); // Stop normal text pasting of images

          const file = items[i].getAsFile();
          const reader = new FileReader();

          reader.onload = (event) => {
            this.insertResizableImage(event.target.result);
          };

          reader.readAsDataURL(file);
          break; // Process one image at a time
        }
      }

      // If pasting text, update word count asynchronously after DOM update
      if (!hasImage) {
        setTimeout(() => this.handleInput(), 10);
      }
    },

    /**
     * Creates and inserts a resizable image wrapper at the current text cursor position.
     * @param {string} src - Base64 Data URL or path
     */
    insertResizableImage(src) {
      // Create container
      const container = document.createElement('div');
      container.className = 'resizable-image-container selected';
      container.setAttribute('contenteditable', 'false');
      container.style.width = '300px'; // Default starting width

      // Create image
      const img = document.createElement('img');
      img.src = src;
      container.appendChild(img);

      // Create resize handle
      const handle = document.createElement('div');
      handle.className = 'resize-handle-se';
      container.appendChild(handle);

      // Focus the editor
      this.editor.focus();

      // Insert at selection cursor
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(container);

        // Put cursor right after the image
        const newRange = document.createRange();
        newRange.setStartAfter(container);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Fallback
        this.editor.appendChild(container);
      }

      // Deselect other images, keep new one active
      this.deselectAllImages(container);
      this.handleInput(); // Trigger save
    },

    /**
     * Deselects all resizable containers.
     * @param {HTMLElement|null} exceptContainer 
     */
    deselectAllImages(exceptContainer = null) {
      const containers = this.editor.querySelectorAll('.resizable-image-container');
      containers.forEach(container => {
        if (container !== exceptContainer) {
          container.classList.remove('selected');
        }
      });
    },

    /**
     * Mouse Down event handler - manages selection, resize clicks, and drag start.
     */
    handleMouseDown(e) {
      const container = e.target.closest('.resizable-image-container');
      
      if (container) {
        // Select this container
        this.deselectAllImages(container);
        container.classList.add('selected');

        // Check if clicking resize handle
        if (e.target.classList.contains('resize-handle-se')) {
          e.preventDefault(); // Stop text selection
          isResizing = true;
          activeContainer = container;
          
          const img = container.querySelector('img');
          startX = e.clientX;
          startY = e.clientY;
          startWidth = parseInt(document.defaultView.getComputedStyle(container).width, 10);
          startHeight = parseInt(document.defaultView.getComputedStyle(container).height, 10);
          
          // Calculate aspect ratio
          if (img && img.naturalWidth) {
            aspectRatio = img.naturalWidth / img.naturalHeight;
          } else {
            aspectRatio = startWidth / startHeight;
          }
        } else {
          // Start dragging image container absolutely
          e.preventDefault(); // Prevent text highlights
          isDraggingImage = true;
          activeContainer = container;

          // Transition to absolute coordinates relative to editor if it was inline
          if (container.style.position !== 'absolute') {
            const rect = container.getBoundingClientRect();
            const editorRect = this.editor.getBoundingClientRect();
            const initialLeft = rect.left - editorRect.left + this.editor.scrollLeft;
            const initialTop = rect.top - editorRect.top + this.editor.scrollTop;

            container.style.position = 'absolute';
            container.style.left = initialLeft + 'px';
            container.style.top = initialTop + 'px';
            container.style.margin = '0';
          }

          dragStartX = e.clientX;
          dragStartY = e.clientY;
          startLeft = parseInt(container.style.left, 10) || 0;
          startTop = parseInt(container.style.top, 10) || 0;
        }
      }
    },

    /**
     * Mouse Move event handler - resizes or drags the image container.
     */
    handleMouseMove(e) {
      // 1. Resizing Image
      if (isResizing && activeContainer) {
        const deltaX = e.clientX - startX;
        let newWidth = startWidth + deltaX;
        if (newWidth < 50) newWidth = 50;

        const editorWidth = this.editor.clientWidth - 120;
        if (newWidth > editorWidth) newWidth = editorWidth;

        const newHeight = newWidth / aspectRatio;
        activeContainer.style.width = newWidth + 'px';
        activeContainer.style.height = newHeight + 'px';
        this.adjustEditorHeight();
      }

      // 2. Dragging/Moving Image anywhere on the page
      if (isDraggingImage && activeContainer) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        // Boundaries checks relative to the scrollable editor page size
        const editorW = this.editor.clientWidth;
        const containerW = activeContainer.clientWidth;
        const containerH = activeContainer.clientHeight;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > editorW - containerW) newLeft = editorW - containerW;
        if (newTop < 0) newTop = 0;

        activeContainer.style.left = newLeft + 'px';
        activeContainer.style.top = newTop + 'px';

        // Dynamically grow the editor's minHeight as the user drags the image down
        const bottomEdge = newTop + containerH;
        const currentMinHeight = parseInt(this.editor.style.minHeight, 10) || this.editor.clientHeight;
        if (bottomEdge + 100 > currentMinHeight) {
          this.editor.style.minHeight = (bottomEdge + 100) + 'px';
        }
      }
    },

    /**
     * Mouse Up event handler - ends interaction and saves.
     */
    handleMouseUp(e) {
      if (isResizing) {
        isResizing = false;
        activeContainer = null;
        this.handleInput(); // Save size
      }
      if (isDraggingImage) {
        isDraggingImage = false;
        activeContainer = null;
        this.handleInput(); // Save coordinates
      }
    }
  };

  // Expose Editor interface to global window scope
  window.NoteBloomEditor = NoteBloomEditor;
})();
