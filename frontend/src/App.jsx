import React, { useMemo, useState } from 'react';
import CreateAvatar from './pages/CreateAvatar.jsx';
import Login from './pages/Login.jsx';
import MyAvatars from './pages/MyAvatars.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';

// Décode le payload d'un JWT (partie centrale, base64url) sans dépendance externe
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('avaverse_token'));
  const [pseudo, setPseudo] = useState(() => localStorage.getItem('avaverse_pseudo') || 'ZakMarket');
  const [page, setPage] = useState(() => (localStorage.getItem('avaverse_token') ? 'create' : 'login'));

  const isAuthenticated = Boolean(token);

  const session = useMemo(() => {
    const decoded = token ? decodeToken(token) : null;
    const role = decoded?.role ?? null;

    return {
      isAuthenticated,
      isAdmin: role === 'admin',
      token,
      role,
      pseudo,
      login(authToken, userPseudo = 'ZakMarket') {
        localStorage.setItem('avaverse_token', authToken);
        localStorage.setItem('avaverse_pseudo', userPseudo);
        setToken(authToken);
        setPseudo(userPseudo);

        const decodedToken = decodeToken(authToken);
        if (decodedToken?.role === 'admin') {
          setPage('admin');
        } else {
          setPage('create');
        }
      },
      logout() {
        localStorage.removeItem('avaverse_token');
        localStorage.removeItem('avaverse_pseudo');
        setToken(null);
        setPseudo('ZakMarket');
        setPage('login');
      },
      navigate(nextPage) {
        setPage(nextPage);
      },
    };
  }, [isAuthenticated, token, pseudo]);

  // Route Admin
  if (isAuthenticated && page === 'admin') {
    return <Admin session={session} />;
  }

  // Route 1 : Création d'avatar
  if (isAuthenticated && page === 'create') {
    return <CreateAvatar session={session} />;
  }

  // Route 2 : Bibliothèque
  if (isAuthenticated && page === 'library') {
    return <MyAvatars session={session} />;
  }

  // Route 3 : Profil
  if (isAuthenticated && page === 'profile') {
    return <Profile session={session} />;
  }

  // Route 4 : Inscription
  if (page === 'register') {
    return <Register session={session} />;
  }

  // Route par défaut : Connexion
  return <Login session={session} />;
}
