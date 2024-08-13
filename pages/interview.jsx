import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaStop, FaSpinner, FaVideo } from 'react-icons/fa';
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
      // Check if videoRef.current is not null
      if (videoRef.current) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            let hasEarphones = false;
            devices.forEach(device => {
              if (device.kind === 'output' && device.label.includes('Headphones')) {
                hasEarphones = true;
              }
            });
  
            const audioConstraints = {
              echoCancellation: !hasEarphones,
              audioSuppression: !hasEarphones,
            };
  
            navigator.mediaDevices.getUserMedia({
              video: true,
              audio: audioConstraints
            })
            .then(stream => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.stream = stream;
              }
            })
            .catch(err => {
              console.error('Error accessing media devices:', err);
              setError('Failed to access media devices. Please try again.');
            });
  
            setupSpeechRecognition();
  
            if (questions.length > 0 && currentQuestionIndex === 0) {
              speakQuestion(questions[currentQuestionIndex]);
            }
          })
          .catch(err => {
            console.error('Error enumerating devices:', err);
            setError('Failed to enumerate devices. Please try again.');
          });
      }
    } else {
      stopMediaStream();
    }
  
    // Cleanup function to stop media stream when component unmounts or recording stops
    return () => {
      stopMediaStream();
    };
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
      const questionsArray = response.data.split('\n');
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
        setTranscript(prevTranscript => prevTranscript + latestResult[0].transcript);
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
    
    speechSynthesis.cancel();
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    const utterance = new SpeechSynthesisUtterance(question);
    
    utterance.onstart = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    
    utterance.onend = () => {
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
        setRecording(false);
        setLoading(true); // Start loading when stopping recording
  
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
  
        speechSynthesis.cancel();
        stopMediaStream();
  
        setTimeout(async () => {
          try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/get-feedback`, { answers });
            const feedbackText = response.data.feedback;
            const parsedFeedback = parseFeedback(feedbackText);
            setFeedback(parsedFeedback);
          } catch (error) {
            console.error('Error ending interview:', error);
            setError('Failed to end the interview and retrieve feedback. Please try again.');
          } finally {
            setLoading(false); // Stop loading when feedback is received
          }
        }, 2000); // Adjust the timeout if necessary
  
        return prevIndex;
      }
    });
  };

  const stopInterview = () => {
    if (recording) {
      stopMediaStream();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      speechSynthesis.cancel();
      setRecording(false);
      alert('Interview stopped.');
    }
  };

  const parseFeedback = (feedbackText) => {
    const feedbackSections = {};
    
    const overallPerformancePattern = /(?<=\*\*Overall Performance:\*\*).+?(?=\*\*Suggestions for Improvement:\*\*)/s;
    const suggestionsPattern = /(?<=\*\*Suggestions for Improvement:\*\*).+?(?=\*\*Specific Feedback:\*\*)/s;
    const specificFeedbackPattern = /(?<=\*\*Specific Feedback:\*\*).+/s;

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
        <h1 className="text-3xl font-semibold mb-10">Interview Simulation</h1>
        <div className="space-y-4">
          {!recording && !feedback && !loading && (
            <div className="flex flex-col gap-2">
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
              className={`flex space-x-2 mb-10 items-center text-white px-4 py-2 rounded-md transition sm:max-w-60 max-w-40 transform duration-300 ${
                !jobRole || !resume || !interviewType ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110'
              }`}
            >
              <FaVideo className="text-xl" />
              <span>Start Interview</span>
            </button>

            </div>
          )}

          {recording && !loading && (
            <div className="flex flex-col items-center mb-10">
              <h2 className="text-xl font-semibold mb-4">Recording Interview</h2>
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <video ref={videoRef} autoPlay className="w-full object-cover mirrored" />
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <FaVideo className="text-red-600" />
        <span className="text-white">Recording...</span>
      </div>
    </div>
              <div className="mt-4 text-lg">
                {questions.length > 0 && currentQuestionIndex < questions.length ? (
                  <p>Current Question: {questions[currentQuestionIndex]}</p>
                ) : (
                  <p>Waiting for the interview to end...</p>
                )}
              </div>
              <button
                onClick={stopInterview}
                className="mt-4 mb-10 px-4 py-2 rounded-md text-white bg-red-500 flex items-center gap-2"
              >
                <FaStop />
                Stop Interview
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center mt-4">
              <FaSpinner className="animate-spin text-2xl" />
            </div>
          )}

          {feedback && !loading && (
            <div className="my-6 p-4 bg-[#1e1e1e] rounded-lg">
              <h2 className="text-2xl font-semibold mb-2">Feedback</h2>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Overall Performance:</h3>
                <p>{feedback.overallPerformance}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Suggestions for Improvement:</h3>
                <ul>
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="list-disc ml-5">{suggestion}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Specific Feedback:</h3>
                <p>{feedback.specificFeedback}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500 text-white rounded-lg flex items-center gap-2">
              <AiOutlineWarning className="text-xl" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSimulation;
