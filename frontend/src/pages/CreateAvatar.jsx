import React, { useEffect, useMemo, useState } from 'react';
import { fetchElements } from '../services/api.js';
import { SKIN_COLORS } from '../utils/svgFragment.js';
import AvatarRenderer from './AvatarRenderer.jsx';

const CATEGORY_LABELS = {
    skin: 'Peau',
    clothes: 'Vêtements',
    top: 'Cheveux / Coiffure',
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

    useEffect(() => {
        fetchElements()
            .then((data) => {
                setElements(data);
                setActiveCategory('skin');
                setStatus('');
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

    return (
        <main className="app-page">
            <Header session={session} />
            <section className="creator-shell">
                <div className="creator-heading">
                    <p>CRÉATION D’AVATAR</p>
                    <h1>Personnalisation</h1>
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
                    </aside>
                </div>
            </section>
        </main>
    );
}

function Header({ session }) {
    return (
        <header className="site-header">
            <button className="brand brand-button" type="button" onClick={() => session.navigate('create')}>
                <img src="/logo.png" alt="AvaVerse" />
            </button>
            <nav className="top-nav">
                <button type="button" onClick={() => session.navigate('create')}>Accueil</button>
                <button className="active" type="button" onClick={() => session.navigate('create')}>Créer</button>
                <button type="button" onClick={() => session.navigate('create')}>Bibliothèque</button>
            </nav>
            <button className="logout-button" type="button" onClick={session.logout}>
                Déconnexion
            </button>
        </header>
    );
}

function formatOptionName(value) {
    return String(value)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ');
}