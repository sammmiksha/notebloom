# 🌸 NoteBloom — Cute Study Notebook Widget

> A beautifully designed, installable Progressive Web App for students to take notes, paste screenshots, and stay organized during online lectures and meetings.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blueviolet?style=for-the-badge)](https://sammmiksha.github.io/notebloom/)
[![PWA](https://img.shields.io/badge/PWA-Installable-success?style=for-the-badge)](https://sammmiksha.github.io/notebloom/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

---

## ✨ What is NoteBloom?

NoteBloom is a **lightweight, offline-capable note-taking app** built specifically for students. Whether you're in a Zoom lecture, watching a recorded session, or sitting in a live class, NoteBloom keeps your notes organized in one cute, distraction-free space.

With NoteBloom you can:

- Organize notes into a **bookshelf of notebooks**, one per subject or course
- Write with rich text formatting (bold, italic, underline)
- **Paste screenshots directly** from your clipboard into your notes
- Choose between **page styles** — Blank, Ruled, Grid, Dot Grid
- Switch between multiple **themes** to personalize your workspace
- Use the built-in **floating Study Calculator** without leaving your notes
- Work **completely offline**, with no internet needed after install
- **Install it like a native app** on Windows, Mac, Android, or iOS

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><b>Bookshelf Dashboard</b><br/><img width="380" alt="NoteBloom bookshelf dashboard showing notebook shelves" src="https://github.com/user-attachments/assets/e86127ae-937c-45f4-89d6-e1621332b5d0" /></td>
    <td align="center"><b>Note Editor</b><br/><img width="380" alt="NoteBloom note editor with formatting toolbar" src="https://github.com/user-attachments/assets/560d533b-ca1f-44e1-9db5-dce3b18a5191" /></td>
  </tr>
  <tr>
    <td align="center"><b>Floating Study Calculator</b><br/><img width="380" alt="Draggable floating study calculator over a note" src="https://github.com/user-attachments/assets/67aed41c-30ac-4f7d-8146-b38b0f3b01db" /></td>
    <td align="center"><b>Narrow / Mobile View</b><br/><img width="380" alt="NoteBloom dashboard in a narrow mobile layout" src="https://github.com/user-attachments/assets/be6573b2-a010-4f2e-aa74-c181c9f398e5" /></td>
  </tr>
</table>

> **Tip:** The app adapts its layout to window size — snap it beside your lecture video for a distraction-free note-taking experience.

---

## 🚀 Getting Started

### Option 1 — Use in Browser (No Install)

Visit **[sammmiksha.github.io/notebloom](https://sammmiksha.github.io/notebloom/)** and start using it immediately. No sign-up required.

### Option 2 — Install as a Desktop / Mobile App (Recommended)

Installing NoteBloom as a PWA gives you a native-feeling app with full offline access.

**Desktop (Chrome or Edge)**
1. Open [sammmiksha.github.io/notebloom](https://sammmiksha.github.io/notebloom/) in Chrome or Edge.
2. Click the install icon (➕) in the address bar, or open the browser menu (⋮) → **Install NoteBloom**.
3. Click **Install**. NoteBloom now appears in your Start Menu, Taskbar, or Desktop like any native app.

**Android (Chrome)**
1. Open the site in Chrome.
2. Tap the menu (⋮) → **Add to Home Screen** → **Add**.

**iOS (Safari)**
1. Open the site in Safari.
2. Tap **Share** → **Add to Home Screen** → **Add**.

> ℹ️ Once installed, NoteBloom works fully offline. Your notes are saved locally on your device.

---

## 📖 How to Use NoteBloom

**Creating a notebook**
Click **+ New Notebook** on the dashboard, name it (e.g. "Physics Lectures," "CS101"), and it appears on your bookshelf.

**Writing notes**
Open any notebook and start typing. Use the toolbar for **Bold**, *Italic*, or Underline. Notes auto-save — look for "All changes saved" in the bottom-right corner.

**Choosing a page style**
Pick from **Blank**, **Ruled**, **Grid**, or **Dot Grid** in the toolbar dropdown, depending on how you like to write.

**Changing themes**
Use the theme dropdown to switch the editor's color scheme to match your mood or subject.

**Pasting screenshots**
Take a screenshot (`Win+Shift+S` on Windows, `Cmd+Shift+4` on Mac), click inside your note, then paste with `Ctrl+V` / `Cmd+V`. It drops straight into your note.

**Using the Study Calculator**
Tap the calculator FAB (floating action button) in the editor's bottom-right corner. On desktop, drag it anywhere — it remembers its position between sessions. On mobile, it opens as a bottom-sheet so your writing area stays usable. You can also type expressions like `6 + 4 =` directly into a note and they'll evaluate inline.

**Renaming or deleting a notebook**
Each notebook card on the dashboard has **Rename** and **Delete** options beneath it.

**Searching notebooks**
Use the search bar at the top of the dashboard to find a notebook by name instantly.

---

## 🎨 Features Overview

| Feature | Details |
|---|---|
| 📚 Bookshelf Organization | Notebooks displayed on a customizable visual bookshelf |
| 📒 Notebook Management | Create, rename, and delete multiple notebooks |
| 🎨 Themes | Multiple color themes to personalize your workspace |
| 📄 Page Styles | Blank, Ruled, Grid, Dot Grid |
| 🖼️ Screenshot Pasting | Paste images from clipboard directly into notes |
| 💾 Auto-Save | Notes saved automatically via IndexedDB |
| 🔍 Search | Find notebooks instantly from the dashboard |
| 🧮 Floating Calculator | Draggable Study Calculator with session persistence |
| ➗ Inline Math | Type `6 + 4 =` in a note and get the result instantly |
| 📱 PWA / Installable | Install on desktop or mobile like a native app |
| 🌐 Offline Support | Works without internet after first load |
| 🔠 Rich Text | Bold, Italic, Underline formatting |
| 📏 Font & Size Controls | Adjust font family and size from the toolbar |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | App structure and markup |
| **CSS3** | Styling, themes, animations |
| **Vanilla JavaScript** | All app logic and interactions |
| **IndexedDB** | Local persistent storage for notes and notebooks |
| **Service Workers** | Offline support and caching |
| **Web App Manifest** | PWA installability (icons, name, theme color) |
| **GitHub Pages** | Free static hosting for the live demo |

No frameworks, no backend, no server. NoteBloom runs entirely in your browser with zero dependencies.

---

## 🗂️ Project Structure

```
notebloom/
├── assets/
│   ├── icon-192.png          # PWA icon (small)
│   ├── icon-512.png          # PWA icon (large)
│   └── screenshots/          # App screenshots used in this README
├── app.js                    # Core app logic & notebook management
├── database.js               # IndexedDB storage layer
├── editor.js                 # Note editor logic (formatting, page styles)
├── index.css                 # Global styles and themes
├── index.html                # Main app entry point
├── manifest.json             # PWA manifest (icons, name, theme color)
└── service-worker.js         # Offline support and caching
```

---

## 📋 Changelog

### v1.1.0 — Bookshelf, Floating Calculator & Mobile Polish

**📚 Bookshelf Notebook Organization**
- New visual bookshelf layout for browsing and managing notebooks
- Notebook spine and front-cover display modes
- Multi-shelf arrangement with renameable shelves
- Shelf customization and positioning controls

**🧮 Responsive Study Calculator**
- Replaced the fixed sidebar calculator with a draggable floating window; position and open/close state persist between sessions
- Tablet: calculator appears as a floating utility panel with a simplified interaction model
- Mobile: calculator opens as a bottom-sheet panel so the full writing area stays usable

**📱 Mobile Math Solver Fix**
- Fixed automatic inline math evaluation on mobile devices
- Expressions like `6 + 4 =`, `7 × 7 =`, and `12 / 3 =` now evaluate correctly on Android and iOS virtual keyboards
- Added input-event–based detection for `=` while preserving existing desktop keyboard support

**✨ UX Improvements**
- Added a Floating Action Button (FAB) for one-tap calculator access
- Removed the old split-screen layout to improve editor workspace utilization
- Added calculator close button and header controls
- Improved responsive behavior across desktop, tablet, and mobile

**🎨 Theme & Persistence**
- Calculator now integrates cleanly with all existing themes
- Calculator visibility and position remembered between sessions
- All existing notebook data remains fully compatible — no migration needed

---

## 💡 Tips & Tricks

- **Snap it beside your lecture** — resize NoteBloom to a narrow window and dock it next to your video call; the layout is designed to look good at any width.
- **Use Grid pages for diagrams and equations** — the grid lines make freehand sketching much cleaner.
- **Organize by subject** — one notebook per course keeps your notes from getting mixed up.
- **Screenshot workflow** — during a Zoom or Teams call, use your OS snipping tool and paste straight into your note without breaking flow.
- **Keep the calculator handy** — drag it to a corner and leave it open; it'll be there next session.

---

## 🔮 Roadmap

- [ ] Always-on-top window mode (keep NoteBloom above your lecture window)
- [ ] Electron desktop version for deeper OS integration
- [ ] Export notes as PDF or Markdown
- [ ] More notebook cover themes and colors
- [ ] Tagging and folder organization
- [ ] Dark mode support
- [ ] Handwriting / stylus input support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  Made with 🌸 for students, by a student
  <br/>
  <a href="https://sammmiksha.github.io/notebloom/">Try NoteBloom Live →</a>
</div>
