import React, { useState } from 'react';
import axios from 'axios';
import '../src/app/globals.css';
import Navbar from '../src/app/components/Navbar';

const Roadmap = () => {
  const [jobRole, setJobRole] = useState('');
  const [elements, setElements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [attempted, setAttempted] = useState(false);

  const handleInputChange = (e) => {
    setJobRole(e.target.value);
  };

  const handleSkillHover = (skill) => {
    setHoveredSkill(skill);
  };

  const handleGenerateRoadmap = async () => {
    setError('');
    setLoading(true);
    setAttempted(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/generate-roadmap`, {
        currentQuery: jobRole,
      });

      if (response.data.text) {
        const roadmapText = response.data.text;
        const skillLines = roadmapText.split('\n').filter(line => line.trim());
        const skills = [];

        skillLines.forEach(line => {
          const [skill, days] = line.split(':');
          const skillName = skill.replace(/\*\*/g, '').trim();
          const estimatedDays = days.replace(/\*\*/g, '').trim();
          skills.push({ label: skillName, days: estimatedDays });
        });

        setElements(skills);
      } else {
        setError('No data received from the server.');
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      setError('Failed to generate roadmap. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-sm bg-black text-white flex flex-col">
      <Navbar />
      <main className="mt-20 flex-grow p-6 w-full max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">
          Unfold Your Developer Journey
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="text"
              value={jobRole}
              onChange={handleInputChange}
              placeholder="Enter your desired job role"
              className="px-4 py-2 bg-[#151515] rounded-md text-white w-full md:w-72 mb-3 md:mb-0"
            />
            <div className='items-center flex relative justify-center'> 
            <button
              onClick={handleGenerateRoadmap}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg transition-transform transform duration-300 hover:scale-105 shadow-lg hover:shadow-xl sm:max-w-48"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Roadmap'}
            </button>
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {attempted && elements.length === 0 && !loading && !error && (
          <p className="text-center text-gray-400">No skills available. Please try a different job role.</p>
        )}
        <div className="flex-grow rounded-lg overflow-y-auto p-4">
          {elements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {elements.map((skill, index) => (
                <div
                  key={index}
                  className={`bg-gray-900 p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${hoveredSkill === skill ? 'bg-gray-700' : ''}`}
                  onMouseOver={() => handleSkillHover(skill)}
                  onMouseOut={() => handleSkillHover(null)}
                  role="listitem"
                  aria-label={`Skill: ${skill.label}, Days: ${skill.days}`}
                >
                  <h2 className="text-lg font-bold mb-2">{skill.label}</h2>
                  <p className="text-sm text-gray-400">Days: {skill.days}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Roadmap;
