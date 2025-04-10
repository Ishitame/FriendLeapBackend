// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
 
  const { user } = useSelector((state) => state.auth);

  const socket = useMemo(() => {
    return io('http://localhost:3000', {
      withCredentials: true,
      autoConnect: false,
    });
  }, []);

  useEffect(() => {
   
    
    
    
    if (user?._id) {
        console.log(socket);
        
      
      socket.connect();
      socket.emit("userIsOnline", user);
      socket.emit('register', user._id);
    }

    return () => {
      socket.disconnect();
    };
  }, [user, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
