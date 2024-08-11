'use client';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../src/app/components/Navbar';
import '../src/app/globals.css';
import { FaVideo, FaStop, FaSpinner } from 'react-icons/fa';
import { AiOutlineWarning } from 'react-icons/ai';

const InterviewSimulation = () => {
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [showInterview, setShowInterview] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [resume, setResume] = useState(null);
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    if (recording) {
      // Initialize WebRTC peer connection
      peerConnectionRef.current = new RTCPeerConnection();
      peerConnectionRef.current.ontrack = (event) => {
        // Handle incoming tracks
      };

      // Get local stream and add to peer connection
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStreamRef.current = stream;
          videoRef.current.srcObject = stream;
          stream.getTracks().forEach(track => {
            peerConnectionRef.current.addTrack(track, stream);
          });

          // Create an offer and send to the server
          return peerConnectionRef.current.createOffer();
        })
        .then(offer => {
          return peerConnectionRef.current.setLocalDescription(offer);
        })
        .then(() => {
          // Send the offer to the server
          return axios.post(`${process.env.REACT_APP_API_URL}/offer`, {
            sdp: peerConnectionRef.current.localDescription
          });
        })
        .then(response => {
          // Set remote description from server
          return peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(response.data.sdp));
        })
        .catch(err => {
          console.error('Error initializing WebRTC:', err);
          setError('Failed to initialize video call. Please try again.');
        });

      // Handle errors
      peerConnectionRef.current.onicecandidateerror = (event) => {
        console.error('ICE Candidate Error:', event);
      };

      // Handle remote stream end
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        if (peerConnectionRef.current.iceConnectionState === 'disconnected') {
          setError('Connection with AI has been lost.');
        }
      };
    }

    return () => {
      // Cleanup on unmount
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [recording]);

  const startRecording = async () => {
    setRecording(true);
    setShowInterview(true);
    setError('');
    setLoading(true);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-question`);
      setCurrentQuestion(response.data.question);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to fetch interview question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', resume);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/end-interview`, formData);
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Error ending interview:', error);
      setError('Failed to end interview and retrieve feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobRoleChange = (e) => {
    setJobRole(e.target.value);
  };

  const handleResumeChange = (e) => {
    if (e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  return (
    <div className="max-h-screen font-sans text-sm bg-black text-white flex flex-col">
      <Navbar />
      <div className="container mx-auto mt-20 p-6 rounded-lg shadow-lg w-full max-w-4xl">
        {!showInterview ? (
          <>
            <h1 className="text-3xl font-semibold mb-20">Interview Simulation</h1>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">Job Role</label>
              <input
                type="text"
                value={jobRole}
                onChange={handleJobRoleChange}
                placeholder="Enter job role"
                className="w-full px-4 py-2 bg-[#151515] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">Resume (Optional)</label>
              <input
                type="file"
                accept=".jpg, .jpeg, .png, .pdf"
                onChange={handleResumeChange}
                className="w-full px-4 py-2 bg-[#151515] rounded-md text-white focus:outline-none"
              />
            </div>
            <div className='flex flex-col items-center mb-8'>
              <button 
                onClick={startRecording} 
                disabled={!jobRole}
                className={`flex space-x-2 mb-10 items-center text-white px-4 py-2 rounded-md transition transform duration-300 ${
                  !jobRole ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110'
                }`}
              >
                <FaVideo className="text-xl" />
                <span>Start Interview</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:space-x-4 lg:space-y-0 space-y-4 mb-8">
              <div className="w-full h-32 overflow-auto hidden-scrollbar bg-[#151515] text-white mb-4 p-4 rounded-md border-[0.5px] border-[#151515] relative">
                <div className="absolute inset-0 overflow-auto">
                  <p className="p-2">{currentQuestion || 'Waiting for question...'}</p>
                </div>
              </div>
              <div className="flex-1 lg:w-1/2">
                <video ref={videoRef} width="100%" autoPlay muted className="border-[0.5px] border-[#151515] rounded-md mirrored"></video>
              </div>
            </div>
            <div className="mt-4 flex space-x-4">
              {!recording ? (
                <button 
                  onClick={startRecording} 
                  className="flex space-x-2 mb-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md transition transform duration-300 hover:scale-110"
                >
                  <FaVideo className="text-xl" />
                  <span>Start Interview</span>
                </button>
              ) : (
                <button 
                  onClick={stopRecording} 
                  className="bg-red-500 hover:bg-red-800 flex space-x-2 mb-10 items-center text-white px-4 py-2 rounded-md transition transform duration-300 hover:scale-110"
                >
                  <FaStop className="text-xl" />
                  <span>Stop Interview</span>
                </button>
              )}
            </div>
            {error && (
              <div className="mt-4 text-red-500 flex items-center mx-auto space-x-2">
                <AiOutlineWarning className="text-xl" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="flex justify-center mt-6">
            <FaSpinner className="animate-spin text-2xl text-white" />
          </div>
        )}

        {feedback && (
          <div className="mt-8 p-4 bg-gray-800 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Feedback</h2>
            <p>{feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSimulation;
