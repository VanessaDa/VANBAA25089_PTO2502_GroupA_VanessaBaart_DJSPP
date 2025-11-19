
import React from "react";
import { initTheme, mountPlayer, renderShow } from "../vanilla/app.js";

export default function ShowPage() {
  React.useEffect(() => {
    // Initialise theme + global player once this route is active
    initTheme();
    mountPlayer();

    // Read ID from the hash router used in your React app
    // Expected pattern: #/show/123
    const hash = window.location.hash || "";
    let id = null;

    // Try pattern "#/show/123"
    const match = hash.match(/#\/show\/(\d+)/);
    if (match && match[1]) {
      id = match[1];
    } else if (hash.includes("?")) {
      // Fallback for pattern "#/show?id=123"
      const query = hash.slice(hash.indexOf("?")); // ?id=123
      const params = new URLSearchParams(query);
      id = params.get("id");
    }

    // Pass the id to vanilla renderShow (it will also
    // fall back to ?id= in the URL if id is null)
    renderShow(id || undefined);
  }, []);

  return (
    <>
      <section className="show-header">
        <img id="showCover" className="show-cover" src="" alt="" />
        <div>
          <h2 id="showTitle" className="section-title">
            Loading…
          </h2>
          <div className="meta">
            <span id="updatedMeta" />
            <span id="seasonsMeta" />
          </div>
          <div id="genres" className="genres" />
          <p id="showDescription" className="desc" />
          <div className="toolbar">
            <label htmlFor="seasonSelect">Season</label>
            <select id="seasonSelect" />
          </div>
        </div>
      </section>
      <section id="episodeList" className="episode-list" />
    </>
  );
}
