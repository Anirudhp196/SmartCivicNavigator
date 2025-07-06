import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  // Example of a simple logout function (will be expanded later)
  const handleLogout = () => {
    // TODO: Implement actual logout functionality (clear token, user state, etc.)
    console.log('Logging out...');
    navigate('/'); // Redirect to login page
  };

  return (
    <nav className="bg-gray-800 p-4 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/home" className="text-2xl font-bold text-white hover:text-gray-300">
          Smart Civic Navigator
        </Link>
        <div className="space-x-4">
          <Link to="/home" className="hover:text-gray-300">Home</Link>
          <Link to="/map" className="hover:text-gray-300">Map View</Link>
          {/* Placeholder for Service Details - can be dynamic later */}
          <Link to="/services/123" className="hover:text-gray-300">Service Details (Example)</Link>
          <Link to="/profile" className="hover:text-gray-300">Profile</Link>
          <button onClick={handleLogout} className="hover:text-gray-300 focus:outline-none">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 