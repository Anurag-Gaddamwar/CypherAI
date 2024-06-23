import React from 'react';
import Link from 'next/link'; // Import Link from next/link

const Navbar = () => {
  return (
    <nav className="bg-gray-800 font-sans sm:text-[15px] text-white p-4 border-b">
      <div className="mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Link href="/">
              <p className="text-gray-300 hover:text-white">AI</p>
            </Link>
            <Link href="/resume">
              <p className="text-gray-300 hover:text-white">Resume</p>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
