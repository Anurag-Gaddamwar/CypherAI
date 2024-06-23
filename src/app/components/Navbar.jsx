import React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter from next/router


 const Navbar = () => {
  const router = useRouter(); // Use the useRouter hook to get the router object

  return (
     <nav className="bg-gray-800 font-sans sm:text-[15px] text-white p-4 border-b">
       <div className="mx-auto">
         <div className="flex justify-between items-center">
           <div className="flex space-x-4">
             <a href="/" className={`text-gray-300 hover:text-white ${router.pathname === '/' ? 'text-blue-500' : ''}`}>AI</a>
             <a href="/resume" className={`text-gray-300 hover:text-white ${router.pathname === '/resume' ? 'text-blue-500' : ''}`}>Resume</a>
    
           </div>
         </div>
       </div>
     </nav>
  );
 };
 
 export default Navbar;