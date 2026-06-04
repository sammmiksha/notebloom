

(function () {
  const DB_NAME = 'NoteBloomDB';
  const DB_VERSION = 1;
  let db = null;

  const NoteBloomDB = {
    /**
     * Initializes the IndexedDB database.
     * @returns {Promise<IDBDatabase>}
     */
    init() {
      return new Promise((resolve, reject) => {
        if (db) {
          return resolve(db);
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.error('Database failed to open:', event.target.error);
          reject(event.target.error);
        };

        request.onsuccess = (event) => {
          db = event.target.result;
          resolve(db);
        };

        request.onupgradeneeded = (event) => {
          const dbInstance = event.target.result;

          // Notebooks object store
          if (!dbInstance.objectStoreNames.contains('notebooks')) {
            const notebookStore = dbInstance.createObjectStore('notebooks', { keyPath: 'id' });
            // Add indices for sorting or searching if needed
            notebookStore.createIndex('lastEdited', 'lastEdited', { unique: false });
          }

          // Settings object store
          if (!dbInstance.objectStoreNames.contains('settings')) {
            dbInstance.createObjectStore('settings', { keyPath: 'key' });
          }
        };
      });
    },

    /**
     * Returns a transaction and object store for notebooks.
     * @param {string} mode - 'readonly' or 'readwrite'
     */
    _getNotebookStore(mode = 'readonly') {
      if (!db) throw new Error('Database not initialized. Call init() first.');
      const transaction = db.transaction('notebooks', mode);
      const store = transaction.objectStore('notebooks');
      return { store, transaction };
    },

    /**
     * Returns a transaction and object store for settings.
     * @param {string} mode - 'readonly' or 'readwrite'
     */
    _getSettingsStore(mode = 'readonly') {
      if (!db) throw new Error('Database not initialized. Call init() first.');
      const transaction = db.transaction('settings', mode);
      const store = transaction.objectStore('settings');
      return { store, transaction };
    },

    // --- Notebook Operations ---

    /**
     * Retrieves all notebooks, sorted by lastEdited descending.
     * @returns {Promise<Array>}
     */
    getAllNotebooks() {
      return new Promise((resolve, reject) => {
        try {
          const { store } = this._getNotebookStore('readonly');
          const request = store.getAll();

          request.onsuccess = () => {
            const notebooks = request.result || [];
            // Sort by lastEdited descending (newest first)
            notebooks.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
            resolve(notebooks);
          };

          request.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    },

    /**
     * Retrieves a single notebook by ID.
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    getNotebook(id) {
      return new Promise((resolve, reject) => {
        try {
          const { store } = this._getNotebookStore('readonly');
          const request = store.get(id);

          request.onsuccess = () => {
            resolve(request.result || null);
          };

          request.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    },

    /**
     * Saves or updates a notebook.
     * @param {Object} notebook 
     * @returns {Promise<string>}
     */
    saveNotebook(notebook) {
      return new Promise((resolve, reject) => {
        try {
          const { store } = this._getNotebookStore('readwrite');
          
          // Enforce required fields
          if (!notebook.id) {
            notebook.id = 'nb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          }
          notebook.lastEdited = new Date().toISOString();
          if (!notebook.created) {
            notebook.created = notebook.lastEdited;
          }
          if (notebook.content === undefined) notebook.content = '';
          if (!notebook.pageStyle) notebook.pageStyle = 'blank';
          if (!notebook.theme) notebook.theme = 'lavender-dream';

          const request = store.put(notebook);

          request.onsuccess = () => {
            resolve(notebook.id);
          };

          request.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    },

    /**
     * Deletes a notebook by ID.
     * @param {string} id 
     * @returns {Promise<void>}
     */
    deleteNotebook(id) {
      return new Promise((resolve, reject) => {
        try {
          const { store } = this._getNotebookStore('readwrite');
          const request = store.delete(id);

          request.onsuccess = () => {
            resolve();
          };

          request.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    },

    // --- Settings Operations ---

    /**
     * Retrieves a setting value.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {Promise<*>}
     */
    getSetting(key, defaultValue = null) {
      return new Promise((resolve, reject) => {
        try {
          const { store } = this._getSettingsStore('readonly');
          const request = store.get(key);

          request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : defaultValue);
          };

          request.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    },

    /**
     * Saves a setting value.
     * @param {string} key 
     * @param {*} value 
     * @returns {Promise<void>}
     */
    saveSetting(key, value) {
      return new Promise((resolve, reject) => {
        try {
          const { store } = this._getSettingsStore('readwrite');
          const request = store.put({ key, value });

          request.onsuccess = () => {
            resolve();
          };

          request.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    }
  };

  // Expose DB interface to global window scope
  window.NoteBloomDB = NoteBloomDB;
})();
