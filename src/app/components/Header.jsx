'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Header = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.get('/api/users/logout');
      toast.success('Logout successful');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error.message);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <div className="w-full cypherHeader header flex items-center justify-between pb-1 border-b-2 border-blue-500 transition duration-200 ease-in-out">
      <h1 className="tt font-bold w-full text-cypherColor">Cypher AI</h1>
      <img
        src="./images/logout.png"
        alt="Logout icon"
        className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform duration-200"
        onClick={handleLogout}
      />
    </div>
  );
};

export default Header;
