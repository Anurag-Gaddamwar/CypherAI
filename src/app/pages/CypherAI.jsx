'use client';
import React, { useState, useEffect, useRef } from 'react';
import Mic from '@/app/components/Mic'; // Import the Mic component
import Navbar from '../components/Navbar';
import './bot.css'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CypherAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const micIconRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const messageContainerRef = useRef(null);

  const handleSendClick = () => {
    if (input.trim() !== '') {
      setMessages(prevMessages => [...prevMessages, { text: input, fromUser: true }]);
      setInput('');
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
      const response = await fetch('https://cypher-ai.vercel.app/generate-content', {
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
      console.log('Server response:', data); // Log the server response

      if (data.text) {
        const responseText = data.text.trim();
        setMessages(prevMessages => [...prevMessages, { text: responseText, fromUser: false }]);
        if (isVoiceInput) {
          speak(responseText); // Only speak if input was voice
        }
      } else {
        handleResponseError('I could not find a suitable answer.', isVoiceInput);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      handleResponseError('An error occurred while generating a response.', isVoiceInput);
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
    <div className="min-h-screen font-sans text-sm bg-gray-900 text-white flex flex-col">
      <Navbar />
      <main className="flex-grow overflow-hidden">
        <div className="flex-grow h-[80vh] max-h-[80vh] overflow-y-hidden relative">
          <div className='bg-gray-800'>
            <h1 className="text-2xl font-bold py-4 px-6 text-white">CypherAI</h1>
          </div>
          <div className="mt-20 mb-0 absolute inset-0 overflow-y-auto flex flex-col custom-scrollbar" ref={messageContainerRef}>
  {messages.map((message, index) => (
    <div
      key={index}
      className={`message p-3 rounded-xl ${message.fromUser ? 'bg-blue-800 text-white self-end my-3 sm:mx-4 lg:mx-10 xl:mx-16 2xl:mx-24 flex justify-center' : 'bg-gray-800 text-white self-start my-3 sm:mx-4 lg:mx-10 xl:mx-16 2xl:mx-24 flex justify-center'}`}
    >
      <ReactMarkdown 
        className="prose prose-invert" // Apply styling for Markdown content
        remarkPlugins={[remarkGfm]} // Support GitHub Flavored Markdown
      >
        {message.text}
      </ReactMarkdown>
    </div>
  ))}
</div>

        </div>
        <div className='justify-center align-center flex'>
          <Mic
            handleMicClick={handleMicClick}
            isListening={isListening}
            isMoving={isMoving}
            micIconRef={micIconRef}
          />
        </div>
        <div className="message-input mb-0 bottom-0 relative flex items-center bg-gray-800 p-4 rounded-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flexGrow: 1,
              border: '1px solid #4b5563',
              borderRadius: '12px',
              padding: '8px',
              outline: 'none',
              resize: 'none',
              color: '#d1d5db',
              backgroundColor: '#2d3748',
            }}
            placeholder="Please specify the part of the interview you need assistance with..."
            onKeyDown={handleKeyDown}
          ></textarea>
          <button
            className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-mg ml-4'
            onClick={handleSendClick}
            style={{
              borderRadius: '8px'
            }}
          >
            Send
          </button>
        </div>
      </main>

    </div>
  );

}

export default CypherAI;
