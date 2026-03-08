// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * Custom hook to subscribe to socket events with automatic cleanup
 * 
 * @param {string} eventName - The socket event to listen to
 * @param {function} handler - Callback function when event is received
 * @param {array} deps - Additional dependencies for the effect
 * 
 * @example
 * useSocket('new_lead', (data) => {
 *   console.log('New lead received:', data);
 * });
 */



export const useSocket = (eventName, handler, deps = [], options = {}) => {
  const { socket } = useSocketContext();
  const savedHandler = useRef(handler);
  const { enabled = true } = options;

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket || !enabled) return;

    const eventHandler = (...args) => savedHandler.current(...args);
    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
  }, [socket, enabled, eventName, ...deps]);
};

/**
 * Hook to emit socket events
 * 
 * @returns {function} emit function
 * 
 * @example
 * const emit = useSocketEmit();
 * emit('join_lead_room', leadId, (response) => {
 *   console.log('Joined room:', response);
 * });
 */
export const useSocketEmit = () => {
  const { socket } = useSocketContext();

  return (eventName, ...args) => {
    if (!socket) {
      console.warn('Socket not connected, cannot emit:', eventName);
      return;
    }
    socket.emit(eventName, ...args);
  };
};