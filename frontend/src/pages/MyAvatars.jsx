import React, { useEffect, useMemo, useState } from 'react';
import { API_URL, deleteMyAvatar, fetchMyAvatars } from '../services/api.js';

const statusLabels = {
  approved: 'Validé',
  pending: 'En attente',
  rejected: 'Refusé'
};

export default function MyAvatars({ session }) {
  const [avatars, setAvatars] = useState([]);
  const [status, setStatus] = useState('Chargement de ta bibliothèque...');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    fetchMyAvatars(session.token)
      .then((items) => {
        setAvatars(items);
        setStatus('');
      })
      .catch((error) => setStatus(error.message));
  }, [session.token]);

  const counts = useMemo(() => ({
    total: avatars.length,
    approved: avatars.filter((avatar) => avatar.status === 'approved').length,
    pending: avatars.filter((avatar) => avatar.status === 'pending').length,
    rejected: avatars.filter((avatar) => avatar.status === 'rejected').length
  }), [avatars]);

  async function handleDelete(id) {
    setStatus('');
    try {
      await deleteMyAvatar(session.token, id);
      setAvatars((current) => current.filter((avatar) => avatar._id !== id));
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className="app-page library-page">
      <Header session={session} onNotifications={() => setNotificationsOpen((open) => !open)} />

      <section className="library-layout">
        <aside className="library-sidebar">
          <p className="eyebrow">BIBLIOTHÈQUE PERSO</p>
          <h1>Mes avatars</h1>

          <nav className="library-filter" aria-label="Filtres avatars">
            <button className="active" type="button">
              <span>Tous</span>
              <strong>{counts.total}</strong>
            </button>
            <button type="button">
              <span>Validés</span>
              <strong>{counts.approved}</strong>
            </button>
            <button type="button">
              <span>En attente</span>
              <strong>{counts.pending}</strong>
            </button>
            <button type="button">
              <span>Refusés</span>
              <strong>{counts.rejected}</strong>
            </button>
          </nav>

          <article className="library-rule">
            <h2>Règle téléchargement</h2>
            <p>Un SVG non validé ne peut pas être téléchargé, sauf rôle admin.</p>
          </article>
        </aside>

        <section className="library-content">
          <div className="library-alert">
            <div className="alert-icon">🔔</div>
            <div>
              <strong>{counts.pending ? `${counts.pending} avatar en attente de validation` : 'Aucune validation en attente'}</strong>
              <span>Les avatars soumis apparaissent ici avec leur statut admin.</span>
            </div>
            <button type="button" onClick={() => setNotificationsOpen(true)}>Voir notifications</button>
          </div>

          {notificationsOpen ? (
            <aside className="notification-popover" aria-label="Notifications">
              <div className="notification-head">
                <h2>Notifications</h2>
                <button type="button" onClick={() => setNotificationsOpen(false)}>×</button>
              </div>
              <div className="notification-item">
                <span>✓</span>
                <div>
                  <strong>Avatar accepté</strong>
                  <p>Ton SVG peut maintenant être téléchargé.</p>
                </div>
              </div>
              <div className="notification-item">
                <span>⏱</span>
                <div>
                  <strong>Validation admin</strong>
                  <p>Délai estimé : 15 minutes après soumission.</p>
                </div>
              </div>
              <div className="notification-item">
                <span>×</span>
                <div>
                  <strong>Avatar refusé</strong>
                  <p>Modifie l’accessoire premium puis renvoie.</p>
                </div>
              </div>
            </aside>
          ) : null}

          <div className="library-heading">
            <p className="eyebrow">GESTION</p>
            <h2>Bibliothèque d’avatars</h2>
            <span>Modifier, supprimer, sauvegarder plusieurs avatars et suivre leur validation.</span>
          </div>

          <div className="library-stats">
            <article>
              <strong>{counts.approved}</strong>
              <div>
                <h3>Validés</h3>
                <p>téléchargeables</p>
              </div>
            </article>
            <article>
              <strong>{counts.pending}</strong>
              <div>
                <h3>En attente</h3>
                <p>soumis admin</p>
              </div>
            </article>
            <article>
              <strong>{counts.rejected}</strong>
              <div>
                <h3>Refusé</h3>
                <p>à modifier</p>
              </div>
            </article>
          </div>

          {status ? <div className="notice-strip">{status}</div> : null}

          {avatars.length ? (
            <div className="avatar-library-grid">
              {avatars.map((avatar) => (
                <article className="avatar-library-card" key={avatar._id}>
                  <div className="avatar-card-preview">
                    <img
                      src={avatar.fichier ? `${API_URL}${avatar.fichier}` : `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatar._id}&backgroundColor=transparent`}
                      alt={`Avatar ${avatar.nom}`}
                    />
                  </div>
                  <div className="avatar-card-body">
                    <div className="avatar-card-title">
                      <h3>{avatar.nom}</h3>
                      <span className={`status-pill status-${avatar.status}`}>
                        {statusLabels[avatar.status] || avatar.status}
                      </span>
                    </div>
                    <p>{avatar.status === 'approved' ? 'SVG téléchargeable' : 'Validation admin requise'}</p>
                    <div className="avatar-card-actions">
                      <button type="button">Modifier</button>
                      <button type="button" disabled={avatar.status !== 'approved'}>Télécharger</button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(avatar._id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-library">
              <h3>Aucun avatar pour le moment</h3>
              <p>Crée ton premier avatar, puis demande sa validation pour le voir apparaître ici.</p>
              <button type="button" onClick={() => session.navigate('create')}>Créer un avatar</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Header({ session, onNotifications }) {
  return (
    <header className="site-header">
      <button className="brand brand-button" type="button" onClick={() => session.navigate('create')}>
        <img src="/logo.png" alt="AvaVerse" />
      </button>
      <nav className="top-nav" aria-label="Navigation principale">
        <button type="button" onClick={() => session.navigate('create')}>Accueil</button>
        <button type="button" onClick={() => session.navigate('create')}>Créer</button>
        <button className="active" type="button" onClick={() => session.navigate('library')}>Bibliothèque</button>
        <button type="button" onClick={() => session.navigate('library')}>Profil</button>
      </nav>
      <div className="header-actions">
        <button className="notification-button" type="button" onClick={onNotifications}>🔔</button>
        <button className="logout-button" type="button" onClick={session.logout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
