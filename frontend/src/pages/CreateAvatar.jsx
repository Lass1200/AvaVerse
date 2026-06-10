import React, { useEffect, useMemo, useState } from 'react';
import { fetchElements } from '../services/api.js';

const FALLBACK_ELEMENTS = [
  { _id: 'hair-short', categorie: 'top', nom: 'ShortHairShortFlat' },
  { _id: 'hair-bob', categorie: 'top', nom: 'LongHairBob' },
  { _id: 'hair-bun', categorie: 'top', nom: 'LongHairBun' },
  { _id: 'hair-hat', categorie: 'top', nom: 'Hat' },
  { _id: 'eyes-default', categorie: 'eyes', nom: 'Default' },
  { _id: 'eyes-happy', categorie: 'eyes', nom: 'Happy' },
  { _id: 'eyes-wink', categorie: 'eyes', nom: 'Wink' },
  { _id: 'mouth-smile', categorie: 'mouth', nom: 'Smile' },
  { _id: 'mouth-serious', categorie: 'mouth', nom: 'Serious' },
  { _id: 'clothes-hoodie', categorie: 'clothes', nom: 'Hoodie' },
  { _id: 'clothes-shirt', categorie: 'clothes', nom: 'ShirtCrewNeck' },
  { _id: 'accessories-glasses', categorie: 'accessories', nom: 'Prescription01' }
];

const CATEGORY_LABELS = {
  top: 'Cheveux',
  hair: 'Cheveux',
  eyes: 'Yeux',
  yeux: 'Yeux',
  mouth: 'Bouches',
  bouche: 'Bouches',
  clothes: 'Vêtements',
  clothing: 'Vêtements',
  accessories: 'Accessoires',
  facialHair: 'Barbe',
  facialhair: 'Barbe',
  eyebrow: 'Sourcils',
  nose: 'Nez',
  skin: 'Peau',
  background: 'Fond'
};

const DICEBEAR_COLORS = ['b6e3f4', 'ffd5dc', 'ffdfbf', 'c0aede', 'd1d4f9', 'e9f6ff'];

export default function CreateAvatar({ session }) {
  const [elements, setElements] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [selections, setSelections] = useState({});
  const [status, setStatus] = useState('Chargement du catalogue...');

  useEffect(() => {
    let ignore = false;

    fetchElements()
      .then((items) => {
        if (ignore) return;
        const cleanItems = items.filter((item) => item.nom && item.nom.toLowerCase() !== 'index');
        const nextElements = cleanItems.length ? cleanItems : FALLBACK_ELEMENTS;
        const firstCategory = nextElements[0]?.categorie || 'top';

        setElements(nextElements);
        setActiveCategory(firstCategory);
        setStatus(cleanItems.length ? '' : 'Catalogue vide : options de démonstration affichées.');
      })
      .catch(() => {
        if (ignore) return;
        setElements(FALLBACK_ELEMENTS);
        setActiveCategory('top');
        setStatus('API indisponible : options de démonstration affichées.');
      });

    return () => {
      ignore = true;
    };
  }, []);

  const groupedElements = useMemo(() => {
    return elements.reduce((groups, element) => {
      const category = element.categorie || 'autres';
      groups[category] = groups[category] || [];
      groups[category].push(element);
      return groups;
    }, {});
  }, [elements]);

  const categories = Object.keys(groupedElements);
  const activeElements = groupedElements[activeCategory] || [];
  const seed = Object.values(selections).join('-') || 'avaverse';
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${DICEBEAR_COLORS.join(',')}`;

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
          <h1>Personnalisation en temps réel</h1>
          <span>
            Clique sur les catégories et les options pour mettre à jour ton avatar instantanément.
          </span>
        </div>

        {status ? <div className="notice-strip">{status}</div> : null}

        <div className="creator-grid">
          <section className="editor-panel">
            <div className="panel-title-row">
              <h2>{CATEGORY_LABELS[activeCategory] || activeCategory}</h2>
              <button type="button" className="small-accent-button">+ Ajouter accessoire</button>
            </div>

            <div className="category-tabs" role="tablist" aria-label="Catégories de personnalisation">
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
                    key={element._id || `${element.categorie}-${element.nom}`}
                    type="button"
                    className={selected ? 'option-card selected' : 'option-card'}
                    onClick={() => selectElement(element)}
                  >
                    <span className="option-preview" />
                    <strong>{formatOptionName(element.nom)}</strong>
                  </button>
                );
              })}
            </div>

            <div className="color-row" aria-label="Palettes de couleurs">
              {['#ffd3b0', '#c97a35', '#8a4b20', '#211b4a', '#ffd96a', '#d34add'].map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{ backgroundColor: color }}
                  onClick={() => setSelections((current) => ({ ...current, couleur: color }))}
                  aria-label={`Couleur ${color}`}
                />
              ))}
            </div>
          </section>

          <aside className="preview-panel">
            <div className="panel-title-row">
              <h2>Aperçu</h2>
              <span>SVG</span>
            </div>
            <div className="avatar-preview">
              <img src={avatarUrl} alt="Prévisualisation avatar" />
            </div>
            <div className="selection-summary">
              {Object.entries(selections).length ? (
                Object.entries(selections).map(([category, value]) => (
                  <p key={category}>
                    <span>{CATEGORY_LABELS[category] || category}</span>
                    <strong>{formatOptionName(value)}</strong>
                  </p>
                ))
              ) : (
                <p>
                  <span>Avatar</span>
                  <strong>Sélectionne une option</strong>
                </p>
              )}
            </div>
            <div className="preview-actions">
              <button type="button">Sauvegarder</button>
              <button type="button">Télécharger</button>
              <button type="button" className="primary-inline">Demander validation</button>
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
      <nav className="top-nav" aria-label="Navigation principale">
        <button type="button" onClick={() => session.navigate('create')}>Accueil</button>
        <button className="active" type="button" onClick={() => session.navigate('create')}>Créer</button>
        <button type="button" onClick={() => session.navigate('create')}>Bibliothèque</button>
        <button type="button" onClick={() => session.navigate('create')}>Profil</button>
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
