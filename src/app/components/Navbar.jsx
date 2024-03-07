import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 px-4 z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-customBlue to-transparent rounded-lg blur-md mix-blend-overlay"></div>
      <ul className="flex justify-around items-center relative z-60">
        <li>
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="h-5 w-5">
                <img src="/images/logo.svg"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </div>
              <span className="text-xs sm:text-sm md:text-base ">CYPHER AI</span>
            </div>
          </Link>
        </li>
        <li>
          <Link href="/Resume">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="h-5 w-5">
                <img src="/images/boostresume.svg"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </div>
              <span className="text-xs sm:text-sm md:text-base">RESUME BOOSTER</span>
            </div>
          </Link>
        </li>
        <li>
          <Link href="/about">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="h-5 w-5">
                <img src="/images/about.svg"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </div>
              <span className="text-xs sm:text-sm md:text-base">ABOUT</span>
            </div>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
