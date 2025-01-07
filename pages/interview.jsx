import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaStop, FaSpinner, FaVideo } from 'react-icons/fa';
import { AiOutlineWarning } from 'react-icons/ai';
import "../src/app/globals.css";
import Navbar from "../src/app/components/Navbar";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import FeedbackSection from './FeedbackSection';
import * as cv from 'opencv.js'; 
import dynamic from 'next/dynamic';

const OpenCV = dynamic(() => import('opencv.js'), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement);


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
  const [postureData, setPostureData] = useState(null);

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

  const startPostureDetection = (stream) => {
    // Placeholder: Implement posture detection logic using MediaPipe and OpenCV
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const detectPosture = () => {
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Assuming OpenCV.js and MediaPipe integration here to track posture
        let mat = cv.imread(canvas);
        // MediaPipe code would go here to detect the pose and extract key points

        // Example posture data extraction (shoulder angle, etc.)
        const postureAngles = calculatePostureAngles(mat); // Placeholder
        setPostureData(postureAngles);
        
        // Continue detecting
        requestAnimationFrame(detectPosture);
      }
    };

    detectPosture();
  };

  const calculatePostureAngles = (mat) => {
    // This function would use MediaPipe to calculate the posture angles (like shoulder angle)
    // For now, we return placeholder data
    return {
      shoulderAngle: 45, // Example placeholder value
    };
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
      console.log('Form Data:', formData);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiUrl}/conduct-interview`, formData);
      const questionsArray = response.data.split('\n');
      setQuestions(questionsArray);

      // Log the number of questions received
      console.log('Number of questions:', questionsArray.length);

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
    
    recognition.onstart = () => {
      // Mute the audio output when recognition starts
      muteAudioOutput();
    };
    
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
    
    recognition.onend = () => {
      // Unmute audio output when recognition stops
      unmuteAudioOutput();
    };
    
    recognitionRef.current = recognition;
  };
  
  const muteAudioOutput = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = false; // Disable audio output
        }
      });
    }
  };
  
  const unmuteAudioOutput = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = true; // Enable audio output again
        }
      });
    }
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
  
      if (nextIndex < questions.length-1) {
        // Save the current answer before moving to the next question
        if (questions[currentQuestionIndex] && transcript.trim()) {
          setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questions[currentQuestionIndex]]: (prevAnswers[questions[currentQuestionIndex]] || '') + transcript.trim(),
          }));
        }
  
        // Continue with the next question
        setupSpeechRecognition();
        speakQuestion(questions[nextIndex]);
        return nextIndex;
      } else {
        // End of interview: Stop recognition and process feedback
        setRecording(false);
        setLoading(true); // Start loading when stopping recording
  
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
  
        speechSynthesis.cancel();
        stopMediaStream();
  
        // After a short delay, fetch feedback from the backend
        setTimeout(async () => {
          try {
            // Save the final answer before stopping
            if (questions[currentQuestionIndex] && transcript.trim()) {
              setAnswers(prevAnswers => ({
                ...prevAnswers,
                [questions[currentQuestionIndex]]: (prevAnswers[questions[currentQuestionIndex]] || '') + transcript.trim(),
              }));
            }
  
            console.log(answers);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await axios.post(`${apiUrl}/get-feedback`, { answers });
            const feedbackText = response.data.feedback;
            console.log(feedbackText);
            setFeedback(feedbackText);
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
    if (questions[currentQuestionIndex] && transcript.trim()) {
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questions[currentQuestionIndex]]: (prevAnswers[questions[currentQuestionIndex]] || '') + transcript.trim(),
      }));
    }

    setTranscript('');
    stopMediaStream();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    speechSynthesis.cancel();

    // Unmute audio output when interview is stopped
    unmuteAudioOutput();

    setRecording(false);
    alert('Interview stopped.');
  };
  

  const resetInterview = () => {
    setRecording(false);
    setFeedback(null);
    setLoading(false);
    setError('');
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers({});
    setTranscript('');
  };



  const handleJobRoleChange = (e) => setJobRole(e.target.value);
  const handleResumeChange = (e) => setResume(e.target.files[0]);
  const handleInterviewTypeChange = (e) => setInterviewType(e.target.value);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      <div className="mx-auto mt-20 p-6 max-w-4xl w-full">
        <h1 className="text-3xl font-semibold text-center mb-12">Interview Simulation</h1>
        <div className="space-y-4">
          {/* Initial Form Section */}
          {!recording && !feedback && !loading && (
            <div className="flex flex-col gap-2">
              <div className="mb-6">
                <label className="block text-lg font-medium mb-2">Job Role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={handleJobRoleChange}
                  placeholder="Enter job role"
                className="w-full px-4 py-2 bg-gray-800 shadow-lg rounded-md text-white border border-gray-700"

                />
              </div>

              <div className="mb-6">
                <label className="text-xl text-gray-200">Resume</label>
                <input
                  type="file"
                  accept=".jpg, .jpeg, .png, .pdf"
                  onChange={handleResumeChange}
                  className="w-full px-4 py-2 bg-gray-800 rounded-md shadow-lg text-center text-gray-400 cursor-pointer"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-lg font-medium mb-2">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={handleInterviewTypeChange}
                  className="w-full px-4 py-2 bg-gray-800 shadow-lg rounded-md text-gray-400"
                >
                  <option value="">Select Interview Type</option>
                  <option value="HR">HR</option>
                  <option value="Technical">Technical</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div className="mt-10 text-center">
              <button
                onClick={startRecording}
                disabled={!jobRole || !resume || !interviewType}
                className={`px-6 py-2 text-lg rounded-md bg-blue-600 hover:bg-blue-700 transition duration-200 
                  ${!jobRole || !resume || !interviewType ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Start Interview
              </button>
            </div>
            </div>
          )}
  
          {/* Video and Recording Section */}
          {recording && !loading && (
            <div>
              {/* Video Area */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden mb-4">
                <video ref={videoRef} autoPlay className="w-full object-cover mirrored" />
                <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                  <FaVideo className="text-red-600" />
                  <span className="text-white">Recording...</span>
                </div>
              </div>
              
              {/* Question Area */}
              <div className="text-lg">
                {questions.length > 0 && currentQuestionIndex < questions.length ? (
                  <p>Current Question: {questions[currentQuestionIndex]}</p>
                ) : (
                  <p>Waiting for the interview to end...</p>
                )}
              </div>
  
              {/* Stop Interview Button */}
              <button
                onClick={stopInterview}
                className="mt-4 mb-10 px-4 py-2 rounded-md text-white bg-red-500 flex items-center gap-2"
              >
                <FaStop />
                Stop Interview
              </button>
            </div>
          )}
  
          {/* Loading Spinner */}
          {loading && (
            <div className="flex items-center justify-center mt-4">
              <FaSpinner className="animate-spin text-2xl" />
            </div>
          )}
  
{/* Feedback Section */} 
{feedback && !loading && (
  <FeedbackSection feedback={feedback} loading={loading} posture={postureData} resetInterview={resetInterview} />
)}


  
          {/* Error Message */}
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
