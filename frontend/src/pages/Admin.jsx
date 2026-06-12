import React, { useEffect, useState } from 'react';
import { API_URL, fetchAdminAvatars, moderateAvatar } from '../services/api.js';

export default function Admin({ session }) {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('Chargement des soumissions...');

  useEffect(() => {
    if (!session.isAdmin) {
      return;
    }

    fetchAdminAvatars(session.token)
      .then((items) => {
        setPendingSubmissions(items);
        setSelected(items[0] || null);
        setStatus('');
      })
      .catch((error) => setStatus(error.message));
  }, [session.isAdmin, session.token]);

  async function handleModerate(id, nextStatus) {
    setStatus('');
    try {
      await moderateAvatar(session.token, id, nextStatus);
      setPendingSubmissions((current) => {
        const nextItems = current.filter((avatar) => avatar._id !== id);
        setSelected(nextItems[0] || null);
        return nextItems;
      });
    } catch (error) {
      setStatus(error.message);
    }
  }

  if (!session.isAdmin) {
    return (
      <main className="register-page">
        <Header session={session} />
        <section className="register-hero">
          <div className="register-card">
            <h1>Accès refusé</h1>
            <p>Cette page est réservée aux administrateurs.</p>
            <button className="primary-button" type="button" onClick={() => session.navigate('create')}>
              Retour à l’application
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page admin-page">
      <Header session={session} />

      <section className="admin-shell">
        <div className="admin-heading">
          <h1>Dashboard administrateur</h1>
          <p>Validation avant publication, gestion des éléments SVG, contrôle des modèles premium.</p>
        </div>

        <div className="admin-grid">
          <section className="admin-panel">
            <h2>Soumissions à valider</h2>

            <div className="submission-list">
              {status ? <div className="notice-strip">{status}</div> : null}
              {!status && pendingSubmissions.length === 0 ? (
                <div className="empty-library compact-empty">
                  <h3>Aucune soumission</h3>
                  <p>Les avatars envoyés par les utilisateurs apparaîtront ici.</p>
                </div>
              ) : null}
              {pendingSubmissions.map((submission) => (
                <article
                  className={selected?._id === submission._id ? 'submission-row active' : 'submission-row'}
                  key={submission._id}
                >
                  <button
                    className="submission-main"
                    type="button"
                    onClick={() => setSelected(submission)}
                  >
                    <span className="submission-avatar" />
                    <span>
                      <strong>{submission.nom}</strong>
                      <small>Utilisateur {submission.userId}</small>
                    </span>
                  </button>

                  <span className="waiting-pill">En attente</span>
                  <span className="submission-delay">{formatDelay(submission.createdAt)}</span>

                  <div className="submission-actions">
                    <button type="button" onClick={() => handleModerate(submission._id, 'approved')} aria-label={`Valider ${submission.nom}`}>✓</button>
                    <button type="button" onClick={() => handleModerate(submission._id, 'rejected')} aria-label={`Refuser ${submission.nom}`}>×</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="admin-preview-card">
            {selected ? (
              <>
                <div className="admin-avatar-preview">
                  <img
                    src={selected.fichier ? `${API_URL}${selected.fichier}` : `https://api.dicebear.com/9.x/avataaars/svg?seed=${selected._id}&backgroundColor=transparent`}
                    alt={`Avatar ${selected.nom}`}
                  />
                </div>
                <div className="admin-preview-body">
                  <h3>{selected.nom}</h3>
                  <div className="admin-preview-actions">
                    <button type="button">Modifier</button>
                    <button className="reject-button" type="button" onClick={() => handleModerate(selected._id, 'rejected')}>Refusé</button>
                  </div>
                </div>
                <button className="validate-download-button" type="button" onClick={() => handleModerate(selected._id, 'approved')}>
                  Valider le téléchargement
                </button>
              </>
            ) : (
              <div className="admin-preview-empty">
                <h3>Aucun avatar sélectionné</h3>
                <p>Les nouvelles demandes de validation apparaîtront ici.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function formatDelay(createdAt) {
  if (!createdAt) {
    return '-';
  }

  return createdAt.slice(0, 10);
}

function Header({ session }) {
  return (
    <header className="site-header admin-header">
      <button className="brand brand-button" type="button" onClick={() => session.navigate('admin')}>
        <img src="/logo.png" alt="AvaVerse" />
      </button>
      <nav className="top-nav" aria-label="Navigation administrateur">
        <button className="active" type="button" onClick={() => session.navigate('admin')}>Admin</button>
        <button type="button" onClick={() => session.navigate('admin')}>Catalogue SVG</button>
        <button type="button" onClick={() => session.navigate('admin')}>Utilisateurs</button>
      </nav>
      <button className="logout-button" type="button" onClick={session.logout}>
        Déconnexion admin
      </button>
    </header>
  );
}
