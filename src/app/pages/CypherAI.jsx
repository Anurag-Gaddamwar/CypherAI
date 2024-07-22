'use client';
import React, { useState, useEffect, useRef } from 'react';
import Mic from '@/app/components/Mic'; 
import Navbar from '../components/Navbar';
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


  const handleSendClick = () => {
    if (input.trim() !== '') {
      const newMessageIndex = messages.length;
      setMessages(prevMessages => [...prevMessages, { text: input, fromUser: true }]);
      setInput('');
      setLoading(true);
      setLoadingIndex(newMessageIndex); // Set the index for the loading placeholder
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
    } else {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      startRecognition();
    }
  };

  const generateResponse = async (question, isVoiceInput) => {
    try {
      const response = await fetch('http://localhost:3001/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }
  
      const data = await response.json();
      console.log('Server response:', data);
  
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
      setLoadingIndex(null); // Ensure loading is cleared
    }
  };
  
  



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
      // Remove Markdown formatting
      const cleanedText = text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
        .replace(/\*([^*]+)\*/g, '$1')   // Remove italic
        .replace(/_([^_]+)_/g, '$1')    // Remove underline
        .replace(/~([^~]+)~/g, '$1')   // Remove strikethrough
        .replace(/#+\s?/g, '')        // Remove headers
        .replace(/- /g, '')          // Remove list items
        .replace(/```[^`]+```/g, ''); // Remove code blocks (simple)

      // Remove non-alphabetic characters (as before)
      const finalText = cleanedText.replace(/[^a-zA-Z\s.,!?']/g, '');

      const utterance = new SpeechSynthesisUtterance(finalText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = voices.filter(voice => {
        return voice.localService && // Prioritize local voices for better performance
          !voice.name.includes('compact') && // Avoid compact voices, which are often lower quality
          (voice.lang.startsWith('en-IN') || voice.lang === 'en-US'); // Indian English or US English
      });

      // Fallback to other voices if no preferred voices are available
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
    <div className="max-h-screen font-sans text-sm bg-gradient-to-br from-black to-midnight-blue text-white flex flex-col">
      <Navbar />
      <main className="flex-grow overflow-hidden">
        <div className="flex-grow h-[80vh] max-h-[80vh] overflow-y-hidden relative">
          <div className="bg-gradient-to-br from-midnight-blue to-black">
            <h1 className="text-2xl font-bold cursor-pointer py-4 px-6 text-white">CypherAI</h1>
          </div>
          <div className="mt-20 mb-0 absolute inset-0 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-scrollbar-thumb scrollbar-track-scrollbar-track custom-scrollbar" ref={messageContainerRef}>
  {messages.map((message, index) => (
    <div
      key={index}
      className={`message p-4 rounded-xl ${
        message.fromUser ? 'bg-gradient-to-bl from-gray-700 self-end my-4 sm:mx-4 lg:mx-10 xl:mx-16 2xl:mx-24 flex justify-center text-white' : 'bg-gradient-to-br from-[#272323] self-start my-4 sm:mx-4 lg:mx-10 xl:mx-16 2xl:mx-24 flex justify-center text-white'
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
    <div className="message p-4 rounded-xl bg-midnight-blue self-start my-4 sm:mx-4 lg:mx-10 xl:mx-16 2xl:mx-24 flex justify-center text-white">
      <div className="flex items-center justify-center py-4">
        <div className="loading-spinner"></div>
      </div>
    </div>
  )}
</div>

        </div>
        <div className="justify-center align-center flex">
          <Mic
            handleMicClick={handleMicClick}
            isListening={isListening}
            isMoving={isMoving}
            micIconRef={micIconRef}
          />
        </div>
        <div className="message-input mb-0 bottom-0 relative flex items-center bg-gradient-to-br from-gray-800 to-black p-4 rounded-t-xl shadow-md">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flexGrow: 1,
              border: 'none',
              borderRadius: '16px',
              padding: '12px',
              outline: 'none',
              resize: 'none',
              color: '#e2e8f0',
              backgroundColor: 'transparent',
              fontSize: '16px',
            }}
            placeholder="Type your message here..."
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-gradient-to-r text-white hover:bg-gradient-to-r hover:from-teal-500 hover:via-blue-500 hover:to-purple-500 transition-all duration-300 px-6 py-3 rounded-full shadow-lg transform hover:scale-105 flex items-center justify-center"
            onClick={handleSendClick}
          >
            <PaperAirplaneIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default CypherAI;