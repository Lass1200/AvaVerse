export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

export async function submitAvatar(token, payload) {
  const response = await fetch(`${API_URL}/api/avatars`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de sauvegarder l’avatar.');
  }

  return data;
}

export async function fetchMyAvatars(token) {
  const response = await fetch(`${API_URL}/api/avatars/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de charger la bibliothèque.');
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteMyAvatar(token, id) {
  const response = await fetch(`${API_URL}/api/avatars/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de supprimer l’avatar.');
  }

  return data;
}

export async function fetchAdminAvatars(token, status = 'pending') {
  const response = await fetch(`${API_URL}/api/admin/avatars?status=${status}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de charger les soumissions admin.');
  }

  return Array.isArray(data) ? data : [];
}

export async function moderateAvatar(token, id, status) {
  const response = await fetch(`${API_URL}/api/admin/avatars/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de modérer l’avatar.');
  }

  return data;
}
