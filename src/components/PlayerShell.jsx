import React from 'react';

export default function PlayerShell({ children, onNav }) {
  return (
    <div id="app-root">
      <header className="header">
        <nav className="nav container">
          <div role="img" aria-label="The Healing Mic logo">🎙️</div>
          <h1>The Healing Mic</h1>
          <div className="spacer" />
          <button className="btn" type="button" onClick={() => onNav('#/')}>
            Home
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => onNav('#/favourites')}
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