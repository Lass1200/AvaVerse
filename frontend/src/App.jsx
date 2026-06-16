import React, { useMemo, useState, useEffect } from 'react';
import CreateAvatar from './pages/CreateAvatar.jsx';
import Login from './pages/Login.jsx';
import MyAvatars from './pages/MyAvatars.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';

// Décodeur sécurisé de token JWT pour extraire le vrai rôle
function decodeToken(token) {
  try {
    if (!token || token === 'null' || token === 'undefined') return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState('login');
  const [isLoading, setIsLoading] = useState(true);

  // Restauration synchrone et sécurisée de la session au rechargement (F5)
  useEffect(() => {
    const savedToken = sessionStorage.getItem('avaverse_token');
    const savedPage = sessionStorage.getItem('avaverse_page');

    if (savedToken && savedToken !== 'null' && savedToken !== 'undefined') {
      const cleanToken = savedToken.replace(/['"]+/g, '');
      const decoded = decodeToken(cleanToken);
      
      // Détermination stricte du rôle
      const userIsAdmin = decoded?.role === 'admin' || decoded?.isAdmin === true || sessionStorage.getItem('avaverse_is_admin') === 'true';

      setToken(cleanToken);
      setIsAdmin(userIsAdmin);
      setPage(savedPage || (userIsAdmin ? 'admin' : 'create'));
    } else {
      setPage('login');
    }
    // Fin de la restauration, on libère l'affichage
    setIsLoading(false);
  }, []);

  const isAuthenticated = Boolean(token);

  const session = useMemo(() => {
    return {
      isAuthenticated,
      isAdmin,
      token,
      login(authToken, userRole) {
        if (!authToken) return;
        const cleanToken = authToken.replace(/['"]+/g, '');
        sessionStorage.setItem('avaverse_token', cleanToken);
        setToken(cleanToken);

        const decoded = decodeToken(cleanToken);
        const userIsAdmin = userRole === 'admin' || decoded?.role === 'admin' || decoded?.isAdmin === true;

        sessionStorage.setItem('avaverse_is_admin', userIsAdmin ? 'true' : 'false');
        setIsAdmin(userIsAdmin);

        const destPage = userIsAdmin ? 'admin' : 'create';
        sessionStorage.setItem('avaverse_page', destPage);
        setPage(destPage);
      },
      logout() {
        sessionStorage.clear();
        setToken(null);
        setIsAdmin(false);
        setPage('login');
      },
      navigate(nextPage) {
        sessionStorage.setItem('avaverse_page', nextPage);
        setPage(nextPage);
      },
    };
  }, [isAuthenticated, token, isAdmin]);

  // Écran d'attente anti race-condition pendant la lecture du sessionStorage
  if (isLoading) {
    return (
      <div style={{ background: '#1a1a1a', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p>Vérification de la session en cours...</p>
      </div>
    );
  }

  // Écrans non connectés
  if (!isAuthenticated) {
    return page === 'register' ? <Register session={session} /> : <Login session={session} />;
  }

  // Aiguillage strict des pages pour les utilisateurs connectés
  if (page === 'admin') {
    return <Admin session={session} />;
  }

  if (page === 'library') {
    return <MyAvatars session={session} />;
  }

  return <CreateAvatar session={session} />;
}