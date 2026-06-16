import React, { useEffect, useMemo, useState } from 'react';
import { fetchElements } from '../services/api.js';
import { SKIN_COLORS } from '../utils/svgFragment.js';
import AvatarRenderer from './AvatarRenderer.jsx';
import NotificationMenu from './NotificationMenu.jsx';

const CATEGORY_LABELS = {
    background: 'Fond',
    skin: 'Peau',
    clothes: 'Vêtements',
    top: 'Cheveux',
    facialhair: 'Barbe',
    mouth: 'Bouche',
    nose: 'Nez',
    eyes: 'Yeux',
    eyebrow: 'Sourcils'
};

const DEFAULT_SELECTIONS = {
    skin: 'Light',
    clothes: 'Hoodie',
    top: 'LongHairStraight',
    facialhair: 'Blank',
    mouth: 'Smile',
    nose: 'Default',
    eyes: 'Default',
    eyebrow: 'Default'
};

export default function CreateAvatar({ session }) {
    const [elements, setElements] = useState([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [selections, setSelections] = useState(DEFAULT_SELECTIONS);
    const [status, setStatus] = useState('Chargement du catalogue...');
    const [avatarName, setAvatarName] = useState('Mon Avatar');
    const [isSaving, setIsSaving] = useState(false);
    const [editSource, setEditSource] = useState(null);

    useEffect(() => {
        const draft = loadEditDraft();
        if (draft?.selections) {
            setSelections({
                ...DEFAULT_SELECTIONS,
                ...draft.selections
            });
            setAvatarName(`Copie de ${draft.sourceName || 'Mon Avatar'}`);
            setEditSource(draft);
        }

        fetchElements()
            .then((data) => {
                setElements(data);
                setActiveCategory('skin');
                setStatus(draft ? 'Modification depuis un avatar existant : l’original reste validé, la copie sera soumise à l’admin.' : '');
            })
            .catch((err) => {
                console.error(err);
                setStatus('Erreur : Impossible de charger le catalogue.');
            });
    }, []);

    const svgElements = useMemo(() => {
        const parts = {};
        const catalogCategories = ['clothes', 'top', 'facialhair', 'mouth', 'nose', 'eyes', 'eyebrow'];

        for (const category of catalogCategories) {
            const selectedName = selections[category];
            const element = elements.find(
                (item) => item.categorie === category && item.nom === selectedName
            );
            parts[category] = element?.svgContent || '';
        }

        return parts;
    }, [elements, selections]);

    const groupedElements = useMemo(() => {
        const groups = elements.reduce((acc, element) => {
            const category = element.categorie || 'autres';
            acc[category] = acc[category] || [];
            acc[category].push(element);
            return acc;
        }, {});

        groups.skin = Object.keys(SKIN_COLORS).map((nom) => ({
            _id: `skin-${nom}`,
            nom,
            categorie: 'skin'
        }));

        return groups;
    }, [elements]);

    const categories = useMemo(() => {
        const preferredOrder = ['skin', 'clothes', 'top', 'facialhair', 'mouth', 'nose', 'eyes', 'eyebrow'];
        const available = Object.keys(groupedElements);
        return preferredOrder.filter((category) => available.includes(category));
    }, [groupedElements]);
    
    const activeElements = groupedElements[activeCategory] || [];

    function selectElement(element) {
        setSelections((current) => ({
            ...current,
            [element.categorie]: element.nom
        }));
    }

    async function handleSave() {
        console.log("=== DIAGNOSTIC SESSION ===", session);

        // Récupère le token peu importe sa position dans l'objet session
        const token = session?.token || session?.user?.token || session?.jwt;

        if (!token) { 
            setStatus("Erreur : Vous n'êtes pas connecté (Aucun token trouvé).");
            return;
        }

        setIsSaving(true);
        setStatus('Sauvegarde en cours...');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/avatars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Utilise le token détecté
                },
                body: JSON.stringify({
                    selections: selections,
                    nom: avatarName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Erreur lors de la sauvegarde');
            }

            setStatus('Avatar soumis avec succès !');
            localStorage.removeItem('avaverse_edit_draft');
            setEditSource(null);
            setTimeout(() => {
                session.navigate('library');
            }, 1500);

        } catch (error) {
            console.error(error);
            setStatus(`Erreur : ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="app-page">
            <Header session={session} />
            <section className="creator-shell">
                <div className="creator-heading">
                    <p>CRÉATION D’AVATAR</p>
                    <h1>{editSource ? 'Modifier une copie' : 'Personnalisation'}</h1>
                    {editSource ? (
                        <span>
                            Avatar source : {editSource.sourceName}. Enregistrer crée une nouvelle demande de validation.
                        </span>
                    ) : null}
                </div>

                {status ? <div className="notice-strip">{status}</div> : null}

                <div className="creator-grid">
                    <section className="editor-panel">
                        <div className="panel-title-row">
                            <h2>{CATEGORY_LABELS[activeCategory] || activeCategory}</h2>
                        </div>

                        <div className="category-tabs" role="tablist">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    className={category === activeCategory ? 'active' : ''}
                                    onClick={() => setActiveCategory(category)}
                                >
                                    {CATEGORY_LABELS[category] || category}
                                </button>
                            ))}
                        </div>

                        <div className="option-grid">
                            {activeElements.map((element) => {
                                const selected = selections[element.categorie] === element.nom;
                                return (
                                    <button
                                        key={element._id}
                                        type="button"
                                        className={selected ? 'option-card selected' : 'option-card'}
                                        onClick={() => selectElement(element)}
                                    >
                                        <strong>{formatOptionName(element.nom)}</strong>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <aside className="preview-panel">
                        <div className="avatar-preview">
                            <AvatarRenderer selections={svgElements} skinName={selections.skin} />
                        </div>
                        
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                            <input
                                type="text"
                                value={avatarName}
                                onChange={(e) => setAvatarName(e.target.value)}
                                placeholder="Nom de l'avatar"
                                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                            <button 
                                type="button" 
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {isSaving ? 'Envoi...' : editSource ? 'Soumettre la copie modifiée' : 'Soumettre pour validation'}
                            </button>
                        </div>
                    </aside>
                </div>
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
            <nav className="top-nav">
                <button type="button" onClick={() => session.navigate('home')}>Accueil</button>
                <button className="active" type="button" onClick={() => session.navigate('create')}>Créer</button>
                <button type="button" onClick={() => session.navigate('library')}>Bibliothèque</button>
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

function formatOptionName(value) {
    return String(value)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ');
}

function loadEditDraft() {
    try {
        const rawDraft = localStorage.getItem('avaverse_edit_draft');
        return rawDraft ? JSON.parse(rawDraft) : null;
    } catch (error) {
        localStorage.removeItem('avaverse_edit_draft');
        return null;
    }
}
