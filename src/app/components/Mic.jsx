'use client'
import React from 'react';

const Mic = ({ handleMicClick, micIconRef }) => {

  return (
    <img
      ref={micIconRef}
      src="./images/MicIcon.png"
      alt="Microphone icon"
      onClick={handleMicClick}
      className="mic flex w-16 cursor-pointer rounded-full shadow-md transition-all duration-300 ease-in-out mt-[-48px]"
    />
  );
};

export default Mic;
