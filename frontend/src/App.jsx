import React, { useMemo, useState, useEffect } from 'react';
import CreateAvatar from './pages/CreateAvatar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import MyAvatars from './pages/MyAvatars.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';

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
  const [pseudo, setPseudo] = useState('Utilisateur');
  const [page, setPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  // Fusion : Restauration de la session ET du pseudo au F5
  useEffect(() => {
    const savedToken = sessionStorage.getItem('avaverse_token');
    const savedPage = sessionStorage.getItem('avaverse_page');
    const savedPseudo = sessionStorage.getItem('avaverse_pseudo');

    if (savedToken && savedToken !== 'null' && savedToken !== 'undefined') {
      const cleanToken = savedToken.replace(/['"]+/g, '');
      const decoded = decodeToken(cleanToken);
      
      const userIsAdmin = decoded?.role === 'admin' || decoded?.isAdmin === true || sessionStorage.getItem('avaverse_is_admin') === 'true';

      setToken(cleanToken);
      setIsAdmin(userIsAdmin);
      setPseudo(savedPseudo || 'Utilisateur');
      setPage(savedPage || (userIsAdmin ? 'admin' : 'create'));
    } else {
      setPage(savedPage || 'home');
    }
    setIsLoading(false);
  }, []);

  const isAuthenticated = Boolean(token);

  const session = useMemo(() => {
    return {
      isAuthenticated,
      isAdmin,
      token,
      pseudo, // Ajout du pseudo pour la page Profile de ton binôme
      login(authToken, userRole, userPseudo) {
        if (!authToken) return;
        const cleanToken = authToken.replace(/['"]+/g, '');
        sessionStorage.setItem('avaverse_token', cleanToken);
        setToken(cleanToken);

        const decoded = decodeToken(cleanToken);
        const userIsAdmin = userRole === 'admin' || decoded?.role === 'admin' || decoded?.isAdmin === true;

        sessionStorage.setItem('avaverse_is_admin', userIsAdmin ? 'true' : 'false');
        setIsAdmin(userIsAdmin);

        // Sauvegarde du pseudo
        const finalPseudo = userPseudo || 'Utilisateur';
        sessionStorage.setItem('avaverse_pseudo', finalPseudo);
        setPseudo(finalPseudo);

        const destPage = userIsAdmin ? 'admin' : 'create';
        sessionStorage.setItem('avaverse_page', destPage);
        setPage(destPage);
      },
      logout() {
        sessionStorage.clear();
        setToken(null);
        setIsAdmin(false);
        setPseudo('Utilisateur');
        setPage('home');
      },
      navigate(nextPage) {
        sessionStorage.setItem('avaverse_page', nextPage);
        setPage(nextPage);
      },
    };
  }, [isAuthenticated, token, isAdmin, pseudo]);

  if (isLoading) {
    return (
      <div style={{ background: '#1a1a1a', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p>Vérification de la session en cours...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (page === 'home') return <Home session={session} />;
    return page === 'register' ? <Register session={session} /> : <Login session={session} />;
  }

  // Aiguillage incluant la nouvelle page Profile
  if (page === 'home') return <Home session={session} />;
  if (page === 'admin') return <Admin session={session} />;
  if (page === 'library') return <MyAvatars session={session} />;
  if (page === 'profile') return <Profile session={session} />;

  return <CreateAvatar session={session} />;
}
