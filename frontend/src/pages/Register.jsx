import React, { useState } from 'react';
import { registerWithPseudo } from '../services/api.js';

export default function Register({ session }) {
  const [form, setForm] = useState({
    pseudo: 'ZakMarket2026',
    password: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    if (form.password.length < 6) {
      setStatus('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const data = await registerWithPseudo(form);

      if (data.token) {
        session.login(data.token);
        return;
      }
      setStatus('Compte créé avec succès.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <Header />
      <section className="register-hero">
        <form className="register-card" onSubmit={handleSubmit}>
          <h1>Créer un compte</h1>
          <p>Un pseudo suffit pour commencer la personnalisation.</p>

          <label htmlFor="pseudo">Pseudo</label>
          <input
            id="pseudo"
            type="text"
            value={form.pseudo}
            onChange={(event) => updateField('pseudo', event.target.value)}
            placeholder="ZakMarket2026"
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="••••••••"
            required
          />

          <label htmlFor="confirmPassword">Mot de passe</label>
          <input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => updateField('confirmPassword', event.target.value)}
            placeholder="Confirmer"
            required
          />

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <button className="login-link" type="button" onClick={() => session.navigate('login')}>
            J’ai déjà un compte
          </button>

          {status ? <div className="form-status">{status}</div> : null}
        </form>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        <img src="/logo.png" alt="AvaVerse" />
      </a>
      <nav className="top-nav" aria-label="Navigation principale">
        <a href="/">Accueil</a>
        <a className="active" href="/register">Compte</a>
        <a href="/avatars">Bibliothèque</a>
      </nav>
      <button className="logout-button" type="button">
        Retour
      </button>
    </header>
  );
}