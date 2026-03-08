// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);


//  
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { admin, loading, logout } = useAuth();

    

    const socketRef = useRef(null);

    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | connecting | connected | disconnected | error
    const [error, setError] = useState(null);

    const socketOptions = useMemo(() => {
        return {
            withCredentials: true,            //  cookie-based auth support (your current setup)
            transports: ['websocket'],        //  prefer websocket in production
            reconnection: true,
            reconnectionAttempts: Infinity,   //  keep trying
            reconnectionDelay: 500,
            reconnectionDelayMax: 5000,
            timeout: 10000,
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleForceLogout = (payload) => {
            // payload = { reason, message, timestamp }
            // Security-first: immediately logout
            logout();
        };

        socket.on('force_logout', handleForceLogout);

        return () => {
            socket.off('force_logout', handleForceLogout);
        };
    }, [socket, logout]);


    useEffect(() => {
        // Wait for auth to finish
        if (loading) return;

        // If not logged in → disconnect
        if (!admin) {
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
            setConnected(false);
            setStatus('idle');
            setError(null);
            return;
        }

        // If logged in and no socket yet → connect
        if (!socketRef.current) {
            setStatus('connecting');
            setError(null);

            const s = io(SOCKET_URL, socketOptions);
            socketRef.current = s;
            setSocket(s);

            const onConnect = () => {
                setConnected(true);
                setStatus('connected');
                setError(null);
            };

            const onDisconnect = () => {
                setConnected(false);
                setStatus('disconnected');
            };

            const onConnectError = (err) => {
                setConnected(false);
                setStatus('error');
                setError(err?.message || 'Socket connection error');
            };

            s.on('connect', onConnect);
            s.on('disconnect', onDisconnect);
            s.on('connect_error', onConnectError);

            // Cleanup listeners if effect reruns
            return () => {
                s.off('connect', onConnect);
                s.off('disconnect', onDisconnect);
                s.off('connect_error', onConnectError);
            };
        }
    }, [admin, loading, socketOptions]);

    // ----------------------------------------------------------
    // 🔴 NEW: Automatically join the Admin's Personal Room
    // ----------------------------------------------------------
    useEffect(() => {
        if (socket && connected && admin?._id) {
            // Join the room specifically for this admin (e.g., "admin_65a1b...")
            // This enables: Unread Badges, Blue Toasts, and Dashboard Grid Refresh
            socket.emit('join_admin_room', { adminId: admin._id });
            
            
        }
    }, [socket, connected, admin]);

    // Hard cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected, status, error }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocketContext must be used within SocketProvider');
    return context;
};
