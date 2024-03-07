'use client'
import React, { useState, useEffect, useRef } from 'react';
import Mic from '@/app/components/Mic';

function CypherAI() {
  const [messages, setMessages] = useState([]);
  const [isMoving, setIsMoving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPointer, setShowPointer] = useState(true);
  const micIconRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputDivRef = useRef(null);
  const synthRef = useRef(null);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowPointer(false);
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const interviewQuestions = [
    {
      question: "tell me something about yourself",
      answer: "Sure! If you're asked to tell something about yourself, you can start with your name, education, professional background, and mention some of your key skills and experiences."
    },
    {
      question: "what are your strengths and weaknesses",
      answer: "When discussing strengths, it's good to mention skills relevant to the job you're applying for. For weaknesses, focus on areas you're actively working on improving."
    },
    {
      question: "can you describe a challenging project you've worked on",
      answer: "Certainly! When discussing a challenging project, highlight the obstacles you faced, how you tackled them, and the lessons you learned."
    },
    // Add more questions and answers as needed
  ];

  const responses = {
    "hi": "Hello! How can I assist you today?",
    "hello": "Hi there! How can I help you?",
  };

  const generateResponse = (inputMessage) => {
    const trimmedMessage = inputMessage.trim().toLowerCase();
    if (responses.hasOwnProperty(trimmedMessage)) {
      return responses[trimmedMessage];
    } else {
      const question = interviewQuestions.find(q => trimmedMessage.includes(q.question.toLowerCase()));
      if (question) {
        return question.answer;
      } else {
        return "I'm sorry, I don't understand. Could you please rephrase your question?";
      }
    }
  };

  const speak = (text) => {
    if (typeof window !== 'undefined' && synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(voice => voice.lang.startsWith('hello'));
      utterance.voice = indianVoice;
      utterance.rate = 1;
      utterance.pitch = 4;
      utterance.volume = 2;
      synthRef.current.speak(utterance);
    }
  };

  const handleMicClick = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      if (isListening) {
        setIsListening(false);
        setIsMoving(false);
        const recognition = recognitionRef.current;
        recognition && recognition.stop();
        micIconRef.current.style.boxShadow = '';
      } else {
        if (synthRef.current && synthRef.current.speaking) {
          synthRef.current.cancel();
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => {
          setIsListening(true);
          setIsMoving(true);
        };
        recognition.onresult = async (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setMessages(prevMessages => [...prevMessages, { text: transcript, fromUser: true }]);
          const aiResponse = { text: await generateResponse(transcript), fromUser: false };
          setMessages(prevMessages => [...prevMessages, aiResponse]);
          speak(aiResponse.text);
        };
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setIsMoving(false);
        };
        recognition.onend = () => {
          setIsListening(false);
          setIsMoving(false);
        };
        recognitionRef.current = recognition;
        recognition.start();
      }
    } else {
      console.error('SpeechRecognition is not supported in this browser.');
    }
  };

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

  const handleSendClick = async () => {
    const message = inputDivRef.current.textContent.trim();
    if (message) {
      const userMessage = { text: message, fromUser: true };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      try {
        const aiResponseText = await generateResponse(message);
        const aiResponse = { text: aiResponseText, fromUser: false };
        setMessages(prevMessages => [...prevMessages, aiResponse]);
        inputDivRef.current.textContent = '';
        if (isListening) {
          speak(aiResponse.text);
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  return (
    <div className="container mx-auto px-4 text-gray-800">
      <main className="main mt-10 flex flex-col justify-center items-center">
        {showPointer && (
          <div className="indicating-pointer">
            <p>Tap here to speak</p>
          </div>
        )}
        <Mic
          handleMicClick={handleMicClick}
          isListening={isListening}
          isMoving={isMoving}
          micIconRef={micIconRef}
        />
        <div className="message-container fixed bottom-28 left-0 w-full text-center z-50 " ref={messageContainerRef}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.fromUser ? 'text-right' : 'ai-response'}`}
            >
              {message.text}
            </div>
          ))}
        </div>
      </main>
      <div className="bottom-10 message-input flex items-center fixed left-0 right-0 p-4 mt-4">
        <div
          ref={inputDivRef}
          contentEditable="true"
          className="input-field text-white flex-grow border-2 border-gray-300 rounded-xl p-2 w-full outline-none"
          placeholder="Type your message here..."
        ></div>
        <button 
          onClick={handleSendClick} 
          className="send-button hover:border hover:border-blue-500 transition duration-300 ease-in-out  p-2 rounded-md "
        >
          <img src="./images/send.png" style={{ width: '35px', height: '25px' }} alt="Send"/>
        </button>
      </div>
    </div>
  );
}

export default CypherAI;
