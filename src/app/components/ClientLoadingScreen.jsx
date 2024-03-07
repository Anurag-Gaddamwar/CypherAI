// components/ClientLoadingScreen.jsx
'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

export default function ClientLoadingScreen({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    },   250); 

    return () => clearTimeout(timer);
  }, []);

  return isLoading ? <LoadingScreen /> : (
    <div className="content-behind-loading-screen">
      {children}
    </div>
  );
}
