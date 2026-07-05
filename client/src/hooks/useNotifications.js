import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { tokenStore } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui';

/**
 * useNotifications — hook de niveau app pour les notifications globales.
 *
 * Écoute :
 * - live:started  → toast "⛪ <paroisse> est EN DIRECT !"  (si ma paroisse)
 * - donation confirmée → toast "💛 Votre don a été confirmé"
 *
 * Ce hook est monté UNE SEULE FOIS dans App.jsx.
 * Il utilise une connexion Socket.io séparée du hook useSocket
 * (qui est pour le viewer live) pour éviter les conflits.
 */
export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;
    if (socketRef.current?.connected) return;

    const socket = io({
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token: tokenStore.get() },
    });

    socket.on('connect', () => {
      // Rejoindre la room de la paroisse de l'utilisateur pour les notifs globales
      if (user.parishId) {
        socket.emit('room:join', {
          parishId: user.parishId,
          liveId: 'notifications', // magic value — le serveur ne compte pas les viewers ici
        });
      }
    });

    // 🔴 Service démarré dans ma paroisse
    socket.on('live:started', (data) => {
      if (data.parishId === user.parishId || user.role === 'super_admin') {
        toast({
          message: `📡 Un service en direct vient de commencer !`,
          type: 'info',
          duration: 6000,
        });
      }
    });

    // ✅ Service terminé
    socket.on('live:ended', (data) => {
      if (data.parishId === user.parishId) {
        toast({
          message: `Service en direct terminé`,
          type: 'info',
          duration: 3000,
        });
      }
    });

    socketRef.current = socket;
  }, [isAuthenticated, user, toast]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [isAuthenticated, connect, disconnect]);
}
