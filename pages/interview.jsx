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
  const [showInterview, setShowInterview] = useState(false); // State to control interview section visibility
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [jobRole, setJobRole] = useState('');
  const [techStack, setTechStack] = useState('');

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

  const startRecording = () => {
    setRecording(true);
    setShowInterview(true); // Show interview section
    setError('');
    // Fetch initial question from server
    axios.get(`${process.env.REACT_APP_API_URL}/get-question`)
      .then(response => {
        setCurrentQuestion(response.data.question);
      })
      .catch(err => {
        console.error('Error fetching question:', err);
      });
  };

  const stopRecording = () => {
    setRecording(false);
    // Notify the server to end the interview
    axios.post(`${process.env.REACT_APP_API_URL}/end-interview`)
      .then(response => {
        setFeedback(response.data.feedback);
      })
      .catch(error => {
        console.error('Error ending interview:', error);
      });
  };

  const handleJobRoleChange = (e) => {
    setJobRole(e.target.value);
  };

  const handleTechStackChange = (e) => {
    setTechStack(e.target.value);
  };

  return (
    <div className="max-h-screen font-sans text-sm bg-black text-white flex flex-col">
      <Navbar />
      <div className="container mx-auto mt-20 p-6 rounded-lg shadow-lg w-full max-w-4xl">
        {!showInterview ? (
          <>
            <h1 className="text-3xl font-semibold mb-6 text-center">Interview Simulation</h1>
            
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
              <label className="block text-lg font-medium mb-2">Tech Stack (Optional)</label>
              <input
                type="text"
                value={techStack}
                onChange={handleTechStackChange}
                placeholder="Enter tech stack"
                className="w-full px-4 py-2 bg-[#151515] rounded-md text-white"
              />
            </div>

        
            <div className='flex flex-col items-center mb-8'>
          <button onClick={startRecording}
            className={`bg-gradient-to-r from-blue-500 items-center to-purple-600 text-white px-4 py-2 rounded-md transition transform duration-300 hover:scale-110`}
  
            
          >
            <FaVideo className="text-xl" />
            Start Interview
          </button>
        </div>
          </>
        ) : (
          <>
            {/* Interview section */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-full h-32 overflow-y-scroll bg-[#151515] text-white mb-4 p-4 rounded-md border-[0.5px] border-[#151515]">
                <p className="text-lg">{currentQuestion || 'Waiting for question...'}</p>
              </div>
              <video ref={videoRef} width="640" height="480" autoPlay muted className="border-[0.5px] border-[#151515] rounded-md mirrored"></video>
              <div className="mt-4 flex space-x-4">
                {!recording ? (
                  <button onClick={startRecording} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 mb-10">
                    <FaVideo className="text-xl" />
                    <span>Start Interview</span>
                  </button>
                ) : (
                  <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 mb-10">
                    <FaStop className="text-xl" />
                    <span>Stop Interview</span>
                  </button>
                )}
              </div>
              {error && (
                <div className="mt-4 text-red-500 flex items-center space-x-2">
                  <AiOutlineWarning className="text-xl" />
                  <span>{error}</span>
                </div>
              )}
            </div>
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
