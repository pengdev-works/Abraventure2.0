import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, refreshUser } = useAuth();
  const { addToast } = useToast ? useToast() : { addToast: () => {} };
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Determine the socket server URL: in local dev, connect directly to backend (port 5000)
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' &&
       (window.location.port === '3000' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[REALTIME] Connected to server socket:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[REALTIME] Disconnected from server socket:', reason);
      setConnected(false);
    });

    // Handle account status change (e.g., approved/rejected by admin)
    newSocket.on('account:status_changed', (data) => {
      console.log('[REALTIME] Account status changed:', data);
      if (refreshUser) {
        refreshUser();
      }
      if (addToast) {
        if (data.status === 'APPROVED') {
          addToast('🎉 Congratulations! Your account application has been approved by the Tourism Office!', 'success');
        } else if (data.status === 'REJECTED') {
          addToast(`Application status updated: REJECTED. ${data.remarks ? `Reason: ${data.remarks}` : ''}`, 'error');
        } else if (data.status === 'ENDORSED') {
          addToast('Your application has been endorsed to the Provincial Tourism Office for final review.', 'info');
        }
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || { socket: null, connected: false };
};

/**
 * Custom hook to subscribe to a real-time socket event with automatic cleanup
 */
export const useSocketEvent = (eventName, handler) => {
  const { socket } = useSocket();
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket || !eventName) return;

    const eventListener = (...args) => {
      if (savedHandler.current) {
        savedHandler.current(...args);
      }
    };

    socket.on(eventName, eventListener);

    return () => {
      socket.off(eventName, eventListener);
    };
  }, [socket, eventName]);
};
