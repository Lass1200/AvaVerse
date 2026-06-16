import React, { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const CATEGORY_OPTIONS = [
  'background', 'clothes', 'top', 'facialhair', 'mouth', 'nose', 'eyes', 'eyebrow'
];

// Catégories du visage : même décalage que <g id="Face" transform="translate(76, 82)">
// dans AvatarRenderer.jsx / AvatarController::submit
const FACE_CATEGORIES = ['mouth', 'nose', 'eyes', 'eyebrow', 'facialhair'];

function getPreviewTransform(categorie) {
  return FACE_CATEGORIES.includes(categorie) ? 'translate(76, 82)' : '';
}

export default function AdminCatalog({ session }) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState(CATEGORY_OPTIONS[0]);
  const [svgFile, setSvgFile] = useState(null);
  const [svgPreview, setSvgPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadElements();
  }, []);

  async function loadElements() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/elements`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (!response.ok) {
        throw new Error('Impossible de charger le catalogue.');
      }

      const data = await response.json();
      setElements(data);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setSvgFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setSvgPreview(e.target.result);
    reader.readAsText(file);
  }

  async function handleAdd(event) {
    event.preventDefault();
    setStatus('');

    if (!nom.trim() || !svgPreview) {
      setStatus('Nom et fichier SVG requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          nom: nom.trim(),
          categorie,
          svgContent: svgPreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout.");
      }

      setNom('');
      setSvgFile(null);
      setSvgPreview('');
      setStatus('Élément ajouté avec succès.');
      loadElements();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet élément du catalogue ?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/elements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression.');
      }

      setElements((current) => current.filter((el) => el._id !== id));
    } catch (error) {
      setStatus(error.message);
    }
  }

  const groupedByCategory = useMemo(() => {
    return elements.reduce((acc, el) => {
      acc[el.categorie] = acc[el.categorie] || [];
      acc[el.categorie].push(el);
      return acc;
    }, {});
  }, [elements]);

  return (
    <section className="admin-catalog">
      <div className="admin-heading">
        <h1>Catalogue SVG</h1>
        <p>Ajoute ou retire des éléments graphiques utilisés dans l'éditeur d'avatar.</p>
      </div>

      {status ? <div className="notice-strip">{status}</div> : null}

      <form className="catalog-add-form" onSubmit={handleAdd}>
        <h2>Ajouter un élément</h2>

        <label htmlFor="elementNom">Nom</label>
        <input
          id="elementNom"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="ex: Smile"
          required
        />

        <label htmlFor="elementCategorie">Catégorie</label>
        <select
          id="elementCategorie"
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label htmlFor="elementSvg">Fichier SVG</label>
        <input
          id="elementSvg"
          type="file"
          accept=".svg"
          onChange={handleFileChange}
          required
        />

        {svgPreview ? (
          <div className="svg-preview-box">
            <svg viewBox="0 0 264 280" xmlns="http://www.w3.org/2000/svg">
              <g transform={getPreviewTransform(categorie)} dangerouslySetInnerHTML={{ __html: svgPreview }} />
            </svg>
          </div>
        ) : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ajout...' : 'Ajouter au catalogue'}
        </button>
      </form>

      <div className="catalog-list">
        <h2>Éléments existants</h2>

        {loading ? <div className="notice-strip">Chargement...</div> : null}

        {!loading && Object.keys(groupedByCategory).length === 0 ? (
          <div className="empty-library compact-empty">
            <h3>Aucun élément</h3>
            <p>Le catalogue est vide pour le moment.</p>
          </div>
        ) : null}

        {Object.entries(groupedByCategory).map(([cat, items]) => (
          <div className="catalog-category" key={cat}>
            <h3>{cat}</h3>
            <div className="catalog-grid">
              {items.map((el) => (
                <article className={el.actif ? 'catalog-item' : 'catalog-item inactive'} key={el._id}>
                  <div className="catalog-item-preview">
                    <svg viewBox="0 0 264 280" xmlns="http://www.w3.org/2000/svg">
                      <g transform={getPreviewTransform(el.categorie)} dangerouslySetInnerHTML={{ __html: el.svgContent }} />
                    </svg>
                  </div>
                  <strong>{el.nom}</strong>
                  <button type="button" className="danger-button" onClick={() => handleDelete(el._id)}>
                    Supprimer
                  </button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
