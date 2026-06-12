import React, { useMemo, useState } from 'react';
import Admin from './pages/Admin.jsx';
import CreateAvatar from './pages/CreateAvatar.jsx';
import Login from './pages/Login.jsx';
import MyAvatars from './pages/MyAvatars.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('avaverse_token'));
  const [role, setRole] = useState(() => localStorage.getItem('avaverse_role') || 'user');
  const [page, setPage] = useState(() => {
    if (!localStorage.getItem('avaverse_token')) {
      return 'login';
    }

    return localStorage.getItem('avaverse_role') === 'admin' ? 'admin' : 'create';
  });

  const isAuthenticated = Boolean(token);
  const isAdmin = isAuthenticated && role === 'admin';

  const session = useMemo(() => ({
    isAuthenticated,
    isAdmin,
    token,
    role,
    login(authToken, userRole = 'user') {
      localStorage.setItem('avaverse_token', authToken);
      localStorage.setItem('avaverse_role', userRole);
      setToken(authToken);
      setRole(userRole);
      setPage(userRole === 'admin' ? 'admin' : 'create');
    },
    logout() {
      localStorage.removeItem('avaverse_token');
      localStorage.removeItem('avaverse_role');
      setToken(null);
      setRole('user');
      setPage('login');
    },
    navigate(nextPage) {
      if (nextPage === 'admin' && role !== 'admin') {
        setPage('create');
        return;
      }

      setPage(nextPage);
    }
  }), [isAuthenticated, isAdmin, role, token]);

  if (isAdmin && page === 'admin') {
    return <Admin session={session} />;
  }

  if (isAuthenticated && page === 'create') {
    return <CreateAvatar session={session} />;
  }

  if (isAuthenticated && page === 'library') {
    return <MyAvatars session={session} />;
  }

  if (page === 'register') {
    return <Register session={session} />;
  }

  return <Login session={session} />;
}
