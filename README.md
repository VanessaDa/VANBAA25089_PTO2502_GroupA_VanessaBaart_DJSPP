# 🎙️ The Healing Mic | React DJSPP Project

## 📌 Project Overview

**The Healing Mic** is a modern podcast listening experience built with **React and Vite**.  
It includes a global audio player, favourites library, listening progress, themed UI,
and a clean multi-page layout using hash routing.

The app demonstrates:

- React components for all UI pages
- Persistent global audio player across navigation
- LocalStorage persistence for theme, favourites, and progress
- Responsive design with light/dark modes
- Seamless hash-based client-side routing (`#/`, `#/show/:id`, `#/favourites`)

---

## 🚀 Features

### 🎵 Global Audio Player

- Sticky footer player visible on all pages
- Play/pause, back 10s, forward 10s
- Seek using progress slider
- Remembers last played episode and restores playback state
- Works across Home, Show, and Favourites

### ❤️ Favourites Library

- Add/remove episodes & shows from favourites
- Grouped by show name
- Sort by newest, oldest, A–Z, Z–A
- Filter favourites by show
- “Clear favourites” button
- “Reset listening history” button

### ⏱️ Listening Progress

- Saves timestamp for each episode
- Resumes from where you left off
- Marks episodes as “Finished” when completed
- Progress indicators on Show and Favourites

### 🏠 Home Page

- Recommended carousel
- All-shows grid
- Genre filter
- Sort by newest/oldest
- Click through to show details

### 📺 Show Page

- Show cover, title, metadata
- Description with “Read more / Read less”
- Season selector
- Episode list with:
  - Title
  - Summary
  - Progress pill
  - Favourite icon
  - Play button

### 🌓 Theme Toggle

- Light/dark mode toggle in header
- Saves preference in LocalStorage
- Applies globally across UI

### 🔁 Routing

Handled in `App.jsx`:

- `#/` → Home
- `#/show/:id` → Show Page
- `#/favourites` → Favourites

---

## 🧾 Key Code Snippets

### 1️⃣ App.jsx – Hash Routing and Shell

```jsx
// src/App.jsx
import React, { useState, useEffect } from "react";
import HomePage from "./pages/HomePage.jsx";
import ShowPage from "./pages/ShowPage.jsx";
import FavouritesPage from "./pages/FavouritesPage.jsx";
import PlayerShell from "./components/PlayerShell.jsx";

export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (hash) => {
    window.location.hash = hash;
  };

  let page;
  if (route.startsWith("#/show")) {
    page = <ShowPage />;
  } else if (route.startsWith("#/favourites")) {
    page = <FavouritesPage />;
  } else {
    page = <HomePage />;
  }

  return <PlayerShell onNav={navigate}>{page}</PlayerShell>;
}
```

---

### 2️⃣ PlayerShell.jsx – Header and Global Player

```jsx
// src/components/PlayerShell.jsx
import React from "react";

export default function PlayerShell({ children, onNav }) {
  return (
    <div id="app-root">
      <header className="header">
        <nav className="nav container">
          <div role="img" aria-label="The Healing Mic logo">
            🎙️
          </div>
          <h1>The Healing Mic</h1>
          <div className="spacer" />
          <button className="btn" type="button" onClick={() => onNav("#/")}>
            Home
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => onNav("#/favourites")}
          >
            Favourites
          </button>
          <button id="themeToggle" className="btn" type="button">
            🌙 Dark
          </button>
        </nav>
      </header>

      <main className="container page">{children}</main>

      <footer className="player">
        <div>
          <div id="nowTitle" className="title">
            No episode selected
          </div>
          <div id="nowSub" className="subtitle">
            The Healing Mic
          </div>
        </div>
        <button id="back10" className="btn" type="button">
          « 10s
        </button>
        <button id="playToggle" className="btn" type="button">
          ▶️
        </button>
        <button id="fwd10" className="btn" type="button">
          10s »
        </button>
        <input id="progress" type="range" min="0" max="100" step="1" />
        <audio id="audio" crossOrigin="anonymous" />
      </footer>
    </div>
  );
}
```

---

### 3️⃣ HomePage.jsx – Mounting Logic and Rendering

```jsx
// src/pages/HomePage.jsx
import React, { useEffect } from "react";
import { initTheme, mountPlayer, renderHome } from "../vanilla/app.js";

export default function HomePage() {
  useEffect(() => {
    initTheme();
    mountPlayer();
    renderHome();
  }, []);

  return (
    <>
      <h2 className="section-title">Recommended Shows</h2>
      <ul className="carousel" id="carousel" />
      <div className="toolbar">
        <label htmlFor="genreFilter">Filter by:</label>
        <select id="genreFilter">
          <option>All Genres</option>
        </select>
        <div className="spacer" />
        <label htmlFor="sortSelect">Sort:</label>
        <select id="sortSelect">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      <section className="grid" id="grid" />
    </>
  );
}
```

---

### 4️⃣ Example Play Button Markup

Any play button in the UI can trigger the global player using `data-*` attributes:

```html
<button
  class="action play"
  type="button"
  data-episode-id="1:1:3"
  data-audio-url="https://audio.example.com/episode.mp3"
  data-title="S1E3 — Example Episode"
  data-subtitle="The Healing Mic Show"
>
  Play
</button>
```

The global player listens to clicks on `.action.play` and reads these attributes to:

- Set the audio `src`
- Update the “Now Playing” text
- Restore and save progress

---

## 🛠️ Technologies Used

- **React 18**
- **Vite**
- **JavaScript (ES Modules)**
- **CSS3**
- **Podcast API**  
  `https://podcast-api.netlify.app`

---

## ⚙️ Setup Instructions

### 📥 Install & Run

```bash
npm install
npm run dev
```

Open:

```
http://localhost:5173
```

### 🏗 Build for Production

```bash
npm run build
npm run preview
```

### 🌍 Deploy to Vercel

1. Push project to GitHub
2. Create New Project → Import Repo
3. Framework: **Vite**
4. Build: `vite build`
5. Output directory: `dist/`

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

## 👤 Author

**Vanessa Baart**  
GitHub: https://github.com/VanessaDa  
LinkedIn: https://www.linkedin.com/in/vanessa-gwama-50841ab7
