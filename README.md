# 🎙️ The Healing Mic | React DJSPP Project

## 🌍 Live Demo

🔗 **https://vanbaa-25089-pto-2502-group-a-vanes.vercel.app**

## 📌 Project Overview

**The Healing Mic** is a modern podcast listening experience built with **React + Vite**, enhanced with a global audio player, favourites system, listening progress tracking, and multi-page navigation using **hash routing**.

This project demonstrates:

- React component-based UI
- Persistent global audio player across all pages
- LocalStorage for theme, favourites, and listening progress
- Responsive UI with full dark/light mode support
- Client-side routing using URL hashes (`#/`, `#/show/:id`, `#/favourites`)

---

## 🚀 Features

### 🎵 Global Audio Player

- Sticky footer player visible on all pages
- Play, pause, back 10s, forward 10s
- Progress slider
- Persists last played episode + timestamp
- Continues playing across navigation

### ❤️ Favourites Library

- Add/remove shows and episodes
- Grouped by show
- Sort: newest, oldest, A–Z, Z–A
- Filter by show
- Clear all favourites
- Reset listening progress

### ⏱️ Listening Progress

- Saves timestamp per episode
- Shows "In Progress" or "Finished"
- Auto-resumes when revisiting

### 🏠 Home Page

- Recommended carousel
- Full shows grid
- Genre filter
- Sort shows

### 📺 Show Page

- Show metadata
- Dynamic seasons
- Episode list with play + favourite
- Read more / read less description

### 🌓 Theme Toggle

- Dark/light mode
- Saved in LocalStorage

---

## 🧱 Tech Stack

- **React 18**
- **Vite** (bundler)
- **JavaScript ES Modules**
- **CSS3** (custom properties, grid, flexbox)
- **Podcast API** → https://podcast-api.netlify.app

---

## ⚙️ Setup & Running Locally

### Install dependencies

```bash
npm install
```

### Start dev server

```bash
npm run dev
```

👉 Visit: **http://localhost:5173**

### Build for production

```bash
npm run build
npm run preview
```

---

## 🌍 Deployment (Vercel)

1. Push repo to GitHub
2. Go to **Vercel → New Project**
3. Import your GitHub repo
4. Framework preset: **Vite**
5. Build command: `vite build`
6. Output folder: `dist/`
7. Deploy

Your live version:  
🔗 **https://vanbaa-25089-pto-2502-group-a-vanes.vercel.app**

---

## 🗂 Folder Structure

```
src/
├── App.jsx
├── main.jsx
├── styles.css
├── components/
│   └── PlayerShell.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── ShowPage.jsx
│   └── FavouritesPage.jsx
└── vanilla/
    └── app.js
index.html
vite.config.js
package.json
README.md
```

---

## 👩‍💻 Author

**Vanessa Baart**  
GitHub: https://github.com/VanessaDa  
LinkedIn: https://www.linkedin.com/in/vanessa-gwama-50841ab7

---

## ✔️ Notes

This project forms part of the **CodeSpace DJSPP** portfolio requirements and meets:

- All required user stories
- Stretch goals: audio persistence + progress tracking
- Clean commit history & documentation
