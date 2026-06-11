import React, { useState } from 'react';
import { loginWithPseudo } from '../services/api.js';

export default function Login({ session }) {
  const [form, setForm] = useState({
    pseudo: 'Griche1524',
    password: '',
    isAdmin: false
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    if (!form.pseudo.trim() || !form.password) {
      setStatus('Pseudo et mot de passe requis.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginWithPseudo(form);

      if (form.isAdmin && data.role !== 'admin') {
        setStatus('Ce compte n’est pas administrateur.');
        return;
      }

      session.login(data.token);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <Header session={session} />
      <section className="register-hero">
        <form className="register-card" onSubmit={handleSubmit}>
          <h1>Connexion</h1>
          <p>Connecte-toi avec ton pseudo pour retrouver ta bibliothèque.</p>

          <label htmlFor="loginPseudo">Pseudo</label>
          <input
            id="loginPseudo"
            type="text"
            value={form.pseudo}
            onChange={(event) => updateField('pseudo', event.target.value)}
            placeholder="Griche1524"
            required
          />

          <label htmlFor="loginPassword">Mot de passe</label>
          <input
            id="loginPassword"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="••••••••"
            required
          />

          <label className="checkbox-row" htmlFor="adminLogin">
            <input
              id="adminLogin"
              type="checkbox"
              checked={form.isAdmin}
              onChange={(event) => updateField('isAdmin', event.target.checked)}
            />
            <span>Connexion administrateur</span>
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <button className="login-link" type="button" onClick={() => session.navigate('register')}>
            Créer un compte
          </button>

          {status ? <div className="form-status">{status}</div> : null}
        </form>
      </section>
    </main>
  );
}

function Header({ session }) {
  return (
    <header className="site-header">
      <button className="brand brand-button" type="button" onClick={() => session.navigate('login')}>
        <img src="/logo.png" alt="AvaVerse" />
      </button>
      <nav className="top-nav" aria-label="Navigation principale">
        <button type="button" onClick={() => session.navigate('login')}>Accueil</button>
        <button className="active" type="button" onClick={() => session.navigate('login')}>Compte</button>
        <button type="button" onClick={() => session.navigate('create')}>Bibliothèque</button>
      </nav>
      <button className="logout-button" type="button" onClick={() => session.navigate('register')}>
        Inscription
      </button>
    </header>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> dabb2f65cbdde301c5cd28e2569e0df190cebaa3
