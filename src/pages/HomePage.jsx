import React from 'react';
import { initTheme, mountPlayer, renderHome } from '../vanilla/app.js';

export default function HomePage() {
  React.useEffect(() => {
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