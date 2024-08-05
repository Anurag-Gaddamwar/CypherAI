'use client';
import React, { useState, useEffect, useRef } from 'react';
import Mic from '@/app/components/Mic'; 
import Navbar from '@/app/components/Navbar';
import './bot.css'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

function CypherAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const micIconRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [isLoading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(null);  
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

  const handleSendClick = () => {
    if (input.trim() !== '') {
      const newMessageIndex = messages.length;
      setMessages(prevMessages => [...prevMessages, { text: input, fromUser: true }]);
      setInput('');
      setLoading(true);
      setLoadingIndex(newMessageIndex); // Set the index for the loading placeholder
      setIsAwaitingResponse(true);
      generateResponse(input, false); // Text input, so isVoiceInput is false
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMoving(false);
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

const startRecognition = () => {
  setLoading(true);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('SpeechRecognition is not supported in this browser.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    setIsListening(true);
    setIsMoving(true);
    // `loadingIndex` should be set when starting recognition
  };
  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    setMessages(prevMessages => [...prevMessages, { text: transcript, fromUser: true }]);
    generateResponse(transcript, true); // Voice input, so isVoiceInput is true
  };
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    setIsMoving(false);
    handleSpeechError();
  };
  recognition.onend = () => {
    setIsListening(false);
    setIsMoving(false);
  };
  recognitionRef.current = recognition;
  recognition.start();
};


const handleMicClick = () => {
  if (isListening) {
    const recognition = recognitionRef.current;
    recognition && recognition.stop();
    setIsListening(false);
    setIsMoving(false);
    micIconRef.current.style.boxShadow = '';
    synthRef.current && synthRef.current.cancel();
    // Set loading to false when stopping recognition
    setLoading(false);
    setLoadingIndex(null); // Reset loadingIndex when stopping
  } else {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    // Set loading index when starting recognition
    const newMessageIndex = messages.length;
    setLoading(true);
    setLoadingIndex(newMessageIndex);
    startRecognition();
  }
};


  const generateResponse = async (currentQuery, isVoiceInput) => {
    setLoading(true);
    try {
      const prevConversation = messages.slice(-10).map(message => message.text).join('\n');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentQuery,       // Send the new user input
          prevConversation,  // Send the conversation history
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.text) {
        const responseText = data.text.trim();
        setMessages(prevMessages => [...prevMessages, { text: responseText, fromUser: false }]);
        setLoading(false);
        setLoadingIndex(null);
        if (isVoiceInput) {
          speak(responseText);
        }
      } else {
        handleResponseError('I could not find a suitable answer.', isVoiceInput);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      handleResponseError('An error occurred while generating a response.', isVoiceInput);
    } finally {
      setLoading(false);
      setLoadingIndex(null);
      setIsAwaitingResponse(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleResponseError = (errorMessage, isVoiceInput) => {
    setMessages(prevMessages => [...prevMessages, { text: errorMessage, fromUser: false }]);
    if (isVoiceInput) {
      speak(errorMessage);
    }
  };

  const handleSpeechError = () => {
    const errorMessage = 'Speech recognition error. Please try again.';
    speak(errorMessage);
    setMessages(prevMessages => [...prevMessages, { text: errorMessage, fromUser: false }]);
  };

  const speak = (text) => {
    if (typeof window !== 'undefined' && synthRef.current) {
      const cleanedText = text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
        .replace(/\*([^*]+)\*/g, '$1')   // Remove italic
        .replace(/_([^_]+)_/g, '$1')    // Remove underline
        .replace(/~([^~]+)~/g, '$1')   // Remove strikethrough
        .replace(/#+\s?/g, '')        // Remove headers
        .replace(/- /g, '')          // Remove list items
        .replace(/`[^`]*`/g, '');    // Remove inline code

      const finalText = cleanedText.replace(/[^a-zA-Z\s.,!?']/g, '');

      const utterance = new SpeechSynthesisUtterance(finalText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = voices.filter(voice => {
        return voice.localService && // Prioritize local voices for better performance
          !voice.name.includes('compact') && // Avoid compact voices, which are often lower quality
          (voice.lang.startsWith('en-IN') || voice.lang === 'en-US'); // Indian English or US English
      });

      const voiceToUse = preferredVoices[0] || voices.find(voice => voice.lang === 'en-US') || voices[0];

      if (!voiceToUse) {
        console.error("No suitable voices found.");
        return;
      }

      utterance.voice = voiceToUse;
      utterance.rate = 1.2;
      utterance.pitch = 0.5;
      utterance.volume = 1;
      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    const micIcon = micIconRef.current;
    const recognition = recognitionRef.current;

    if (!micIcon) return;

    if (!isListening) {
      recognition && recognition.stop();
      micIcon.style.boxShadow = '';
    }

    return () => {
      recognition && recognition.stop();
    };
  }, [isListening]);

  useEffect(() => {
    const micIcon = micIconRef.current;
    if (!micIcon || !isMoving) return;

    const intervalId = setInterval(() => {
      const x = Math.floor(Math.random() * 10) - 5;
      const y = Math.floor(Math.random() * 10) - 5;
      const spread = Math.floor(Math.random() * 10) + 5;
      const blur = Math.floor(Math.random() * 10) + 5;
      const color = '#77c4ff';

      micIcon.style.boxShadow = `${x}px ${y}px ${spread}px ${blur}px ${color}`;
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [isMoving]);

  useEffect(() => {
    const micIcon = micIconRef.current;
    if (!micIcon) return;

    micIcon.onmouseover = () => {
      if (!isListening) {
        micIcon.style.boxShadow = '0 0 5px 5px #77c4ff';
      }
    };

    micIcon.onmouseout = () => {
      if (!isListening) {
        micIcon.style.boxShadow = '';
      }
    };
  }, [isListening]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-h-screen font-sans text-sm bg-black text-white flex flex-col">
      <Navbar/>
      <main className="flex-grow overflow-hidden flex flex-col">
        <div className="flex-grow h-[80vh] sm:mx-10 max-h-[80vh] mb-[4rem] sm:max-h-[100vh] sm:mb-[4.3rem] sm:h-[100vh] overflow-y-hidden relative">
          <div className="bg-gradient-to-br from-midnight-blue to-black p-4 md:p-6">
            <h1 className="fixed z-20 mt-16 text-2xl md:text-2xl font-bold cursor-pointer text-white">CypherAI</h1>
          </div>
          <div className="mt-32  absolute inset-0 overflow-y-auto flex flex-col custom-scrollbar" ref={messageContainerRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message p-2 md:p-4 rounded-xl ${
                  message.fromUser
                    ? 'bg-gradient-to-bl from-gray-700 self-end my-2 md:my-4 mx-2 md:mx-4 flex justify-center text-white'
                    : 'bg-gradient-to-br from-[#272323] self-start my-2 md:my-4 mx-2 md:mx-4 flex justify-center text-white'
                }`}
              >
                <ReactMarkdown
                  className="prose prose-invert"
                  remarkPlugins={[remarkGfm]}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            ))}
            {loadingIndex !== null && messages.length === loadingIndex + 1 && (
              <div className="message p-2 md:p-4 rounded-xl bg-midnight-blue self-start my-2 md:my-4 mx-2 md:mx-4 flex justify-center text-white">
                <div className="flex items-center justify-center py-2 md:py-4">
                  <div className="loading-spinner"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center items-center p-2 md:p-4">
          <Mic
            handleMicClick={handleMicClick}
            isListening={isListening}
            isMoving={isMoving}
            micIconRef={micIconRef}
          />
        </div>
        <div className="fixed mb-0 bottom-0 left-0 right-0 flex items-center bg-gradient-to-br from-gray-800 to-black p-2 md:p-4 rounded-t-xl shadow-md">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow border-none rounded-lg p-2 md:p-4 outline-none resize-none text-gray-200 bg-transparent text-base md:text-lg"
            placeholder="Type your message here..."
            onKeyDown={handleKeyDown}
            disabled={isAwaitingResponse}
          />
          <button
            className="bg-gradient-to-r text-white hover:bg-gradient-to-r hover:from-teal-500 hover:via-blue-500 hover:to-purple-500 transition-all duration-300 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg transform hover:scale-105 flex items-center justify-center"
            onClick={handleSendClick}
            disabled={isAwaitingResponse}
          >
            <PaperAirplaneIcon className="w-4 md:w-5 h-4 md:h-5 text-white" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default CypherAI;
