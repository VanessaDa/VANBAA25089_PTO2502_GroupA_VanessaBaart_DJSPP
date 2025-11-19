import React from 'react';
import { initTheme, mountPlayer, renderFavourites } from '../vanilla/app.js';

export default function FavouritesPage() {
  React.useEffect(() => {
    initTheme();
    mountPlayer();
    renderFavourites();
  }, []);

  return (
    <>
      <h2 className="section-title">Favourite Episodes</h2>
      <div className="toolbar">
        <button id="clearFavs" className="btn" type="button">
          Clear favourites
        </button>
        <label htmlFor="favSort">Sort:</label>
        <select id="favSort">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">Title A–Z</option>
          <option value="za">Title Z–A</option>
        </select>
        <label htmlFor="favShowFilter">Filter:</label>
        <select id="favShowFilter">
          <option value="__all">All Shows</option>
        </select>
      </div>
      <div id="favContainer" />
    </>
  );
}