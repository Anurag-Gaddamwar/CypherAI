import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaVideo, FaStop, FaSpinner } from 'react-icons/fa';
import { AiOutlineWarning } from 'react-icons/ai';
import "../src/app/globals.css";
import Navbar from "../src/app/components/Navbar";

const InterviewSimulation = () => {
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [resume, setResume] = useState(null);
  const [interviewType, setInterviewType] = useState('');
  const [jobRole, setJobRole] = useState('');
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (recording) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error('Error accessing media devices:', err);
          setError('Failed to access media devices. Please try again.');
        });

      setupSpeechRecognition();

      if (questions.length > 0 && currentQuestionIndex === 0) {
        speakQuestion(questions[currentQuestionIndex]);
      }
    } else {
      stopMediaStream();
    }
  }, [recording, questions, currentQuestionIndex]);
  

  const stopMediaStream = () => {
    if (videoRef.current && videoRef.current.stream) {
      const stream = videoRef.current.stream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      videoRef.current.stream = null;
    }
  };

  const startRecording = async () => {
    if (!resume || !interviewType || !jobRole) {
      setError('Please upload a resume, select the interview type, and enter the job role.');
      return;
    }

    setRecording(true);
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('interviewType', interviewType);
      formData.append('jobRole', jobRole);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/conduct-interview`, formData);
      const responseText = response.data;
      console.log('API Response:', responseText);

      const questionsArray = responseText.split('\n');
      setQuestions(questionsArray);
      setCurrentQuestionIndex(0);

    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to start the interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupSpeechRecognition = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    if (!recognition) {
      console.error('SpeechRecognition API is not supported in this browser.');
      setError('Speech Recognition API is not supported in this browser.');
      return;
    }
  
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
  
    recognition.onresult = (event) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
  
      if (latestResult.isFinal) {
        const resultTranscript = latestResult[0].transcript;
        console.log('Transcript:', resultTranscript);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(nextQuestion, 4000);
  
        if (questions[currentQuestionIndex]) {
          setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questions[currentQuestionIndex]]: (prevAnswers[questions[currentQuestionIndex]] || '') + resultTranscript
          }));
        }
      } else {
        setTranscript((prevTranscript) => prevTranscript + latestResult[0].transcript);
      }
    };
  
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError('Speech recognition error. Please try again.');
      recognition.stop();
    };
  
    recognitionRef.current = recognition;
  };
  

  const speakQuestion = (question) => {
    console.log('Speaking Question:', question);
    
    // Cancel any ongoing speech synthesis
    speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(question);
    
    utterance.onstart = () => {
      // Temporarily mute the microphone input if possible
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  
    utterance.onend = () => {
      // Restart the recognition after speaking
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        console.error('Speech recognition is not initialized.');
      }
    };
  
    speechSynthesis.speak(utterance);
  };
  
  

  const nextQuestion = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setCurrentQuestionIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < questions.length) {
        setupSpeechRecognition();
        speakQuestion(questions[nextIndex]);
        return nextIndex;
      } else {
        stopRecording();
        return prevIndex;
      }
    });
  };

  const stopRecording = async () => {
    setRecording(false);
    setLoading(true);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    speechSynthesis.cancel();

    stopMediaStream();

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/get-feedback`, { answers });
      const feedbackText = response.data.feedback;
      const parsedFeedback = parseFeedback(feedbackText);
      setFeedback(parsedFeedback);
    } catch (error) {
      console.error('Error ending interview:', error);
      setError('Failed to end the interview and retrieve feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseFeedback = (feedbackText) => {
    const feedbackSections = {};
    
    // Regex patterns to match different feedback sections
    const overallPerformancePattern = /(?<=\*\*Overall Performance:\*\*).+?(?=\*\*Suggestions for Improvement:\*\*)/s;
    const suggestionsPattern = /(?<=\*\*Suggestions for Improvement:\*\*).+?(?=\*\*Specific Feedback:\*\*)/s;
    const specificFeedbackPattern = /(?<=\*\*Specific Feedback:\*\*).+/s;

    // Extract feedback sections using regex
    feedbackSections.overallPerformance = feedbackText.match(overallPerformancePattern)?.[0]?.trim() || '';
    feedbackSections.suggestions = feedbackText.match(suggestionsPattern)?.[0]?.trim().split('\n').filter(line => line) || [];
    feedbackSections.specificFeedback = feedbackText.match(specificFeedbackPattern)?.[0]?.trim() || '';

    return feedbackSections;
  };

  const handleJobRoleChange = (e) => setJobRole(e.target.value);
  const handleResumeChange = (e) => setResume(e.target.files[0]);
  const handleInterviewTypeChange = (e) => setInterviewType(e.target.value);

  return (
    <div className="min-h-screen font-sans text-sm bg-black text-white flex flex-col mb-10">
      <Navbar />
      <div className="container mx-auto mt-20 p-6 rounded-lg shadow-lg w-full max-w-4xl">
        {!recording && !loading && !feedback ? (
          <>
            <h1 className="text-3xl font-semibold mb-20">Interview Simulation</h1>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">Job Role</label>
              <input
                type="text"
                value={jobRole}
                onChange={handleJobRoleChange}
                placeholder="Enter job role"
                className="w-full px-4 py-2 bg-[#151515] rounded-md text-white"
              />
            </div>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">Resume</label>
              <input
                type="file"
                accept=".jpg, .jpeg, .png, .pdf"
                onChange={handleResumeChange}
                className="w-full px-4 py-2 bg-[#151515] rounded-md text-white cursor-pointer"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">Interview Type</label>
              <select
                value={interviewType}
                onChange={handleInterviewTypeChange}
                className="w-full px-4 py-2 bg-[#151515] rounded-md text-white"
              >
                <option value="">Select Interview Type</option>
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
              </select>
            </div>
            <button
              onClick={startRecording}
              disabled={!jobRole || !resume || !interviewType}
              className={`flex space-x-2 mb-10 items-center text-white px-4 py-2 rounded-md transition transform duration-300 ${
                !jobRole || !resume || !interviewType ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110'
              }`}
            >
              <FaVideo className="text-xl" />
              <span>Start Interview</span>
            </button>
          </>
        ) : null}

{recording && (
  <div className="flex flex-col items-center">
    <h2 className="text-xl font-semibold mb-4">Recording Interview</h2>
    <div className="relative w-full max-w-md h-72 bg-gray-800 rounded-lg overflow-hidden">
      <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <FaVideo className="text-red-600" />
        <span className="text-white">Recording...</span>
      </div>
    </div>
    <div className="mt-4 text-center">
      <button
        onClick={stopRecording}
        className="py-3 px-6 bg-red-600 rounded-md text-white flex items-center space-x-2 hover:bg-red-700"
      >
        <FaStop />
        <span>Stop Interview</span>
      </button>
    </div>
    <div className="mt-4 text-center">
      <h3 className="text-lg font-medium">Current Question:</h3>
      <p className="text-white">{questions[currentQuestionIndex]}</p>
    </div>
  </div>
)}


        {loading && (
          <div className="flex flex-col items-center mt-10">
            <FaSpinner className="animate-spin text-blue-500 text-3xl mb-4" />
            <p className="text-lg">Loading...</p>
          </div>
        )}

        {error && (
          <div className="mt-10 p-4 bg-red-500 rounded-md text-white flex items-center space-x-2">
            <AiOutlineWarning className="text-xl" />
            <span>{error}</span>
          </div>
        )}

        {feedback && (
          <div className="mt-10 p-4 bg-gray-800 rounded-md text-white">
            <h3 className="text-2xl font-semibold mb-4">Feedback</h3>
            <div className="mb-4">
              <h4 className="text-xl font-medium">Overall Performance:</h4>
              <p>{feedback.overallPerformance}</p>
            </div>
            <div className="mb-4">
              <h4 className="text-xl font-medium">Suggestions for Improvement:</h4>
              <ul className="list-disc pl-5">
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-medium">Specific Feedback:</h4>
              <p>{feedback.specificFeedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSimulation;
