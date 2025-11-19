import React, { useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import ShowPage from './pages/ShowPage.jsx';
import FavouritesPage from './pages/FavouritesPage.jsx';
import PlayerShell from './components/PlayerShell.jsx';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (hash) => {
    window.location.hash = hash;
  };

  let page = null;
  if (route.startsWith('#/show')) {
    page = <ShowPage />;
  } else if (route.startsWith('#/favourites')) {
    page = <FavouritesPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <PlayerShell onNav={navigate}>
      {page}
    </PlayerShell>
  );
}