import React, { useMemo, useState } from 'react';
import CreateAvatar from './pages/CreateAvatar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('avaverse_token'));
  const [page, setPage] = useState(() => (localStorage.getItem('avaverse_token') ? 'create' : 'login'));

  const isAuthenticated = Boolean(token);

  const session = useMemo(() => ({
    isAuthenticated,
    login(authToken) {
      localStorage.setItem('avaverse_token', authToken);
      setToken(authToken);
      setPage('create');
    },
    logout() {
      localStorage.removeItem('avaverse_token');
      setToken(null);
      setPage('login');
    },
    navigate(nextPage) {
      setPage(nextPage);
    }
  }), [isAuthenticated]);

  if (isAuthenticated && page === 'create') {
    return <CreateAvatar session={session} />;
  }

  if (page === 'register') {
    return <Register session={session} />;
  }

  return <Login session={session} />;
<<<<<<< HEAD
}
=======
}
>>>>>>> dabb2f65cbdde301c5cd28e2569e0df190cebaa3
