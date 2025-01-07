import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const FeedbackSection = ({ feedback = {}, loading = true, posture, resetInterview }) => {
  const chartData = {
    labels: ['Quality', 'Clarity', 'Relevance'],
    datasets: [
      {
        label: 'Feedback Scores',
        data: [
          (feedback.quality ? (feedback.quality / 10) * 100 : 0),
          (feedback.clarity ? (feedback.clarity / 10) * 100 : 0),
          (feedback.relevance ? (feedback.relevance / 10) * 100 : 0),
        ],
        backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
        borderColor: ['#388E3C', '#1976D2', '#D32F2F'],
        borderWidth: 1,
      },
    ],
  };

  // Options for the bar chart
  const chartOptions = {
    responsive: true,
    layout: {
      padding: 0,
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <>
      {/* Feedback Section */}
      {feedback && !loading && (
        <div className="mt-10">
          <h2 className="sm:text-4xl text-2xl mb-10 font-bold text-gray-300 text-center border-y pt-5 pb-6 border-white">
            Interview Feedback
          </h2>

          {/* Specific Feedback (Graphical) */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-lg font-semibold mb-4 text-white">Feedback Overview</h3>
            <div className="w-full mb-4">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Overall Performance (Textual) */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-lg font-semibold mb-2 text-white">Overall Performance</h3>
            <p className="text-gray-300">{feedback.performanceSummary}</p>
          </div>

          {/* Suggestions for Improvement (Textual) */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-lg font-semibold mb-2 text-white">Suggestions for Improvement</h3>
            <ul className="text-gray-300">
              {feedback.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>

          {/* Interview Result (Textual with Animation) */}
          <div
            className={`mt-6 p-4 rounded-lg text-center ${
              feedback.interviewResult === 'Yes'
                ? 'bg-green-500 text-white animate__animated animate__bounce animate__infinite'
                : 'bg-red-500 text-white animate__animated animate__shakeX'
            }`}
          >
            {feedback.interviewResult === 'Yes' ? (
              <h4 className="text-xl font-semibold">Congrats, you are selected!</h4>
            ) : (
              <h4 className="text-xl font-semibold">
                We regret to inform you that you were not selected. However, don’t lose hope—keep practicing and striving for improvement!
              </h4>
            )}
          </div>

          

          {/* Take Mock Interview Again Button */}
          <div className="flex justify-center p-10">
            <button
              onClick={() => resetInterview()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110 text-white rounded-md transition transform duration-300"
            >
              Conduct another Interview
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackSection;
