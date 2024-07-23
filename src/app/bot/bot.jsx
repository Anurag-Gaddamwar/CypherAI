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
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Server response:', data);
  
      if (data.text) {
        const responseText = data.text.trim();
        setMessages(prevMessages => [...prevMessages, { text: responseText, fromUser: false }]);
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
      micIcon.style.transform = `translate(${x}px, ${y}px)`;
    }, 100);

    return () => clearInterval(intervalId);
  }, [isMoving]);

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="content">
          <div className="message-container" ref={messageContainerRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.fromUser ? 'message user-message' : 'message bot-message'}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {isLoading && loadingIndex !== null && (
              <div className="message bot-message loading-message">
                <div className="loading-spinner">
                  <div className="spinner-dot"></div>
                  <div className="spinner-dot"></div>
                  <div className="spinner-dot"></div>
                </div>
              </div>
            )}
          </div>
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
            />
            <button onClick={handleSendClick}>
              <PaperAirplaneIcon className="send-icon" />
            </button>
            <div
              className={`mic-icon ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              ref={micIconRef}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default CypherAI;
