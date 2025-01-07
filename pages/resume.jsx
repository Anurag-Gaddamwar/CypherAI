'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../src/app/components/Navbar';
import { FaUpload, FaFileAlt } from 'react-icons/fa';
import './resume.css';
import '../src/app/globals.css';
import { Bar } from 'react-chartjs-2';
import { FaSpinner } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Resume = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileSelected, setFileSelected] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReport, setShowReport] = useState(false);  // State to control report visibility

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setUploadedFileName(selectedFile.name);
    setFileSelected(true);
  };

  const handleUpload = async () => {
    if (isSubmitting) return;

    try {
      if (!file) {
        setErrorMessage('Please select a file.');
        return;
      }

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setErrorMessage('Invalid file format. Please upload a JPG, PNG, or PDF file.');
        return;
      }

      if (!jobRole) {
        setErrorMessage('Please enter the job role you are aiming for.');
        return;
      }

      setLoading(true);
      setErrorMessage('');
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobRole', jobRole);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiUrl}/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysisResult(response.data.text);
      setLoading(false);
      setUploadedFileName(file.name);
      setShowReport(true); // Show the report after successful upload and analysis
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Error Analyzing your Resume');
      setLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseAnalysisResult = (result) => {
    const sections = {
      scores: {},
      strengths: [],
      areasForImprovement: [],
      additionalNotes: [],
    };

    const lines = result.split('\n').map(line => line.trim());
    let currentSection = null;

    lines.forEach(line => {
      const cleanedLine = line.replace(/\*/g, '').trim();

      if (cleanedLine.startsWith('ATS Compatibility Score:')) {
        sections.scores['ATS Compatibility'] = parseFloat(cleanedLine.split(':')[1]?.trim()) || 0;
      } else if (cleanedLine.startsWith('Content Relevance Score:')) {
        sections.scores['Content Relevance'] = parseFloat(cleanedLine.split(':')[1]?.trim()) || 0;
      } else if (cleanedLine.startsWith('Structure and Formatting Score:')) {
        sections.scores['Structure and Formatting'] = parseFloat(cleanedLine.split(':')[1]?.trim()) || 0;
      } else if (cleanedLine.startsWith('Strengths:')) {
        currentSection = 'Strengths';
      } else if (cleanedLine.startsWith('Areas for Improvement:')) {
        currentSection = 'Areas for Improvement';
      } else if (cleanedLine.startsWith('Additional Notes:')) {
        currentSection = 'Additional Notes';
      } else if (currentSection === 'Strengths' && cleanedLine) {
        sections.strengths.push(cleanedLine);
      } else if (currentSection === 'Areas for Improvement' && cleanedLine) {
        sections.areasForImprovement.push(cleanedLine);
      } else if (currentSection === 'Additional Notes' && cleanedLine) {
        sections.additionalNotes.push(cleanedLine);
      }
    });

    return sections;
  };

  const chartData = {
    labels: ['ATS Compatibility', 'Content Relevance', 'Structure and Formatting'],
    datasets: [
      {
        label: 'Resume Scores',
        data: [
          parseAnalysisResult(analysisResult).scores['ATS Compatibility'],
          parseAnalysisResult(analysisResult).scores['Content Relevance'],
          parseAnalysisResult(analysisResult).scores['Structure and Formatting'],
        ],
        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const handleBackButtonClick = () => {
    setShowReport(false); // Hide the report section
    setLoading(false); // Stop the loading spinner
    setFile(null); // Reset the uploaded file
    setJobRole(''); // Reset the job role input
    setErrorMessage(''); // Clear any error message
    setFileSelected(false); // Reset the file selected flag
    setUploadedFileName(''); // Clear the file name display
  };

  useEffect(() => {
    // Ensure proper re-rendering after state changes
    if (!showReport) {
      setAnalysisResult(''); // Clear the analysis result when not showing the report
    }
  }, [showReport]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      <div className="mx-auto mt-20 p-6 max-w-4xl w-full">

        {!showReport && !analysisResult && (
          <>
            <h1 className="text-3xl font-semibold text-center mb-12">Upload Your Resume</h1>

            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer text-xl text-gray-200">
                <FaUpload className="inline-block text-4xl mb-4" />
                <div className="mt-2">Click or Drag to Upload Resume</div>
              </label>
            </div>

            <div className="mt-8">
              <label htmlFor="jobRole" className="block text-lg mb-2">Job Role:</label>
              <input
                type="text"
                id="jobRole"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Graphic Designer"
                className="w-full px-4 py-2 bg-gray-800 rounded-md text-white border border-gray-700"
              />
            </div>

            {uploadedFileName && (
              <div className="mt-8 flex items-center justify-center bg-gray-700 p-4 rounded-lg">
                <FaFileAlt className="mr-2" />
                <p className="text-gray-300">Uploaded File: {uploadedFileName}</p>
              </div>
            )}

            <div className="mt-10 text-center">
              <button
                onClick={handleUpload}
                disabled={!fileSelected || !jobRole}
                className={`px-6 py-2 text-lg rounded-md bg-blue-600 hover:bg-blue-700 transition duration-200 
                  ${!fileSelected || !jobRole ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Analyze Resume
              </button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center mt-4">
            <FaSpinner className="animate-spin text-2xl" />
          </div>
        )}

        {errorMessage && <p className="text-red-600 mt-6 text-center">{errorMessage}</p>}

        {showReport && !loading && analysisResult && (
          <div>
            <h2 className="text-2xl font-semibold text-center mb-8">Resume Analysis Report</h2>

            <div className="flex justify-center mb-8">
              <Bar data={chartData} options={{ responsive: true }} />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-4">Strengths</h3>
              <ul className="list-disc ml-5">
                {parseAnalysisResult(analysisResult).strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Areas for Improvement</h3>
              <ul className="list-disc ml-5">
                {parseAnalysisResult(analysisResult).areasForImprovement.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleBackButtonClick}
                className="px-6 py-2 text-lg rounded-md bg-blue-600 hover:bg-blue-700 transition duration-200"
              >
                Back to Upload Section
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resume;
