import React, { useState } from 'react';

const AVATAR_URL =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=avaverse-maquette&backgroundColor=b6e3f4&style=circle';

const CATEGORY_LABELS = {
  cheveux: 'Cheveux',
  barbe: 'Barbe',
  sourcils: 'Sourcils',
  yeux: 'Yeux',
  bouches: 'Bouches',
  nez: 'Nez'
};

const MOCK_ELEMENTS = {
  cheveux: ['Court', 'Bouclés', 'Casquette', 'Longs', 'Rasés premium', 'Lunettes', 'Barbe', 'Bouclette'],
  barbe: ['Aucune', 'Barbe courte', 'Moustache', 'Barbe medium'],
  sourcils: ['Défaut', 'Fâché', 'Surpris', 'Triste'],
  yeux: ['Défaut', 'Heureux', 'Clin d’œil', 'Cœurs'],
  bouches: ['Sourire', 'Sérieux', 'Langue', 'Triste'],
  nez: ['Défaut']
};

const DEFAULT_SELECTIONS = {
  cheveux: 'Court',
  yeux: 'Heureux',
  bouches: 'Sourire'
};

export default function CreateAvatar({ session }) {
  const [activeCategory, setActiveCategory] = useState('cheveux');
  const [selections, setSelections] = useState(DEFAULT_SELECTIONS);
  const activeElements = MOCK_ELEMENTS[activeCategory] || [];

  function selectOption(option) {
    setSelections((current) => ({
      ...current,
      [activeCategory]: option
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
            À droite, l’avatar restera visible. Ici on montre les sections prévues pour la personnalisation.
          </span>
        </div>

        <div className="creator-grid">
          <section className="editor-panel">
            <div className="panel-title-row">
              <h2>{CATEGORY_LABELS[activeCategory]}</h2>
              <button type="button" className="small-accent-button">+ Ajouter accessoire</button>
            </div>

            <div className="option-grid">
              {activeElements.map((option) => {
                const selected = selections[activeCategory] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={selected ? 'option-card selected' : 'option-card'}
                    onClick={() => selectOption(option)}
                  >
                    <span className="option-preview" />
                    <strong>{option}</strong>
                  </button>
                );
              })}
            </div>

            <div className="color-row" aria-label="Palettes de couleurs">
              {['#ffd3b0', '#c97a35', '#8a4b20', '#211b4a', '#ffd96a', '#d34add'].map((color) => (
                <button key={color} type="button" style={{ backgroundColor: color }} aria-label={`Couleur ${color}`} />
              ))}
            </div>

            <div className="category-tabs bottom-tabs" role="tablist" aria-label="Catégories de personnalisation">
              {Object.keys(MOCK_ELEMENTS).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === activeCategory ? 'active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </section>

          <aside className="preview-panel">
            <div className="panel-title-row">
              <h2>Aperçu</h2>
              <span>SVG</span>
            </div>
            <div className="avatar-preview">
              <img src={AVATAR_URL} alt="Prévisualisation avatar" />
            </div>
            <div className="selection-summary">
              {Object.entries(selections).map(([category, value]) => (
                <p key={category}>
                  <span>{CATEGORY_LABELS[category]}</span>
                  <strong>{value}</strong>
                </p>
              ))}
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
