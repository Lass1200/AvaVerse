import React from 'react';

export default function Home({ session }) {
  const ctaPage = session.isAuthenticated ? 'create' : 'register';

  return (
    <main className="home-page">
      <Header session={session} />

      <section className="home-hero">
        <div className="home-copy">
          <h1>Crée ton avatar cartoon, sans montrer ta vraie photo.</h1>
          <p>
            AvaVerse permet de personnaliser un avatar SVG de style flat cartoon :
            peau, visage, yeux, nez, cheveux, fond, lunettes, casquette, barbe et accessoires.
          </p>
          <button className="cyan-button" type="button" onClick={() => session.navigate(ctaPage)}>
            {session.isAuthenticated ? 'Créer un avatar' : 'Créer un compte'}
          </button>
        </div>

        <div className="home-visual" aria-label="Aperçu AvaVerse">
          <div className="home-visual-back" />
          <div className="home-avatar-card">
            <div className="home-avatar-mark" aria-hidden="true">
              <span className="home-avatar-head" />
              <span className="home-avatar-body" />
            </div>
          </div>
          <span className="home-tag home-tag-top">⚡ Prévisualisation temps réel</span>
          <span className="home-tag home-tag-side">✨ SVG animé</span>
          <span className="home-tag home-tag-bottom">🛡 Sans vraie photo</span>
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
      <nav className="top-nav" aria-label="Navigation principale">
        <button className="active" type="button" onClick={() => session.navigate('home')}>Accueil</button>
        <button type="button" onClick={() => session.navigate(session.isAuthenticated ? 'create' : 'register')}>Compte</button>
        <button type="button" onClick={() => session.navigate(session.isAuthenticated ? 'library' : 'login')}>Bibliothèque</button>
      </nav>
      <button className="logout-button" type="button" onClick={() => session.navigate(session.isAuthenticated ? 'create' : 'login')}>
        {session.isAuthenticated ? 'Découvrir' : 'Connexion'}
      </button>
    </header>
  );
}
