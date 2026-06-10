export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function toTechnicalEmail(pseudo) {
  return `${pseudo.trim().toLowerCase()}@avaverse.local`;
}

export async function loginWithPseudo({ pseudo, password }) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: toTechnicalEmail(pseudo),
      password
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Connexion impossible.');
  }

  return data;
}

export async function registerWithPseudo({ pseudo, password }) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: toTechnicalEmail(pseudo),
      pseudo,
      password
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de créer le compte.');
  }

  return data;
}

export async function fetchElements() {
  const response = await fetch(`${API_URL}/api/elements`);
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(data.error || 'Impossible de récupérer les éléments.');
  }

  return Array.isArray(data) ? data : [];
}
