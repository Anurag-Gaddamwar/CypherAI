'use client'
import React from 'react';

const Mic = ({ handleMicClick, micIconRef }) => {

  return (
    <img
      ref={micIconRef}
      src="./images/MicIcon.png"
      alt="Microphone icon"
      onClick={handleMicClick}
      className="mic flex w-20 h-20 cursor-pointer rounded-full shadow-md transition-all duration-300 ease-in-out mt-5"
    />
  );
};

export default Mic;
