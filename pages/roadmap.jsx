import React, { useState } from 'react';  
import axios from 'axios';
import '../src/app/globals.css';
import Navbar from '../src/app/components/Navbar';
import { FaSpinner, FaYoutube } from 'react-icons/fa'; // Import FaYoutube

const Roadmap = () => {
  const [jobRole, setJobRole] = useState('');
  const [elements, setElements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setJobRole(e.target.value);
  };

  const handleGenerateRoadmap = async () => {
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${apiUrl}/generate-roadmap`, {
        currentQuery: jobRole,
      });

      if (response.data && response.data.parsedData) {
        const roadmapData = response.data.parsedData;
        setElements(roadmapData);
      } else {
        setError('No roadmap data found.');
      }
    } catch (err) {
      setError('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJobRole('');
    setElements([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      {elements.length === 0 ? (
        <div className="mx-auto mt-20 p-6 max-w-4xl w-full flex flex-col">
          <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-center">
            Embark on Your Career Roadmap
          </h1>
          <div className="flex flex-col items-center mb-8 space-y-4">
            <input
              type="text"
              value={jobRole}
              onChange={handleInputChange}
              placeholder="Enter your desired job role"
              className="w-full px-4 py-2 bg-gray-800 shadow-lg rounded-md text-gray-400"
            />
            <button
              onClick={handleGenerateRoadmap}
              disabled={!jobRole || loading}
              className={`px-6 py-2 text-lg rounded-md bg-blue-600 hover:bg-blue-700 transition duration-200 ${
                (!jobRole || loading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? <FaSpinner className="animate-spin text-2xl" /> : 'Generate Roadmap'}
            </button>
          </div>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        </div>
      ) : (
        <div className="mt-20 mx-auto max-w-5xl w-full bg-gray-900 rounded-md">
          <div className="road flex flex-col items-center relative">
            <div className="road-line bg-gray-600 w-2 rounded-md h-full absolute left-1/2 transform -translate-x-1/2"></div>
            {elements.map((skill, index) => (
              <div
                key={index}
                className={`road-stop flex items-center mb-12 ${
                  index % 2 === 0 ? 'self-start' : 'self-end'
                }`}
              >
                <div
                  className={`info-box text-base text-thin bg-gray-800 text-white rounded-md px-6 py-4 shadow-md w-52 ml-6 text-justified`}
                >
                  <p className="font-bold">{skill.skill}</p>
                  <p className="bg-gray-700 text-center border m-1 p-2 rounded-xl">{skill.days} days</p>
                  <a
                    href={skill.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-yellow-400 font-semibold hover:text-yellow-500 transition duration-300 transform hover:scale-105"
                  >
                    <FaYoutube className="mr-2 text-red-500 text-xl" /> 
                    {skill.channel}
                  </a>
                </div>
                <div
                  className={`marker w-10 h-10 bg-yellow-500 rounded-full shadow-lg flex items-center justify-center text-black font-bold z-10`}
                >
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!loading && elements.length !== 0 && (
        <div className="my-8 text-center">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-lg rounded-md bg-blue-600 hover:bg-blue-700 transition duration-200"
          >
            Back to Input Section
          </button>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
