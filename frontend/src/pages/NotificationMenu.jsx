import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const notificationCopy = {
  approved: {
    title: 'Avatar accepté',
    text: 'Ton SVG peut maintenant être téléchargé.',
    icon: '✓'
  },
  pending: {
    title: 'Avatar soumis',
    text: 'En attente de validation par l’admin.',
    icon: '○'
  },
  rejected: {
    title: 'Avatar refusé',
    text: 'Modifie ton avatar puis renvoie une demande.',
    icon: '×'
  }
};

export default function NotificationMenu({ session }) {
  const [avatars, setAvatars] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    fetch('http://127.0.0.1:8000/api/avatars/mine', {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setAvatars(Array.isArray(data) ? data : []))
      .catch(() => setAvatars([]));
  }, [session?.token]);

  const notifications = useMemo(() => {
    const recentAvatars = avatars.slice(0, 5);

    if (!recentAvatars.length) {
      return [{
        _id: 'empty',
        title: 'Aucune notification',
        text: 'Tes demandes de validation apparaîtront ici.',
        icon: '○',
        status: 'empty'
      }];
    }

    return recentAvatars.map((avatar) => ({
      _id: avatar._id,
      title: notificationCopy[avatar.status]?.title || 'Mise à jour avatar',
      text: `${avatar.nom} - ${notificationCopy[avatar.status]?.text || 'Statut mis à jour.'}`,
      icon: notificationCopy[avatar.status]?.icon || '○',
      status: avatar.status
    }));
  }, [avatars]);

  return (
    <>
      <button className="notification-button" type="button" onClick={() => setOpen((current) => !current)} aria-label="Notifications">
        <span>{avatars.length}</span>
      </button>

      {open ? createPortal(
        <aside className="notification-popover global-notification-popover" aria-label="Notifications">
          <div className="notification-head">
            <h2>Notifications</h2>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="notification-list">
            {notifications.map((notification) => (
              <div className={`notification-item notification-${notification.status}`} key={notification._id}>
                <span>{notification.icon}</span>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.text}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="notification-footer-button" type="button" onClick={() => setOpen(false)}>
            Fermer
          </button>
        </aside>,
        document.body
      ) : null}
    </>
  );
}
