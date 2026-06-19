import React, { useEffect, useMemo, useState } from 'react';
import NotificationMenu from './NotificationMenu.jsx';

const statusLabels = {
  approved: 'Validé',
  pending: 'En attente',
  rejected: 'Refusé'
};

export default function MyAvatars({ session }) {
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

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

    const filteredAvatars = useMemo(() => {
        if (activeFilter === 'all') {
            return avatars;
        }

        return avatars.filter((avatar) => avatar.status === activeFilter);
    }, [activeFilter, avatars]);

    const activeFilterLabel = {
        all: 'Tous les avatars',
        approved: 'Avatars validés',
        pending: 'Avatars en attente',
        rejected: 'Avatars refusés'
    }[activeFilter];

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
            <Header session={session} />

            <section className="library-layout">
                <aside className="library-sidebar">
                    <p className="eyebrow">BIBLIOTHÈQUE PERSO</p>
                    <h1>Mes avatars</h1>

                    <nav className="library-filter" aria-label="Filtres avatars">
                        <button
                            className={activeFilter === 'all' ? 'active' : ''}
                            type="button"
                            onClick={() => setActiveFilter('all')}
                        >
                            <span>Tous</span>
                            <strong>{counts.total}</strong>
                        </button>
                        <button
                            className={activeFilter === 'approved' ? 'active' : ''}
                            type="button"
                            onClick={() => setActiveFilter('approved')}
                        >
                            <span>Validés</span>
                            <strong>{counts.approved}</strong>
                        </button>
                        <button
                            className={activeFilter === 'pending' ? 'active' : ''}
                            type="button"
                            onClick={() => setActiveFilter('pending')}
                        >
                            <span>En attente</span>
                            <strong>{counts.pending}</strong>
                        </button>
                        <button
                            className={activeFilter === 'rejected' ? 'active' : ''}
                            type="button"
                            onClick={() => setActiveFilter('rejected')}
                        >
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
		                    <div className="library-heading">
	                        <p className="eyebrow">GESTION</p>
	                        <h2>Bibliothèque d'avatars</h2>
	                        <span>{activeFilterLabel} : {filteredAvatars.length} résultat{filteredAvatars.length > 1 ? 's' : ''}.</span>
	                    </div>
	
	                    {loading && <div className="notice-strip">Chargement de vos créations...</div>}
	                    {error && <div className="notice-strip">{error}</div>}
	
	                    {!loading && filteredAvatars.length ? (
	                        <div className="avatar-library-grid">
	                            {filteredAvatars.map((avatar) => (
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
                                        <p>
                                            {avatar.status === 'approved'
                                                ? 'SVG téléchargeable'
                                                : avatar.status === 'rejected'
                                                    ? `Motif de refus : ${avatar.rejectionReason || 'Aucun motif précisé.'}`
                                                    : 'Validation admin requise'}
                                        </p>
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

	                    {!loading && avatars.length > 0 && filteredAvatars.length === 0 ? (
	                        <div className="empty-library">
	                            <h3>Aucun résultat</h3>
	                            <p>Aucun avatar ne correspond au filtre “{activeFilterLabel}”.</p>
	                            <button type="button" onClick={() => setActiveFilter('all')}>Voir tous les avatars</button>
	                        </div>
	                    ) : null}
                </section>
            </section>
        </main>
    );
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
                <button className="active" type="button" onClick={() => session.navigate('library')}>Bibliothèque</button>
                <button type="button" onClick={() => session.navigate('profile')}>Profil</button>
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
