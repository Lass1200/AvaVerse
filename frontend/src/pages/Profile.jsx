import React, { useEffect, useMemo, useState } from 'react';
import NotificationMenu from './NotificationMenu.jsx';

const statusLabels = {
  approved: 'Validé',
  pending: 'En attente',
  rejected: 'Refusé'
};

const activityIcons = {
  approved: '✓',
  pending: '○',
  rejected: '×'
};

export default function Profile({ session }) {
  const [avatars, setAvatars] = useState([]);
  const [status, setStatus] = useState('Chargement du profil...');
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [profileAvatarId, setProfileAvatarId] = useState(() => localStorage.getItem('avaverse_profile_avatar'));

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/avatars/mine', {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    })
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.error || 'Impossible de charger le profil.');
        }
        setAvatars(Array.isArray(data) ? data : []);
        setStatus('');
      })
      .catch((error) => setStatus(error.message));
  }, [session.token]);

  const counts = useMemo(() => ({
    total: avatars.length,
    approved: avatars.filter((avatar) => avatar.status === 'approved').length,
    pending: avatars.filter((avatar) => avatar.status === 'pending').length
  }), [avatars]);

  const recentActivity = avatars.slice(0, 3);
  const displayName = session.pseudo || 'ZakMarket';
  const approvedAvatars = avatars.filter((avatar) => avatar.status === 'approved');
  const selectedProfileAvatar = approvedAvatars.find((avatar) => avatar._id === profileAvatarId);
  const profileAvatarSrc = selectedProfileAvatar
    ? `http://127.0.0.1:8000${selectedProfileAvatar.fichier}`
    : `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=transparent`;

  function selectProfileAvatar(avatar) {
    localStorage.setItem('avaverse_profile_avatar', avatar._id);
    setProfileAvatarId(avatar._id);
    setAvatarPickerOpen(false);
  }

  return (
    <main className="app-page profile-page">
      <Header session={session} />

      <section className="profile-shell">
        <div className="profile-heading">
          <p className="eyebrow">COMPTE UTILISATEUR</p>
          <h1>Profil de {displayName}</h1>
        </div>

        <div className="profile-grid">
          <aside className="profile-card">
            <div className="profile-avatar">
              <img
                src={profileAvatarSrc}
                alt={`Avatar de ${displayName}`}
              />
            </div>

            <h2>{displayName}</h2>
            <p>Créateur d’avatars cartoon pour forum e-commerce.</p>

            <div className="profile-counters">
              <article>
                <strong>{counts.total}</strong>
                <span>avatars</span>
              </article>
              <article>
                <strong>{counts.approved}</strong>
                <span>validés</span>
              </article>
              <article>
                <strong>{counts.pending}</strong>
                <span>attente</span>
              </article>
            </div>

            <div className="profile-card-actions">
              <button type="button" onClick={() => setAvatarPickerOpen(true)}>Changer avatar</button>
              <button className="danger-button" type="button">Supprimer compte</button>
            </div>
          </aside>

          <section className="profile-details">
            <h2>Informations du profil</h2>
            <div className="profile-form-grid">
              <label>
                <span>Pseudo public</span>
                <input type="text" value={displayName} readOnly />
              </label>
              <label>
                <span>Adresse</span>
                <input type="text" value="Utilisateur" readOnly />
              </label>
              <label>
                <span>Style préféré</span>
                <input type="text" value="Cartoon flat Avataaars" readOnly />
              </label>
              <label>
                <span>Genre avatar</span>
                <input type="text" value="masculin" readOnly />
              </label>
            </div>

            <div className="profile-activity">
              <h2>Activité récente</h2>
              {status ? <div className="notice-strip">{status}</div> : null}

              {!status && recentActivity.length === 0 ? (
                <div className="activity-empty">
                  Aucune activité pour le moment.
                </div>
              ) : null}

              {recentActivity.map((avatar) => (
                <article className="activity-row" key={avatar._id}>
                  <span className={`activity-icon activity-${avatar.status}`}>
                    {activityIcons[avatar.status] || '•'}
                  </span>
                  <div>
                    <strong>{avatar.nom} {statusLabels[avatar.status]?.toLowerCase() || avatar.status}</strong>
                    <p>{activityText(avatar.status)}</p>
                  </div>
                  <span className={`status-pill status-${avatar.status}`}>
                    {statusLabels[avatar.status] || avatar.status}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      {avatarPickerOpen ? (
        <section className="profile-picker-backdrop" aria-label="Choisir une photo de profil">
          <div className="profile-picker">
            <div className="profile-picker-head">
              <div>
                <p className="eyebrow">AVATARS VALIDÉS</p>
                <h2>Choisir une photo de profil</h2>
              </div>
              <button type="button" onClick={() => setAvatarPickerOpen(false)}>×</button>
            </div>

            {approvedAvatars.length ? (
              <div className="profile-picker-grid">
                {approvedAvatars.map((avatar) => (
                  <button
                    className={avatar._id === profileAvatarId ? 'selected' : ''}
                    key={avatar._id}
                    type="button"
                    onClick={() => selectProfileAvatar(avatar)}
                  >
                    <img src={`http://127.0.0.1:8000${avatar.fichier}`} alt={avatar.nom} />
                    <span>{avatar.nom}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="activity-empty">
                Tu n’as pas encore d’avatar validé par l’admin.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function activityText(status) {
  if (status === 'approved') {
    return 'Téléchargement SVG autorisé.';
  }
  if (status === 'rejected') {
    return 'Accessoire premium non autorisé.';
  }
  return 'En attente de validation administrateur.';
}

function Header({ session }) {
  return (
    <header className="site-header">
      <button className="brand brand-button" type="button" onClick={() => session.navigate('home')}>
        <img src="/logo.png" alt="AvaVerse" />
      </button>
      <nav className="top-nav" aria-label="Navigation principale">
        <button type="button" onClick={() => session.navigate('home')}>Accueil</button>
        <button type="button" onClick={() => session.navigate('create')}>Créer</button>
        <button type="button" onClick={() => session.navigate('library')}>Bibliothèque</button>
        <button className="active" type="button" onClick={() => session.navigate('profile')}>Profil</button>
      </nav>
      <div className="header-actions">
        <NotificationMenu session={session} />
        <button className="logout-button" type="button" onClick={session.logout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
