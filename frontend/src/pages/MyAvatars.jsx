import React, { useEffect, useMemo, useState } from 'react';

const statusLabels = {
  approved: 'Validé',
  pending: 'En attente',
  rejected: 'Refusé'
};

export default function MyAvatars({ session }) {
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        fetchAvatars();
    }, []);

    const fetchAvatars = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://127.0.0.1:8000/api/avatars/mine', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.token}`
                }
            });

            if (!response.ok) throw new Error('Impossible de charger vos avatars.');

            const data = await response.json();
            setAvatars(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const counts = useMemo(() => ({
        total: avatars.length,
        approved: avatars.filter((avatar) => avatar.status === 'approved').length,
        pending: avatars.filter((avatar) => avatar.status === 'pending').length,
        rejected: avatars.filter((avatar) => avatar.status === 'rejected').length
    }), [avatars]);

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet avatar définitivement ?')) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/avatars/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.token}`
                }
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression.');

            setAvatars(avatars.filter(avatar => avatar._id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDownload = async (avatar) => {
        if (avatar.status !== 'approved') {
            alert("Cet avatar n'a pas encore été approuvé par l'administrateur.");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/avatars/download/${avatar._id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.token}`
                }
            });

            if (!response.ok) throw new Error('Erreur de téléchargement.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${avatar.nom}.svg`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (avatar) => {
        if (!avatar.selections || Object.keys(avatar.selections).length === 0) {
            alert("Impossible de modifier cet avatar : ses paramètres de personnalisation ne sont pas disponibles.");
            return;
        }

        localStorage.setItem('avaverse_edit_draft', JSON.stringify({
            sourceId: avatar._id,
            sourceName: avatar.nom,
            selections: avatar.selections
        }));
        session.navigate('create');
    };
    

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
                        <div className="alert-icon"></div>
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
                                <span></span>
                                <div>
                                    <strong>Validation admin</strong>
                                    <p>Délai estimé : 15 minutes après soumission.</p>
                                </div>
                            </div>
                            <div className="notification-item">
                                <span>×</span>
                                <div>
                                    <strong>Avatar refusé</strong>
                                    <p>Modifie l'accessoire premium puis renvoie.</p>
                                </div>
                            </div>
                        </aside>
                    ) : null}

                    <div className="library-heading">
                        <p className="eyebrow">GESTION</p>
                        <h2>Bibliothèque d'avatars</h2>
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

                    {loading && <div className="notice-strip">Chargement de vos créations...</div>}
                    {error && <div className="notice-strip">{error}</div>}

                    {!loading && avatars.length ? (
                        <div className="avatar-library-grid">
                            {avatars.map((avatar) => (
                                <article className="avatar-library-card" key={avatar._id}>
                                    <div className="avatar-card-preview">
                                        {avatar.svgContent ? (
                                            <div
                                                className="avatar-inline-svg"
                                                aria-label={avatar.nom}
                                                dangerouslySetInnerHTML={{ __html: avatar.svgContent }}
                                            />
                                        ) : (
                                            <img
                                                src={`http://127.0.0.1:8000${avatar.fichier}`}
                                                alt={avatar.nom}
                                            />
                                        )}
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
                                            <button type="button" onClick={() => handleEdit(avatar)}>Modifier</button>
                                            <button
                                                type="button"
                                                disabled={avatar.status !== 'approved'}
                                                onClick={() => handleDownload(avatar)}
                                            >
                                                Télécharger
                                            </button>
                                            <button type="button" className="danger-button" onClick={() => handleDelete(avatar._id)}>
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : null}

                    {!loading && !avatars.length ? (
                        <div className="empty-library">
                            <h3>Aucun avatar pour le moment</h3>
                            <p>Crée ton premier avatar, puis demande sa validation pour le voir apparaître ici.</p>
                            <button type="button" onClick={() => session.navigate('create')}>Créer un avatar</button>
                        </div>
                    ) : null}
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
                <button type="button" onClick={() => session.navigate('profile')}>Profil</button>
            </nav>
            <div className="header-actions">
                <button className="notification-button" type="button" onClick={onNotifications}></button>
                <button className="logout-button" type="button" onClick={session.logout}>
                    Déconnexion
                </button>
            </div>
        </header>
    );
}
