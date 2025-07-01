import React from 'react';
import '../App.css'; // Assuming App.css contains global styles like Tailwind imports

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section with Search Bar */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold text-gray-900 mb-4">Smart Civic Navigator</h1>
        <p className="text-xl text-gray-600 mb-8">Connecting communities with local social services and volunteer opportunities.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search for services, e.g., food bank, mental health..."
            className="w-full sm:w-96 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Search
          </button>
        </div>
      </div>

      {/* Featured Services Section */}
      <div className="w-full max-w-4xl">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Featured Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder Service Card 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Food Bank XYZ</h3>
            <p className="text-gray-600">Provides emergency food assistance to families in need.</p>
            <span className="inline-block bg-green-200 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-4">Food Support</span>
          </div>

          {/* Placeholder Service Card 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Mental Wellness Center</h3>
            <p className="text-gray-600">Offering free counseling and support groups for all ages.</p>
            <span className="inline-block bg-purple-200 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-4">Mental Health</span>
          </div>

          {/* Placeholder Service Card 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Community Shelter</h3>
            <p className="text-gray-600">Temporary housing and resources for individuals experiencing homelessness.</p>
            <span className="inline-block bg-red-200 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-4">Housing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage; 