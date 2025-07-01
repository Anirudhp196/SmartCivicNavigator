import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isNonProfit, setIsNonProfit] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      if (isLogin) {
        const response = await authService.login(email, password);
        console.log('Login successful:', response);
        // Store token in localStorage or context if needed
        // localStorage.setItem('user', JSON.stringify(response));
        navigate('/home'); // Redirect to home page on success
      } else {
        const response = await authService.register(name, email, password, isNonProfit, organizationName);
        console.log('Signup successful:', response);
        // Store token in localStorage or context if needed
        // localStorage.setItem('user', JSON.stringify(response));
        navigate('/home'); // Redirect to home page on success
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Authentication Error:', err);
    }
    // Reset password field after submission (optional, for security)
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-10 w-full max-w-md">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          {isLogin ? 'Welcome Back!' : 'Join Smart Civic Navigator'}
        </h2>

        {/* Blurbs to attract users */}
        <div className="text-center text-gray-600 mb-8">
          <p className="mb-2">Connecting communities to vital services and fostering local engagement.</p>
          <p>{isLogin ? "Don't have an account?" : "Already have an account?"} <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-600 hover:underline font-medium focus:outline-none">{isLogin ? 'Sign Up' : 'Login'}</button></p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isNonProfit"
                  name="isNonProfit"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={isNonProfit}
                  onChange={(e) => setIsNonProfit(e.target.checked)}
                />
                <label htmlFor="isNonProfit" className="ml-2 block text-sm text-gray-900">
                  Register as a Nonprofit Organization
                </label>
              </div>

              {isNonProfit && (
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">Organization Name</label>
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthPage; 