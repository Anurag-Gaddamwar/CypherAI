import React from 'react';
import Link from 'next/link'; 

const Navbar = () => {
  return (
    <nav className="bg-gradient-to-b z-20 fixed top-0 left-0 right-0 from-gray-800 font-sans text-[1.07rem] text-white p-5 backdrop-blur-md backdrop-filter">
      <div className="mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Link href="/">
              <p className="hover:text-blue-300 transition-colors duration-300">AI</p>
            </Link>
            <Link href="/resume">
              <p className="text-white hover:text-blue-300 transition-colors duration-300">Resume</p>
            </Link>
            <Link href="/interview">
              <p className="text-white hover:text-blue-300 transition-colors duration-300">Interview</p>
            </Link>
            <Link href="/roadmap">
              <p className="text-white hover:text-blue-300 transition-colors duration-300">Roadmap</p>
            </Link>
            <Link href="/profile"> 
              <p className="text-white  hover:text-blue-300 transition-colors duration-500">Profile</p>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}; 

export default Navbar;
