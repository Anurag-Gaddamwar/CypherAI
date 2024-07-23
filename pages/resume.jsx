'use client';
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../src/app/components/Navbar';
import { FaUpload, FaFileAlt } from 'react-icons/fa';
import './resume.css';
import '../src/app/globals.css'

const Resume = () => {
  // State variables for file upload, analysis result, loading state, error message, uploaded file name, and job role
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileSelected, setFileSelected] = useState(false); // State for tracking if file is selected
  const [jobRole, setJobRole] = useState(''); // State for job role input

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setUploadedFileName(selectedFile.name);
    setFileSelected(true); // Set fileSelected to true when a file is selected
  };

  const handleUpload = async () => {
    try {
      // Check if file is selected
      if (!file) {
        setErrorMessage('Please select a file.');
        return;
      }

      // Check file type
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setErrorMessage('Invalid file format. Please upload a JPG, PNG, or PDF file.');
        return;
      }

      // Check if job role is entered
      if (!jobRole) {
        setErrorMessage('Please enter the job role you are aiming for.');
        return;
      }

      setLoading(true); // Show loading spinner
      setErrorMessage('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobRole', jobRole); // Append job role to form data

      // Send POST request to backend for analysis
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


      // Update analysis result and hide loading spinner
      setAnalysisResult(response.data.text);
      setLoading(false);

      // Set the uploaded file name after successful upload
      setUploadedFileName(file.name);
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Error Analyzing your Resume');
      setLoading(false); // Hide loading spinner
    }
  };


  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
      setFileSelected(true); // Set fileSelected to true when a file is dropped
      setUploadedFileName(files[0].name); // Update uploaded file name
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const parseAnalysisResult = (result) => {
    const lines = result.split('\n').map(line => line.trim());

    const scores = {};
    const strengths = [];
    const areasForImprovement = [];
    const additionalNotes = [];

    let currentSection = null;
    lines.forEach(line => {
      // Remove asterisks from the line
      const cleanedLine = line.replace(/\*/g, '');

      if (cleanedLine.includes("Score:")) {
        const [title, value] = cleanedLine.split(":");
        scores[title.trim()] = value.trim();
      } else if (cleanedLine === "Strengths:") {
        currentSection = "Strengths";
      } else if (cleanedLine === "Areas for Improvement:") {
        currentSection = "Areas for Improvement";
      } else if (cleanedLine === "Additional Notes:") {
        currentSection = "Additional Notes";
      } else if (currentSection && cleanedLine !== "") {
        if (currentSection === "Strengths") {
          strengths.push(cleanedLine);
        } else if (currentSection === "Areas for Improvement") {
          areasForImprovement.push(cleanedLine);
        } else {
          additionalNotes.push(cleanedLine);
        }
      }
    });

    return { scores, strengths, areasForImprovement, additionalNotes };
  };

  return (
    <div className="min-h-screen font-sans text-sm bg-gradient-to-br from-black to-midnight-blue text-white flex flex-col">
      <Navbar />
      <div className=" mx-auto mt-20 p-6 shadow-lg w-full max-w-7xl overflow-auto">
        <h1 className="text-3xl font-semibold mb-12 text-white">Upload Your Resume</h1>
        {/* File upload container */}
        <div
          className="text-black p-8 rounded-md flex items-center justify-center border-2 border-gray-800"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <div className="upload-content flex flex-col items-center hover:scale-105 duration-300 transform transition">
              
              <FaUpload className="upload-icon text-4xl mb-4" />
              <span className="upload-text text-lg text-white">Drop resume or browse</span>
             
            </div>
          </label>
        </div>

        {/* Job role input */}
        <div className="mt-8">
          <label htmlFor="jobRole" className="block text-lg font-semibold text-gray-300 mb-2">Job Role:</label>
          <input
            type="text"
            id="jobRole"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="Enter the job role you are aiming for; Ex: Graphic Designer"
            className="w-full px-4 py-2 text-black rounded-md border border-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>
        {/* Display uploaded file name */}
        {uploadedFileName && (
          <div className="mt-8 flex items-center justify-center bg-gray-800 rounded-2xl border-[0.1px] p-4">
            <FaFileAlt className="mr-2 text-white" />
            <p className="text-gray-300">Uploaded File: {uploadedFileName}</p>
          </div>
        )}
        {/* Analyze button */}
        <div className='flex justify-center mt-10'>
          <button
            className={bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md transition transform duration-300 hover:scale-110 ${!fileSelected ? 'opacity-50 cursor-not-allowed' : ''
              }}
            onClick={handleUpload}
            disabled={!fileSelected || !jobRole} // Disable button if file or job role is not selected
          >
            Analyze Resume
          </button>
        </div>
        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center mt-8">
            <div className="spinner"></div>
          </div>
        )}
        {/* Error message */}
        {errorMessage && <p className="text-red-600 mt-6">{errorMessage}</p>}
        {/* Display analysis result */}
        {/* Display analysis result */}
        {analysisResult && (
          <div className="mt-24">
            <h2 className="text-4xl mb-20  font-bold text-gray-300 text-center border-y pt-5 pb-6 border-white">Resume Analysis Report</h2>

            {/* Grid layout for scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(parseAnalysisResult(analysisResult).scores).map(([title, value]) => (
                <div key={title} className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text- text-gray-300">{value}</p>
                </div>
              ))}
            </div>

            {/* Strengths and Areas for Improvement */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Strengths</h3>
                <ul className="list-disc ml-5 text-gray-300">
                  {parseAnalysisResult(analysisResult).strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Areas for Improvement</h3>
                <ul className="list-disc ml-5 text-gray-300">
                  {parseAnalysisResult(analysisResult).areasForImprovement.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Additional Notes */}
            {parseAnalysisResult(analysisResult).additionalNotes.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
                <p className="text-gray-300">{parseAnalysisResult(analysisResult).additionalNotes.join(' ')}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Resume;
